#!/usr/bin/env python3
"""
Sync workout data from CSV to Google Calendar.
Creates/updates calendar events for future workouts.

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

SKIP_TYPES = {"Day Off"}


def load_credentials():
    """Load Google service account credentials from env var (JSON string or file path)."""
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    if not raw:
        print("Error: GOOGLE_SERVICE_ACCOUNT_JSON not set")
        sys.exit(1)

    calendar_id = os.environ.get("GOOGLE_CALENDAR_ID", "")
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
    return "tp" + hashlib.sha256(key.encode()).hexdigest()[:30]


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

    threshold_speed = extra.get("_thresholdSpeed")

    for w in workouts:
        day = (w.get("WorkoutDay") or "")[:10]
        title = w.get("Title", "")
        key = f"{day}_{title}"
        w.update(extra.get(key, {}))
        if threshold_speed:
            w["_thresholdSpeed"] = threshold_speed

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


def format_pace_target(step, metric, threshold_speed):
    """Format the target pace/power/rpe for a step."""
    t_min = step.get("targetMin")
    t_max = step.get("targetMax")
    if t_min is None and t_max is None:
        return ""

    if metric == "percentOfThresholdPace" and threshold_speed:
        paces = []
        if t_max:
            paces.append(speed_to_pace(threshold_speed * t_max / 100))
        if t_min:
            paces.append(speed_to_pace(threshold_speed * t_min / 100))
        pace_str = " - ".join(paces)
        return f" @ {pace_str}/km"
    elif metric == "percentOfFtp":
        if t_min and t_max:
            return f" @ {t_min}-{t_max}% FTP"
        return f" @ {t_min or t_max}% FTP"
    elif metric == "rpe":
        if t_min and t_max:
            return f" @ RPE {t_min}-{t_max}"
        return f" @ RPE {t_min or t_max}"
    return ""


def format_structure(workout):
    """Format the workout structure with paces into a readable string."""
    structure = workout.get("structure")
    if not structure:
        return ""

    metric = structure.get("metric", "")
    blocks = structure.get("blocks", [])
    threshold_speed = workout.get("_thresholdSpeed")

    lines = ["\nWorkout Plan:"]
    for block in blocks:
        btype = block.get("type", "single")
        if btype == "repeat":
            reps = block.get("reps", 1)
            steps = block.get("steps", [])
            lines.append(f"  {reps}x:")
            for step in steps:
                dur = format_duration_or_distance(step.get("value", 0), step.get("unit", ""))
                pace = format_pace_target(step, metric, threshold_speed)
                name = step.get("name", "")
                lines.append(f"    - {name} {dur}{pace}")
        else:
            dur = format_duration_or_distance(block.get("value", 0), block.get("unit", ""))
            pace = format_pace_target(block, metric, threshold_speed)
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

    coach = workout.get("CoachComments", "")
    if coach and coach.strip():
        parts.append(f"\nCoach Comments:\n{coach}")

    return "\n".join(parts)


def build_event(workout):
    """Build a Google Calendar event body from a workout row."""
    day = (workout.get("WorkoutDay") or "")[:10]
    title = workout.get("Title", "")
    wtype = workout.get("WorkoutType", "")

    summary = f"{wtype}: {title}" if wtype and title else (title or wtype or "Workout")
    event_id = make_event_id(day, title)

    duration = parse_duration_hours(workout.get("PlannedDuration", ""))
    start = datetime.strptime(day, "%Y-%m-%d").replace(hour=DEFAULT_START_HOUR)
    end = start + duration

    return {
        "id": event_id,
        "summary": summary,
        "description": build_description(workout),
        "start": {"dateTime": start.isoformat(), "timeZone": TIMEZONE},
        "end": {"dateTime": end.isoformat(), "timeZone": TIMEZONE},
        "reminders": {"useDefault": False, "overrides": []},
    }


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


def main():
    print("Google Calendar Sync")
    print("=" * 40)

    creds, calendar_id = load_credentials()
    service = build("calendar", "v3", credentials=creds)
    print(f"Calendar ID: {calendar_id}")

    workouts = load_workouts()
    print(f"Loaded {len(workouts)} workouts from CSV")

    today = datetime.now().strftime("%Y-%m-%d")

    created = 0
    updated = 0
    skipped = 0
    errors = 0

    for w in workouts:
        day = (w.get("WorkoutDay") or "")[:10]
        title = w.get("Title", "")
        wtype = w.get("WorkoutType", "")

        if not day or day < today or wtype in SKIP_TYPES:
            skipped += 1
            continue

        event = build_event(w)

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

    print(f"\nDone! Created: {created}, Updated: {updated}, Skipped: {skipped}, Errors: {errors}")
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
