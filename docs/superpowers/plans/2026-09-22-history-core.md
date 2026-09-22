# History Core Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the eager inline History archive with a compact newest-first summary → detail experience backed only by saved completed-workout snapshots.

**Architecture:** A small pure helper returns a stable, non-mutating newest-first view of completed sessions. `WorkoutHistory` owns only the selected session ID and renders either compact summaries or one saved-session detail; `Stats` continues to own Progress analytics and composes the History component inside its existing `ScrollView`.

**Tech Stack:** React Native, Expo, TypeScript, React 19, Jest, react-test-renderer.

**Spec:** Approved History Core Completion brief in this task; permanent product contracts in `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/DESIGN_SYSTEM.md`, and `docs/WORKOUT_CORE.md`.

## Global Constraints

- Persistence schema remains version 1; no migration or repository mutation.
- History is read-only: no edit, delete, duplicate, repeat, search, filter, calendar, pagination, sync, or analytics expansion.
- Render saved `WorkoutSession` and `WorkoutExercise` snapshot fields directly; never join current templates or exercise catalog metadata.
- Reuse `duration`, `completedSetCount`, and `volume`; do not create competing calculations.
- Follow existing theme tokens, 44-point touch targets, system typography, and light Apple-inspired direction.
- Keep the outer Progress `ScrollView`; do not nest a same-direction virtualized list.

## Review Focus

- Two sessions with equal timestamps retain their persisted relative order rather than flickering.
- A selected session removed from props returns safely to the summary list.
- Exercises with zero completed sets render an explicit empty message and no invented values.
- Long workout and exercise names wrap within phone width without fixed-width overflow.
- Summary accessibility labels identify the saved workout and the action to open its details.

---

### Task 1: Pure newest-first History ordering

**Files:**

- Create: `lib/workout-history.ts`
- Create: `lib/__tests__/workout-history.test.ts`

**Interfaces:**

- Consumes: `WorkoutSession` from `lib/workout-model.ts`.
- Produces: `newestFirstHistory(history: readonly WorkoutSession[]): WorkoutSession[]`.

- [ ] **Step 1: Write the failing ordering tests**

Create fixtures with literal `startedAt`/`finishedAt` values and assert that `newestFirstHistory` returns descending completion time, preserves input objects and array order, and preserves persisted order for equal timestamps.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --runInBand lib/__tests__/workout-history.test.ts`

Expected: FAIL because `lib/workout-history.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure helper**

Copy sessions with their original indexes, sort by `(finishedAt ?? startedAt)` descending and then original index ascending, and return the sessions without cloning or mutating snapshots.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- --runInBand lib/__tests__/workout-history.test.ts`

Expected: ordering tests pass.

Run: `npm test -- --runInBand`

Expected: all suites pass.

- [ ] **Step 5: Commit**

Commit message: `feat: add history ordering boundary`

### Task 2: Compact summary → saved snapshot detail component

**Files:**

- Create: `components/WorkoutHistory.tsx`
- Create: `lib/__tests__/workout-history-screen.test.tsx`

**Interfaces:**

- Consumes: `history: readonly WorkoutSession[]`, `newestFirstHistory`, `duration`, `completedSetCount`, `volume`, and `isSetComplete`.
- Produces: `WorkoutHistory({ history }: { history: readonly WorkoutSession[] }): ReactElement`.

- [ ] **Step 1: Write failing component tests**

Cover independently:

- empty History copy;
- multiple out-of-order sessions displayed newest-first;
- initial summaries contain no exercise/set snapshot details;
- meaningful 44-point summary buttons and accessibility labels;
- opening one summary shows saved name, date/time, duration, completed-set count, volume, exercise names, weights, and repetitions;
- a partial completed workout shows `No completed sets` for the relevant exercise;
- saved snapshot names remain unchanged when unrelated current catalog/template fixtures differ;
- long workout/exercise names and many sets render without truncating detail data;
- Back returns to summaries;
- removing the selected session from props returns safely to summaries.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --runInBand lib/__tests__/workout-history-screen.test.tsx`

Expected: FAIL because `WorkoutHistory` does not exist.

- [ ] **Step 3: Implement compact summaries**

