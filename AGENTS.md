# FitFlow — Codex Instructions

## Mission
FitFlow is a commercial React Native + Expo + TypeScript fitness tracker focused on fast workout logging, reliable workout state, history, and useful progress analytics.

## Required context
Before UI work, read `docs/DESIGN_SYSTEM.md`.
Before product/feature work, read `docs/PRODUCT.md` and `docs/ROADMAP.md`.
These documents are the source of truth.

## Before every task
1. Inspect current branch, `git status`, diff, and relevant recent commits.
2. Inspect existing implementation before changing code.
3. Preserve uncommitted user changes.
4. Determine what is already implemented; do not redo completed work.
5. Keep scope narrow.

## Product priority
Current Core flow:
Onboarding → Home → choose/create workout → Exercise → Sets → Rest Timer → Finish → History → Progress.

Do not start AI Coach, social, nutrition, wearables, Oracle marketing infrastructure, or unrelated features unless explicitly requested.

## UI
Follow `docs/DESIGN_SYSTEM.md`.
- Light, premium, Apple-inspired direction.
- Reuse theme tokens and shared components.
- No dark-neon/cyberpunk direction.
- No arbitrary colors, typography, spacing, radii, shadows, or gradients.
- Phone-sized layouts are primary.
- Implement relevant loading, empty, error, offline, disabled and pressed states.
- Preserve accessibility and practical touch targets.

## Engineering
- Prefer the smallest safe change.
- Do not refactor unrelated code.
- Add dependencies only when justified.
- Reuse existing architecture/state/storage/components where practical.
- Keep business logic separate from presentation where practical.
- Do not break workout persistence, stored data, or active workout recovery.
- Preserve offline-first behavior where supported.

## Workout invariants
Do not accidentally lose active workouts or logged sets, duplicate completed workouts, corrupt history, silently reset weight/reps, or make Finish Workout persist invalid/partial data unintentionally.

## Validation
Before completion:
1. Run existing typecheck.
2. Run relevant tests.
3. Run lint if configured.
4. Run other affected CI checks.
5. Fix regressions caused by the task.

Never claim completion while relevant checks fail. Clearly distinguish pre-existing failures.

## Git
- Do not work directly on `main`.
- Follow existing branch strategy.
- Do not merge into `main` automatically.
- Keep commits focused.
- Never discard uncommitted work just to obtain a clean tree.

## Completion report
Report: implemented; key files changed; checks/results; known limitations; recommended next task. Then stop.
