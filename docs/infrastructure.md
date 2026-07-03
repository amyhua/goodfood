# Infrastructure — goodfood

The cloud infra for goodfood, and exactly which accounts/keys must be provisioned. This mirrors the
**"Platform & Infrastructure"** Linear Project (its PRD is the source of truth; keep them in sync).
Secrets live in a gitignored `.env` locally, in **claude.ai/code environment secrets** for cloud
sessions, and in **Vercel project env vars** for deploys — never committed.
See [.env.example](../.env.example) for the full variable list.

## Components

| Component | Service | Purpose | Provisioned by |
|-----------|---------|---------|----------------|
| App DB | **Neon** (serverless Postgres) | canonical app data + normalized USDA food snapshots | **you** (account + project) |
| ORM / migrations | **Prisma** | schema, typed client, migrations | code (a phase) |
| Web hosting | **Vercel** | host the Next.js app | **you** (connect GitHub repo) |
| Food data | **USDA FoodData Central** API | canonical nutrient source | **you** (free API key) |
| Solver hosting | container host (Fly.io / Railway / Render / Cloud Run) | run the FastAPI + OR-Tools service | deferred — decided when the solver phase lands |
| Auth / storage / images | **Supabase** *(optional)* | auth + licensed image storage, if/when needed | deferred (rule: "supabase if needed") |
| Source control | **GitHub** | repo, branches, PRs | ✅ done (`amyhua/goodfood`) |
| Tracking | **Linear** | issues/projects/PRDs (team `GOO`) | ✅ done |

## Database access pattern (Neon + Prisma)

Neon provides two connection strings. Prisma needs both:

- **`DATABASE_URL`** — the **pooled** connection (PgBouncer, `-pooler` host) for the app runtime /
  serverless functions. Append `?sslmode=require&pgbouncer=true`.
- **`DIRECT_URL`** — the **direct** (non-pooled) connection for **migrations** (`prisma migrate`).

`schema.prisma` will use `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")`. Migrations
only ever run forward — **never reset or destroy the database** (CLAUDE.md §4 / phase-brief).

## Environments

- **Local dev** — `.env` (gitignored). A dedicated Neon branch/db for dev.
- **Cloud agent (claude.ai/code)** — set the same vars as **environment secrets** (the VM clones from
  GitHub and never sees `.env`).
- **Preview / Production (Vercel)** — set vars in the Vercel project; use a Neon
  production branch. Neon's branching gives isolated preview DBs per Vercel preview if desired.

## Neon branch strategy

Neon gives us two branches; the database name on each is `neondb`:

- **`test` branch** → **local dev** (`.env` `DATABASE_URL` / `DIRECT_URL`).
- **`production` branch** → **Vercel production** env vars.

Host ids: test `ep-patient-union-atl4a2xd` (+ `-pooler`), production `ep-mute-truth-atwloikz`
(+ `-pooler`). Credentials live only in `.env` / Vercel env / cloud secrets — never in this file.

## Provisioning status

| Item | Status | Detail |
|------|--------|--------|
| Neon account + branches (`test`, `production`) | ✅ done | connection verified — PostgreSQL 18.4, db `neondb`, pooled + direct both reachable |
| `DATABASE_URL` / `DIRECT_URL` (test) in local `.env` | ✅ done | pooled = runtime, direct = migrations |
| Vercel project | ✅ imported | id `prj_erhiVTB5CmbDihbqT6pgnjxnV6tG`, domain `goodfood-silk-seven.vercel.app` (not deployed yet — nothing to build until scaffold) |
| USDA FDC API key | ⚠️ pending | using `DEMO_KEY` placeholder (30 req/hr). Real key needed — the "Account ID" provided is **not** the api.data.gov key |
| Cloud/Vercel secret propagation | ⏳ todo | add the same vars to claude.ai/code env secrets + Vercel env vars |
| Prisma schema + first migration | ⏳ todo | scaffold phase |
| Solver host · Supabase | 💤 deferred | decided when their phases land |

## Loading `.env` in scripts (gotcha)

The Neon URLs contain `&`/`?`, so **`source .env` breaks** in bash. Read a value explicitly instead:
`DATABASE_URL=$(grep '^DATABASE_URL=' .env | cut -d= -f2-)`. Prisma/Next.js load `.env` natively and
are unaffected.
