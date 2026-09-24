# CRESUM Progress Analytics

Progress analytics are derived from completed `WorkoutSession` snapshots stored in the existing schema-v1 workout state. The projection is read-only: it does not rewrite History, migrate persistence, or reconstruct saved workouts from current templates or Exercise Library display metadata.

## Exercise identity and labels

Known canonical and legacy `libraryId` values resolve to the same canonical exercise identity. Unknown non-empty IDs retain their saved value, while unusable empty IDs are isolated to their saved workout/exercise snapshot instead of being merged by display name. Internal identity keys use distinct canonical, unknown, and snapshot namespaces with encoded snapshot tuples, so unusual saved IDs cannot collide with fallback identities or object properties.

Saved exercise names are labels, not identity. An aggregated record uses the newest relevant saved snapshot label; later catalog renames do not replace historical labels or split records for the same stable exercise.

## Safe completed-set samples

Only completed sets contribute to analytics. Weight uses the Workout Engine's decimal syntax, must be finite, and may be zero. Repetitions must be a finite positive integer. Negative, malformed, scientific, hexadecimal, infinite, and non-finite derived values are excluded from analytics without changing or deleting the saved workout.

Training volume remains the sum of valid completed `weight × repetitions` samples. Totals remain finite. Estimated 1RM retains the existing Epley formula and is always presented as an estimate; best records retain their saved set timestamp and use deterministic timestamp-based ordering.

## Progress periods

The period choices are `1W`, `1M`, `3M`, `6M`, `1Y`, and `ALL`; the default is `1M`. Finite periods roll back from an explicit `now` by one local-calendar week, one/three/six local-calendar months, or one local-calendar year. Local wall-clock time is preserved where it exists; month-end and leap-day subtraction clamp to the final day of the target month. Tests supply `now` directly; the Progress screen refreshes it while open and when the app becomes active.

A completed workout belongs to a finite period when its saved `finishedAt` is in `[start, now]`, including both boundaries. `ALL` includes all valid completed workouts with `finishedAt <= now`. Future-dated sessions do not contribute to any Progress period. The selection scopes workout count, safe volume, Estimated 1RM records, and the existing recent-workout volume bars. Empty periods show zero workouts and volume, no estimated record, and no fabricated workout bar.

The selected period is presentation state, not a schema-v1 field. History remains the complete saved archive, including workouts outside the selected period; neither History nor its timestamps are rewritten.

## Training volume visualization

The Progress volume card shows at most seven recent completed workouts from the selected period as separate bars with short saved completion-date labels. It identifies this as a recent overview rather than the entire period. An accompanying full-period view exposes every qualifying workout separately with its saved completion date/time, workout name, and volume in kilograms. Same-day workouts are not combined. Zero-volume workouts remain visible as entries but have no positive bar height. The selected period and History contracts above are unchanged.

## Exercise-specific logged performance

The first exercise-specific view presents factual saved workout dates and valid completed-set weight and repetitions for one selected stable exercise identity. Its selectable exercises come from completed saved history, not the full current catalog. It uses the existing Progress period and safe sample rules; a selection trained only outside that period has an empty period view. Saved set order is retained within each workout, and History remains unchanged.

This view does not define a Strength Score, percentage improvement, "best set", or strength-growth claim. Estimated 1RM remains an explicitly estimated existing metric, not a new trend in this view.

## Exercise-specific Estimated 1RM series

For the selected stable exercise identity, the series derives one point per qualifying completed workout from the highest valid completed-set Epley estimate across matching exercise snapshots. It retains the source weight, repetitions, set identity and saved order. Equal estimates prefer later `completedAt`, then lexicographically smaller exercise/set IDs and earlier saved indices. Legacy done-only sets use the workout completion time as the persistence loader does. Points are ordered by workout `finishedAt` and stable workout ID, use the selected Progress period, and do not rewrite saved data.

Each point is explicitly labeled Estimated 1RM and dated by the workout finish time. Zero remains zero. A single point is one estimate, not a trend; no measured-strength, percentage-change, Strength Score, or new PR claim is made.

Date buckets, a training-frequency formula, Muscle Load, Muscle Map, recommendations, and cloud analytics remain outside this foundation.
