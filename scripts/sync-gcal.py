#!/usr/bin/env python3
"""
Sync workout data from CSV to Google Calendar.
Creates/updates calendar events for future workouts.
Works with data produced by sync-runna.py (Runna iCal -> CSV/JSON).

Reads credentials from env vars:
  GOOGLE_SERVICE_ACCOUNT_JSON  – JSON key content (or path to .json file)
  GOOGLE_CALENDAR_ID           – target calendar ID

Usage: python3 scripts/sync-gcal.py
"""

import csv
import hashlib
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = PROJECT_ROOT / "public" / "data" / "aviel" / "2026.csv"
EXTRA_JSON_PATH = PROJECT_ROOT / "public" / "data" / "aviel" / "2026-extra.json"

TIMEZONE = "Asia/Jerusalem"
DEFAULT_START_HOUR = 8
DEFAULT_DURATION_HOURS = 2
SCOPES = ["https://www.googleapis.com/auth/calendar"]

EVENT_ID_PREFIX = "rn"
OLD_EVENT_ID_PREFIX = "tp"

SKIP_TYPES = {"Day Off"}

# Must stay in sync with src/utils/strength-map.js
STRENGTH_MAP = {
    1: "Lower",    # Sat  Apr 18
    2: "Pull",     # Mon  Apr 21
    3: "Push",     # Tue  Apr 22
    4: "Upper",    # Wed  Apr 23
    5: "Lower",    # Fri  Apr 25
    6: "Push",     # Mon  Apr 28
    7: "Upper",    # Tue  Apr 29
    8: "Pull",     # Wed  Apr 30
    9: "Lower",    # Fri  May 2
}

COLOR_MAP = {
    "Run": "2",        # Sage (green)
    "Strength": "8",   # Graphite (dark/black)
    "Custom": "3",     # Grape (purple)
    "Other": "5",      # Banana (yellow)
}


def load_credentials():
    """Load Google service account credentials from env var (JSON string or file path)."""
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    if not raw:
        env_file = PROJECT_ROOT / ".env"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    if key.strip() == "GOOGLE_SERVICE_ACCOUNT_JSON" and not raw:
                        raw = val.strip()

    if not raw:
        print("Error: GOOGLE_SERVICE_ACCOUNT_JSON not set")
        sys.exit(1)

    calendar_id = os.environ.get("GOOGLE_CALENDAR_ID", "")
    if not calendar_id:
        env_file = PROJECT_ROOT / ".env"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    if key.strip() == "GOOGLE_CALENDAR_ID" and not calendar_id:
                        calendar_id = val.strip()

    if not calendar_id:
        print("Error: GOOGLE_CALENDAR_ID not set")
        sys.exit(1)

    if os.path.isfile(raw):
        creds = service_account.Credentials.from_service_account_file(raw, scopes=SCOPES)
    else:
        info = json.loads(raw)
        creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)

    return creds, calendar_id


def make_event_id(date_str, title):
    """Generate a deterministic Google Calendar event ID.

    gcal event IDs allow lowercase [a-v0-9], 5-1024 chars.
    Hex chars (0-9, a-f) are a valid subset, so a hex digest works directly.
    """
    key = f"{date_str}_{title}"
    return EVENT_ID_PREFIX + hashlib.sha256(key.encode()).hexdigest()[:30]


def parse_duration_hours(planned_duration_str):
    """Parse PlannedDuration (hours as float string) into a timedelta."""
    if not planned_duration_str or not planned_duration_str.strip():
        return timedelta(hours=DEFAULT_DURATION_HOURS)
    try:
        hours = float(planned_duration_str)
        if hours <= 0:
            return timedelta(hours=DEFAULT_DURATION_HOURS)
        return timedelta(hours=hours)
    except ValueError:
        return timedelta(hours=DEFAULT_DURATION_HOURS)


def load_workouts():
    """Load workouts from the CSV and merge extra JSON fields."""
    if not CSV_PATH.exists():
        print(f"Error: CSV not found at {CSV_PATH}")
        sys.exit(1)

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.strip().splitlines()
    if not lines:
        return []

    lines[0] = lines[0].strip()

    workouts = list(csv.DictReader(lines))

    extra = {}
    if EXTRA_JSON_PATH.exists():
        with open(EXTRA_JSON_PATH, "r", encoding="utf-8") as f:
            extra = json.load(f)

    for w in workouts:
        day = (w.get("WorkoutDay") or "")[:10]
        title = w.get("Title", "")
        key = f"{day}_{title}"
        w.update(extra.get(key, {}))

    return workouts


