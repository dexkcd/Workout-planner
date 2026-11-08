# Formkoll — handoff for Claude Code

Everything Claude Code needs to build Formkoll v1, a phone-first PWA for the winter training and diet plan.

## Use it

1. Create an empty repo and copy these files into its root, keeping the folders.
2. Open the repo in Claude Code.
3. Paste the prompt from `KICKOFF_PROMPT.md`. Claude Code will plan Milestone 1, wait for your OK, build it, and stop.

## What's inside

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | Project rules Claude Code reads automatically: sources of truth, how to work, non-negotiables, design tokens, open-question defaults |
| `KICKOFF_PROMPT.md` | The first prompt to paste, plus a short prompt for each following milestone |
| `docs/spec.md` | The v1 spec: screens, requirements, rules, food database and research agent, receipts, 30-table data model, stack, build order |
| `docs/plan.md` | The training and diet plan the app runs |
| `seed/plan.json` | The plan as structured seed data: targets, adjustment rules, locations, schedules, 15 exercises, workouts, meal templates, recipes, staples, reminders |
| `docs/mockups/` | 12 static phone mockups. Open `index.html` to see them all; links inside the screens work |
| `.env.example` | Every env var the app needs: Postgres, bucket, Claude API, YouTube, agent token, Web Push |

## Before you start

Pick up the open questions at the end of `docs/spec.md`. `CLAUDE.md` gives a default for each one, so Claude Code can start without them. You'll need these keys by the milestone that uses them:

| Key | Needed from |
| --- | --- |
| Railway project with Postgres | Milestone 1 |
| `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` | Milestone 4 (Ask AI exercises) |
| `YOUTUBE_API_KEY` (YouTube Data API v3 in Google Cloud) | Milestone 4 |
| Railway bucket credentials | Milestone 4 (climbing clips) |
| VAPID key pair | Milestone 6 (push reminders) |
