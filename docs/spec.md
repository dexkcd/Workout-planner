# Formkoll — v1 spec

Formkoll (working name) is a phone-first web app that runs the training and diet plan in [`docs/plan.md`](plan.md) day to day. It answers four questions: what to do today, what to eat, whether it's working, and what the food costs. It has a single user, installs as a PWA and syncs through a Next.js + Postgres backend on Railway.

v1 is done when, for 4 weeks in a row, the user can:

- open the app and see today's session and calorie and protein targets within 5 seconds;
- log a weigh-in in 2 taps and see the weekly average against the projection;
- log a gym session set by set, with last session's numbers pre-filled;
- attach a photo or video to a boulder problem in 2 taps;
- log a meal in under 30 seconds from a template, a saved recipe, a food search or a barcode;
- photograph or upload a grocery receipt and see what each meal cost.

The mockups in [`docs/mockups/`](mockups/index.html) show every screen in this spec as a static phone prototype. The numbers in them are sample data.

## Screens and navigation

A bottom tab bar with five tabs: Today, Week, Food, Body and Shop. Session loggers open from a session card, and Settings opens from the top-right avatar.

| Screen | Reached from | What it does | Mockup |
| --- | --- | --- | --- |
| Today | Tab | Day type, calorie and protein rings, today's session cards, next meal, quick actions (weigh in, log meal, scan receipt) | `today.html` |
| Week | Tab | Mon–Sun schedule with done/skipped status, a "Tuesday frisbee this week" toggle, deload and diet-break flags, weekly summary | `week.html` |
| Gym logger | Gym session card | Exercises with target sets × reps, set-by-set kg and reps pre-filled from last time, progression hint, rest timer | `gym-log.html` |
| Ask AI for an exercise | Gym logger, Ask AI | Describe what you need. You get an AI-drafted exercise with form cues, suggested sets and reps, and YouTube demo videos to pin, then add it, swap it in or discard it | `exercise-ai.html` |
| Climb / frisbee log | Climb or frisbee card | Done, duration, effort (RPE 1–10), notes. For climbing: session type, problems with photos and videos (take, record or attach), hardest grade sent, finger-pain flag | `climb-log.html` |
| Food log | Tab | Today's meals by slot against targets, remaining kcal and protein, add button | `food.html` |
| Add food | Food log, + | Meal templates, recent, recipes, food search, barcode scan, quick kcal + protein entry, portion in grams | `add-food.html` |
| Food library | Food, Library | Browse and edit foods, see sources and price per kg, review research-agent updates | `food-updates.html` |
| Body | Tab | Weigh-in entry, weekly-average chart against projection, waist entries, weekly check-in, adjustment suggestion | `body.html` |
| Shopping list | Tab | Items generated from planned recipes plus manual items, grouped by store section, check-off | `shop.html` |
| Receipt review | Shop, Scan | Camera or file upload, parsed lines matched to foods, confirm | `receipt.html` |
| Meal costs | Shop, Costs | Cost per meal, day and week, cost per 100 g protein, monthly grocery spend | `costs.html` |
| Settings | Avatar | Targets history, schedule templates, reminders, data export | none |

## Feature requirements

The requirements are grouped by tab. Must-haves are unmarked, and items marked (should) can slip to v1.1.

**Today**

- Show the day type (training, rest or diet break) and rings for kcal and protein against that day's target.
- List today's sessions with time and place, and one-tap Done, Skip or Moved.
- Suggest the next meal from the templates for this day type and time of day.
- Quick actions: Weigh in, Log meal, Scan receipt.
- (should) Push reminders: a 15:30 pre-climb snack on climbing days, a 07:30 weigh-in prompt on 4 set days, and a Monday check-in.

**Week**

