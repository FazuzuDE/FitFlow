# History Core contracts

History is a read-only view of completed `WorkoutSession` snapshots stored in the existing schema-v1 workout state. This feature adds no persistence fields and performs no migration.

## Summary and detail

The initial History view shows compact workout summaries in newest-first completion order. A summary identifies the saved workout by name and includes its completion date and time, duration, completed-set count, and volume without eagerly rendering every exercise and set in the archive.

Opening a summary displays one completed snapshot. Detail shows the saved workout name, timing and totals, followed by saved exercise names and completed weight/repetition values. Exercises with no completed sets remain visible with an explicit empty message; History never invents set results.

## Snapshot independence

History renders the fields saved in each completed session. It does not reconstruct a session from the current template, Exercise Library, or muscle taxonomy. Later template deletion, template editing, catalog renaming, and metadata changes therefore cannot rewrite the displayed historical workout.

History remains read-only in FitFlow Core. Editing, deletion, duplication, repeat-workout behavior, search, filtering, cloud synchronization, and analytics expansion are outside this contract.
