# Workout Templates Core Design

**Status:** Approved for implementation  
**Date:** 2026-09-21

## Goal

Complete the existing Workout Templates feature so users can safely create, edit, order, start, and delete reusable custom routines without changing persistence schema v1 or altering active and historical workout snapshots.

## Scope

The existing `WorkoutTemplate` shape remains `{ id, name, exerciseIds }`. Built-in templates remain visible and startable but immutable. Custom templates gain a draft-based Create/Edit flow, ordered exercise controls, validation, and confirmed deletion. Exercise selection continues to use the canonical Exercise Library.

No Muscle Map, Training Load, recommendation engine, History redesign, Progress redesign, schema migration, cloud sharing, template marketplace, or drag-and-drop dependency is included.

## Domain boundary

`lib/workout-templates.ts` owns template rules independently of React and storage:

- centralized built-in ID detection;
- draft creation with copied values;
- known legacy-to-canonical normalization in editable drafts while preserving order;
- unknown/stale ID detection without silent removal;
- trimmed, non-empty names;
- at least one valid exercise;
- rejection of duplicate canonical exercise IDs and unresolved stale IDs;
- ordered move/remove/toggle operations;
- collision-safe custom template ID generation;
- immutable create/update/delete operations;
- rejection of built-in update/delete.

Duplicate template names are allowed because identity is the template ID. Existing questionable persisted templates are loaded without global repair or deduplication.

## Persistence and store

Schema v1 remains unchanged. `WorkoutStore` exposes focused asynchronous create, update, and delete methods. Each returns an explicit success/failure result. Template state is published only after the repository write succeeds, so the UI never closes, clears a draft, or emits success feedback for a rejected or failed save.

Template writes preserve the current `activeWorkout` and `history` references and values. Active and completed workouts remain snapshots; editing or deleting their source template never rewrites them.

## Editor and selection flow

`TemplateEditor` has Create and Edit modes and owns a local draft. Opening Exercise Library changes only that draft. Closing the library returns to the editor; Save validates and persists, while Cancel discards the draft without writing.

Selected exercises render as ordered rows with accessible Remove, Move up, and Move down controls. Controls use existing tokens and practical touch targets. Stale entries are visibly identified, can be explicitly removed, and block Save until resolved. No second exercise picker is introduced.

## Built-in and deletion behavior

Built-in templates have no edit or delete actions. Custom templates expose both. Deletion uses the existing `Confirmation` component; cancel performs no write, confirm waits for durable success, and failure keeps the confirmation open with an error.

## Error handling

Validation failures appear within the editor in understandable language. Busy/not-ready store states return explicit rejection results. Persistence failures keep the previous state and draft intact and expose retryable feedback. Home counts available exercises and identifies unavailable references rather than presenting a misleading raw count.

## Verification

Domain tests cover invariants, legacy/stale behavior, ordering, and built-in protection. Store tests cover durable CRUD, busy/failure results, reload, and snapshot independence. Component/integration tests cover Create/Edit/Save/Cancel, reorder/remove controls, confirmation, accessibility, long/many-exercise layouts, reload, and starting in saved order. Existing Workout Engine and Exercise Library tests remain green.
