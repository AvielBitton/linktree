#!/usr/bin/env python3
"""
Sync workout data from Runna via Google Calendar iCal feed to CSV + JSON.
Reads RUNNA_ICAL_URL from env vars or .env file.
Usage: python3 scripts/sync-runna.py
"""

import csv
import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
OUTPUT_CSV = PROJECT_ROOT / "public" / "data" / "aviel" / "2026.csv"
OUTPUT_JSON = PROJECT_ROOT / "public" / "data" / "aviel" / "2026-extra.json"

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

EMOJI_TYPE_MAP = {
    "\U0001f3c3": "Run",       # 🏃
    "\U0001f3cb": "Strength",  # 🏋
    "\U0001f938": "Custom",    # 🤸 (Pilates)
    "\U0001f9ce": "Custom",    # 🧎 (Stretch)
}

DATE_START = datetime(2026, 1, 1)
DATE_END = datetime(2026, 12, 31)


def flatten_text(text):
    """Replace newlines with spaces and collapse whitespace for CSV safety."""
    if not text:
        return ""
    text = text.replace("\r\n", " ").replace("\r", " ").replace("\n", " ")
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def load_env():
    """Load RUNNA_ICAL_URL from env vars or .env file."""
    url = os.environ.get("RUNNA_ICAL_URL", "")
    if not url and ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                if key.strip() == "RUNNA_ICAL_URL":
                    url = val.strip()
                    break
    if not url or url == "PASTE_SECRET_ICAL_URL_HERE":
        print("Error: RUNNA_ICAL_URL not set (env var or .env)")
        sys.exit(1)
    return url