Render a `History` section heading, an intentional empty `GlassCard`, or one `Pressable` per ordered session. Each summary shows only saved name, completion date/time, duration, completed-set count, and volume. Use `numberOfLines={2}` only for the summary name and no fixed content widths.

- [ ] **Step 4: Implement one-session detail**

When selected, render a secondary `Back to History` action and exactly one detail `GlassCard`. Read exercise names and set values from the selected snapshot, filter with `isSetComplete`, and show `No completed sets` when appropriate. If the selected ID disappears, render the summary list instead of stale or reconstructed data.

- [ ] **Step 5: Run focused and full tests**

Run: `npm test -- --runInBand lib/__tests__/workout-history-screen.test.tsx`

Expected: component tests pass with no React warnings.

Run: `npm test -- --runInBand`

Expected: all suites pass.

- [ ] **Step 6: Commit**

Commit message: `feat: add workout history summary and detail`

### Task 3: Progress integration, reload coverage, and durable contract

**Files:**

- Modify: `app/index.tsx`
- Modify: `lib/__tests__/workout-screen.test.tsx`
- Create: `docs/HISTORY.md`

**Interfaces:**

- Consumes: `WorkoutHistory` from Task 2 and the existing `data.history` array.
- Produces: Progress composition with analytics unchanged and History delegated to `WorkoutHistory`.

- [ ] **Step 1: Write the failing app reload test**

Seed or finish a valid schema-v1 session, unmount and recreate `App`, open Progress, assert the compact summary exists, open it, and assert the same saved workout/exercise/set snapshot values render. Mutate only current template/catalog fixtures where possible and confirm the saved labels remain unchanged.

- [ ] **Step 2: Run the focused app test and verify RED**

Run: `npm test -- --runInBand lib/__tests__/workout-screen.test.tsx`

Expected: FAIL because the current Progress UI eagerly renders exercise detail and has no summary-open interaction.

- [ ] **Step 3: Integrate `WorkoutHistory`**

Replace only the inline History section in `Stats`; retain all existing Progress calculations, cards, copy, and outer scrolling. Remove styles/imports made unused by the extraction.

- [ ] **Step 4: Add the durable History contract**

Create `docs/HISTORY.md` documenting completed `WorkoutSession` snapshots, newest-first compact summaries, summary → detail, read-only Core behavior, schema v1, and the prohibition on live template/catalog reconstruction.

- [ ] **Step 5: Run focused and full verification**

Run: `npm test -- --runInBand lib/__tests__/workout-screen.test.tsx lib/__tests__/workout-history-screen.test.tsx lib/__tests__/workout-history.test.ts`

Expected: focused tests pass.

Run: `npm run check`

Expected: TypeScript, ESLint, Prettier, all Jest tests, Expo config, and dependency checks pass.

Run: `npm run export:check`

Expected: iOS and Android exports pass.

- [ ] **Step 6: Commit**

Commit message: `feat: complete history core`

### Task 4: Phone validation and focused review

**Files:**

- Modify only files already in scope if a Critical/Important finding requires a TDD fix.

**Interfaces:**

- Consumes: completed branch diff and the approved task requirements.
- Produces: reviewed, verified branch ready for PR.

- [ ] **Step 1: Validate UI states**

Smoke-test empty, one, several, long-name, many-set, partial, summary → detail → back, and reload behavior at practical phone width. Record exact viewport limitations honestly.

- [ ] **Step 2: Review the complete branch diff**

Check data loss, schema v1, active/finished snapshot mutation, Finish/reload regressions, ordering, snapshot-only detail, metric accuracy, eager rendering, partial state, accessibility, virtualized nesting, overflow, Progress regressions, and scope creep.

- [ ] **Step 3: Fix Critical/Important findings through RED→GREEN tests**

For each qualifying finding, add a focused failing test, confirm the expected failure, implement the smallest fix, then run the focused and full suites.

- [ ] **Step 4: Run final verification**

Run: `npm run check`

Run: `npm run export:check`

Expected: both exit successfully on the final committed tree.

- [ ] **Step 5: Commit review fixes if needed**

Commit message: `fix: harden history core`