def speed_to_pace(speed_ms):
    """Convert speed (m/s) to pace string (M:SS/km)."""
    if not speed_ms or speed_ms <= 0:
        return "?"
    secs_per_km = 1000.0 / speed_ms
    m = int(secs_per_km // 60)
    s = int(secs_per_km % 60)
    return f"{m}:{s:02d}"


def format_duration_or_distance(value, unit):
    """Format a block's value+unit for display."""
    if unit == "second":
        mins = int(value // 60)
        if mins >= 60:
            h = mins // 60
            m = mins % 60
            return f"{h}h{m:02d}m" if m else f"{h}h"
        return f"{mins}min"
    elif unit == "meter":
        if value >= 1000:
            km = value / 1000
            return f"{km:g}km"
        return f"{int(value)}m"
    return str(value)


def format_pace_target(step):
    """Format the target pace for a step (Runna format with targetSpeed)."""
    speed = step.get("targetSpeed")
    if speed:
        return f" @ {speed_to_pace(speed)}/km"

    speed_min = step.get("targetSpeedMin")
    speed_max = step.get("targetSpeedMax")
    if speed_min and speed_max:
        return f" @ {speed_to_pace(speed_max)} - {speed_to_pace(speed_min)}/km"
    if speed_min:
        return f" @ {speed_to_pace(speed_min)}/km"
    if speed_max:
        return f" @ {speed_to_pace(speed_max)}/km"

    return ""


def format_structure(workout):
    """Format the workout structure with paces into a readable string."""
    structure = workout.get("structure")
    if not structure:
        return ""

    blocks = structure.get("blocks", [])

    lines = ["\nWorkout Plan:"]
    for block in blocks:
        btype = block.get("type", "single")
        if btype == "repeat":
            reps = block.get("reps", 1)
            steps = block.get("steps", [])
            lines.append(f"  {reps}x:")
            for step in steps:
                dur = format_duration_or_distance(step.get("value", 0), step.get("unit", ""))
                pace = format_pace_target(step)
                name = step.get("name", "")
                lines.append(f"    - {name} {dur}{pace}")
        else:
            dur = format_duration_or_distance(block.get("value", 0), block.get("unit", ""))
            pace = format_pace_target(block)
            name = block.get("name", "")
            lines.append(f"  {name} {dur}{pace}")

    return "\n".join(lines)


def build_description(workout):
    """Build a rich calendar event description from workout fields."""
    parts = []

    wtype = workout.get("WorkoutType", "")
    if wtype:
        parts.append(f"Type: {wtype}")

    dist = workout.get("PlannedDistanceInMeters", "")
    if dist:
        try:
            km = float(dist) / 1000
            parts.append(f"Planned Distance: {km:.1f} km")
        except ValueError:
            pass

    duration_str = workout.get("PlannedDuration", "")
    if duration_str:
        try:
            hours = float(duration_str)
            h = int(hours)
            m = int((hours - h) * 60)
            parts.append(f"Planned Duration: {h}h{m:02d}m")
        except ValueError:
            pass

    desc = workout.get("WorkoutDescription", "")
    if desc and desc.strip():
        parts.append(f"\nDescription:\n{desc}")

    structure_text = format_structure(workout)
    if structure_text:
        parts.append(structure_text)

    runna_url = workout.get("runnaUrl", "")
    if runna_url:
        parts.append(f"\n📲 View in Runna: {runna_url}")

    return "\n".join(parts)


def apply_strength_map(workouts, today):
    """Replace Runna's generic strength titles and descriptions with actual gym info."""
    future_strength = [
        w for w in workouts
        if (w.get("WorkoutType") or "").lower() == "strength"
        and (w.get("WorkoutDay") or "")[:10] >= today
    ]
    future_strength.sort(key=lambda w: (w.get("WorkoutDay") or "")[:10])

    for i, w in enumerate(future_strength):
        ordinal = i + 1
        name = STRENGTH_MAP.get(ordinal)
        if name:
            w["Title"] = name
            w["WorkoutDescription"] = ""
            w["PlannedDuration"] = "1.5"

    return workouts


def build_event(workout):
    """Build a Google Calendar event body from a workout row."""
    day = (workout.get("WorkoutDay") or "")[:10]
    title = workout.get("Title", "")
    wtype = workout.get("WorkoutType", "")

    summary = f"{wtype}: {title}" if wtype and title else (title or wtype or "Workout")
    event_id = make_event_id(day, title)

    duration = parse_duration_hours(workout.get("PlannedDuration", ""))
    start = datetime.strptime(day, "%Y-%m-%d").replace(hour=DEFAULT_START_HOUR)
    end_time = start + duration

    event = {
        "id": event_id,
        "summary": summary,
        "description": build_description(workout),
        "start": {"dateTime": start.isoformat(), "timeZone": TIMEZONE},
        "end": {"dateTime": end_time.isoformat(), "timeZone": TIMEZONE},
        "reminders": {"useDefault": False, "overrides": []},
    }

    color_id = COLOR_MAP.get(wtype)
    if color_id:
        event["colorId"] = color_id

    return event


def upsert_event(service, calendar_id, event):
    """Insert or update a calendar event (upsert by deterministic ID)."""
    event_id = event["id"]
    try:
        service.events().get(calendarId=calendar_id, eventId=event_id).execute()
        result = service.events().update(
            calendarId=calendar_id, eventId=event_id, body=event
        ).execute()
        return "updated", result
    except HttpError as e:
        if e.resp.status == 404:
            result = service.events().insert(
                calendarId=calendar_id, body=event
            ).execute()
            return "created", result
        raise


def cleanup_orphaned_events(service, calendar_id, valid_event_ids, today):
    """Delete future calendar events created by this script that no longer exist in the CSV.
    Also cleans up old TP-prefixed events from the previous TrainingPeaks integration.
    """
    today_rfc = datetime.strptime(today, "%Y-%m-%d").isoformat() + "Z"

    all_events = []
    page_token = None
    while True:
        result = service.events().list(
            calendarId=calendar_id,
            timeMin=today_rfc,
            maxResults=250,
            singleEvents=True,
            pageToken=page_token,
        ).execute()
        all_events.extend(result.get("items", []))
        page_token = result.get("nextPageToken")
        if not page_token:
            break

    deleted = 0
    for event in all_events:
        eid = event.get("id", "")
        is_ours = eid.startswith(EVENT_ID_PREFIX) or eid.startswith(OLD_EVENT_ID_PREFIX)
        if not is_ours:
            continue
        if eid in valid_event_ids:
            continue
        try:
            service.events().delete(calendarId=calendar_id, eventId=eid).execute()
            summary = event.get("summary", "?")
            start = event.get("start", {}).get("dateTime", "?")[:10]
            print(f"  - {start} | {summary} (removed)")
            deleted += 1
        except HttpError:
            pass

    return deleted


def main():
    print("Google Calendar Sync (Runna)")
    print("=" * 40)

    creds, calendar_id = load_credentials()
    service = build("calendar", "v3", credentials=creds)
    print(f"Calendar ID: {calendar_id}")

    workouts = load_workouts()
    print(f"Loaded {len(workouts)} workouts from CSV")

    today = datetime.now().strftime("%Y-%m-%d")
    apply_strength_map(workouts, today)

    created = 0
    updated = 0
    skipped = 0
    errors = 0
    valid_event_ids = set()

    for w in workouts:
        day = (w.get("WorkoutDay") or "")[:10]
        title = w.get("Title", "")
        wtype = w.get("WorkoutType", "")

        if not day or day < today or wtype in SKIP_TYPES:
            skipped += 1
            continue

        event = build_event(w)
        valid_event_ids.add(event["id"])

        try:
            action, _ = upsert_event(service, calendar_id, event)
            if action == "created":
                created += 1
                print(f"  + {day} | {event['summary']}")
            else:
                updated += 1
                print(f"  ~ {day} | {event['summary']}")
        except HttpError as e:
            errors += 1
            print(f"  ! {day} | {event['summary']} – API error {e.resp.status}: {e.reason}")

    deleted = cleanup_orphaned_events(service, calendar_id, valid_event_ids, today)

    print(f"\nDone! Created: {created}, Updated: {updated}, Deleted: {deleted}, Skipped: {skipped}, Errors: {errors}")
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
