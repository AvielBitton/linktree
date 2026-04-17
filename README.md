# Running Dashboard

A personal training dashboard that displays:

- **Weekly schedule** - All workouts (runs, strength, pilates, stretch) from Runna + Strava
- **Training stats** - Track distance, duration, HR, calories across all activity types
- **Workout details** - Planned intervals with target paces, actual splits from Strava
- **Personal records** - Strava best efforts from 400m to Marathon
- **Gym tracker** - Custom workout templates with exercise logging (Supabase)
- **Nutrition** - Meal plans with daily tracking
- **Activity log** - Full Strava activity history with splits visualization

## Tech Stack

- Next.js 15 (App Router, SSG)
- React 18
- TailwindCSS
- Framer Motion
- Recharts
- Vercel (deployment)

## Quick Start

```bash
npm install
npm run dev
```

## Deploy

Deployed automatically via Vercel on every push to `main`.

## Vercel + Domain Setup

1. **Connect repo**: Go to [vercel.com/new](https://vercel.com/new), import the GitHub repo
2. **Add custom domain**: In Vercel project settings > Domains, add `aviel.club`
3. **Update DNS**: Point `aviel.club` to Vercel:
   - **Option A** (CNAME): `aviel.club` → `cname.vercel-dns.com`
   - **Option B** (A record): `aviel.club` → `76.76.21.21`
4. **Environment variables**: Add `RUNNA_ICAL_URL`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_CALENDAR_ID` in Vercel project settings > Environment Variables

## Data Sync — Runna

Training data is synced from the **Runna** app via a Google Calendar iCal feed.

```
Runna App → (native sync) → Runna Google Calendar → (iCal feed) → sync-runna.py → CSV/JSON
CSV/JSON → sync-gcal.py → Your Google Calendar (editable)
Strava → sync-strava-activities.py → strava-activities.json
```

The GitHub Actions workflow (`.github/workflows/sync-runna.yml`) runs twice daily:
1. Fetches the Runna iCal feed and writes `2026.csv` + `2026-extra.json`
2. Pushes future workouts to your editable Google Calendar
3. Commits data files and Vercel auto-deploys

### Data sources and merge strategy

The app merges data from **Runna** and **Strava** at hydration time in the frontend (`mergeStravaActivities()` in `src/utils/workouts.js`). Each source provides complementary data:

| Data | Runna (iCal) | Strava (API) |
|------|-------------|-------------|
| **Planned workouts** (runs, strength, pilates, stretch) | Full details, intervals, pace targets | N/A |
| **Completed runs** | Distance, pace, lap splits | HR, cadence, calories, suffer score, km splits |
| **Completed strength/pilates/yoga** | Not exported by Runna | Duration, HR, calories, suffer score |
| **Completed walks/rides/swims** | N/A | Full activity data |

Strava non-run activities (WeightTraining, Pilates, Yoga, Walk, Ride, Swim) are automatically injected into the workout schedule. Run activities are matched to Runna workouts by date to enrich the detail modal with Strava splits and HR data. All workout detail modals include a "View on Strava" link when a matching activity exists.

**Not available from Runna (was in TrainingPeaks):** HR zones, TSS/IF, RPE/Feeling, compliance %, threshold speed.

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `RUNNA_ICAL_URL` | Secret iCal URL from Google Calendar settings (Runna calendar) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key content from the service account |
| `GOOGLE_CALENDAR_ID` | Target calendar ID (your editable Google Calendar) |

### Local testing

```bash
# Sync Runna data to CSV/JSON
python3 scripts/sync-runna.py

# Push to Google Calendar
pip install -r scripts/requirements-gcal.txt
export GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account-key.json
export GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com
python3 scripts/sync-gcal.py
```

### Google Calendar Sync

Future workouts are pushed to your editable Google Calendar after each Runna sync.

Each workout creates a calendar event at **08:00 Israel time** with the planned duration, workout description, interval structure, and a deep link to the workout in the Runna app.

Duplicate prevention uses deterministic event IDs — the script is idempotent and safe to run multiple times. Old TrainingPeaks events (prefixed `tp`) are automatically cleaned up.

Uses a Google Cloud **Service Account** shared with the target calendar with "Make changes to events" permission.

### Archive

The previous TrainingPeaks integration scripts are archived in `scripts/archive/` and `.github/workflows/archive/` for reference. The old secrets (`TP_AUTH_COOKIE`, `TP_ATHLETE_ID`) can be removed from GitHub.

## Strava Integration

### Activities Sync

All Strava activities (runs, strength, walks, rides, swims, yoga, etc.) are fetched with detailed data including splits, laps, HR, and map polylines. The GitHub Actions workflow (`.github/workflows/sync-strava-activities.yml`) runs twice daily.

Non-run activities from Strava are merged into the workout schedule automatically by the frontend, filling the gap for completed strength sessions, walks, rides, and other activity types that Runna doesn't export.

**Run locally:**

```bash
python3 scripts/sync-strava-activities.py
```

### Personal Records

PRs are fetched from Strava and displayed on the main dashboard.

The sync script scans all run activities, extracts `best_efforts` for standard distances (400m through Marathon), and saves the all-time bests to `public/data/aviel/strava-prs.json`.

**Features:**
- Incremental sync — only fetches new activities on subsequent runs
- Resumable — saves progress if rate-limited, just run again to continue
- No external dependencies — uses Python stdlib only

**Run locally:**

```bash
python3 scripts/sync-strava.py
```

**Required `.env` variables:**

| Variable | Value |
|----------|-------|
| `STRAVA_CLIENT_ID` | Your Strava API app Client ID |
| `STRAVA_CLIENT_SECRET` | Your Strava API app Client Secret |
| `STRAVA_REFRESH_TOKEN` | OAuth refresh token with `activity:read_all` scope |

**Getting a refresh token:**

1. Create an app at [strava.com/settings/api](https://www.strava.com/settings/api)
2. Authorize with the correct scope:
   ```
   https://www.strava.com/oauth/authorize?client_id=YOUR_ID&response_type=code&redirect_uri=http://localhost&scope=activity:read_all
   ```
3. Exchange the `code` from the redirect URL:
   ```bash
   curl -X POST https://www.strava.com/oauth/token \
     -d client_id=YOUR_ID \
     -d client_secret=YOUR_SECRET \
     -d code=THE_CODE \
     -d grant_type=authorization_code
   ```
4. Save the `refresh_token` from the response to `.env`

**Rate limits:** Strava allows 200 requests per 15 minutes. The first full sync (~112 calls for ~111 runs) fits within this limit. Subsequent syncs only fetch new activities.

---

Live at: https://aviel.club
