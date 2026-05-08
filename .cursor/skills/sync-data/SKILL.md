---
name: sync-data
description: >-
  Run data sync scripts (Garmin, Strava, Runna) and commit+push results.
  Use when the user asks to sync, refresh, update, or pull data from
  Garmin, Strava, Runna, or says "sync", "סינק", "תסנכרן", "תעדכן נתונים".
---

# Sync Data

Run sync scripts from `scripts/` using the project venv, then commit and push changed data files.

## Available syncs

| Name | Script | Output files |
|------|--------|-------------|
| garmin | `scripts/sync-garmin.py` | `public/data/aviel/garmin-health.json` |
| strava-prs | `scripts/sync-strava.py` | `public/data/aviel/strava-prs.json` |
| strava-activities | `scripts/sync-strava-activities.py` | `public/data/aviel/strava-activities.json` |
| runna | `scripts/sync-runna.py` | `public/data/aviel/2026.csv`, `public/data/aviel/2026-extra.json` |

## Execution

1. Determine which syncs to run based on the user's request. If the user says "sync all" or just "sync" without specifying, run **all** of them.
2. Run each script using the project venv:

```bash
scripts/.venv/bin/python scripts/sync-<name>.py
```

3. Use `block_until_ms: 120000` — these scripts make API calls and can take up to ~2 minutes.
4. Run syncs sequentially (they share rate-limited APIs and the venv).

## After syncing

1. Run `git status` to check which data files changed.
2. If any output files changed, commit only the data files (not unrelated changes):

```bash
git add public/data/aviel/<changed-files>
git commit -m "Auto-sync <list of synced sources>"
```

3. Push. If rejected, do `git stash && git pull --rebase origin main && git stash pop && git push`.

## Important

- Working directory is always the project root: `/Users/aviel/dev/linktree`
- Never commit files outside `public/data/aviel/`.
- If a script fails, report the error and continue with the next sync.
- Don't ask for confirmation — just run.
