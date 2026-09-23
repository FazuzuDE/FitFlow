# Exercise-Specific Logged Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the saved, valid completed sets of one selected exercise over time inside the selected Progress period.

**Architecture:** Reuse the existing period filter and completed-set parser. Share the current stable exercise identity function with a small pure performance projection, then render a history-derived searchable selector and dated workout entries in a focused Progress component.

**Tech Stack:** React Native, Expo, TypeScript, Jest, React test renderer.

**Spec:** User-approved Exercise-Specific Logged Performance Foundation request (2026-09-23); durable decision in `docs/DECISIONS.md` and contract in `docs/PROGRESS_ANALYTICS.md`.

## Global Constraints

- Persistence remains schema v1; do not change History, Finish, recovery, or `fitflow_state_v1`.
- Reuse `1W`, `1M`, `3M`, `6M`, `1Y`, `ALL` and `WorkoutSession.finishedAt` membership.
- Display factual workout date and valid completed-set weight × repetitions only; no strength score, best-set label, percentage, trend chart, or recommendations.
- Reuse `docs/DESIGN_SYSTEM.md` tokens and practical 44-point targets; do not add dependencies.

## Review Focus

- A known legacy ID and its canonical ID must produce one selectable exercise and one series.
- An unknown ID and a blank ID must not collide with known or other snapshot identities.
- A selected exercise with history only outside the period must remain selectable and show an empty period state.
- Same-day and equal-time sessions must remain distinct and deterministically ordered.
- A malformed set must disappear from Progress without rewriting its History snapshot, while zero weight remains visible.

---

### Task 1: Approved decision sync

**Files:** `docs/DECISIONS.md`, `docs/PROGRESS_ANALYTICS.md`.

- [ ] Record the factual-performance decision once in the decision log.
- [ ] State the durable read-only, period-scoped contract in Progress analytics documentation.
- [ ] Check the changed prose against `AGENTS.md`, PRODUCT, ROADMAP, DESIGN_SYSTEM, and HISTORY; do not expand those files without a contradiction.

### Task 2: Pure exercise performance projection (TDD)

**Files:** `lib/progress-analytics.ts`, `lib/exercise-performance.ts` (new), `lib/__tests__/exercise-performance.test.ts` (new).

**Interfaces:** `stableExerciseIdentity(session, exercise)` preserves the current canonical/unknown/snapshot key. `listPerformanceExercises(history, now)` returns searchable choices from valid completed saved history through now. `projectExercisePerformance(history, period, now, identityKey)` returns chronological workout/exercise occurrences with valid `{id, weight, reps}` sets in saved order.

- [ ] Write failing tests for canonical/legacy/renamed and collision-safe identities, period and future exclusion, exact boundaries, same-day/equal-time order, multi-set order, malformed/zero-weight sets, empty/one occurrence, and equivalent reloaded snapshots.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/exercise-performance.test.ts`; confirm failures are due to missing projection behavior.
- [ ] Export the existing identity rule without changing its semantics; implement the smallest projection using `filterProgressWorkouts`, `completedSetMetrics`, and saved labels.
- [ ] Re-run focused tests, then the full Jest suite; keep the projection read-only.

### Task 3: Searchable Progress presentation (TDD)

**Files:** `components/ExercisePerformance.tsx` (new), `app/index.tsx`, `lib/__tests__/exercise-performance-screen.test.tsx` (new or existing screen test).

**Interfaces:** The component receives `{history, period, now}`; its local selected identity and search query do not enter schema v1. The existing `Stats` period selector remains the only period control.

- [ ] Write failing component/integration tests for history-only choices, search, selection, period change, saved set display, empty cases, accessibility targets, and History independence after reload.
- [ ] Run the focused UI test and confirm the expected failure.
- [ ] Add a small searchable sheet/list of trained exercises and dated entries using theme tokens, saved names, and tabular weight/reps. Keep app-level analytics wiring thin.
- [ ] Re-run focused and full Jest tests; inspect compact-width behavior where the environment permits.

### Task 4: Validate, review, and publish

**Files:** Only the focused files above plus any test-driven correction.

- [ ] Run `npm run check`, `npm run export:check`, and `git diff --check`.
- [ ] Review the branch diff for Critical, Important, and Minor findings, especially schema/History mutations, identity collisions, period leakage, fake data, and narrow-phone usability. Fix introduced Critical/Important findings with a failing test first.
- [ ] Commit focused changes, push `feature/exercise-logged-performance`, and create one PR targeting `develop`. Do not merge or enable auto-merge.
