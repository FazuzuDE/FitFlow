# Workout Core

## Scope and existing work

Continues the foundation PR and the unfinished local engine/model/catalog files.
The eight existing metrics tests remain unchanged. Home, templates and analytics
are adapted from the existing implementation. No backend is required.

## Implemented scenario

- Start a template, or resume the single active session.
- Enter decimal weight (dot or comma) and positive integer repetitions.
- Mark/unmark sets; completed inputs are locked until unmarked.
- Start a timestamp-based rest timer after logging; adjust ±15 seconds, restart
  or skip. It survives tab navigation and reopening without countdown drift.
- Automatically select the next incomplete exercise after the last set;
  manual exercise navigation and adding exercises/sets remain available.
- Confirm Finish, including intentional partial workouts. Empty workouts cannot
  finish. Show success and History/Progress only after the write succeeds.
- Keep the active session and show a retry action if a write fails.
- Show history with actual completed weights/reps, duration and volume.

## Storage

Schema version 1 stores active workout, history and templates in one AsyncStorage
value, `fitflow_state_v1`. Writes are serialized, including pending draft writes
before Finish. Finish disables edits and duplicate submission while saving.

The three original `fitflow_*` keys are migrated on first load; original values
are retained as backup. Legacy `done` fields become completion timestamps.
Nested corrupt data or unknown schema versions block editing and preserve the
original stored values. Migration/read failures expose a retry, never a silent
empty state. An interrupted legacy finish does not restore an active workout
already present in history.

## Design

Tokens come from `docs/DESIGN_SYSTEM.md`; the document's formatting was normalized
to pass the existing Prettier gate, without changing its design values or rules.
Cards are opaque white; the dock alone uses restrained light blur. Native system
fonts, safe areas, 44-point workout controls and keyboard avoidance are retained.

## Verification

- `npm run check`: types, lint, formatting, unit/integration/component tests,
  Expo config and dependency checks.
- `npm run export:check`: iOS and Android JavaScript/Hermes bundles.
- Browser smoke at 375×812 and 320×640: start, decimal comma, set logging,
  exercise advance, rest skip, active recovery after reload, confirmation,
  saved history/progress and persisted history after another reload.
- Native device smoke remains required before release: software keyboard,
  safe-area insets, haptics and background/force-close behavior on iOS/Android.
  Bundling and a phone-sized browser are not native device tests.

Timer timestamps recover when returning to the app; this iteration does not
schedule operating-system notifications while the app is suspended.
