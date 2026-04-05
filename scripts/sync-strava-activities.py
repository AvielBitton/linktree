#!/usr/bin/env python3
"""
Fetch all Strava activities (runs, rides, strength, etc.) with smart incremental sync.

Only fetches activities newer than the last synced one. For each new activity,
fetches detailed data (splits, laps, map polyline).

Saves to public/data/aviel/strava-activities.json.

Usage: python3 scripts/sync-strava-activities.py
"""

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "public" / "data" / "aviel" / "strava-activities.json"
ENV_PATH = PROJECT_ROOT / ".env"

STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API = "https://www.strava.com/api/v3"


def load_env():
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


def get_access_token():
    client_id = os.environ.get("STRAVA_CLIENT_ID", "")
    client_secret = os.environ.get("STRAVA_CLIENT_SECRET", "")
    refresh_token = os.environ.get("STRAVA_REFRESH_TOKEN", "")

    if not all([client_id, client_secret, refresh_token]):
        print("Error: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN must be set")
        sys.exit(1)

    data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }).encode()

    req = urllib.request.Request(STRAVA_TOKEN_URL, data=data)
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read())

    return body["access_token"]


def api_get(endpoint, token, params=None):
    url = f"{STRAVA_API}{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def fetch_activities(token, after_ts=None):
    """Fetch all activities (all types), paginated. Uses `after` for incremental sync."""
    all_activities = []
    page = 1
    while True:
        params = {"per_page": 200, "page": page}
        if after_ts:
            params["after"] = after_ts
        activities = api_get("/athlete/activities", token, params)
        if not activities:
            break
        all_activities.extend(activities)
        if len(activities) < 200:
            break
        page += 1
    return all_activities


def format_duration(seconds):
    if not seconds:
        return "0:00"
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def pace_per_km(average_speed):
    """Convert m/s to pace min/km."""
    if not average_speed or average_speed <= 0:
        return None
    secs_per_km = 1000 / average_speed
    m = int(secs_per_km // 60)
    s = int(secs_per_km % 60)
    return f"{m}:{s:02d}"


def extract_activity_summary(activity):
    """Extract key fields from list endpoint activity."""
    start_date = activity.get("start_date_local", activity.get("start_date", ""))

    return {
        "id": activity["id"],
        "name": activity.get("name", ""),
        "type": activity.get("type", ""),
        "sport_type": activity.get("sport_type", activity.get("type", "")),
        "date": start_date[:10],
        "start_time": start_date[11:19] if len(start_date) > 11 else "",
        "distance": round(activity.get("distance", 0), 1),
        "moving_time": activity.get("moving_time", 0),
        "elapsed_time": activity.get("elapsed_time", 0),
        "moving_time_formatted": format_duration(activity.get("moving_time", 0)),
        "elapsed_time_formatted": format_duration(activity.get("elapsed_time", 0)),
        "total_elevation_gain": round(activity.get("total_elevation_gain", 0), 1),
        "average_speed": activity.get("average_speed", 0),
        "max_speed": activity.get("max_speed", 0),
        "average_heartrate": activity.get("average_heartrate"),
        "max_heartrate": activity.get("max_heartrate"),
        "average_cadence": activity.get("average_cadence"),
        "calories": activity.get("calories", 0),
        "suffer_score": activity.get("suffer_score"),
        "has_heartrate": activity.get("has_heartrate", False),
    }


def enrich_with_detail(summary, detail):
    """Add detailed data (splits, laps, map) from the detail endpoint."""
    summary_map = detail.get("map", {})
    summary["map_polyline"] = summary_map.get("summary_polyline", "")

    splits = detail.get("splits_metric", [])
    if splits:
        summary["splits_metric"] = [
            {
                "distance": round(s.get("distance", 0), 1),
                "elapsed_time": s.get("elapsed_time", 0),
                "moving_time": s.get("moving_time", 0),
                "elevation_difference": s.get("elevation_difference", 0),
                "average_speed": s.get("average_speed", 0),
                "average_heartrate": s.get("average_heartrate"),
                "pace": pace_per_km(s.get("average_speed", 0)),
                "split": s.get("split", 0),
            }
            for s in splits
        ]

    laps = detail.get("laps", [])
    if laps:
        summary["laps"] = [
            {
                "name": lap.get("name", ""),
                "distance": round(lap.get("distance", 0), 1),
                "elapsed_time": lap.get("elapsed_time", 0),
                "moving_time": lap.get("moving_time", 0),
                "average_speed": lap.get("average_speed", 0),
                "average_heartrate": lap.get("average_heartrate"),
                "max_heartrate": lap.get("max_heartrate"),
                "average_cadence": lap.get("average_cadence"),
                "pace": pace_per_km(lap.get("average_speed", 0)),
            }
            for lap in laps
        ]

    if detail.get("average_cadence"):
        summary["average_cadence"] = detail["average_cadence"]
    if detail.get("calories"):
        summary["calories"] = detail["calories"]

    return summary


def load_existing():
    if OUTPUT_PATH.exists():
        return json.loads(OUTPUT_PATH.read_text())
    return {"last_sync": None, "last_activity_ts": 0, "activities": []}


def save_output(data):
    data["last_sync"] = datetime.now().isoformat()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False))


