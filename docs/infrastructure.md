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

## What YOU need to set up now

See the checklist in the current session / the Linear infra issue. In short:

1. **Neon** — create an account + a project named `goodfood`; copy the **pooled** and **direct**
   connection strings → `DATABASE_URL`, `DIRECT_URL`.
2. **USDA FoodData Central** — request a free API key at
   <https://fdc.nal.usda.gov/api-key-signup.html> → `FDC_API_KEY`.
3. **Vercel** — create an account and a project linked to the `amyhua/goodfood` GitHub repo (import;
   don't deploy yet — no app to build until the scaffold phase).
4. Paste the keys back so they can be written to `.env` (local) and added to claude.ai/code secrets +
   Vercel env vars. Deferred (do later): solver host choice, Supabase.
