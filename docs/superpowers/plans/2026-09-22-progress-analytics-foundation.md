# Progress Analytics Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Derive trustworthy Progress volume and Estimated 1RM records from completed schema-v1 workout snapshots without mutating History or joining live exercise metadata.

**Architecture:** Keep accepted numeric syntax and Epley math in `lib/workout-metrics.ts`, then add `lib/progress-analytics.ts` as the pure snapshot-to-analytics projection. The existing Progress presentation consumes that projection; persistence, Workout Engine finish behavior, periods, progression, and chart design stay unchanged.

**Tech Stack:** React Native, Expo, TypeScript, Jest, react-test-renderer.

**Spec:** User-approved Progress Analytics Foundation task brief in the current Codex task (2026-09-22); no separate repository spec exists.

## Global Constraints

- Persistence schema remains exactly version 1; no migration or History rewrite.
- Only completed sets are eligible; zero weight is valid and repetitions must be positive integers.
- Reject negative, fractional-repetition, NaN-like, Infinity, scientific, hexadecimal, and non-finite derived samples.
- Preserve the existing Epley formula and the explicit `Estimated 1RM` label.
- Canonicalize known legacy aliases, isolate unknown IDs, and never use snapshot names as identity.
- Use saved snapshot names as labels; do not join current Exercise Library display metadata.
- Use actual timestamps with deterministic ties; do not add periods or date buckets.
- Do not redesign Progress or change Workout Engine, Finish, repository, templates, or History behavior.

## Review Focus

- A decimal-comma weight accepted by Workout Engine must remain analytically valid after normalization.
- Two individually finite volume contributions must never make the aggregate total infinite.
- Empty or whitespace-only historical `libraryId` values must be isolated rather than merged by name.
- Equal Estimated 1RM values from equal timestamps must resolve independently of input array order.
- A newer renamed snapshot with a lower record must update the label without replacing the older best record.

---

### Task 1: Safe completed-set metric boundary

**Files:**

- Modify: `lib/workout-metrics.ts`
- Modify: `lib/__tests__/workout-metrics.test.ts`

**Interfaces:**

- Consumes: completed-set-like values `{ weight: string; reps: string; completedAt?: number; done?: boolean }`.
- Produces: `completedSetMetrics(set): { weight: number; reps: number; volume: number; estimatedOneRepMax: number } | undefined`, existing `volume(session): number`, and unchanged `epley(weight, reps): number`.

- [ ] **Step 1: Add failing numeric-boundary tests**

Add table-driven assertions proving negative weight, zero/negative/fractional reps, NaN-like, Infinity, scientific, hexadecimal, and multiplication overflow are rejected; `0 × positive reps`, decimal dot, decimal comma, and trimmed values are accepted. Assert that `volume()` sums only valid completed samples and remains finite if an addition would overflow.

```ts
expect(completedSetMetrics(done('0', '10'))).toMatchObject({
  weight: 0,
  reps: 10,
  volume: 0,
});
expect(completedSetMetrics(done('-1', '10'))).toBeUndefined();
expect(completedSetMetrics(done('1e2', '10'))).toBeUndefined();
expect(Number.isFinite(volume(overflowingSession))).toBe(true);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --runInBand lib/__tests__/workout-metrics.test.ts`

Expected: FAIL because `completedSetMetrics` does not exist and current `volume()` accepts some invalid representations.

- [ ] **Step 3: Implement the minimal safe parser and volume reuse**

Use Workout Engine-compatible decimal syntax after trimming and replacing one comma with a dot. Require `/^\d+(\.\d+)?$/` for weight and `/^\d+$/` for reps, finite `weight >= 0`, integer `reps > 0`, finite `weight * reps`, and finite Epley output. Make `volume()` consume this result and retain a finite running total.

- [ ] **Step 4: Verify focused and full suites GREEN**

Run: `npm test -- --runInBand lib/__tests__/workout-metrics.test.ts`

Expected: all workout-metrics tests pass.

Run: `npm test`

