#!/usr/bin/env python3
"""
Sync workout data from TrainingPeaks to CSV.
Reads TP_AUTH_COOKIE from .env file in project root.
Usage: python3 scripts/sync-tp.py
"""

import csv
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
OUTPUT_CSV = PROJECT_ROOT / "public" / "data" / "aviel" / "2026.csv"
OUTPUT_JSON = PROJECT_ROOT / "public" / "data" / "aviel" / "2026-extra.json"

TP_API_BASE = "https://tpapi.trainingpeaks.com"
MIN_REQUEST_INTERVAL = 0.15

CSV_HEADERS = [
    "Title", "WorkoutType", "WorkoutDescription", "PlannedDuration",
    "PlannedDistanceInMeters", "WorkoutDay", "CoachComments",
    "DistanceInMeters", "PowerAverage", "PowerMax", "Energy",
    "AthleteComments", "TimeTotalInHours", "VelocityAverage", "VelocityMax",
    "CadenceAverage", "CadenceMax", "HeartRateAverage", "HeartRateMax",
    "TorqueAverage", "TorqueMax", "IF", "TSS",
    "HRZone1Minutes", "HRZone2Minutes", "HRZone3Minutes", "HRZone4Minutes",
    "HRZone5Minutes", "HRZone6Minutes", "HRZone7Minutes", "HRZone8Minutes",
    "HRZone9Minutes", "HRZone10Minutes",
    "PWRZone1Minutes", "PWRZone2Minutes", "PWRZone3Minutes", "PWRZone4Minutes",
    "PWRZone5Minutes", "PWRZone6Minutes", "PWRZone7Minutes", "PWRZone8Minutes",
    "PWRZone9Minutes", "PWRZone10Minutes",
    "Rpe", "Feeling",
]

TYPE_MAP = {
    3: "Run",
    7: "Day Off",
    9: "Strength",
    10: "Custom",
    100: "Other",
}


def load_env():
    """Load TP_AUTH_COOKIE and TP_ATHLETE_ID from env vars or .env file."""
    cookie = os.environ.get("TP_AUTH_COOKIE", "")
    athlete_id = os.environ.get("TP_ATHLETE_ID", "")

    if not cookie or not athlete_id:
        if ENV_FILE.exists():
            for line in ENV_FILE.read_text().splitlines():
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    key, val = key.strip(), val.strip()
                    if key == "TP_AUTH_COOKIE" and not cookie:
                        cookie = val
                    elif key == "TP_ATHLETE_ID" and not athlete_id:
                        athlete_id = val

    if not cookie or cookie == "PASTE_YOUR_COOKIE_HERE":
        print("Error: TP_AUTH_COOKIE not set (env var or .env)")
        sys.exit(1)
    if not athlete_id:
        print("Error: TP_ATHLETE_ID not set (env var or .env)")
        sys.exit(1)

    return cookie, int(athlete_id)