- Generate each week from the base template. A "Tuesday frisbee this week" toggle applies the variant: Tue Gym A becomes frisbee, Wed becomes rest or light climbing, and Sat becomes full-body gym.
- Flag every 4th week as a deload, so gym targets drop to 2 sets.
- Apply the diet-break flag from 21 Dec to 4 Jan, which switches targets to maintenance.
- Weekly summary: sessions done against planned, average kcal and protein, change in weekly average weight.
- (should) Move a session to another day by drag or a menu.

**Gym logger**

- Load Gym A, Gym B or full-body exercises with target sets and rep range.
- Each set takes kg, reps and done, pre-filled from the last time that exercise was logged.
- Show a progression hint when every working set hit the top of the range last time.
- Each exercise has a play button that opens its pinned demo video.
- **Ask AI for an exercise**, from the Gym logger header or an exercise's menu. The user describes what they need, such as "a hamstring move without a Nordic bench". The AI is given the plan, the current workout, recent logs, the gym and any active flags (finger pain, deload). It returns a JSON draft: name, muscles, equipment, why it fits, suggested sets and reps with a starting weight, 3–5 form cues and one common mistake. It must stay inside the plan's rules, for example no hangboard work while eating in a deficit.
- **Demo videos:** the server searches YouTube for the drafted exercise and shows the top 2–3 results with thumbnail, title, channel and length. The user can play them in place and pin one as the exercise's demo. The AI never writes video links itself.
- Nothing is saved until the user chooses Add to a workout, Swap with an existing exercise, or Discard. Saving creates an `exercises` row with source `ai`, plus its pinned video.
- The seeded Gym A and Gym B exercises get their demos the same way: one Ask AI run each, which the user reviews.
- (should) Rest timer and a per-exercise history chart.

**Climbing and frisbee**

- Log done, duration, RPE and notes.
- For climbing, also log session type (hard, volume or technique), hardest grade sent (Font scale) and a finger-pain flag. A flag shows a "3 days off climbing" banner on Today and offers to skip the next climb.
- A climbing session holds a list of problems: colour or label, wall, grade, attempts, sent or project, and notes.
- Take a photo, record a video, or attach one from the camera roll. This works from the climb log and from the camera button on Today's session card. A clip attaches to the problem the user is on, or to the session if no problem is open. Use `<input type="file" accept="image/*,video/*">`, with `capture` for the two camera buttons.
- Clips upload straight to object storage with presigned URLs. Uploads queue while offline and default to Wi-Fi only. The server keeps the original and makes a poster frame for each video.
- (should) Cap clips at 2 minutes, and add a problem history that puts every clip of one problem side by side across sessions.

**Food**

- Daily log by slot: lunch, afternoon, dinner, evening and flex, plus an optional morning slot. Slots are configurable, and there's no breakfast slot by default.
- Add food from a meal template (one tap, portions adjustable), a recipe (per-portion macros), a food search, a barcode scan or a quick entry (kcal and protein only).
- Show what's left of the day's kcal and protein, with an over-target state.
- Recipes list ingredients in grams, and the app computes per-portion macros and cost.
- Logging works offline and syncs when back online.

**Body**

- Weigh-in in kg to 0.1, one per day (the latest entry wins).
- Chart the weekly average and a 7-day rolling average against the projection line.
- Waist in cm, prompted every 2 weeks.
- Weekly check-in: sleep, hunger and energy on a 1–5 scale, plus notes.
- An adjustment card shows when a rule fires (see Rules and calculations). Nothing changes until the user accepts.

**Shop**

- Generate the list from the recipes picked for the coming week, plus manual items, grouped by store section.
- Check items off. Checked items can be linked to a scanned receipt.
- Receipt scanning and meal costs are covered in their own section below.

## Rules and calculations

All logic lives in one pure, unit-tested module, `lib/rules`, so the screens only display results. Times use Europe/Stockholm, weeks start on Monday, and units are kg, cm, kcal, g and SEK.

