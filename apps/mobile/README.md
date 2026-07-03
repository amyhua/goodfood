# goodfood mobile (Expo / React Native) — iOS MVP

A React Native (Expo) MVP that **reuses the goodfood REST API** — no backend changes. It shares
the same domain contract (auth, plans, proof, shopping) as `apps/web`. MVP screens: **Auth**,
**Planner** (generate + nutrient proof), **Pantry** (device-local), **Shopping** (saved lists).

> **Standalone project.** This app is intentionally **excluded from the pnpm workspace**
> (`pnpm-workspace.yaml` has `!apps/mobile`) because it runs on React 18 / React Native while the
> web app is on React 19. Install and run it from inside `apps/mobile` with its own package
> manager — it never touches the monorepo's install or CI gates.

## Product invariants carried over

- Nutrition comes only from the API (USDA-backed); the app never fabricates values.
- Missing nutrient data renders `—`, **never 0**; the proof shows PARTIAL/MISSING confidence.
- Plans/lists are private per account (the API enforces row-level ownership); auth reuses the web
  **cookie session** (iOS `URLSession` persists cookies automatically).

## Run it (developer machine with Xcode)

```bash
cd apps/mobile
npm install                       # or: yarn / bun install (NOT pnpm -w)
# Point the app at your API (defaults to app.json extra.apiUrl, else localhost:3000):
export EXPO_PUBLIC_API_URL="https://<your-web-deploy>"
npm run ios                       # builds + boots the iOS Simulator
# or: npm start  then press "i"
```

`npm run typecheck` runs `tsc --noEmit` once deps are installed.

## Build for the Simulator / TestFlight (EAS)

```bash
npm i -g eas-cli
eas login
npm run build:ios:sim             # local simulator build (eas build --profile preview --local)
npm run build:ios:testflight      # cloud production build for TestFlight
eas submit --platform ios --profile production
```

## External steps still required (not doable in CI / without credentials)

1. **Apple Developer Program** membership ($99/yr) — needed for any device/TestFlight build.
2. **Signing**: an Apple Team ID + distribution certificate + provisioning profile. `eas build`
   can manage these once you `eas login` with an account in the team.
3. Fill `eas.json` › `submit.production.ios` (`appleId`, `ascAppId`, `appleTeamId`) and create the
   app record in **App Store Connect** (bundle id `app.goodfood.mobile`).
4. Provide real **app icon / splash** assets (Expo ships defaults until then).
5. An iOS **Simulator** (Xcode) or a registered device to run the app — this repo's CI has neither,
   so runtime verification of the mobile app is performed on a developer machine, not in the queue.

## Layout

```
apps/mobile
├─ App.tsx                 # navigation (auth gate → Home → Planner/Pantry/Shopping)
├─ index.ts                # Expo root registration
├─ app.json  eas.json      # Expo + EAS config (simulator + TestFlight profiles)
└─ src/
   ├─ api.ts  config.ts    # REST client over the shared goodfood API
   ├─ theme.ts
   └─ screens/             # Auth, Home, Planner, Pantry, Shopping
```
