# Workout Templates contracts

Workout Templates are reusable ordered workout plans stored inside the existing Workout State schema version 1 under `fitflow_state_v1`. The original persisted shape `{ id, name, exerciseIds }` remains valid. Custom workouts may additionally store `plannedExercises?: { exerciseId, sets, weight? }[]`; no migration or schema-version change is needed.

## Built-in and custom templates

Built-in template identity is owned centrally by `lib/workout-templates.ts`. Built-ins remain visible and startable but cannot be edited or deleted. Custom templates can be created, edited, reordered, and deleted after explicit confirmation. Duplicate template names are allowed because identity is the template ID.

New custom IDs are generated with collision checks against every persisted template ID. New and edited templates require a trimmed non-empty name, at least one available exercise, no duplicate exercise IDs, and no unresolved stale references.

## Draft and Save behavior

Create and Edit use a local draft. Creating a workout follows Workout Name → Exercise Library single selection → planned configuration → ordered composition → Save Workout. A valid name opens the Library directly. From composition, users may add, edit, remove, reorder, or return to the name. Back keeps the draft in memory; switching app tabs also retains it until Save or explicit Cancel. Cancel confirms if meaningful unsaved changes would be lost. No partial step writes. Save publishes the template state only after the schema-v1 document is written successfully; a busy or failed write keeps the editor and draft open and does not emit success feedback.

Exercise order is the `exerciseIds` array order. The editor uses explicit accessible Move up and Move down controls rather than drag and drop.

`plannedExercises` is optional and keyed by stable exercise ID. Configured sets must be a whole number from 1 through 20. Optional starting weight must be a finite, non-negative decimal value entered manually; comma input is normalized to a decimal point. Empty weight is unset, never guessed. Planned IDs must belong to `exerciseIds`, and duplicate planned IDs are invalid. Legacy exercises without configuration start with three rows of unset weight as before. At workout start, configured rows and weights are copied into a new active snapshot without `completedAt`; users may change actual values. Only completed actual sets contribute to History and Progress. Later template edits never alter an active or completed snapshot.

## Legacy and stale exercise references

Opening an editable template converts known legacy exercise aliases to canonical catalog IDs while preserving their order. This conversion remains local until Save; opening and cancelling does not rewrite persistence.

Unknown IDs remain visible as unavailable entries. They are never silently removed and block Save until the user explicitly removes or replaces them. Existing questionable persisted duplicates are not silently deduplicated; new and edited templates cannot be saved with duplicate canonical exercise IDs.

## Snapshot independence

Starting a workout resolves the template's exercise IDs and creates the existing workout snapshot. Later template edits or deletion do not change the active workout or any historical workout. A historical `templateId` may continue to identify a template that has since been deleted; Workout Engine does not dereference it to reconstruct saved sessions.
