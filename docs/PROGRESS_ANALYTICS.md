# Progress Analytics Foundation

Progress analytics are derived from completed `WorkoutSession` snapshots stored in the existing schema-v1 workout state. The projection is read-only: it does not rewrite History, migrate persistence, or reconstruct saved workouts from current templates or Exercise Library display metadata.

## Exercise identity and labels

Known canonical and legacy `libraryId` values resolve to the same canonical exercise identity. Unknown non-empty IDs retain their saved value, while unusable empty IDs are isolated to their saved workout/exercise snapshot instead of being merged by display name. Internal identity keys use distinct canonical, unknown, and snapshot namespaces with encoded snapshot tuples, so unusual saved IDs cannot collide with fallback identities or object properties.

Saved exercise names are labels, not identity. An aggregated record uses the newest relevant saved snapshot label; later catalog renames do not replace historical labels or split records for the same stable exercise.

## Safe completed-set samples

Only completed sets contribute to analytics. Weight uses the Workout Engine's decimal syntax, must be finite, and may be zero. Repetitions must be a finite positive integer. Negative, malformed, scientific, hexadecimal, infinite, and non-finite derived values are excluded from analytics without changing or deleting the saved workout.

Training volume remains the sum of valid completed `weight × repetitions` samples. Totals remain finite. Estimated 1RM retains the existing Epley formula and is always presented as an estimate; best records retain their saved set timestamp and use deterministic timestamp-based ordering.

Periods, date buckets, training frequency, exercise-specific progression charts, Muscle Load, Muscle Map, recommendations, and cloud analytics are outside this foundation.
