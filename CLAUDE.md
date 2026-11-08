# Formkoll

A phone-first PWA that runs one person's winter training and diet plan: today's session and food targets, gym, climbing and frisbee logs, weight trend, food logging, a shopping list, and grocery receipts that turn into meal costs. There's one user, Dexter, in Stockholm.

## Sources of truth

Read these before changing anything, and keep them in sync when behaviour changes.

| File | What it is |
| --- | --- |
| `docs/spec.md` | Requirements, rules, data model, stack and build order. Wins over everything else |
| `docs/plan.md` | The training and diet plan the app runs, with the reasoning behind it |
| `seed/plan.json` | The plan as structured seed data: targets, schedules, workouts, meal templates, recipes, locations, reminders |
| `docs/mockups/index.html` | Static HTML mockups of every screen. Visual reference only; the numbers in them are sample data |
| `docs/progress.md` | Create and keep updated: what's done per milestone, decisions made, open issues |

If the spec and a mockup disagree, follow the spec and note it in `docs/progress.md`.

## How to work

- Build in the order of the spec's "Build order", one milestone at a time. At the start of a milestone, post a short plan (files, schema changes, tests) and wait for an OK. At the end, make sure everything passes, update `docs/progress.md`, and stop.
- Keep every milestone deployable. Small commits with clear messages; don't push or deploy without being asked.
- Look up current docs (Context7 or the official site) for Next.js, Drizzle, Serwist, shadcn/ui, the Claude API, the YouTube Data API and the Livsmedelsverket and Open Food Facts APIs before using them. Don't pin versions or API shapes from memory; use the latest stable releases.
- Ask before adding a dependency that isn't named in the spec.

## Non-negotiables

- **Business logic lives in `lib/rules`** as pure, typed functions with Vitest tests: day type, targets lookup, weekly average, projection, pace, adjustment rules, progression hints, deload weeks, meal cost. Screens and route handlers call it; they don't reimplement it.
- **Time:** Europe/Stockholm is the only timezone. Weeks start on Monday. Day-level records use a local `date` column, never a UTC timestamp cast to a date. Test the DST changeovers (last Sunday of March and October).
- **Money:** SEK in `numeric(10,2)`, never floats. Weights in kg to 0.1, food in grams.
- **History is immutable:** food log entries snapshot kcal, macros and cost when saved. Targets are new rows with `effective_from`; old rows are never edited.
- **Nothing changes without the user:** adjustment suggestions, research-agent food proposals and Ask AI exercises are drafts until the user accepts them.
- **AI calls are server-side only.** Use the Claude API with JSON-schema structured output and validate every response with Zod before using it. Read the model name from `ANTHROPIC_MODEL`; don't hard-code one.
- **Never let a model write URLs.** Exercise demo videos come only from YouTube Data API search results, and food sources only from fetched pages. Store the video ID, not a free-form link.
- **Files** go to the S3-compatible bucket through presigned uploads, stored privately and served through signed URLs. Keep originals.
- **Offline:** logging (sets, meals, weigh-ins, climb problems) must work offline and sync later. Writes need a client-generated UUID so retries are idempotent.
- **Attribution:** Livsmedelsverket data is CC BY 4.0; credit it on an About screen.
- **Secrets** live only in env vars. Keep `.env.example` current; never commit `.env`.

## Design

Match the mockups: a dark "Nordic winter night" theme. Also derive a light theme from the same tokens, since the app follows the system setting.

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#0E1218` | Page background |
| `surface` | `#171C25` | Cards |
| `surface-2` | `#1F2631` | Inputs, inner panels, selected tabs |
| `border` | `#2B3442` | Borders, dividers |
| `text` | `#EEF2F7` | Body text |
| `muted` | `#A3AEBF` | Secondary text (passes 4.5:1 on `surface`) |
| `accent` | `#7CC4FF` | Primary actions, calories, done states |
| `attention` | `#FFB547` | Protein, suggestions, AI drafts, warnings |

- Fonts: Space Grotesk for headings and numbers, Inter for everything else.
- Radius 12–20 px; tap targets at least 44 px; real `<button>`, `<a>`, `<input>` and `<label>` elements.
- Bottom tab bar: Today, Week, Food, Body, Shop. Pushed screens (gym logger, climb log, Ask AI, receipt review) get a back link and a sticky bottom action bar.
- No emoji in the UI. Icons are 1.8 px stroke SVGs.

## Environment

See `.env.example`. Railway provides Postgres and the bucket; the app runs as one Next.js service plus a cron service.

## Open questions

These are still open, with the default to use until answered:

- iPhone or Android: build the file-picker path, which works on both, and add the Android share target as a progressive enhancement.
- Steps: leave them out of v1.
- Meal cost basis: latest price.
- Research agent runtime: build the `/api/agent/*` endpoints only; the agent itself is v1.1.
