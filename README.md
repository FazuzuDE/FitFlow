# FitFlow v0.3 — Exercise Library & Progress

## New in v0.3

- Exercise library with 12 starter exercises and search
- Add exercises while a workout is active
- Three built-in workout templates: Upper Body, Push Day, Leg Day
- Create and persist custom workout templates
- Estimated 1RM records using the Epley formula
- Workout volume chart and recent history
- Active workout persistence, editable sets, rest timer, haptics

## Workout Core

Start a template, enter weight/reps, complete sets, use the rest timer, move
between exercises, and confirm Finish to save into History/Progress.
Active sessions recover after reopening. History is shown under Progress with
completed set details, total volume and explicitly estimated 1RM.

The Core implementation uses the approved [design system](./docs/DESIGN_SYSTEM.md).
See [workout verification and storage notes](./docs/WORKOUT_CORE.md).

## Run

```bash
# Node.js 22.16.0, npm 10.9.2 (see .nvmrc and package.json)
npm ci
npx expo start
```

Use a development client or Expo Go compatible with SDK 53. Availability of a
compatible Expo Go build depends on the platform; the latest store app may not
support this SDK.

## Checks

```bash
npm run check
npm run export:check
```

`check` runs TypeScript, ESLint, Prettier, Jest, Expo configuration and dependency
compatibility checks. `export:check` bundles the iOS and Android JavaScript; it
does not build native binaries. Use `npm run format` to apply formatting.

## GitHub and Oracle

GitHub hosts the source and CI; the existing Oracle server is the target for the
future backend. See [infrastructure setup](./docs/INFRASTRUCTURE.md) for branch
workflow, access requirements and the staging plan. Deployment is not configured
yet. `.env.example` documents the future public API URL; no backend is required
to run the current local MVP.

## Next milestone

v0.4: authentication + cloud sync + onboarding + normalized project architecture.
Backend implementation will be selected for the existing Oracle infrastructure;
the original Supabase-specific plan is provisional.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the product and engineering plan from v0.3 to v1.0.
