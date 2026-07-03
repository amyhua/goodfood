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

## Run it on Android (F11)

The same screens run on Android — UX parity is inherent (react-navigation handles the hardware
back button; StatusBar + safe-area are cross-platform).

```bash
cd apps/mobile
npm install
export EXPO_PUBLIC_API_URL="https://<your-web-deploy>"
npm run android                   # builds + boots an Android emulator / connected device
# or: npm start  then press "a"
```

Build artifacts (EAS):

```bash
npm run build:android:apk         # internal-testing APK (preview profile)
npm run build:android:play        # production AAB for Play (app-bundle)
eas submit --platform android --profile production   # uploads to the Play internal track
```

Android config lives in `app.json` (`android.package = app.goodfood.mobile`, `versionCode`,
`edgeToEdgeEnabled`, adaptive-icon background, `INTERNET` permission) and `eas.json` (apk for
dev/preview, app-bundle for production).

### Android external steps (not doable in CI / without credentials)

1. **Google Play Console** account ($25 one-time) + an app record for `app.goodfood.mobile`.
2. A **release keystore** (EAS can generate/manage one via `eas credentials`) — needed to sign the AAB.
3. A **Play service-account JSON** with release permissions → set
   `submit.production.android.serviceAccountKeyPath` in `eas.json`.
4. Real **adaptive-icon foreground** + feature-graphic assets and a store listing.
5. An **Android emulator** (Android Studio) or a device to run it — this repo's CI has neither, so
   Android runtime verification happens on a developer machine.

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
