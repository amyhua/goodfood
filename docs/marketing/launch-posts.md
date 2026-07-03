# Launch posts — "Launching the Good Food App!"

Draft copy for announcing goodfood across platforms. **Honest claims only** — this is a product whose
whole point is not overstating nutrition: say "targets met within displayed tolerances," never
"perfect" or "guaranteed"; say "missing data is shown as missing," never imply completeness we don't
have. Free, open source, no ads.

Repo: https://github.com/amyhua/goodfood · App: https://goodfood.app (set to the real deploy URL)

Fill placeholders `[APP_URL]`, `[REPO_URL]` before posting.

---

## LinkedIn (long form — mission + open source)

> **Launching the Good Food App! 🥬**
>
> Most meal planners hand you a number and ask you to trust it. goodfood does the opposite: every
> plan ships a **source-linked nutrient proof table**, so you can see exactly where each figure comes
> from — traced back to the USDA FoodData Central record.
>
> A few things I care about that are baked into the product:
> • **Missing data is shown as missing, never as zero.** A gap in the source can't quietly count as
>   "target met."
> • **Your restrictions are absolute** — vegan, allergies, custom bans are hard rules, not
>   suggestions.
> • **It's free, with no ads.** And it's **open source** — read the code, file an issue, or send a PR.
>
> Build a plan, check the proof, save it, share a public link (or don't — plans are private by
> default). Pantry and print-ready shopping lists included.
>
> Try it: [APP_URL]
> Contribute: [REPO_URL]
>
> Would love feedback from dietitians, developers, and anyone who's ever squinted at a nutrition
> label. 🙏
>
> #nutrition #opensource #healthtech #buildinpublic

**Image:** the OG share card (dark-green gradient, plan title + "18/21 targets met · 2018 kcal") or a
screenshot of the proof table on desktop.

---

## X / Twitter (short)

> Launching goodfood 🥬 — a free, open-source meal planner that shows its work.
>
> Every plan comes with a source-linked nutrient proof table. Missing data is shown as missing, never
> faked as zero. Your allergies/bans are hard rules.
>
> Try it → [APP_URL]
> Code → [REPO_URL]

### Optional thread (X)

1/ Launching goodfood 🥬 a free + open-source meal planner. The twist: it proves its numbers. 🧵
2/ Every plan has a nutrient proof table — each value links back to its USDA FoodData Central source.
No black-box "you're good."
3/ Missing data is shown as **missing**, never as 0. A source gap can never count as "target met."
4/ Vegan, allergies, custom bans = hard constraints. Disable a nutrient and it's removed, not capped
at zero.
5/ Pantry tracking + print-ready shopping lists. Plans are private; share a public link only if you
choose (revocable).
6/ Free, no ads, open source. Try it → [APP_URL] · Contribute → [REPO_URL]

**Image:** proof-table screenshot or the generated OG card. Alt text: "A meal plan's nutrient proof
table showing consumed vs target per nutrient."

---

## Instagram (caption)

> Launching the Good Food App 🥬✨
>
> A free meal planner that actually shows its work — every plan comes with a nutrient proof you can
> trace to the source. No fake numbers: missing data is shown as missing, never zero.
>
> ✅ Free, no ads
> ✅ Open source (link in bio)
> ✅ Your allergies + diet = hard rules
> ✅ Pantry + print-ready shopping lists
>
> Try it and tell me what you'd add. Link in bio 👆
>
> #nutrition #mealprep #mealplanning #opensource #healthtech #plantbased #buildinpublic #foodie
> #registereddietitian #wholefoods

**Image:** carousel — (1) OG card, (2) proof table close-up, (3) shopping list, (4) "free + open
source" tile. Feed posts have no web share-intent, so use the app's **Copy caption + Download image**
share action.

---

## Generic short-form (Mastodon / Threads / Bluesky)

> Launching goodfood 🥬 — a free, open-source meal planner that ships a source-linked nutrient proof
> with every plan. Missing data is shown as missing, never zero. Allergies/bans are hard rules. No
> ads. Try it: [APP_URL] · Code: [REPO_URL]

---

## Image / thumbnail suggestions

- **Primary:** the app's dynamic Open Graph card (`/s/<slug>/opengraph-image`) — generated text/vector,
  no licensed-image risk. Great for link previews.
- **Secondary:** clean screenshots of the proof table (desktop), the mobile planner, and a shopping
  list. Use the sample plan so nothing private is shown.
- Avoid stock food photography unless you have a license — the product's invariant is "licensed images
  only." The generated cards are safest.

## Posting checklist

- [ ] Replace `[APP_URL]` / `[REPO_URL]` with the live URLs.
- [ ] Set `NEXT_PUBLIC_APP_URL` on the deploy so OG/canonical links resolve.
- [ ] Verify the link preview renders (paste the URL into the platform's composer first).
- [ ] Add descriptive alt text to every image.
- [ ] Post order suggestion: LinkedIn + X first (developer/professional reach), Instagram same day,
      short-form networks to follow.
