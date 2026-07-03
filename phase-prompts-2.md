You are implementing the goodfood app AUTONOMOUSLY in a persistent session (self-hosted via
scripts/run-queue.sh on elga-1, or claude.ai/code). This is the FOLLOW-UP queue — it assumes the
"goodfood-build" queue (Prompts 0–13 in phase-prompts.md) has completed. Each FOLLOW-UP PROMPT
(F1–F13) below is ONE phase. Work top to bottom, one phase at a time.

============================================================================================
GLOBAL RULES — identical to phase-prompts.md; read that file's GLOBAL RULES + PER-PHASE LOOP
section and CLAUDE.md/AGENTS.md first and obey them for every phase here. In short: full autonomy
(no questions, no waiting), sequential subagents, every phase = a Linear child issue GOO-N under
this queue's parent (title "Prompt FN — <name>"), tests + validation, lint/typecheck/test/E2E
proofs, roadmap update, commit referencing "Prompt FN" + `Issue ID: GOO-N` trailer, push, close.
============================================================================================

QUEUE REGISTRATION (do once, before F1):
- Queue name: goodfood-followups   |   Date: 2026-07-03
- Create a PARENT Linear tracking issue in team GOO titled "Queue: goodfood-followups" listing
  F1–F13 as a checklist. Note the cutline: F1–F3 are REQUIRED; F4–F13 are OPTIONAL (attempt in
  order as time/feasibility allows — skip one only with a logged reason, e.g. an external
  prerequisite like App Store credentials, and continue to the next).
- Add a row to docs/cloud-queues.md (Host=elga-1, tmux goodfood-goodfood-followups,
  status=In Progress); commit + push.

STANDING CONSTRAINTS for this queue:
- The paywall/monetization (F10) must ship INACTIVE by default, with all its settings configurable
  (env/config + admin toggle) — enabling it is a deliberate flip, never the default.
- Social/share/SEO features must never leak private data: plans are private unless the user
  explicitly shares/publishes them.
- Keep every invariant from docs/phase-brief.md (proof tables, no fabricated nutrition, missing ≠ 0,
  licensed images only) intact across all new surfaces, including share pages and mobile.

============================================================================================
=== FOLLOW-UP QUEUE (execute in order). REQUIRED: F1–F3. OPTIONAL: F4–F13. ===
============================================================================================

Prompt F1 — Mobile-friendly design and usage
Make this mobile friendly: mobile friendly design and usage. Responsive layouts across the planner,
proof tables, pantry, shopping lists, and print flows; touch-friendly controls; collapsible
nutrient/meal sections on small screens; test on common phone viewport sizes with Playwright.

Prompt F2 — User auth and signups with per-user saved content
Implement user auth and enable signups. Each user profile should be able to save their own meal
plans and shopping lists, with custom names for each. (Build on the Prompt 13 auth foundation if it
shipped; otherwise implement it now — Better Auth or Auth.js on Neon/Postgres. Enforce row-level
ownership everywhere; migrate demo-user data safely; custom-name CRUD with validation + tests.)

