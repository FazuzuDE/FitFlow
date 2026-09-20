# Exercise Library contracts

The Exercise Library is FitFlow Core's canonical, offline exercise metadata source. Its implementation lives in `lib/exercise-library.ts`; taxonomy IDs and display labels live in `lib/exercise-taxonomy.ts`.

## Canonical IDs

Catalog IDs are stable descriptive slugs. New templates store these IDs. The catalog owns the following compatibility aliases for existing templates and history:

| Legacy ID  | Canonical ID              |
| ---------- | ------------------------- |
| `bench`    | `barbell-bench-press`     |
| `incline`  | `incline-dumbbell-press`  |
| `row`      | `seated-cable-row`        |
| `pulldown` | `lat-pulldown`            |
| `press`    | `dumbbell-shoulder-press` |
| `lateral`  | `dumbbell-lateral-raise`  |
| `squat`    | `barbell-back-squat`      |
| `legpress` | `leg-press`               |
| `deadlift` | `barbell-deadlift`        |
| `curl`     | `dumbbell-biceps-curl`    |
| `triceps`  | `cable-triceps-pushdown`  |
| `calf`     | `standing-calf-raise`     |

The resolver accepts canonical and legacy IDs. Unknown IDs remain unavailable and are not silently converted to another exercise.

## Persistence and snapshots

Persistence remains schema version 1. Saved templates, active workouts, and history are not rewritten when the catalog loads. Template IDs are resolved only when a workout starts.

A workout exercise is a snapshot: starting or appending copies the canonical ID, current name, and primary-muscle display label into the existing workout shape. Later catalog or taxonomy edits cannot change saved workout names, completed sets, weight, repetitions, volume, or history.

Legacy and canonical `libraryId` values are normalized only for previous-performance matching. Historical records retain their original stored value.

## Taxonomies and filtering

Exercise records reference typed muscle, equipment, and movement-pattern IDs. Each record has at least one primary muscle, has no primary/secondary overlap, and uses only taxonomy values.

Filtering is pure and preserves curated catalog order. Search trims input and matches names case-insensitively. Muscle filters match primary or secondary muscles; equipment filters match the equipment list. Active search, muscle, and equipment criteria combine with AND.

## Artwork boundary

`imageKey` is a stable extensionless identifier, normally the exercise ID. It is not a path, URL, file name, or encoded asset. `components/ExerciseArtwork.tsx` owns the current placeholder and is the boundary for future local artwork resolution; catalog and Workout Engine contracts must not depend on image files.
