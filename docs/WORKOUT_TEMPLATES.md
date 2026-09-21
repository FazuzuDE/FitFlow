# Workout Templates contracts

Workout Templates are reusable ordered workout plans stored inside the existing Workout State schema version 1. The persisted shape remains `{ id, name, exerciseIds }`; this feature adds no fields and performs no schema migration.

## Built-in and custom templates

Built-in template identity is owned centrally by `lib/workout-templates.ts`. Built-ins remain visible and startable but cannot be edited or deleted. Custom templates can be created, edited, reordered, and deleted after explicit confirmation. Duplicate template names are allowed because identity is the template ID.

New custom IDs are generated with collision checks against every persisted template ID. New and edited templates require a trimmed non-empty name, at least one available exercise, no duplicate exercise IDs, and no unresolved stale references.

## Draft and Save behavior

Create and Edit use a local draft. Exercise Library selection, name changes, removal, and Move up/Move down ordering affect only that draft. Cancel discards it without writing. Save publishes the template state only after the schema-v1 document is written successfully; a busy or failed write keeps the editor and draft open and does not emit success feedback.

Exercise order is the `exerciseIds` array order. The editor uses explicit accessible Move up and Move down controls rather than drag and drop.

## Legacy and stale exercise references

Opening an editable template converts known legacy exercise aliases to canonical catalog IDs while preserving their order. This conversion remains local until Save; opening and cancelling does not rewrite persistence.

Unknown IDs remain visible as unavailable entries. They are never silently removed and block Save until the user explicitly removes or replaces them. Existing questionable persisted duplicates are not silently deduplicated; new and edited templates cannot be saved with duplicate canonical exercise IDs.

## Snapshot independence

Starting a workout resolves the template's exercise IDs and creates the existing workout snapshot. Later template edits or deletion do not change the active workout or any historical workout. A historical `templateId` may continue to identify a template that has since been deleted; Workout Engine does not dereference it to reconstruct saved sessions.