Prompt F3 — Social sharing with per-platform optimization
Enable a Share on social media that lets anyone view a nice public share page for a meal plan /
shopping list. Include: Twitter/X, email (with custom message and subject line), Instagram,
LinkedIn, and Copy Link. The share page must have good SEO and social-media thumbnails enabling
previews (text messages, Instagram, etc.) — Open Graph + Twitter Card meta, per-platform optimized
share text/images (dynamic OG image generation with the plan's highlights), canonical URLs. Sharing
is explicit opt-in per plan/list; a share can be revoked. Instagram has no web share-intent for
feed posts — provide copy-caption + downloadable share image as the standard approach there.

Prompt F4 (optional) — Landing page
A landing page explaining features and that this is a free service, encouraging sign-up. Also
explain that it is open source and one can contribute on GitHub (link the repo). Good SEO, fast,
accessible, mobile-first.

Prompt F5 (optional) — React Native iOS app
Implement the same app but in React Native, for iOS launch. Reuse the API and domain contracts;
scope an MVP screen set (auth, generate plan, view plan + proof, pantry, shopping list). Set up the
Expo/React Native workspace inside the monorepo. If Apple credentials/signing are unavailable,
build to simulator + TestFlight-ready config and log the external steps needed.

Prompt F6 (optional) — Launch post
Draft a new initial "Launching the Good Food App!" social media post to enable launching on
LinkedIn and other platforms (X, Instagram caption, generic short-form). Store drafts in
docs/marketing/launch-posts.md with per-platform variants and image suggestions.

Prompt F7 (optional) — SEO & link-preview hardening
Include good SEO and preview images on share links app-wide: metadata routes, sitemap, robots,
structured data (Recipe/ItemList where honest), default OG images for non-share pages, and
verification tests that previews render for the main public surfaces.

Prompt F8 (optional) — Social activity board
Enable sharing of meal plans and associated shopping lists to a social activity board sharable
among all users. Allow posting with a description (e.g., vegans sharing meal plans with each
other). Feed with filters by dietary pattern, adopt/duplicate-to-my-account action, like/save,
report button; only explicitly-published content appears; basic anti-abuse (rate limits).

Prompt F9 (optional) — Discord community
Enable set up of a Discord community for swapping meal plans and shopping lists: create the server
blueprint (channels, roles, rules) as docs + an invite surface in the app/landing page; optionally
a webhook bot that cross-posts newly published board plans to a Discord channel. Log any steps that
require the owner's Discord account.

Prompt F10 (optional) — Monetization (OFF by default, configurable)
Consider 'premium' features behind a paywall (~$5/month) — e.g., shopping lists/meal plans beyond a
certain usage per month — and/or an advertisement model to help pay cloud costs. Decide and
document the best-guess approach (docs/adr), then implement it: usage metering, plan gating,
Stripe-ready subscription scaffolding (test mode), and/or ad-slot components. THE PAYWALL MUST BE
INACTIVE BY DEFAULT and fully configurable (limits, price, on/off, which features are premium) via
config/env + an admin settings surface. With the toggle off, the app remains 100% free and
unrestricted.

Prompt F11 (optional) — Android app
Implement for Android: extend the React Native app (F5) with Android config, navigation/UX parity,
and Play-Store-ready build settings. If signing credentials are unavailable, produce a debug/
internal-testing build and log the external steps.

Prompt F12 (optional) — Practitioner content & partnerships
Consider a content section where one can adopt meal plans and shopping lists of dieticians we
partner with. They sign up with roles 'Nutritionist', 'Doctor', etc. (verified badge fields; manual
verification workflow), and create and share lists + plans across the social board and their own
social media (via F3 share pages). Role-aware profiles and a browse/adopt UX for practitioner
content.

Prompt F13 (optional) — Content team posts + moderation system
Enable social media posts from our own content team. This content team highlights creators who may
be cooks, nutritionists, etc., and after moderation allows posting to a board. Implement said
moderation system:
- A moderation queue: content-team posts (and optionally F8 board posts) require approval before
  going live.
- LLM-powered word/safety check as the first pass (flag unsafe/medical-overclaim/spam content;
  configurable ruleset; log rationale), then manual moderation for final approval.
- Community moderators: users can apply to be moderators via a nice application form (motivation,
  experience, availability); the OWNER reviews applications and promotes approved applicants to a
  'Community Moderator' role with scoped permissions (approve/reject/flag, no user-data access).
- Full audit trail of moderation decisions; content states: draft → pending review → approved/
  rejected (+ takedown).

ON QUEUE COMPLETION: set the parent issue Done, mark docs/cloud-queues.md status = Complete, commit
+ push, and post a final summary listing every GOO-N shipped and which optional phases were
completed vs skipped (with reasons).
