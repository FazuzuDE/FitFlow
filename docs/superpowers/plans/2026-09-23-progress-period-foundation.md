# Progress Period Foundation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox syntax for tracking.

**Goal:** Scope existing CRESUM Progress metrics to approved rolling local-calendar periods while keeping History complete.

**Architecture:** A pure period module owns canonical period IDs, local-calendar boundary arithmetic, completed-workout filtering, and a wrapper around the existing Progress projection. The Progress screen owns only the selected period and current clock; all metrics consume the one filtered projection. History receives the original archive.

**Tech Stack:** React Native, Expo, TypeScript, Jest, React test renderer.

**Spec:** Approved Progress Period Foundation request in this Codex task; durable product decisions are synchronized in `docs/PRODUCT.md`, `docs/DESIGN_SYSTEM.md`, and `docs/DECISIONS.md`.

## Global Constraints

- Period IDs: `1W`, `1M`, `3M`, `6M`, `1Y`, `ALL`; default `1M`.
- Finite periods are rolling local-calendar windows `[start, now]`, inclusive; `ALL` includes valid completed workouts through `now`.
- Membership is based on `WorkoutSession.finishedAt`; future workouts are excluded.
- Preserve schema v1, read-only History, Workout Engine, saved snapshots, safe numeric projection, and stable exercise identity.
- No date package, new chart system, period persistence, broad technical CRESUM rename, or unrelated Progress feature.

## Review Focus

- March 31 subtracting a month must clamp to February's final date.
- Leap-day year subtraction must clamp rather than overflow into March.
- Local DST crossing must preserve calendar time semantics rather than subtract fixed milliseconds.
- A workout exactly at `start` or `now` belongs; a future workout does not.
- An empty selected period must not show an old record or a fabricated workout bar.

---

### Task 1: Pure period boundaries and filtered projection

**Files:** Create `lib/progress-periods.ts`; create `lib/__tests__/progress-periods.test.ts`.

**Interfaces:** Consume `WorkoutSession` and `projectProgressAnalytics(history)`. Produce `PROGRESS_PERIODS`, `DEFAULT_PROGRESS_PERIOD`, `ProgressPeriodId`, `progressPeriodStart(period, now)`, `filterProgressWorkouts(history, period, now)`, and `projectPeriodAnalytics(history, period, now)`.

- [ ] Write failing tests for the six periods, default behavior through a projected 1M fixture, exact boundaries, future exclusion, month-end/leap clamping, DST, shuffled/tied workouts, ALL, safe volume and records, empty periods, and unchanged input History.
- [ ] Run `npm test -- --runInBand lib/__tests__/progress-periods.test.ts` and verify RED because the module/API is absent.
- [ ] Implement native local-calendar subtraction with day clamping. Return chronological eligible sessions by `finishedAt`, then ID. Reuse `projectProgressAnalytics` once for the selected sessions and expose `workoutCount` alongside its results.
- [ ] Run the focused test and `npm run typecheck`; verify GREEN.
- [ ] Commit `feat: add pure Progress period projection`.

### Task 2: Progress selector and truthful presentation

**Files:** Modify `app/index.tsx`; modify `lib/__tests__/workout-screen.test.tsx`.

**Interfaces:** Consume Task 1 period IDs and `projectPeriodAnalytics`. Keep `WorkoutHistory` supplied with the original `history` prop.

- [ ] Write a failing real-screen test that loads schema-v1 sessions before, inside, and after 1M; checks default 1M, period selector interaction, period volume/count/Estimated 1RM, empty period, no fake bar, complete History, accessibility states, and equivalent results after reload with the same mocked clock. Adapt older all-time analytics tests by selecting `ALL` explicitly.
- [ ] Run `npm test -- --runInBand lib/__tests__/workout-screen.test.tsx` and verify RED on the new period behavior.
- [ ] Add a compact scrollable period selector using existing theme tokens and at least 44-point hit targets. Use local state, refresh `now` while Progress stays open or resumes, and pass only filtered metrics to existing cards/bars. Keep History on the full archive.
- [ ] Run the focused test, `npm run typecheck`, and full `npm test`; verify GREEN.
- [ ] Commit `feat: scope Progress UI to selected period`.

### Task 3: Durable contract and full validation

**Files:** Modify `docs/PROGRESS_ANALYTICS.md`.

**Interfaces:** Describe Task 1's exact period behavior without changing persistence contracts.

- [ ] Document periods, default, inclusive local boundaries, future exclusion, `finishedAt`, explicit `now`, ALL, unchanged History, and schema v1.
- [ ] Run `npm run check`, `npm run export:check`, and `git diff --check origin/develop...HEAD`.
- [ ] Review the complete branch for Critical/Important findings, fix any introduced issues through a failing test first, and rerun affected/full checks.
- [ ] Commit documentation and verified fixes; publish the branch and create a PR into `develop`, then wait for GitHub CI. Do not merge.
