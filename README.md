# Running Dashboard

A personal running dashboard that displays:

- **Race countdown** - Live countdown timer to your next race
- **Running stats** - Track total distance, time, and completed runs
- **Race calendar** - View upcoming and past races
- **Training plan** - Weekly workout schedule loaded from CSV files
- **Gear showcase** - Display your running gear with affiliate links
- **Spotify playlist** - Link to your running music
- **Team pages** - Support for multiple athletes with their own stats

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
4. **Environment variables** (if needed for future API routes): Add `TP_AUTH_COOKIE` and `TP_ATHLETE_ID` in Vercel project settings > Environment Variables

## Data Sync

TrainingPeaks data is synced automatically via GitHub Actions (`.github/workflows/sync-tp.yml`).
The workflow commits updated CSV/JSON files, and Vercel auto-deploys on push.

## Google Calendar Sync

Future workouts are synced to Google Calendar automatically after each TrainingPeaks sync (`.github/workflows/sync-gcal.yml`).

Each workout creates a calendar event at **08:00 Israel time** with the planned duration, workout description, coach comments, and **calculated target paces** (converted from threshold pace percentages).

Duplicate prevention uses deterministic event IDs — the script is idempotent and safe to run multiple times.

### Setup

Uses a Google Cloud **Service Account** shared with the target calendar with "Make changes to events" permission.

**Required GitHub Secrets:**

| Secret | Value |
|--------|-------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key content from the service account |
| `GOOGLE_CALENDAR_ID` | Target calendar ID (your Google Calendar ID) |

**Local testing:**

```bash
export GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account-key.json
export GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com
python3 scripts/sync-gcal.py
```

## Strava Personal Records

Personal Records (PRs) are fetched from Strava and displayed on the main dashboard.

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