def get_token(cookie):
    url = f"{TP_API_BASE}/users/v3/token"
    headers = {
        "Cookie": f"Production_tpAuth={cookie}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            if data.get("success") and "token" in data:
                return data["token"]["access_token"]
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("Error: Cookie expired. Get a fresh Production_tpAuth cookie.")
        else:
            print(f"Error: Token exchange failed: {e.code}")
        sys.exit(1)
    print("Error: Unexpected token response")
    sys.exit(1)


def api_get(endpoint, token):
    url = f"{TP_API_BASE}{endpoint}"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        print(f"  API error {e.code} on {endpoint}")
        return None


def flatten_text(text):
    """Replace newlines with spaces and collapse whitespace."""
    if not text:
        return ""
    text = text.replace("\r\n", " ").replace("\r", " ").replace("\n", " ")
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def format_comments(comments_list):
    """Format workoutComments array to match TP CSV export format."""
    if not comments_list:
        return ""
    parts = []
    for c in comments_list:
        date_str = c.get("dateCreated", "")
        if date_str:
            try:
                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                date_fmt = dt.strftime("%d/%m/%Y")
            except Exception:
                date_fmt = date_str[:10]
        else:
            date_fmt = ""
        name = c.get("commenterName", "")
        if not name:
            name = f"{c.get('firstName', '')} {c.get('lastName', '')}".strip()
        comment = flatten_text(c.get("comment", ""))
        parts.append(f" *{date_fmt} {name}: {comment}*")
    return "".join(parts)


def fetch_workouts(token, athlete_id, start_date, end_date):
    all_workouts = []
    current = start_date
    while current <= end_date:
        chunk_end = min(current + timedelta(days=89), end_date)
        s = current.strftime("%Y-%m-%d")
        e = chunk_end.strftime("%Y-%m-%d")
        print(f"  {s} to {e}...", end=" ", flush=True)

        data = api_get(f"/fitness/v6/athletes/{athlete_id}/workouts/{s}/{e}", token)
        if data is not None:
            print(f"{len(data)} workouts")
            all_workouts.extend(data)
        else:
            print("failed")

        time.sleep(MIN_REQUEST_INTERVAL)
        current = chunk_end + timedelta(days=1)

    return all_workouts


def fetch_workout_zones(workout_id, token, athlete_id):
    """Fetch HR/Power zone data and threshold speed from the details endpoint."""
    data = api_get(f"/fitness/v6/athletes/{athlete_id}/workouts/{workout_id}/details", token)
    if not data:
        return {}, {}, None

    hr_zones = {}
    hr_data = data.get("timeInHeartRateZones")
    if hr_data and isinstance(hr_data, dict):
        zones = hr_data.get("timeInZones", [])
        for i, z in enumerate(zones):
            if isinstance(z, dict):
                minutes = round(z.get("seconds", 0) / 60.0)
                hr_zones[i + 1] = str(minutes)

    pwr_zones = {}
    pwr_data = data.get("timeInPowerZones")
    if pwr_data and isinstance(pwr_data, dict):
        zones = pwr_data.get("timeInZones", [])
        for i, z in enumerate(zones):
            if isinstance(z, dict):
                minutes = round(z.get("seconds", 0) / 60.0)
                pwr_zones[i + 1] = str(minutes)

    threshold_speed = None
    speed_data = data.get("timeInSpeedZones")
    if speed_data and isinstance(speed_data, dict):
        threshold_speed = speed_data.get("threshold")

    time.sleep(MIN_REQUEST_INTERVAL)
    return hr_zones, pwr_zones, threshold_speed


def is_completed(w):
    return w.get("totalTime") is not None or w.get("distance") is not None


def safe(val):
    if val is None:
        return ""
    if isinstance(val, float):
        if val == 0.0:
            return "0"
        return str(val)
    return str(val)


def map_workout(w, hr_zones, pwr_zones):
    workout_type_id = w.get("workoutTypeValueId")
    workout_type = TYPE_MAP.get(workout_type_id, "Other")

    workout_day = str(w.get("workoutDay", ""))[:10]

    comments_text = format_comments(w.get("workoutComments", []))
    coach_comments = flatten_text(w.get("coachComments", ""))
    description = flatten_text(w.get("description", ""))

    row = {
        "Title": safe(w.get("title")),
        "WorkoutType": workout_type,
        "WorkoutDescription": description,
        "PlannedDuration": safe(w.get("totalTimePlanned")),
        "PlannedDistanceInMeters": safe(w.get("distancePlanned")),
        "WorkoutDay": workout_day,
        "CoachComments": coach_comments,
        "DistanceInMeters": safe(w.get("distance")),
        "PowerAverage": safe(w.get("powerAverage")),
        "PowerMax": safe(w.get("powerMaximum")),
        "Energy": safe(w.get("energy")),
        "AthleteComments": comments_text,
        "TimeTotalInHours": safe(w.get("totalTime")),
        "VelocityAverage": safe(w.get("velocityAverage")),
        "VelocityMax": safe(w.get("velocityMaximum")),
        "CadenceAverage": safe(w.get("cadenceAverage")),
        "CadenceMax": safe(w.get("cadenceMaximum")),
        "HeartRateAverage": safe(w.get("heartRateAverage")),
        "HeartRateMax": safe(w.get("heartRateMaximum")),
        "TorqueAverage": safe(w.get("torqueAverage")),
        "TorqueMax": safe(w.get("torqueMaximum")),
        "IF": safe(w.get("if")),
        "TSS": safe(w.get("tssActual")),
        "Rpe": safe(w.get("rpe")),
        "Feeling": safe(w.get("feeling")),
    }

    for i in range(1, 11):
        row[f"HRZone{i}Minutes"] = hr_zones.get(i, "")
        row[f"PWRZone{i}Minutes"] = pwr_zones.get(i, "")

    return row


def format_step(step):
    length = step.get("length", {})
    targets = step.get("targets", [])
    target = targets[0] if targets else {}
    return {
        "name": step.get("name", step.get("intensityClass", "")),
        "intensityClass": step.get("intensityClass", "active"),
        "value": length.get("value"),
        "unit": length.get("unit", ""),
        "targetMin": target.get("minValue"),
        "targetMax": target.get("maxValue"),
    }


def format_structure(structure):
    """Convert TP structure into grouped intervals with repeat blocks."""
    if not structure:
        return None
    metric = structure.get("primaryIntensityMetric", "")
    blocks = []
    for block in structure.get("structure", []):
        reps = block.get("length", {}).get("value", 1)
        steps = [format_step(s) for s in block.get("steps", [])]
        if not steps:
            continue
        if reps > 1 or len(steps) > 1:
            blocks.append({"type": "repeat", "reps": reps, "steps": steps})
        else:
            blocks.append({**steps[0], "type": "single"})
    return {"metric": metric, "blocks": blocks} if blocks else None


def build_extra_data(workouts, threshold_speed=None):
    """Build the extra JSON data (structure, compliance, etc.) for each workout."""
    extra = {}
    if threshold_speed:
        extra["_thresholdSpeed"] = round(threshold_speed, 6)
    for w in workouts:
        day = str(w.get("workoutDay", ""))[:10]
        title = safe(w.get("title"))
        key = f"{day}_{title}"

        entry = {}

        struct = format_structure(w.get("structure"))
        if struct:
            entry["structure"] = struct

        compliance = {}
        if w.get("complianceDurationPercent") is not None:
            compliance["duration"] = round(w["complianceDurationPercent"], 1)
        if w.get("complianceTssPercent") is not None:
            compliance["tss"] = round(w["complianceTssPercent"], 1)
        if w.get("complianceDistancePercent") is not None:
            compliance["distance"] = round(w["complianceDistancePercent"], 1)
        if compliance:
            entry["compliance"] = compliance

        if w.get("elevationGain") is not None:
            entry["elevationGain"] = round(w["elevationGain"])
        if w.get("elevationLoss") is not None:
            entry["elevationLoss"] = round(w["elevationLoss"])
        if w.get("normalizedSpeedActual") is not None:
            entry["normalizedSpeed"] = w["normalizedSpeedActual"]
        if w.get("calories") is not None:
            entry["calories"] = w["calories"]
        if w.get("startTime"):
            entry["startTime"] = w["startTime"]
        if w.get("tssPlanned") is not None:
            entry["tssPlanned"] = w["tssPlanned"]
        if w.get("ifPlanned") is not None:
            entry["ifPlanned"] = round(w["ifPlanned"], 4)

        if entry:
            extra[key] = entry

    return extra


def write_csv(rows, output_path):
    rows.sort(key=lambda r: r.get("WorkoutDay", ""))

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        header_line = ' "' + '","'.join(CSV_HEADERS) + '"\n'
        f.write(header_line)

        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS, quoting=csv.QUOTE_ALL)
        for row in rows:
            writer.writerow(row)

    print(f"Wrote {len(rows)} workouts to {output_path}")