| Rule | Definition |
| --- | --- |
| Day type | Training if the day has a gym, climbing or frisbee session, planned or done. A logged session overrides the plan, and the user can override the day type by hand. Diet-break dates are always "break" |
| Targets | Read from the `targets` row in effect for that date and day type. Seed: training 2,400 kcal, 160 g protein, 280 g carbs, 70 g fat. Rest 2,000 kcal, 160 g protein, 180 g carbs, 70 g fat. Break 2,750 kcal, 160 g protein |
| Weekly average weight | Mean of that Mon–Sun's weigh-ins. Needs at least 2, otherwise it shows "not enough data" |
| Projection | 88.0 kg on 9 Nov 2026, minus 0.5 kg a week, flat from 21 Dec to 4 Jan |
| Pace | Change in weekly average between consecutive weeks. Week 1 is left out (water loss) |
| Adjustment: too slow | Pace under 0.3 kg a week for 2 weeks in a row: suggest −150 kcal from rest-day carbs, or +2,000 steps a day |
| Adjustment: too fast | Pace over 1.0 kg a week for 2 weeks in a row (from week 3): suggest +150–200 kcal on training days |
| Adjustment: under-recovered | Main lift or hardest grade below its 3-week best, and check-in sleep or energy at 2 or less: suggest +200 kcal on training days and a deload week |
| Adjustment: recomposition | Waist down 1 cm or more over 2 weeks while weight is flat: show "keep going, you're adding muscle" |
| Accepting a suggestion | Creates a new `targets` row from the next day on. Old rows are never edited, so past days keep their targets |
| Gym progression | Every working set last time reached the top of its rep range: suggest +2.5 kg for barbell lifts, +1–2 kg for dumbbells, or +1–2 reps for bodyweight moves |
| Deload | Every 4th week counted from plan start: 2 sets per exercise, same weights |
| Log snapshot | A food log entry stores its kcal, macros and cost when it's saved, so later edits to a food don't rewrite history |
| Meal cost | Sum of each ingredient's grams × its price per gram. Price comes from the latest receipt observation, or from a manual price if there's none. Also shown as cost per 100 g protein |

## Food database and research agent

The food database starts from two open sources and grows from receipts. A research agent proposes changes, and nothing it writes goes live until the user approves it.