Expected: all repository tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/workout-metrics.ts lib/__tests__/workout-metrics.test.ts
git commit -m "fix: harden completed set analytics"
```

### Task 2: Stable Progress analytics projection

**Files:**

- Create: `lib/progress-analytics.ts`
- Create: `lib/__tests__/progress-analytics.test.ts`

**Interfaces:**

- Consumes: `completedSetMetrics`, `volume`, `canonicalExerciseId`, and `readonly WorkoutSession[]`.
- Produces: `projectProgressAnalytics(history): ProgressAnalytics`, including `totalVolume`, newest-first `workoutVolumes`, `estimatedOneRepMaxRecords`, and `excludedSampleCount`.

- [ ] **Step 1: Add failing projection tests**

Cover canonical IDs, legacy + canonical aliases, renamed snapshots, identical names with different IDs, unknown IDs, blank-ID isolation, newest saved label, no live catalog label, every invalid numeric class, zero weight, partial workouts, multiple workouts, best-record timestamp, stable equal-timestamp ties, timestamp-based workout ordering, and finite totals.

```ts
const result = projectProgressAnalytics([olderCanonical, newerLegacy]);
expect(result.estimatedOneRepMaxRecords).toHaveLength(1);
expect(result.estimatedOneRepMaxRecords[0]).toMatchObject({
  exerciseId: 'barbell-bench-press',
  name: 'Newest Saved Bench Name',
  recordedAt: newestBestSet.completedAt,
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --runInBand lib/__tests__/progress-analytics.test.ts`

Expected: FAIL because `lib/progress-analytics.ts` does not exist.

- [ ] **Step 3: Implement stable identity, records, and deterministic ordering**

Known IDs use `canonicalExerciseId(libraryId)`. Unknown non-empty IDs retain the trimmed raw ID. Missing IDs use `snapshot:<session.id>:<exercise.id>`. Label selection uses the newest relevant saved sample by `finishedAt`, then `completedAt`, then a lexical source key. Best Estimated 1RM uses highest estimate, then newest `completedAt`, then lexical source key. Record lists sort by estimate descending, timestamp descending, then identity; workout volumes sort by `finishedAt` descending with stable ID ties.

- [ ] **Step 4: Verify focused and full suites GREEN**

Run: `npm test -- --runInBand lib/__tests__/progress-analytics.test.ts`

Expected: all projection tests pass.

Run: `npm test`

Expected: all repository tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/progress-analytics.ts lib/__tests__/progress-analytics.test.ts
git commit -m "feat: add stable progress analytics projection"
```

### Task 3: Existing Progress UI integration, reload coverage, and contracts

**Files:**

- Modify: `app/index.tsx`
- Modify: `lib/__tests__/workout-screen.test.tsx`
- Create: `docs/PROGRESS_ANALYTICS.md`

**Interfaces:**

- Consumes: `projectProgressAnalytics(history)` from Task 2.
- Produces: existing Progress total volume, recent workout bars, and Estimated 1RM list backed only by the trusted projection; schema-v1 contract documentation.

- [ ] **Step 1: Add a failing app-level reload test**

Seed schema-v1 History with canonical/legacy renamed snapshots plus an invalid completed sample, mount and reload the real app, open Progress, and assert one saved-label record, finite valid-only total volume, retained `Estimated 1RM` wording, and a restrained excluded-sample note.

```ts
expect(progress).toContain('Newest Saved Bench Name');
expect(progress).not.toContain('Current Catalog Bench Name');
expect(progress).toContain('Estimated 1RM');
expect(progress).toContain('Some saved sets could not be included.');
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --runInBand lib/__tests__/workout-screen.test.tsx`

Expected: FAIL because Progress still groups by name and reads unsafe inline calculations.

- [ ] **Step 3: Integrate the projection without redesigning Progress**

Replace inline record construction and raw History volume aggregation with one memoized projection. Keep existing cards, typography, colors, `Estimated 1RM` copy, and top-six display. Use stable `exerciseId` keys, projected timestamps/data, safe workout volumes for bars, and show the restrained note only when `excludedSampleCount > 0`.

- [ ] **Step 4: Document durable analytics contracts**

Add `docs/PROGRESS_ANALYTICS.md` documenting snapshot source, identity policy, legacy aliases, unknown isolation, saved labels, numeric boundary, volume, Epley estimate, schema v1, History immutability, and excluded future period/progression/frequency work.

- [ ] **Step 5: Verify focused and full suites GREEN**

Run: `npm test -- --runInBand lib/__tests__/workout-screen.test.tsx`

Expected: app integration and reload tests pass.

Run: `npm test`

Expected: all repository tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/index.tsx lib/__tests__/workout-screen.test.tsx docs/PROGRESS_ANALYTICS.md
git commit -m "feat: use trusted progress analytics"
```

### Task 4: Final validation and focused review

**Files:**

- Review: all files changed from `origin/develop` through `HEAD`

**Interfaces:**

- Consumes: completed Tasks 1–3 and their test evidence.
- Produces: a reviewed, fully validated branch ready for push and PR.

- [ ] **Step 1: Run repository validation**

Run: `npm run check`

Expected: TypeScript, ESLint, Prettier, all Jest suites, Expo config, and dependency validation pass.

- [ ] **Step 2: Run mobile export validation**

Run: `npm run export:check`

Expected: both iOS and Android exports succeed.

- [ ] **Step 3: Check the patch and invariants**

Run: `git diff --check origin/develop...HEAD`

Expected: no whitespace errors.

Inspect the full branch diff for History mutation, schema changes, Finish/reload regressions, name-based grouping, alias failures, ID collisions, live catalog labels, invalid/non-finite analytics, zero-weight rejection, formula changes, estimate-label regression, UI redesign, and scope creep.

- [ ] **Step 4: Complete fresh whole-branch review**

Use the requesting-code-review template against `origin/develop...HEAD`. Fix all Critical/Important findings through RED→GREEN TDD, record Minor findings, and rerun the complete validation after any fix.

- [ ] **Step 5: Push and create the requested PR**

Push `feature/progress-analytics-foundation`, create `feature/progress-analytics-foundation → develop` with title `Add Progress Analytics Foundation`, wait for GitHub CI, and do not merge or enable auto-merge.
