# Exercise Library Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a canonical, searchable, filterable Exercise Library that safely supplies templates and active workouts without changing FitFlow persistence schema v1.

**Architecture:** Typed taxonomy and catalog modules own immutable metadata and legacy-ID resolution. Workout sessions continue to store snapshots, while a reusable page-sheet provides single-add and template multi-select modes behind an isolated artwork placeholder boundary.

**Tech Stack:** TypeScript 5.8, React 19, React Native 0.79, Expo 53, Jest 29, react-test-renderer.

**Spec:** `docs/superpowers/specs/2026-09-20-exercise-library-design.md`

## Global Constraints

- Preserve AsyncStorage schema version 1 and the current strict repository validator.
- Do not rewrite persisted templates, active workouts, or historical sessions.
- Preserve Workout Engine Finish, timer, set logging, write ordering, and recovery behavior.
- Use descriptive canonical exercise IDs and one explicit legacy-to-canonical map.
- Use only existing dependencies and existing design tokens.
- Do not implement Muscle Map/load scoring, final artwork, cloud, AI, social, nutrition, subscriptions, or another feature.
- All catalog query logic remains pure and React-independent.

## Review Focus

- A mixed legacy/canonical template with one unknown ID starts all resolvable exercises in source order and never creates an invalid snapshot.
- A historical `libraryId` using an old short ID still matches previous performance for the new canonical exercise without rewriting history.
- Empty/whitespace search and cleared filters restore the full curated list in stable order.
- Long names and active filters remain usable at 320-point width while the Add/Select target stays at least 44 points.
- Reopening or closing the sheet clears only transient query state, never active-workout or template selection state.

---

### Task 1: Canonical taxonomies and curated dataset

**Files:**

- Create: `lib/exercise-taxonomy.ts`
- Create: `lib/exercise-library.ts`
- Modify: `lib/workout-model.ts`
- Test: `lib/__tests__/exercise-library.test.ts`

**Interfaces:**

- Produces: `MuscleId`, `EquipmentId`, `MovementPatternId`, label lookups, `exerciseLibrary`, `canonicalExerciseId(id)`, `findExercise(id)`, and `filterExercises(catalog, filters)`.
- `filterExercises` consumes `{ query?: string; muscle?: MuscleId; equipment?: EquipmentId }` and preserves input order.

- [ ] **Step 1: Write failing taxonomy/catalog integrity tests**

Create tests that assert literal expectations and observable invariants:

```ts
expect(exerciseLibrary.length).toBeGreaterThanOrEqual(45);
expect(exerciseLibrary.length).toBeLessThanOrEqual(60);
expect(new Set(exerciseLibrary.map((item) => item.id)).size).toBe(
  exerciseLibrary.length,
);
expect(findExercise('bench')?.id).toBe('barbell-bench-press');
expect(canonicalExerciseId('barbell-bench-press')).toBe('barbell-bench-press');
expect(canonicalExerciseId('unknown')).toBeUndefined();
```

For every exercise, assert non-empty unique primary muscles, no overlap with secondary muscles, valid taxonomy references, valid movement pattern, valid equipment, and an `imageKey` with no slash, URL separator, or image extension. Assert all twelve legacy IDs map to literal canonical IDs.

- [ ] **Step 2: Run the new test and verify RED**

Run: `npm.cmd test -- --runInBand lib/__tests__/exercise-library.test.ts`

Expected: FAIL because the taxonomy/library modules and expanded fields do not exist.

- [ ] **Step 3: Implement typed taxonomies, model, dataset, and resolvers**

Use `as const` records/arrays to derive ID unions. Build 45–60 curated records with descriptive IDs. Keep the mapping centralized:

```ts
export const legacyExerciseIds = {
  bench: 'barbell-bench-press',
  incline: 'incline-dumbbell-press',
  row: 'seated-cable-row',
  pulldown: 'lat-pulldown',
  press: 'dumbbell-shoulder-press',
  lateral: 'dumbbell-lateral-raise',
  squat: 'barbell-back-squat',
  legpress: 'leg-press',
  deadlift: 'barbell-deadlift',
  curl: 'dumbbell-biceps-curl',
  triceps: 'cable-triceps-pushdown',
  calf: 'standing-calf-raise',
} as const;
```

`canonicalExerciseId` returns the same ID for catalog members, mapped ID for known legacy values, and `undefined` otherwise. `findExercise` resolves through it.

- [ ] **Step 4: Add and run query behavior tests**

Add literal tests for `BENCH`, trimmed search, primary and secondary muscle matches, equipment, combined AND filtering, stable full-list return for blank criteria, and no results.

Run: `npm.cmd test -- --runInBand lib/__tests__/exercise-library.test.ts`

Expected before selector implementation: FAIL on search/filter expectations.

- [ ] **Step 5: Implement minimal pure filtering and verify GREEN**

Normalize only the query with `trim().toLocaleLowerCase()`. Apply name, muscle, and equipment predicates with AND and return `catalog.filter(...)`.

