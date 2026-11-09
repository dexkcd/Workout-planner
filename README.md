# Formkoll

A phone-first PWA that runs one person's winter training and diet plan: today's session and food targets, gym, climbing and frisbee logs, weight trend, food logging, a shopping list and grocery receipts that turn into meal costs.

- Spec: [`docs/spec.md`](docs/spec.md) (source of truth) · plan: [`docs/plan.md`](docs/plan.md) · seed: [`seed/plan.json`](seed/plan.json)
- Mockups: open [`docs/mockups/index.html`](docs/mockups/index.html)
- Progress and decisions: [`docs/progress.md`](docs/progress.md)

## Stack

Next.js (App Router, TypeScript), Postgres with Drizzle ORM, Tailwind CSS + shadcn/ui, passkey (WebAuthn) auth, a web app manifest with a small service worker. Business rules live in `lib/rules` as pure functions with Vitest tests; Playwright covers the main flows.

## Run locally

Requirements: Node 22 and a Postgres 16 database.

```bash
cp .env.example .env            # fill in DATABASE_URL, AUTH_SECRET, OWNER_EMAIL
npm install
npm run db:migrate              # applies db/migrations
npm run db:seed                 # loads seed/plan.json (idempotent) and creates the owner user
npm run dev                     # http://localhost:3000
```

First visit: open `/login`, enter the `OWNER_EMAIL` and create a passkey. Later devices add their own passkey from Settings while signed in.

Checks:

```bash
npm run lint
npm run typecheck
npm test                        # Vitest, lib/rules
npm run build && npm run test:e2e   # Playwright against a production build (needs the DB)
```

## Layout

```
app/            routes: (app)/today, week, food, body, shop, settings; login; offline; api/*
components/     UI: nav (TabBar, headers), today, week, auth, pwa, ui (shadcn)
lib/rules/      pure, tested rules: time, schedule, day type, targets, summary
lib/db/         Drizzle schema and client        db/migrations/  generated SQL
lib/auth/       session cookie, WebAuthn, guard   lib/seed/       plan.json schema + loader
scripts/        migrate, seed, make-icons         tests/e2e/      Playwright
```

## Railway

One `web` service (this repo) plus a Postgres service; a cron service arrives in Milestone 6. `railway.json` sets the builder, the pre-deploy command (migrate, then seed), the start command and the `/api/health` health check.

Variables on `web`:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `APP_URL` | `https://<your-domain>` |
| `WEBAUTHN_RP_ID` | `<your-domain>` (no protocol) |
| `AUTH_SECRET` | 32+ random bytes, e.g. `openssl rand -base64 48` |
| `OWNER_EMAIL` | the one user's email |

The pre-deploy command runs the migrations and then the idempotent seed, so a deploy is all that is needed. Later milestones add the S3, Anthropic, YouTube, agent-token and VAPID variables listed in `.env.example`.

## Attribution

Food composition data will come from [Livsmedelsverket](https://www.livsmedelsverket.se/en/about-us/open-data/food-composition-data/) (CC BY 4.0) and [Open Food Facts](https://world.openfoodfacts.org/).
