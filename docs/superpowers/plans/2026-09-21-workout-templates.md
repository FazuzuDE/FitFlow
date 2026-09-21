# Workout Templates Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete production-ready Workout Templates CRUD, ordering, validation, and persistence safety while preserving schema v1 and workout snapshots.

**Architecture:** A pure `workout-templates` domain module owns all invariants and immutable mutations. `WorkoutStore` performs focused durable mutations with explicit results, while a reusable local-draft `TemplateEditor` owns Create/Edit UI and reuses Exercise Library and Confirmation.

**Tech Stack:** React Native 0.79, Expo 53, React 19, TypeScript 5.8, Jest 29, AsyncStorage.

**Spec:** `docs/superpowers/specs/2026-09-21-workout-templates-design.md`

## Global Constraints

- Persistence schema remains version 1 with no new template fields.
- Built-in templates are visible/startable and immutable/not deletable.
- Known legacy IDs normalize only inside an editable draft; persisted data is never globally rewritten on load.
- Unknown IDs remain visible and block Save until explicitly removed or replaced.
- Duplicate template names are allowed; duplicate exercise IDs are not.
- Exercise Library is the only exercise picker; no drag-and-drop dependency.
- Active and historical workout snapshots must remain unchanged by template CRUD.
- UI follows `docs/DESIGN_SYSTEM.md` tokens, 44-point targets, and one clear primary action.

## Review Focus

- A failed or busy save must retain the open editor and all draft values.
- Legacy plus canonical aliases for the same exercise must be detected as a duplicate after normalization.
- Unknown IDs must remain visible until explicit removal and must never disappear on Cancel.
- Template changes made while a workout exists must preserve active/history objects and values.
- Rapid ID collisions must retry safely without overwriting another template.

---

### Task 1: Pure template domain

**Files:**

- Create: `lib/workout-templates.ts`
- Create: `lib/__tests__/workout-templates.test.ts`

**Interfaces:**

- Produces: `TemplateDraft`, `TemplateValidation`, `isBuiltInTemplate`, `createTemplateDraft`, `validateTemplateDraft`, `toggleDraftExercise`, `moveDraftExercise`, `removeDraftExercise`, `createTemplate`, `updateTemplate`, and `deleteTemplate`.
- Consumes: `WorkoutTemplate`, `defaultTemplates`, `canonicalExerciseId`, and `findExercise`.

- [ ] **Step 1: Write failing domain tests**

Cover copied drafts, name trimming, whitespace rejection, empty exercises, duplicate aliases, unique ID collision retry, immutable create/update/delete, ordering, removal, built-in rejection, legacy normalization, partial/all stale values, and preservation of unknown values.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runTestsByPath lib/__tests__/workout-templates.test.ts`  
Expected: FAIL because `lib/workout-templates.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure domain**

Use an ordered `exerciseIds: string[]` draft. Canonicalize known IDs during draft creation, leave unknown values in place, derive stale values through `findExercise`, and validate before mutation. Retry injected ID factories against all existing IDs and fail explicitly after bounded repeated collisions.

- [ ] **Step 4: Verify GREEN**

Run the focused test file, then `npm test`.

- [ ] **Step 5: Commit**

Commit message: `feat: add workout template domain`

### Task 2: Durable store CRUD

**Files:**

- Modify: `lib/workout-store.ts`
- Modify: `lib/__tests__/workout-templates.test.ts`

**Interfaces:**

- Produces: `TemplateMutationResult`, `createTemplate(draft)`, `updateTemplate(id, draft)`, and `deleteTemplate(id)` on `WorkoutStore`.
- Consumes: pure domain mutations from Task 1 and `WorkoutRepository.save`.

- [ ] **Step 1: Write failing store tests**

Test durable create/update/delete and reload, built-in rejection, busy rejection, failed persistence retaining old state, explicit failure results, and unchanged active/history snapshots.

- [ ] **Step 2: Verify RED**

Run the focused test file and confirm missing store methods/results cause the failure.

- [ ] **Step 3: Implement durable mutation helper**

Build the next state from the current snapshot, publish `busy`, await repository save, publish the new state only on success, keep the previous state on failure, and return `{ ok: true }` or `{ ok: false, error }`. Retain `setTemplates` only if existing compatibility still needs it; UI CRUD must use focused methods.