Run: `npm.cmd test -- --runInBand lib/__tests__/exercise-library.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```powershell
git add -- lib/exercise-taxonomy.ts lib/exercise-library.ts lib/workout-model.ts lib/__tests__/exercise-library.test.ts
git commit -m "feat: add canonical exercise catalog"
```

### Task 2: Template and Workout Engine compatibility

**Files:**

- Modify: `lib/workout-catalog.ts`
- Modify: `lib/workout-engine.ts`
- Modify: `lib/workout-store.ts`
- Modify: `components/Workout.tsx`
- Modify: `lib/__tests__/exercise-library.test.ts`
- Modify: `lib/__tests__/workout-engine.test.ts`

**Interfaces:**

- Consumes: `exerciseLibrary`, `findExercise`, `canonicalExerciseId`, taxonomy label lookup.
- Produces: canonical default template IDs; `resolveTemplateExercises(template, catalog)`; snapshots with canonical `libraryId` and a copied primary-muscle label; `exerciseIdsMatch(left, right)` for previous-history matching.

- [ ] **Step 1: Write failing template/engine compatibility tests**

Cover canonical default templates, a legacy-only template, a mixed template containing canonical, legacy, and unknown IDs, canonical append, and snapshot independence:

```ts
expect(resolveTemplateExercises(legacyTemplate).map((item) => item.id)).toEqual(
  ['barbell-bench-press', 'seated-cable-row'],
);
expect(exerciseIdsMatch('bench', 'barbell-bench-press')).toBe(true);
expect(appended.exercises.at(-1)).toMatchObject({
  libraryId: 'barbell-bench-press',
  name: 'Barbell Bench Press',
  muscle: 'Chest',
});
```

Mutate a copied catalog object after append and assert the workout snapshot does not change.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm.cmd test -- --runInBand lib/__tests__/exercise-library.test.ts lib/__tests__/workout-engine.test.ts`

Expected: FAIL because canonical template resolution and ID matching are absent.

- [ ] **Step 3: Implement resolver-backed startup and snapshot creation**

Move default templates to canonical IDs. Add `resolveTemplateExercises` and use it in `startWorkout`; keep `WorkoutStore.start` passing the catalog. `createExercise` copies the canonical ID, current name, and first primary-muscle label into the existing `WorkoutExercise` snapshot. Export `exerciseIdsMatch` and use it in Workout previous-performance lookup. Do not change repository/schema types.

- [ ] **Step 4: Run focused and existing Workout Engine tests**

Run: `npm.cmd test -- --runInBand lib/__tests__/exercise-library.test.ts lib/__tests__/workout-engine.test.ts lib/__tests__/workout-screen.test.tsx`

Expected: PASS with all existing persistence and Finish assertions unchanged.

- [ ] **Step 5: Commit Task 2**

```powershell
git add -- lib/workout-catalog.ts lib/workout-engine.ts lib/workout-store.ts components/Workout.tsx lib/__tests__/exercise-library.test.ts lib/__tests__/workout-engine.test.ts
git commit -m "feat: resolve canonical exercises in workouts"
```

### Task 3: Reusable Exercise Library UI and artwork boundary

**Files:**

- Create: `components/ExerciseArtwork.tsx`
- Create: `components/ExerciseLibrary.tsx`
- Create: `lib/__tests__/exercise-library-screen.test.tsx`
- Modify: `components/Workout.tsx`

**Interfaces:**

- Consumes: canonical catalog, taxonomy labels, `filterExercises`, existing theme tokens, `AppButton`.
- Produces: `ExerciseLibrary` props `{ visible; onClose; onAdd?; selectedIds?; onToggle? }`; `ExerciseArtwork` props `{ imageKey; size? }`.

- [ ] **Step 1: Write failing component behavior tests**

Render the real component with the existing safe-area/icon mocks. Assert:

- `BENCH` search exposes Barbell Bench Press and hides Barbell Back Squat;
- a muscle/equipment selection narrows results through real button presses;
- a nonsense query renders `No exercises found`;
- Add invokes `onAdd` with `barbell-bench-press`;
- selection mode invokes `onToggle` and exposes selected accessibility state;
- closing and reopening resets query/filter state while `selectedIds` remains controlled by the parent.

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm.cmd test -- --runInBand lib/__tests__/exercise-library-screen.test.tsx`

Expected: FAIL because both components are missing.

- [ ] **Step 3: Implement artwork placeholder and library sheet**

`ExerciseArtwork` renders an intentional `surfaceSubtle` rounded square with an Ionicons fitness glyph and an accessibility label derived from `imageKey`. `ExerciseLibrary` owns transient query/filter state, uses horizontal filter ScrollViews and a vertical result ScrollView, wraps long names, and renders at least 44-point actions. It resets transient state on close and never owns active-workout/template persistence.

- [ ] **Step 4: Replace the inline Workout picker**

Open `ExerciseLibrary` from the existing Add exercise button. Pass `onAdd={(exercise) => update(current => appendExercise(current, exercise))}` and close only after the update request. Preserve the outer Workout timer, finish flow, and modal lifecycle.

- [ ] **Step 5: Run UI and Workout tests**

Run: `npm.cmd test -- --runInBand lib/__tests__/exercise-library-screen.test.tsx lib/__tests__/workout-screen.test.tsx lib/__tests__/workout-engine.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```powershell
git add -- components/ExerciseArtwork.tsx components/ExerciseLibrary.tsx components/Workout.tsx lib/__tests__/exercise-library-screen.test.tsx
git commit -m "feat: add exercise library sheet"
```

