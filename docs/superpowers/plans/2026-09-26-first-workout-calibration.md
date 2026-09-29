# First Workout Calibration v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add truthful, optional first-workout calibration for externally loaded exercises without changing workout/history schema v1.

**Architecture:** Keep performed sets in the existing Workout Engine. Store only auxiliary path choices and difficulty feedback in a separate versioned local key. Derive a Starting baseline from a Good feedback record joined to an actually saved completed set; never duplicate or rewrite workout data. Malformed or unavailable auxiliary storage degrades to normal workouts.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, AsyncStorage, Jest.

**Spec:** `docs/PRODUCT.md` (First Workout Calibration v1), `docs/DESIGN_SYSTEM.md` (First-workout calibration), and `docs/DECISIONS.md` (2026-09-26).

## Global Constraints

- Keep `schemaVersion: 1`, `fitflow_state_v1`, History and Progress semantics unchanged.
- Do not infer kilograms from demographics, percentages, or a universal increment table.
- Bodyweight and assisted movements have no kilogram Starting baseline in v1.
- Auxiliary state failure must not block an actual workout.
- No Recommendation Engine or adaptive progression.

## Review Focus

- A set edited after feedback must not silently reuse feedback for a different completion.
- A Good attempt in an unfinished workout must not appear as a durable baseline.
- A completed workout without auxiliary storage must remain available in History/Progress.
- Assisted exercises must not interpret assistance kilograms as lifted-load baseline.
- Reset local data must also clear the new auxiliary key, including on rollback.

---

### Task 1: Auxiliary calibration model and projection

**Files:** Create `lib/calibration.ts`; test `lib/__tests__/calibration.test.ts`.

**Interfaces:** Export `CalibrationState`, `initialCalibrationState`, `calibrationLoadKind(exerciseId)`, `needsCalibration(exerciseId, history)`, `chooseCalibrationPath(state, sessionId, exerciseId, choice)`, `recordCalibrationFeedback(state, session, exerciseId, setId, feedback)`, `pendingCalibrationSet(state, session, exerciseId)`, and `startingBaseline(state, history, exerciseId)`.

- [ ] Write tests for external-load eligibility, existing valid exercise-specific history, bodyweight/assisted exclusion, known/help paths, all four feedback values, repeated attempts, set re-completion, no unfinished baseline, actual saved Good baseline and manual weight override.
- [ ] Run targeted test; confirm failures are missing behavior.
- [ ] Implement pure selectors and state transitions, using stable exercise identity and actual completed set data.
- [ ] Run targeted test; confirm pass.

### Task 2: Safe auxiliary persistence and reset

**Files:** Create `lib/calibration-repository.ts`; modify `lib/local-data-reset.ts`; test `lib/__tests__/calibration-repository.test.ts` and reset tests.

**Interfaces:** Export `CALIBRATION_KEY = 'cresum_calibration_v1'` and `CalibrationRepository` with `load`, `save`, `waitForWrites`. Corrupt auxiliary data returns empty calibration state and never touches workout storage.

- [ ] Write tests for roundtrip, malformed state, failed save, serialized writes, and reset/rollback including the calibration key.
- [ ] Run targeted tests; confirm failures.
- [ ] Implement repository and reset-key inclusion.
- [ ] Run targeted tests; confirm pass.

### Task 3: Active-workout calibration UX

**Files:** Create `components/WorkoutCalibration.tsx`; modify `components/Workout.tsx`, `app/index.tsx`; test `lib/__tests__/calibration-screen.test.tsx` and affected existing screen tests.

**Interfaces:** The screen receives auxiliary state and async choice/feedback callbacks; it never writes a fake workout set. Normal `WorkoutStore` logging remains authoritative.

- [ ] Write screen/integration tests for known/help, actual-set-gated feedback, four responses, no forced increase, repeat attempts/use-today, manual override, unavailable auxiliary storage, relaunch, accessible compact controls, and true History/Progress result.
- [ ] Run targeted tests; confirm failures.
- [ ] Implement the smallest UI and App orchestration, with non-blocking auxiliary persistence and reset sequencing.
- [ ] Run targeted tests; confirm pass.

### Task 4: Validation, review and PR

**Files:** No additional product scope; amend only Critical/Important regressions.

- [ ] Run `npm run check`, `npm exec --yes -- expo-doctor`, `npm run export:check`, `git diff --check`.
- [ ] Review data safety, persistence races, load semantics, accessibility, interrupted flows and scope; fix Critical/Important issues using failing tests first.
- [ ] Commit and push `feature/first-workout-calibration`; open one PR into `develop`; do not merge.