- [ ] **Step 4: Verify GREEN**

Run the focused test file, then the full suite.

- [ ] **Step 5: Commit**

Commit message: `feat: persist workout template mutations safely`

### Task 3: Draft editor and template management UI

**Files:**

- Create: `components/TemplateEditor.tsx`
- Create: `components/WorkoutTemplates.tsx`
- Create: `lib/__tests__/workout-templates-screen.test.tsx`
- Modify: `app/index.tsx`

**Interfaces:**

- `TemplateEditor` consumes mode, optional initial template, busy state, `onSave(draft)`, and `onCancel()`.
- `WorkoutTemplates` consumes templates, busy state, and async create/update/delete callbacks.
- `App` connects those callbacks directly to `WorkoutStore` methods.

- [ ] **Step 1: Write failing component tests**

Test Create/Edit labels, local draft Cancel, Exercise Library reuse, inline validation, ordered rows, accessible Move up/Move down/Remove controls with disabled edge states, stale rows, long names, many exercises, and failed save retaining the editor.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runTestsByPath lib/__tests__/workout-templates-screen.test.tsx`  
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement `TemplateEditor`**

Mount a fresh local draft per Create/Edit session, use `ExerciseLibrary` controlled selection, display every ordered entry, expose 44-point controls, validate before awaiting Save, retain state on failure, and close only through successful parent handling or Cancel.

- [ ] **Step 4: Implement `WorkoutTemplates` and App integration**

Show a clear Create action, immutable built-in rows, Edit/Delete for custom rows, existing `Confirmation` for deletion, and truthful available/stale counts. Remove the old inline array-rebuilding Profile implementation.

- [ ] **Step 5: Verify GREEN**

Run the focused screen tests, existing Exercise Library screen tests, then the full suite.

- [ ] **Step 6: Commit**

Commit message: `feat: complete workout template editor`

### Task 4: End-to-end persistence and snapshot safety

**Files:**

- Modify: `lib/__tests__/workout-templates-screen.test.tsx`
- Modify: `lib/__tests__/workout-templates.test.ts`
- Modify: `app/index.tsx`
- Modify: `components/WorkoutTemplates.tsx`
- Modify: `lib/workout-store.ts`

**Interfaces:**

- Consumes all earlier public APIs; introduces no new persistence shape.

- [ ] **Step 1: Add failing integration tests**

Cover create → reload → start, edit → reload → start, reorder → reload → workout order, delete cancel/confirm, and active/history independence after edit/delete.

- [ ] **Step 2: Verify RED**

Run both new template test files and confirm the missing integration behavior fails for the expected reason.

- [ ] **Step 3: Implement only required integration fixes**

Preserve schema v1 and snapshots; do not broaden scope or globally rewrite persisted templates.

- [ ] **Step 4: Verify GREEN**

Run both focused files and the complete Jest suite.

- [ ] **Step 5: Commit**

Commit message: `test: verify workout template lifecycle`

### Task 5: Durable contracts and final verification

**Files:**

- Create: `docs/WORKOUT_TEMPLATES.md`
- Modify: `docs/DECISIONS.md` only if a new durable decision emerged during implementation

**Interfaces:**

- Documents existing public behavior only; no new product behavior.

- [ ] **Step 1: Document the implemented contract**

Record built-in/custom policy, schema-v1 storage, local draft/Save behavior, ordering, legacy/stale handling, and snapshot independence.

- [ ] **Step 2: Run formatting and full CI checks**

Run `npm run check` and `npm run export:check`, fixing only regressions introduced by this work.

- [ ] **Step 3: Perform focused UI validation**

Validate Create/Edit, Save/Cancel, long names, many exercises, reorder, confirmation, and error states at normal phone widths where the environment permits. Record physical-device checks as remaining if unavailable.

- [ ] **Step 4: Focused self-review**

Audit data loss, schema corruption, snapshots, false success, legacy/stale handling, duplicates, reorder persistence, built-in mutation, accessibility, misleading counts, documentation contradictions, and scope creep. Fix every Critical/Important issue with a failing regression test first.

- [ ] **Step 5: Commit**

Commit message: `docs: record workout template contracts`

- [ ] **Step 6: Push and open PR**

Push `feature/workout-templates`, create `feature/workout-templates → develop` PR titled `Implement Workout Templates Core`, do not merge, and wait for CI status.