def fetch_ical(url):
    """Download the iCal feed."""
    print(f"Fetching iCal feed...")
    req = urllib.request.Request(url, headers={"User-Agent": "sync-runna/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        print(f"Error: HTTP {e.code} fetching iCal feed")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def unfold_ical(text):
    """Unfold iCal line continuations (RFC 5545: lines starting with space are continuations)."""
    return re.sub(r"\r?\n[ \t]", "", text)


def parse_events(ical_text):
    """Parse VEVENT blocks from iCal text."""
    ical_text = unfold_ical(ical_text)
    events = []
    for block in ical_text.split("BEGIN:VEVENT")[1:]:
        block = block.split("END:VEVENT")[0]
        event = {}
        for line in block.strip().splitlines():
            if ":" not in line:
                continue
            key, _, value = line.partition(":")
            key = key.split(";")[0]
            event[key] = value
        events.append(event)
    return events


def unescape_ical(text):
    """Unescape iCal text values."""
    return text.replace("\\n", "\n").replace("\\,", ",").replace("\\;", ";").replace("\\\\", "\\")


def detect_type_from_emoji(summary):
    """Detect workout type from the emoji prefix in SUMMARY."""
    for emoji, wtype in EMOJI_TYPE_MAP.items():
        if summary.startswith(emoji):
            return wtype
    return "Other"


def clean_title(summary):
    """Remove emoji prefix from title."""
    return re.sub(r"^[\U0001f300-\U0001f9ff\u200d\u2640\u2642\ufe0f]+\s*", "", summary).strip()


def is_planned(event):
    """Check if event is a planned (future) workout from Runna plan."""
    uid = event.get("UID", "")
    return "_plan_week_" in uid


def get_event_date(event):
    """Extract date string (YYYY-MM-DD) from event."""
    dtstart = event.get("DTSTART", "")
    if len(dtstart) >= 8:
        return f"{dtstart[:4]}-{dtstart[4:6]}-{dtstart[6:8]}"
    return ""


def get_event_datetime(event):
    """Extract full datetime from event DTSTART (for completed workouts with timestamps)."""
    dtstart = event.get("DTSTART", "")
    if "T" in dtstart and len(dtstart) >= 15:
        return f"{dtstart[:4]}-{dtstart[4:6]}-{dtstart[6:8]}T{dtstart[9:11]}:{dtstart[11:13]}:{dtstart[13:15]}"
    return None


def parse_time_to_hours(time_str):
    """Parse time string like '1:31:57', '55:00', '49:23' to hours."""
    parts = time_str.strip().split(":")
    try:
        if len(parts) == 3:
            return int(parts[0]) + int(parts[1]) / 60.0 + int(parts[2]) / 3600.0
        elif len(parts) == 2:
            return int(parts[0]) / 60.0 + int(parts[1]) / 3600.0
    except ValueError:
        pass
    return None


def parse_pace_to_velocity(pace_str):
    """Parse pace string like '6:07' (min/km) to velocity in m/s."""
    parts = pace_str.strip().split(":")
    try:
        if len(parts) == 2:
            total_secs = int(parts[0]) * 60 + int(parts[1])
            if total_secs > 0:
                return 1000.0 / total_secs
    except ValueError:
        pass
    return None


def parse_distance_km(text):
    """Parse distance like '15.01 km', '15.01km' to meters."""
    m = re.search(r"([\d.]+)\s*km", text)
    if m:
        return float(m.group(1)) * 1000
    return None


def parse_completed_description(desc):
    """Parse the description of a completed workout.

    Returns dict with: distance_m, time_hours, velocity, pace, laps, description, pbs
    """
    result = {}

    summary_m = re.search(r"Summary:\s*\n(.*?)(?:\n\n|\n📋|\n♻️|\n🏆|\n📲|$)", desc, re.DOTALL)
    if summary_m:
        summary_text = summary_m.group(1)

        dist_m = re.search(r"Distance:\s*([\d.]+)\s*km", summary_text)
        if dist_m:
            result["distance_m"] = float(dist_m.group(1)) * 1000

        time_m = re.search(r"Time:\s*([\d:]+)", summary_text)
        if time_m and "{{" not in time_m.group(1):
            result["time_hours"] = parse_time_to_hours(time_m.group(1))

        pace_m = re.search(r"Avg Pace:\s*([\d:]+)\s*/km", summary_text)
        if pace_m:
            result["velocity"] = parse_pace_to_velocity(pace_m.group(1))

    desc_m = re.search(r"📋 Description:\s*\n(.*?)(?:\n\n|\n♻️|\n🏆|\n📲|$)", desc, re.DOTALL)
    if desc_m:
        result["description"] = desc_m.group(1).strip()

    laps_m = re.search(r"♻️ Laps:\s*\n(.*?)(?:\n\n|\n🏆|\n📲|$)", desc, re.DOTALL)
    if laps_m:
        laps = []
        for lap_line in laps_m.group(1).strip().splitlines():
            lap_match = re.match(r"([\d.]+)\s*km\s*@\s*([\d:]+)\s*/km", lap_line.strip())
            if lap_match:
                laps.append({
                    "distance_km": float(lap_match.group(1)),
                    "pace": lap_match.group(2),
                })
        result["laps"] = laps

    pbs_m = re.search(r"🏆 PBs:\s*\n(.*?)(?:\n\n|\n📲|$)", desc, re.DOTALL)
    if pbs_m:
        result["pbs"] = pbs_m.group(1).strip()

    return result


def parse_planned_description(desc):
    """Parse the description of a planned workout.

    Returns dict with: subtype, distance_m, duration_hours, description (full text)
    """
    result = {}
    result["description"] = desc.split("\n📲")[0].strip()

    header_m = re.match(r"^(.+?)(?:\s*•\s*([\d.]+(?:km|m)))?\s*(?:•\s*(\d+[hm]\s*\d*[hm]?\s*-\s*\d+[hm]\s*\d*[hm]?|\d+m\s*-\s*\d+m))?\s*$",
                         desc.split("\n")[0], re.IGNORECASE)
    if header_m:
        result["subtype"] = header_m.group(1).strip()

    dist_m = re.search(r"•\s*([\d.]+)\s*km\b", desc.split("\n")[0])
    if dist_m:
        result["distance_m"] = float(dist_m.group(1)) * 1000

    dur_range = re.search(r"•\s*(\d+)(?:h(\d+))?m?\s*-\s*(\d+)(?:h(\d+))?m?", desc.split("\n")[0])
    if dur_range:
        low_mins = int(dur_range.group(1))
        if dur_range.group(2):
            low_mins = int(dur_range.group(1)) * 60 + int(dur_range.group(2))
        high_mins = int(dur_range.group(3))
        if dur_range.group(4):
            high_mins = int(dur_range.group(3)) * 60 + int(dur_range.group(4))
        avg_mins = (low_mins + high_mins) / 2
        result["duration_hours"] = avg_mins / 60.0
    else:
        dur_single = re.search(r"•\s*(\d+)m\b", desc.split("\n")[0])
        if dur_single:
            result["duration_hours"] = int(dur_single.group(1)) / 60.0

    return result


def parse_planned_structure(desc):
    """Parse interval structure from planned workout description text.

    Returns structure dict compatible with the existing extra JSON format,
    or None if no structure found.
    """
    lines = desc.split("\n📲")[0].split("\n")
    if len(lines) < 2:
        return None

    body_lines = lines[1:]
    body = "\n".join(body_lines).strip()
    if not body:
        return None

    blocks = []

    repeat_m = re.search(
        r"Repeat the following (\d+)x:\s*\n-+\n(.*?)\n-+",
        body, re.DOTALL
    )
    reps_m = re.search(
        r"(\d+) reps of:\s*\n(.*?)(?:\n\n|$)",
        body, re.DOTALL
    )

    # Parse pre-repeat segment steps
    pre_text = body
    if repeat_m:
        pre_text = body[:repeat_m.start()]
    elif reps_m:
        pre_text = body[:reps_m.start()]

    for step in _parse_run_steps(pre_text):
        blocks.append({**step, "type": "single"})

    if repeat_m:
        reps = int(repeat_m.group(1))
        repeat_body = repeat_m.group(2)
        steps = _parse_run_steps(repeat_body)
        if steps:
            blocks.append({"type": "repeat", "reps": reps, "steps": steps})
        post_text = body[repeat_m.end():]
        for step in _parse_run_steps(post_text):
            blocks.append({**step, "type": "single"})
    elif reps_m:
        reps = int(reps_m.group(1))
        repeat_body = reps_m.group(2)
        steps = _parse_run_steps(repeat_body)
        if steps:
            blocks.append({"type": "repeat", "reps": reps, "steps": steps})
        post_text = body[reps_m.end():]
        for step in _parse_run_steps(post_text):
            blocks.append({**step, "type": "single"})

    if not blocks:
        return None

    return {"metric": "pace", "blocks": blocks}


def _parse_run_steps(text):
    """Parse individual run steps from description text like '2km warm up at a conversational pace'."""
    steps = []
    for line in text.strip().splitlines():
        line = line.strip().lstrip("•").strip()
        if not line or line.startswith("-") or line.startswith("📲"):
            continue

        step = {}

        dist_m = re.match(r"([\d.]+)\s*(km|m)\b", line)
        time_m = re.match(r"(\d+)\s*(?:min|s|sec)\b", line)

        if dist_m:
            val = float(dist_m.group(1))
            unit = dist_m.group(2)
            if unit == "km":
                step["value"] = val * 1000
                step["unit"] = "meter"
            else:
                step["value"] = val
                step["unit"] = "meter"
        elif time_m:
            val = int(time_m.group(1))
            unit_text = re.search(r"(min|s|sec)", line).group(1)
            if unit_text == "min":
                step["value"] = val * 60
            else:
                step["value"] = val
            step["unit"] = "second"
        else:
            pace_only = re.search(r"at\s+([\d:]+)/km", line)
            if not pace_only:
                continue
            step["value"] = 0
            step["unit"] = "meter"

        pace_m = re.search(r"at\s+([\d:]+)/km", line)
        if pace_m:
            pace_str = pace_m.group(1)
            parts = pace_str.split(":")
            if len(parts) == 2:
                total_secs = int(parts[0]) * 60 + int(parts[1])
                speed = 1000.0 / total_secs if total_secs > 0 else None
                if speed:
                    step["targetSpeed"] = round(speed, 4)

        pace_range = re.search(r"\(([\d:]+)\s*-\s*([\d:]+)/km\)", line)
        if pace_range:
            for p_str, key in [(pace_range.group(1), "targetSpeedMax"), (pace_range.group(2), "targetSpeedMin")]:
                parts = p_str.split(":")
                if len(parts) == 2:
                    total_secs = int(parts[0]) * 60 + int(parts[1])
                    if total_secs > 0:
                        step[key] = round(1000.0 / total_secs, 4)

        if "warm" in line.lower():
            step["name"] = "Warm-up"
            step["intensityClass"] = "warmUp"
        elif "cool" in line.lower():
            step["name"] = "Cool down"
            step["intensityClass"] = "coolDown"
        elif "rest" in line.lower() or "walk" in line.lower():
            step["name"] = "Rest"
            step["intensityClass"] = "rest"
        elif "conversational" in line.lower() or "comfortable" in line.lower() or "easy" in line.lower():
            step["name"] = "Easy"
            step["intensityClass"] = "active"
        else:
            step["name"] = "Active"
            step["intensityClass"] = "active"

        steps.append(step)

    return steps


def build_workout_row(event):
    """Build a CSV row dict from an iCal event."""
    summary = event.get("SUMMARY", "")
    desc_raw = unescape_ical(event.get("DESCRIPTION", ""))
    workout_day = get_event_date(event)
    title = clean_title(summary)
    workout_type = detect_type_from_emoji(summary)

    row = {h: "" for h in CSV_HEADERS}
    row["Title"] = title
    row["WorkoutType"] = workout_type
    row["WorkoutDay"] = workout_day

    if is_planned(event):
        parsed = parse_planned_description(desc_raw)
        row["WorkoutDescription"] = flatten_text(parsed.get("description", ""))
        if parsed.get("distance_m"):
            row["PlannedDistanceInMeters"] = str(parsed["distance_m"])
        if parsed.get("duration_hours"):
            row["PlannedDuration"] = str(parsed["duration_hours"])
    else:
        parsed = parse_completed_description(desc_raw)
        if parsed.get("description"):
            row["WorkoutDescription"] = flatten_text(parsed["description"])
        if parsed.get("distance_m") is not None:
            row["DistanceInMeters"] = str(parsed["distance_m"])
        if parsed.get("time_hours") is not None:
            row["TimeTotalInHours"] = str(parsed["time_hours"])
        if parsed.get("velocity") is not None:
            row["VelocityAverage"] = str(parsed["velocity"])

    return row


def build_extra_entry(event):
    """Build extra JSON entry for a workout event."""
    desc_raw = unescape_ical(event.get("DESCRIPTION", ""))
    entry = {}

    if is_planned(event):
        structure = parse_planned_structure(desc_raw)
        if structure:
            entry["structure"] = structure
    else:
        start_time = get_event_datetime(event)
        if start_time:
            entry["startTime"] = start_time

        parsed = parse_completed_description(desc_raw)
        if parsed.get("laps"):
            entry["laps"] = parsed["laps"]
        if parsed.get("pbs"):
            entry["pbs"] = parsed["pbs"]

    uid = event.get("UID", "")
    runna_link = re.search(r"https://club\.runna\.com/\S+", desc_raw)
    if runna_link:
        entry["runnaUrl"] = runna_link.group(0)

    return entry


def write_csv(rows, output_path):
    """Write workout rows to CSV in the same format as the old sync-tp.py."""
    rows.sort(key=lambda r: r.get("WorkoutDay", ""))

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        header_line = '"' + '","'.join(CSV_HEADERS) + '"\n'
        f.write(header_line)

        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS, quoting=csv.QUOTE_ALL)
        for row in rows:
            writer.writerow(row)

    print(f"Wrote {len(rows)} workouts to {output_path}")


def write_extra_json(extra, output_path):
    """Write extra data to JSON."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(extra, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Wrote {len(extra)} entries to {output_path}")


def main():
    print("Runna Sync")
    print("=" * 40)

    ical_url = load_env()
    print("iCal URL loaded")

    ical_text = fetch_ical(ical_url)
    events = parse_events(ical_text)
    print(f"Parsed {len(events)} events from iCal feed")

    planned = [e for e in events if is_planned(e)]
    completed = [e for e in events if not is_planned(e)]
    print(f"  Planned: {len(planned)}, Completed: {len(completed)}")

    filtered = []
    for e in events:
        date_str = get_event_date(e)
        if not date_str:
            continue
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            continue
        if DATE_START <= dt <= DATE_END:
            filtered.append(e)

    print(f"  In date range ({DATE_START.year}): {len(filtered)}")

    if not filtered:
        print("No workouts found in date range.")
        sys.exit(0)

    rows = []
    extra = {}

    for e in filtered:
        row = build_workout_row(e)
        rows.append(row)

        day = row["WorkoutDay"]
        title = row["Title"]
        key = f"{day}_{title}"

        entry = build_extra_entry(e)
        if entry:
            extra[key] = entry

    write_csv(rows, OUTPUT_CSV)

    print("\nBuilding extra data...")
    write_extra_json(extra, OUTPUT_JSON)

    print(f"\nDone! {len(rows)} workouts synced.")


if __name__ == "__main__":
    main()
