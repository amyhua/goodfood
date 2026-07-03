# goodfood Discord — server blueprint

A blueprint for a community server where members swap meal plans and shopping lists. It complements
the in-app **community board** (F8): the board is the durable, source-linked record; Discord is the
real-time conversation. Set up is the owner's to perform (steps at the bottom).

## Server identity

- **Name:** goodfood community
- **Vibe:** friendly, evidence-based, no fad-diet dogma. The product invariant carries over: talk in
  terms of *targets met within tolerances* and *sourced data*, never "miracle" claims.
- **Icon:** the goodfood leaf mark (green).

## Channels

**INFO**
- `#welcome` — what this is, link to the app, code of conduct (read-only).
- `#rules` — the rules below (read-only).
- `#announcements` — releases + featured board plans. The optional webhook posts here.

**SHARE PLANS**
- `#share-your-plan` — post a board share link + a note. Encourage linking the app's public share
  page (`/s/<slug>`) so others see the proof table.
- `#shopping-lists` — swap shopping lists.
- `#plan-requests` — "looking for a high-protein vegan week" style asks.

**DIETS** (one channel each so filtering is natural)
- `#vegan` · `#vegetarian` · `#pescatarian` · `#nondairy` · `#paleo` · `#keto` · `#whole-foods`

**HELP & META**
- `#app-help` — using goodfood, bug reports (point to GitHub issues).
- `#feature-ideas` — feed into the GitHub backlog.
- `#feedback`

**VOICE**
- `Cook-along` — optional voice for live cooking.

## Roles

- **@Owner** — full admin (the maintainer).
- **@Moderator** — manage messages/members, run the code of conduct. Maps to the app's future
  Community Moderator role (F13).
- **@Nutritionist / @Doctor** — *verified* professional badges, granted only after the same manual
  verification the app uses (F12). Cosmetic + a `#pro-corner` channel; **not** medical advice.
- **@Contributor** — opened a merged PR on GitHub.
- **@Member** — default after agreeing to the rules (onboarding gate).
- **@Bot** — the announcement webhook / any future bot.

## Rules (short)

1. Be kind and constructive. No harassment, hate, or spam.
2. **No medical advice.** Share what worked for *you*; don't diagnose or prescribe. Verified pros are
   still not giving medical advice here.
3. No fabricated nutrition claims. Prefer sharing app links so numbers are sourced.
4. No unlicensed food images. Use the app's generated share cards.
5. Keep diet talk in the right channel; no diet-shaming.
6. No selling / affiliate spam without owner approval.
7. English in the main channels (regional channels welcome by request).

## Onboarding

- Membership Screening on → agree to rules to unlock channels.
- A `#start-here` reaction-role to pick diet channels.
- Welcome message linking the app, the board, and GitHub.

## Optional announcement webhook (implemented)

The app can cross-post newly published board plans to `#announcements`:

1. Server Settings → Integrations → **Webhooks** → *New Webhook* on `#announcements`; copy the URL.
2. Set `DISCORD_WEBHOOK_URL=<url>` in the web app's environment (server-side secret — never commit it).
3. Publishing a plan to the board then posts `🥬 **<title>** was just shared … [tags]`.
   With no `DISCORD_WEBHOOK_URL` set, the cross-post is a silent no-op — publishing is unaffected.

To show the **Join Discord** link in the app, set `NEXT_PUBLIC_DISCORD_URL=<invite>` (public). Until
it's set, no Discord link is shown anywhere.

## Owner steps required (need the owner's Discord account)

1. Create the server (or use an existing one) and apply this channel/role/rule layout.
2. Create a permanent **invite link** → set `NEXT_PUBLIC_DISCORD_URL`.
3. Create the `#announcements` **webhook** → set `DISCORD_WEBHOOK_URL` (server env).
4. Enable Community features + Membership Screening; upload the icon.
5. Recruit 1–2 moderators; define the verification process for pro badges (aligns with F12).
