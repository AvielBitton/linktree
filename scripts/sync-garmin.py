#!/usr/bin/env python3
"""
Fetch daily health data from Garmin Connect.
Uses garminconnect >=0.3.2 with DI OAuth token caching.

Saves to public/data/aviel/garmin-health.json.
Usage: scripts/.venv/bin/python scripts/sync-garmin.py
"""

import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

try:
    from garminconnect import Garmin
except ImportError:
    print("Run: scripts/.venv/bin/pip install garminconnect curl_cffi")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "public" / "data" / "aviel" / "garmin-health.json"
TOKENSTORE = PROJECT_ROOT / ".garminconnect"
ENV_PATH = PROJECT_ROOT / ".env"

LOOKBACK_DAYS_FIRST_RUN = 90
LOOKBACK_DAYS_INCREMENTAL = 30


def load_env():
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


def login():
    email = os.environ.get("GARMIN_EMAIL", "")
    password = os.environ.get("GARMIN_PASSWORD", "")
    if not email or not password:
        print("Set GARMIN_EMAIL and GARMIN_PASSWORD in .env")
        sys.exit(1)

    client = Garmin(email, password, prompt_mfa=lambda: input("Enter MFA code: "))
    try:
        client.login(str(TOKENSTORE))
        print(f"Logged in: {client.full_name}")
        return client
    except Exception as e:
        if "429" in str(e):
            print("Rate limited. Wait 15-30 min and retry.")
        else:
            print(f"Login failed: {e}")
        sys.exit(1)


def safe(fn):
    try:
        r = fn()
        time.sleep(1)
        return r
    except Exception:
        return None


def extract_day(client, date_str):
    sleep = safe(lambda: client.get_sleep_data(date_str))
    hr = safe(lambda: client.get_heart_rates(date_str))

    daily = (sleep or {}).get("dailySleepDTO", sleep or {})
    scores = (sleep or {}).get("sleepScores", daily.get("sleepScores", {}))
    overall = scores.get("overall", {})

    return {
        "date": date_str,
        "sleep": {
            "totalSeconds": daily.get("sleepTimeSeconds"),
            "deepSeconds": daily.get("deepSleepSeconds"),
            "lightSeconds": daily.get("lightSleepSeconds"),
            "remSeconds": daily.get("remSleepSeconds"),
            "awakeSeconds": daily.get("awakeSleepSeconds"),
            "score": overall.get("value") if isinstance(overall, dict) else overall,
            "avgHR": daily.get("averageSleepHeartRate"),
            "avgHRV": (sleep or {}).get("averageSleepHRV"),
        } if sleep else None,
        "restingHeartRate": (hr or {}).get("restingHeartRate"),
    }


def normalize_day(day):
    """Convert old 5-field format to new slim format."""
    if "restingHeartRate" in day:
        return day
    rhr = None
    if isinstance(day.get("heartRate"), dict):
        rhr = day["heartRate"].get("resting")
    sleep = day.get("sleep")
    if sleep and "avgRespiration" in sleep:
        sleep = {k: v for k, v in sleep.items() if k != "avgRespiration"}
    if not sleep and isinstance(day.get("hrv"), dict):
        pass
    return {"date": day["date"], "sleep": sleep, "restingHeartRate": rhr}


def main():
    load_env()
    print("Garmin Health Sync\n" + "=" * 30)

    client = login()

    existing = {}
    migrated = False
    if OUTPUT_PATH.exists():
        try:
            data = json.loads(OUTPUT_PATH.read_text())
            for d in data.get("days", []):
                normalized = normalize_day(d)
                if normalized is not d:
                    migrated = True
                existing[normalized["date"]] = normalized
        except Exception:
            pass
    if migrated:
        print(f"Migrated {len(existing)} days to new format")

    today = datetime.now().date()
    if existing:
        last = max(existing.keys())
        start = datetime.strptime(last, "%Y-%m-%d").date() + timedelta(days=1)
        print(f"Last synced: {last} ({len(existing)} days)")
    else:
        start = today - timedelta(days=LOOKBACK_DAYS_FIRST_RUN)
        print(f"First run: fetching {LOOKBACK_DAYS_FIRST_RUN} days")

    if start > today:
        print("Up to date.")
        return

    dates = []
    d = start
    while d <= today:
        dates.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)

    print(f"Fetching {len(dates)} days...")
    for i, ds in enumerate(dates):
        print(f"  [{i+1}/{len(dates)}] {ds}...", end="", flush=True)
        try:
            existing[ds] = extract_day(client, ds)
            print(" ok")
        except Exception as e:
            print(f" err: {e}")

    all_days = sorted(existing.values(), key=lambda d: d["date"], reverse=True)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps({"last_sync": datetime.now().isoformat(), "days": all_days}, indent=2, ensure_ascii=False))

    print(f"\nSaved {len(all_days)} days to {OUTPUT_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
