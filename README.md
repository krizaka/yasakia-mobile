# Yasakia for iOS and Android

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/krizaka/yasakia-mobile/badge)](https://scorecard.dev/viewer/?uri=github.com/krizaka/yasakia-mobile)

Talk first, then a small batch of people who fit **both ways**, with no swipe and no score. This is the Expo app of
[Yasakia](https://dev.yasakia.com) over the same API as the web ([krizaka/yasakia](https://github.com/krizaka/yasakia)).
In development: sign-in is by invitation.

- **UI**: [`@krizaka/ui/native`](https://ui.krizaka.com) under the Yasakia brand (`@krizaka/tokens/native` `brands.yasakia`). There is no local component.
- **Text**: every string lives in `src/messages/{en,fr}.json` (`@krizaka/i18n`) and is checked by `npm run lint`.
- **API**: `@krizaka/query`, with a bearer token kept in the secure store. Its address is not baked in: `@krizaka/discovery` reads the signed manifest of krizaka.com ([ADR-003](https://github.com/krizaka/.github/blob/main/docs/adr/ADR-003-mobile-service-discovery.md)), so a move never needs a store release.
- **App version**: `@krizaka/app-config` (krizaka/.github#75). A forced update, maintenance or a soft prompt comes from `GET /api/v1/app-config`, and a `426` from any call shows the update screen.
- **Links**: `https://dev.yasakia.com/app/{en|fr}/…` opens the same screen here (`app-links.json`; `scripts/check-app-links.mjs` runs in `npm run lint` against the web's `routes.json`, krizaka/.github#81).
- **Sign-in**: e-mail and password for invited accounts (krizaka/.github#76). Apple, Google, GitHub and Facebook come once their OAuth apps exist.

```bash
npm ci
npm start              # Expo dev server; the API address comes from the signed manifest of krizaka.com (EXPO_PUBLIC_APP_URL overrides it)
npm run check          # lint · typecheck · tests · iOS and Android bundles (what CI runs)
```

Apache-2.0 · A Krizaka product.