def main():
    load_env()

    print("Strava Activities Sync")
    print("=" * 40)

    token = get_access_token()
    print("Authenticated with Strava")

    existing = load_existing()
    existing_by_id = {a["id"]: a for a in existing.get("activities", [])}
    last_ts = existing.get("last_activity_ts", 0)

    if last_ts:
        last_date = datetime.fromtimestamp(last_ts).strftime("%Y-%m-%d %H:%M")
        print(f"Incremental sync — fetching activities after {last_date}")
        print(f"Existing activities: {len(existing_by_id)}")
    else:
        print("Full sync — fetching all activities")

    try:
        new_activities = fetch_activities(token, after_ts=last_ts if last_ts else None)
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print("Rate limited on activity list. Wait ~15 minutes and retry.")
            sys.exit(1)
        raise

    new_ids = [a["id"] for a in new_activities if a["id"] not in existing_by_id]
    print(f"Found {len(new_activities)} activities from API, {len(new_ids)} are new")

    if not new_ids:
        print("Everything up to date.")
        existing["last_sync"] = datetime.now().isoformat()
        save_output(existing)
        return

    max_ts = last_ts
    for a in new_activities:
        ts = int(datetime.strptime(a["start_date"], "%Y-%m-%dT%H:%M:%SZ").timestamp())
        max_ts = max(max_ts, ts)

    fetched = 0
    for activity in new_activities:
        if activity["id"] in existing_by_id:
            continue

        summary = extract_activity_summary(activity)

        try:
            detail = api_get(f"/activities/{activity['id']}", token)
            summary = enrich_with_detail(summary, detail)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"\n  Rate limited after {fetched} detail fetches. Saving progress.")
                all_so_far = sorted(existing_by_id.values(), key=lambda a: a["date"], reverse=True)
                save_output({"last_activity_ts": 0, "activities": all_so_far})
                print(f"  Saved {len(all_so_far)} activities. Run again to continue.")
                return
            raise

        existing_by_id[activity["id"]] = summary
        fetched += 1

        if fetched % 10 == 0:
            print(f"  Fetched detail for {fetched}/{len(new_ids)} activities...")

        time.sleep(0.2)

    all_activities = sorted(existing_by_id.values(), key=lambda a: a["date"], reverse=True)

    output = {
        "last_sync": None,
        "last_activity_ts": max_ts,
        "activities": all_activities,
    }
    save_output(output)

    type_counts = {}
    for a in all_activities:
        t = a.get("type", "Unknown")
        type_counts[t] = type_counts.get(t, 0) + 1

    print(f"\nSaved {len(all_activities)} activities to {OUTPUT_PATH.relative_to(PROJECT_ROOT)}")
    print("By type:")
    for t, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {count}")


if __name__ == "__main__":
    main()
