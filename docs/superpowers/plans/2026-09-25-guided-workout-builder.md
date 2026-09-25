# Guided Workout Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guide custom workout creation through name, one exercise selection, planned configuration, composition, and durable save.

**Architecture:** Keep ordered `exerciseIds` as the v1 template backbone, with optional per-exercise planned sets and weight. Validate and persist that optional configuration in the existing v1 document; apply it only when instantiating a new active workout. Replace the template editor UI with a small local-state builder that reuses Exercise Library and existing management callbacks.

**Tech Stack:** React Native/Expo, TypeScript, Jest, AsyncStorage repository.

**Spec:** Approved Guided Workout Builder request supplied with this task; owning contracts in `docs/WORKOUT_TEMPLATES.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/DESIGN_SYSTEM.md` and `docs/DECISIONS.md`.

## Global Constraints

- Keep `schemaVersion: 1` and `fitflow_state_v1`; old templates, active sessions and history remain readable.
- Use existing CRESUM design tokens; mobile-first, 44-point actions, truthful copy.
- No calibration, recommendations, target reps, cloud sync or other roadmap feature.
- One focused branch and PR to develop; do not merge.

## Review Focus

- Invalid persisted planned configuration must fail safely rather than silently rewrite a template.
- Legacy aliases and unavailable IDs must remain visible and must not corrupt edit/save.
- Back and cancel must preserve or explicitly discard draft without writing.
- Saving failure must retain every builder field and never show false success.
- Planned prefill must never mark a set complete or replace actual historical performance.

---

### Task 1: Template configuration contract and repository

**Files:** `lib/workout-model.ts`, `lib/workout-templates.ts`, `lib/workout-repository.ts`, `lib/__tests__/workout-templates.test.ts`, repository tests.

**Interfaces:** Produce `WorkoutTemplate.plannedExercises?: PlannedExercise[]` with `{ exerciseId, sets, weight? }`; extend `TemplateDraft` accordingly. Consumers retain `exerciseIds` as order.

- [ ] Write failing tests for create/edit normalization, 1–20 whole sets, finite nonnegative exact weight, alias matching, no duplicate or orphan configurations, and v1 save/reload.
- [ ] Run focused tests and observe contract failures.
- [ ] Implement minimal model, draft helpers, validation and strict repository parsing.
- [ ] Rerun focused tests and full Jest suite.

### Task 2: Workout start prefill

**Files:** `lib/workout-engine.ts`, `lib/__tests__/workout-engine.test.ts`.

**Interfaces:** Consume optional planned configuration by canonical exercise ID; default legacy exercises to three unset-weight rows.

- [ ] Write failing tests for planned row count/weight, unset completion, legacy defaults, user edits and historical truth.
- [ ] Run focused tests to observe failures.
- [ ] Implement minimal start-time snapshot prefill without altering saved sessions.
- [ ] Rerun focused tests and full Jest suite.

### Task 3: Guided builder UX and integration

**Files:** `components/TemplateEditor.tsx`, `components/WorkoutTemplates.tsx`, `components/ExerciseLibrary.tsx` if needed, `lib/__tests__/workout-templates-screen.test.tsx`.

**Interfaces:** Preserve existing `onSave(TemplateDraft)` callback and built-in/delete protection. Library single selection yields one stable exercise ID; local builder steps own name, planned configuration and composition.

- [ ] Write failing UI tests for name validation, automatic Library, select/configure/add, multiple exercises, back, edit/remove/reorder, duplicate prevention, cancel confirmation and failed save retention.
- [ ] Run focused UI tests and observe failures.
- [ ] Implement the smallest accessible local step flow using existing tokens/components.
- [ ] Rerun focused tests and full Jest suite.

### Task 4: Documentation, validation and review

**Files:** `docs/DECISIONS.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/WORKOUT_TEMPLATES.md` and `docs/DESIGN_SYSTEM.md` only where ownership requires.

**Interfaces:** Document current builder and separate future calibration/adaptive progression direction, without implying it is implemented.

- [ ] Synchronize both approved decisions in owning documents and decision log.
- [ ] Run `npm run check`, `npx expo-doctor`, iOS/Android export and `git diff --check`.
- [ ] Review focused diff, fix Critical/Important issues with reproducing tests, rerun checks.
- [ ] Commit, push, open exactly one PR to develop, inspect PR CI, and stop without merge.