| Source | Used for | Notes |
| --- | --- | --- |
| User (manual or confirmed) | Anything; always wins | Status `verified` |
| [Livsmedelsverket food composition API](https://www.livsmedelsverket.se/en/about-us/open-data/food-composition-data/) | Generic Swedish foods: kvarg, oats, chicken thigh, sej, rice | About 2,500 foods with 50+ nutrients each, JSON, CC BY 4.0. Livsmedelsverket must be credited, so add an About screen |
| [Open Food Facts API](https://openfoodfacts.github.io/openfoodfacts-documentation/docs/Product-Opener/v2) | Packaged products by barcode (EAN) | Community-maintained, so fields can be missing. Store the product URL. Their v3 API is recommended for new projects, so check it first |
| Research agent | Gaps: unmatched receipt lines, dagens lunch dishes, stale products | Writes proposals only, with source URLs and a confidence score |

**Food record:** names (sv, en), brand, barcode, per-100 g kcal, protein, carbs, fat and fibre, category, portions (for example "1 banana = 120 g"), source, source ID, source URL, retrieved-at, confidence, status.

**Seeding:** import the whole Livsmedelsverket database once (about 2,500 rows, small enough), then mark the plan's staples (`seed/plan.json` → `staples`) as favourites.

**Agent contract.** The agent is a separate process, such as a Claude Agent SDK script on a Railway cron or a scheduled Claude Code task. It talks to the app over a small authenticated API:

1. `GET /api/agent/tasks` returns open work: unmatched receipt lines, foods missing fields, and Open Food Facts records older than 90 days.
2. The agent researches each task and calls `POST /api/agent/proposals` with `{food_id?, fields, sources[], confidence, reasoning}`.
3. Proposals show up in Food library under "Updates (n)" as a before/after diff with sources. Accept writes a new food version, reject archives the proposal.

Authentication uses a bearer token held in an env var and scoped to the `/api/agent/*` routes. v1 needs the API and the review screen; the agent itself can arrive in v1.1.

## Receipts and meal costs

Each scanned receipt turns into price observations per food, and every recipe, template and logged meal is costed from those. The receipt-to-food match is learned once per store and product name, so scanning gets faster over time.

1. **Capture.** Take a photo in the app, or upload an image or PDF. ICA, Willys, Hemköp and Coop all offer digital receipts, many delivered through Kivra, so a saved receipt PDF works too. On Android, register the PWA as a share target so "Share → Formkoll" works. On iPhone, use the file picker.
2. **Parse.** The server sends the file to a vision model (the Claude API) with a JSON schema: store, purchased-at, and lines with raw text, quantity, weight in kg, unit price, line total and discount, plus the receipt total. Check that lines minus discounts equal the total within 1 kr, and flag it if they don't.
3. **Match.** Look up each line in `receipt_aliases` (store + normalised raw text → food). If there's no alias, fuzzy-match against foods. Still unmatched lines become research-agent tasks. Non-food lines (pant, bags) are tagged non-food and skipped.
4. **Confirm.** The review screen shows each line with its match and a confidence dot. Fix any line in 1–2 taps. Confirming saves the alias for next time.
5. **Price.** Each confirmed line becomes a `price_observation`: food, store, date, and SEK per kg or per unit, from the package size.
6. **Cost.** Recipes and templates cost themselves from the latest observation per food. Logged meals store their cost when they're logged.

**Reports on the Meal costs screen:** cost per meal and template, per day and per week, monthly grocery spend, and cheapest protein (SEK per 100 g protein, by food).

**Edge cases the parser must handle:** weighed items ("kr/kg" lines), multi-buy offers such as "2 för 30", member discounts on their own line, and returns.

Receipt images are stored privately in S3-compatible object storage, such as a Railway bucket, and the original file is always kept.

## Data model

There are 30 Postgres tables in six groups. IDs are UUIDs and timestamps are timestamptz. Day-level records use a local `date` column, so a log made at 23:30 belongs to the right day.

| Group | Table | Key fields |
| --- | --- | --- |
| Core | `users` | id, email, passkey credentials |
| Core | `targets` | effective_from, day_type (training, rest or break), kcal, protein_g, carbs_g, fat_g |
| Schedule | `schedule_templates` | name (base, tuesday_frisbee) |
| Schedule | `template_sessions` | template_id, weekday, session_type, start_time, end_time, location_id |
| Schedule | `locations` | name, address, notes (Klättercentret Telefonplan, Kanalhallen, two Fitness24Seven gyms) |
| Schedule | `weeks` | week_start, template_id, is_deload, is_diet_break |
| Schedule | `planned_sessions` | date, session_type, times, location_id, status (planned, done, skipped or moved) |
| Training | `session_logs` | planned_session_id, date, type, duration_min, rpe, notes, climb_type, hardest_grade, finger_pain |
| Training | `exercises` | name, category, equipment, increment_kg, muscles, cues (jsonb), source (seed, ai or manual) |
| Training | `workout_template_exercises` | workout (gym_a, gym_b or full_body), exercise_id, order, sets, rep_min, rep_max |
| Training | `set_logs` | session_log_id, exercise_id, set_no, kg, reps, rir |
| Training | `climb_problems` | session_log_id, label (colour), wall, grade, attempts, sent, notes |
| Training | `session_media` | session_log_id, problem_id, kind (photo or video), file_key, poster_key, duration_s, width, height, captured_at, upload_status |
| Training | `exercise_videos` | exercise_id, provider (youtube), video_id, title, channel, duration_s, pinned |
| Body | `weigh_ins` | date (unique), kg |
| Body | `waist_measurements` | date, cm |
| Body | `weekly_checkins` | week_start, sleep, hunger, energy (1–5), notes |
| Food | `foods` | names, brand, barcode, per_100g macros, category, source, source_ref, source_url, retrieved_at, confidence, status, version |
| Food | `food_portions` | food_id, label, grams |
| Food | `food_update_proposals` | food_id, fields (jsonb), sources (jsonb), confidence, reasoning, status |
| Food | `recipes` + `recipe_ingredients` | name, portions; recipe_id, food_id, grams |
| Food | `meal_templates` + `meal_template_items` | name, day_type, slot; food_id or recipe_id, grams |
| Food | `food_log_entries` | date, slot, food_id, recipe_id or template_id, grams, kcal, protein_g, carbs_g, fat_g, cost_sek (snapshot) |
| Shopping | `shopping_list_items` | week_start, name, food_id, qty, unit, section, checked |
| Shopping | `receipts` | store, purchased_at, total_sek, file_key, parse_status, raw_json |
| Shopping | `receipt_lines` | receipt_id, raw_text, qty, weight_kg, unit_price_sek, total_sek, discount_sek, food_id, match_status |
| Shopping | `receipt_aliases` | store, normalized_text, food_id |
| Shopping | `price_observations` | food_id, store, date, sek_per_kg or sek_per_unit, receipt_line_id |

Session types are climb_hard, climb_volume, gym_a, gym_b, gym_full, frisbee, walk and rest.

## Architecture and stack

The app is one Next.js service plus Postgres on Railway, with object storage for files and the Claude API for receipt parsing and exercise drafts. The research agent is a separate client of the same API.

| Layer | Choice | Why or notes |
| --- | --- | --- |
| App | Next.js (App Router, TypeScript), server actions and route handlers | One codebase for UI and API |
| Database | Postgres on Railway, with Drizzle ORM and SQL migrations | Typed queries and plain-SQL migrations |
| Auth | Passkey (WebAuthn) with a long-lived session, plus an email magic link as fallback | Single user, so no sign-up flow |
| UI | Tailwind CSS and shadcn/ui, mobile-first, follows system light or dark mode | Large tap targets for gym use |
| Charts | Recharts | Weekly average, projection, lift history |
| PWA | Web app manifest and a service worker (such as Serwist). Today's data is cached, and offline writes queue in IndexedDB and sync later | Installable on the home screen. iPhone push needs the app installed to the home screen |
| Barcode | The `BarcodeDetector` API where available, with a JS fallback (such as ZXing) where it's missing | Then look up the code in Open Food Facts |
| Files | S3-compatible bucket (Railway) with private, signed URLs | Receipt photos and PDFs, plus climbing photos and videos uploaded straight from the phone with presigned URLs. Video poster frames are made server-side |
| AI | Claude API with JSON-schema output, server-side only: receipt parsing (vision) and exercise drafts | API key and model name in env |
| Exercise videos | YouTube Data API v3 search, played in an embedded youtube-nocookie player | The default quota allows 100 searches a day, plenty for one user. Videos are only ever real search results |
| Agent API | `/api/agent/*` routes with a bearer token | See Food database and research agent |
| Jobs | Railway cron: Monday rule evaluation and the push reminders | Rules run in `lib/rules` |
| Quality | Vitest for `lib/rules` and the parsers, Playwright for the main flows | Receipt fixtures from real stores |

Also required: Europe/Stockholm as the only timezone, and a full JSON and CSV export from Settings.

## Seed data

`seed/plan.json` holds the plan as structured data, and [`docs/plan.md`](plan.md) has the full reasoning behind it. The values below are the ones the seed must not get wrong.

| What | Seed |
| --- | --- |
| Plan start | 9 Nov 2026, 88.0 kg, projection 0.5 kg a week |
| Targets | Training 2,400 kcal, rest 2,000, diet break 2,750 (21 Dec–4 Jan); protein 160 g every day |
| Base week | Mon climb_hard 16:45–18:25 Telefonplan · Tue gym_a · Wed climb_volume 16:45–18:25 · Thu frisbee 21:00–22:30 Kanalhallen (WFH) · Fri rest · Sat gym_b · Sun walk |
| Tuesday-frisbee variant | Tue frisbee 21:00–22:30 · Wed rest (optional light climb) · Sat gym_full |
| Gym A | Trap-bar deadlift 4×5, Bulgarian split squat 3×8, DB bench 3×8, Nordic curl 3×4–6, half-kneeling press 3×8, Copenhagen plank 3×20–30 s, calf raises 2×12 |
| Gym B | Box jump 4×3, Romanian deadlift 3×8, lateral lunge 3×6, push-ups 3×8–12, Pallof press 3×10, external rotation + reverse wrist curl 2×15, bike sprints 8×20 s |
| Gym full body | First 4 of Gym A, then box jumps and bike sprints from Gym B |
| Meal templates | Office training day (~2,400 kcal), frisbee Thursday (~2,350 kcal), rest day (~2,000 kcal). No breakfast; the first meal is lunch |
| Recipes | Chili, chicken thigh tray bake, salmon or sej with potatoes, lentil and chickpea curry, overnight oats |
| Locations | Klättercentret Telefonplan (Tellusgången 22–24), Kanalhallen (Skansbrogatan 5), Fitness24Seven Hötorget, Fitness24Seven Södertälje Centrum |
| Reminders | Climb days 15:30 snack; weigh-in 07:30 Mon, Wed, Fri, Sun; Monday 08:00 check-in |

## Build order

Build in eight milestones, each one deployed to Railway and usable before the next starts. Every milestone ships with tests for its part of `lib/rules`.

1. **Foundation:** Next.js app, Drizzle and Postgres, Railway deploy, passkey auth, PWA manifest and install, the tab bar shell.
2. **Schedule:** templates, week generation, the Tuesday-frisbee toggle, deload and diet-break flags, the Today and Week screens, Done/Skip on sessions.
3. **Body:** weigh-ins, waist, weekly check-in, weekly average and projection chart, adjustment suggestions and accepting them.
4. **Gym and climbing logs:** workout templates, set logging with pre-fill, progression hints, climb and frisbee logs with photo and video uploads, Ask AI exercise drafts with YouTube demos, the finger-pain banner.
5. **Food:** Livsmedelsverket import, food search, meal templates, recipes, quick entry, Open Food Facts barcode lookup, log snapshots.
6. **Offline and reminders:** IndexedDB write queue with sync, Web Push reminders, the Railway cron.
7. **Shopping and receipts:** shopping list, receipt upload and parsing, the review and match screen, aliases, price observations, Meal costs.
8. **Agent API:** the tasks and proposals endpoints, the Updates review screen in Food library.

**Out of scope for v1:** other users, importing steps or workouts from Apple Health or Google Fit, a direct Kivra integration, AI meal planning, and the research agent itself (v1.1, once the API exists).

**Open questions**

- iPhone or Android? This decides the share-target and barcode fallback work.
- Steps: manual daily entry in v1, or leave them out?
- Meal cost basis: latest price (the default) or a 90-day median?
- Which stores does the user shop at most? Their receipts become parser test fixtures.
- Should the research agent run as a scheduled Claude Code task or as a Railway cron job?

## Sources

- [Food Composition Data API, Livsmedelsverket](https://www.livsmedelsverket.se/en/about-us/open-data/food-composition-data/)
- [Open Food Facts API v2 documentation](https://openfoodfacts.github.io/openfoodfacts-documentation/docs/Product-Opener/v2)
- [YouTube Data API overview and quotas, Google](https://developers.google.com/youtube/v3/getting-started)
- [Digital receipts in Kivra](https://kivra.se/en/private/how-it-works/digital-receipts)
- [ICA digital receipts with Kivra, ICA Gruppen](https://icagruppen.se/arkiv/pressmeddelandearkiv/2020/ica-forsatter-att-satsa-pa-hallbarhet-digitaliserar-kvitton-med-kivra)
- [Coop digital receipts, M3](https://www.m3.se/article/1851367/nu-kan-du-fa-digitala-kvitton-pa-coop.html)
