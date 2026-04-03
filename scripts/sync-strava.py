#!/usr/bin/env python3
"""
Fetch Strava run activities and compute all-time Personal Records.

Reads credentials from .env (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN).
Saves PR data to public/data/aviel/strava-prs.json.

Supports incremental sync and saves progress on rate-limit interruption.

Usage: python3 scripts/sync-strava.py
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
OUTPUT_PATH = PROJECT_ROOT / "public" / "data" / "aviel" / "strava-prs.json"
ENV_PATH = PROJECT_ROOT / ".env"

STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API = "https://www.strava.com/api/v3"

DISTANCE_ORDER = [
    "400m", "1/2 mile", "1K", "1 mile", "2 mile",
    "5K", "10K", "15K", "10 mile", "20K",
    "Half-Marathon", "Marathon",
]

DISTANCE_METERS = {
    "400m": 400, "1/2 mile": 804.672, "1K": 1000, "1 mile": 1609.34,
    "2 mile": 3218.69, "5K": 5000, "10K": 10000, "15K": 15000,
    "10 mile": 16093.4, "20K": 20000, "Half-Marathon": 21097.5,
    "Marathon": 42195,
}


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


def fetch_run_activities(token, after_ts=None):
    """Fetch all Run activities, paginated."""
    all_runs = []
    page = 1
    while True:
        params = {"per_page": 200, "page": page}
        if after_ts:
            params["after"] = after_ts
        activities = api_get("/athlete/activities", token, params)
        if not activities:
            break
        runs = [a for a in activities if a.get("type") == "Run"]
        all_runs.extend(runs)
        if len(activities) < 200:
            break
        page += 1
    return all_runs


def format_time(seconds):
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def pace_per_km(distance_m, elapsed_s):
    if distance_m <= 0:
        return "—"
    secs_per_km = elapsed_s / (distance_m / 1000)
    m = int(secs_per_km // 60)
    s = int(secs_per_km % 60)
    return f"{m}:{s:02d}"


def load_existing():
    if OUTPUT_PATH.exists():
        return json.loads(OUTPUT_PATH.read_text())
    return None


def save_output(records, max_ts, processed_ids):
    ordered = [records[d] for d in DISTANCE_ORDER if d in records]
    output = {
        "last_sync": datetime.now().isoformat(),
        "last_activity_ts": max_ts,
        "processed_ids": sorted(processed_ids),
        "records": ordered,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    return ordered


def main():
    load_env()

    print("Strava PR Sync")
    print("=" * 40)

    token = get_access_token()
    print("Authenticated with Strava")

    existing = load_existing()
    records = {}
    processed_ids = set()
    after_ts = None

    if existing:
        records = {r["name"]: r for r in existing.get("records", [])}
        processed_ids = set(existing.get("processed_ids", []))
        after_ts = existing.get("last_activity_ts")

    is_incremental = after_ts and len(processed_ids) > 0
    if is_incremental:
        print(f"Incremental sync from {datetime.fromtimestamp(after_ts).strftime('%Y-%m-%d')}")
        print(f"Already processed: {len(processed_ids)} activities")

    try:
        runs = fetch_run_activities(token)
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print("Rate limited on initial fetch. Wait ~15 minutes and try again.")
            sys.exit(1)
        raise
    print(f"Found {len(runs)} total run activities")

    pending = [r for r in runs if r["id"] not in processed_ids]
    print(f"Need to fetch detail for {len(pending)} activities")

    if not pending:
        print("Everything up to date.")
        return

    max_ts = after_ts or 0
    for run in runs:
        ts = int(datetime.strptime(run["start_date"], "%Y-%m-%dT%H:%M:%SZ").timestamp())
        max_ts = max(max_ts, ts)

    for i, run in enumerate(pending, 1):
        try:
            detail = api_get(f"/activities/{run['id']}", token)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"\n  Rate limited after {i-1}/{len(pending)} activities.")
                print("  Progress saved. Run the script again to continue.")
                save_output(records, max_ts, processed_ids)
                return
            raise

        processed_ids.add(run["id"])

        for be in detail.get("best_efforts", []):
            name = be["name"]
            elapsed = be["elapsed_time"]
            dist = DISTANCE_METERS.get(name, be.get("distance", 0))

            prev = records.get(name)
            if prev and prev["elapsed_time"] <= elapsed:
                continue

            records[name] = {
                "name": name,
                "distance_meters": dist,
                "elapsed_time": elapsed,
                "formatted_time": format_time(elapsed),
                "pace": pace_per_km(dist, elapsed),
                "date": run["start_date_local"][:10],
                "activity_name": run["name"],
                "activity_id": run["id"],
            }

        if i % 10 == 0:
            print(f"  Processed {i}/{len(pending)} activities...")

        time.sleep(0.15)

    ordered = save_output(records, max_ts, processed_ids)

    print(f"\nPersonal Records saved to {OUTPUT_PATH.relative_to(PROJECT_ROOT)}")
    print(f"Distances tracked: {len(ordered)}")
    print()
    for r in ordered:
        print(f"  {r['name']:15s}  {r['formatted_time']:>10s}  ({r['date']}  -  {r['activity_name']})")


if __name__ == "__main__":
    main()