def write_extra_json(extra, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(extra, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Wrote {len(extra)} entries to {output_path}")


def main():
    print("TrainingPeaks Sync")
    print("=" * 40)

    cookie, athlete_id = load_env()
    print(f"Cookie loaded, Athlete ID: {athlete_id}")

    print("Authenticating...")
    token = get_token(cookie)
    print("Token obtained")

    start = datetime(2026, 1, 1)
    end = datetime(2026, 9, 30)
    print(f"\nFetching workouts {start.date()} -> {end.date()}...")
    workouts = fetch_workouts(token, athlete_id, start, end)
    print(f"Total: {len(workouts)} workouts")

    if not workouts:
        print("No workouts found.")
        sys.exit(1)

    completed_ids = [w["workoutId"] for w in workouts if is_completed(w)]
    print(f"\nFetching zone data for {len(completed_ids)} completed workouts...")

    zones_cache = {}
    threshold_speed = None
    for i, wid in enumerate(completed_ids):
        if (i + 1) % 10 == 0:
            print(f"  {i + 1}/{len(completed_ids)}...", flush=True)
        hr_z, pwr_z, t_speed = fetch_workout_zones(wid, token, athlete_id)
        zones_cache[wid] = (hr_z, pwr_z)
        if t_speed and not threshold_speed:
            threshold_speed = t_speed

    print(f"  Done ({len(zones_cache)} workouts with zone data)")
    if threshold_speed:
        tp = 1000 / threshold_speed / 60
        print(f"  Threshold pace: {int(tp)}:{int((tp % 1) * 60):02d}/km")

    rows = []
    for w in workouts:
        wid = w["workoutId"]
        cached = zones_cache.get(wid, ({}, {}))
        rows.append(map_workout(w, cached[0], cached[1]))

    write_csv(rows, OUTPUT_CSV)

    print("\nBuilding extra data (structure, compliance)...")
    extra = build_extra_data(workouts, threshold_speed)
    write_extra_json(extra, OUTPUT_JSON)

    print("\nDone!")


if __name__ == "__main__":
    main()