### Task 4: Canonical template selection UI

**Files:**

- Modify: `app/index.tsx`
- Modify: `lib/__tests__/exercise-library-screen.test.tsx`
- Modify: `lib/__tests__/workout-screen.test.tsx`

**Interfaces:**

- Consumes: `ExerciseLibrary` controlled multi-select mode and canonical `exerciseLibrary`.
- Produces: existing template-save behavior with canonical IDs and no exhaustive catalog chip list.

- [ ] **Step 1: Write failing template-selection integration test**

Render `App`, navigate to Profile, open Choose exercises, toggle Barbell Bench Press and Seated Cable Row, close the sheet, save the template, and assert AsyncStorage contains their canonical IDs in source selection order. Assert the Profile tree does not render every catalog name before opening the sheet.

- [ ] **Step 2: Run screen tests and verify RED**

Run: `npm.cmd test -- --runInBand lib/__tests__/exercise-library-screen.test.tsx lib/__tests__/workout-screen.test.tsx`

Expected: FAIL because Profile still renders the full chip catalog and has no sheet.

- [ ] **Step 3: Implement controlled multi-select integration**

Replace the wrapping catalog chips with a summary of selected exercises and a `Choose exercises` button. Open `ExerciseLibrary` with `selectedIds` and `onToggle`; keep existing validation, save, and template persistence. Do not add template editing/reordering.

- [ ] **Step 4: Run all Jest tests**

Run: `npm.cmd test -- --runInBand`

Expected: PASS, including original Workout Engine persistence tests.

- [ ] **Step 5: Commit Task 4**

```powershell
git add -- app/index.tsx lib/__tests__/exercise-library-screen.test.tsx lib/__tests__/workout-screen.test.tsx
git commit -m "feat: select template exercises from library"
```

### Task 5: Durable documentation and full validation

**Files:**

- Create: `docs/EXERCISE_LIBRARY.md`
- Modify only if checks require task-caused fixes: files already touched in Tasks 1–4

**Interfaces:**

- Consumes: implemented canonical IDs, taxonomies, legacy policy, and image-key boundary.
- Produces: concise durable documentation and a verified branch ready for review.

- [ ] **Step 1: Document the durable contracts**

Document canonical ID ownership, the twelve legacy aliases, schema-v1/no-rewrite policy, snapshot independence, taxonomy ownership, pure query semantics, and extensionless `imageKey` contract. Do not duplicate product/design prose.

- [ ] **Step 2: Run formatter and diff checks**

Run: `npx.cmd prettier --write docs/EXERCISE_LIBRARY.md docs/superpowers/plans/2026-09-20-exercise-library.md`

Run: `git diff --check`

Expected: both commands exit 0.

- [ ] **Step 3: Run complete repository validation**

Run: `$env:CI='1'; $env:EXPO_NO_TELEMETRY='1'; npm.cmd run check`

Expected: typecheck, ESLint, Prettier, all Jest tests, Expo config, and dependency checks pass.

- [ ] **Step 4: Run platform export validation**

Run: `$env:CI='1'; $env:EXPO_NO_TELEMETRY='1'; npm.cmd run export:check`

Expected: iOS and Android bundles export successfully.

- [ ] **Step 5: Perform focused small-phone review**

Run Expo web at 320×640 and verify search keyboard behavior, horizontal filter overflow, a long exercise name, no-results state, active-workout Add, template selection, and sheet close/reopen. Record any absence of physical-device coverage in the final report.

- [ ] **Step 6: Commit Task 5**

```powershell
git add -- docs/EXERCISE_LIBRARY.md docs/superpowers/plans/2026-09-20-exercise-library.md
git commit -m "docs: record exercise library contracts"
```

- [ ] **Step 7: Request focused whole-branch review**

Review from `aee630f` through `HEAD`, specifically grading persistence/schema invariants, legacy resolution, taxonomy integrity, snapshot independence, filter correctness, 320-point usability, dependencies, and scope. Fix every Critical/Important finding through a failing regression test followed by a passing focused and full suite.

- [ ] **Step 8: Push and confirm CI**

Push `feature/exercise-library` without force. Wait for the branch CI corresponding to the final SHA and require `conclusion: success` before reporting completion.
