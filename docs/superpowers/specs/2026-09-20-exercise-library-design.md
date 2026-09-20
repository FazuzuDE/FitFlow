# Exercise Library Core Design

## Objective

Create FitFlow's canonical, offline-first exercise metadata layer and a reusable
mobile Exercise Library experience. The feature must preserve the completed
Workout Engine, schema-v1 persistence, active-workout recovery, and historical
snapshot behavior.

This feature does not include Muscle Map scoring, training-load coefficients,
final artwork, cloud sync, AI, social features, nutrition, subscriptions, or a
Workout Templates redesign.

## Canonical domain model

`LibraryExercise` will contain only durable catalog metadata:

```ts
type LibraryExercise = {
  id: ExerciseId;
  name: string;
  primaryMuscles: MuscleId[];
  secondaryMuscles: MuscleId[];
  equipment: EquipmentId[];
  movementPattern: MovementPatternId;
  imageKey: string;
};
```

Exercise IDs are descriptive stable slugs such as `barbell-bench-press`. The
starter catalog will contain about 50 common commercial-gym exercises covering
the major muscle groups and common equipment. `imageKey` is an abstract stable
identifier, normally equal to the exercise ID; it never contains a file
extension, path, URL, or encoded image data.

## Taxonomies

One typed taxonomy module owns machine IDs and display labels.

Muscles:

- `chest`, `upper-back`, `lats`, `traps`
- `front-delts`, `side-delts`, `rear-delts`
- `biceps`, `triceps`, `forearms`
- `abs`, `lower-back`
- `glutes`, `quadriceps`, `hamstrings`, `calves`, `adductors`

Equipment is limited to values used by the catalog:

- `barbell`, `dumbbell`, `bench`, `cable`, `machine`
- `smith-machine`, `bodyweight`, `kettlebell`, `ez-bar`
- `resistance-band`, used by a curated band pull-apart entry

Movement patterns remain intentionally lightweight:

- `horizontal-push`, `vertical-push`
- `horizontal-pull`, `vertical-pull`
- `squat`, `hinge`, `lunge`
- `isolation`, `carry`, `core`

Every catalog record must reference only valid taxonomy IDs, contain at least
one primary muscle, contain no muscle in both primary and secondary arrays, and
use a valid movement pattern.

## Legacy compatibility

A centralized `legacyExerciseIds` map translates all twelve existing short IDs
to descriptive canonical IDs. A reusable resolver will:

1. return a canonical ID unchanged;
2. map a known legacy ID deterministically;
3. return `undefined` for an unknown ID.

Default templates will move to canonical IDs. Persisted templates are not
rewritten; template startup resolves canonical, legacy, and mixed ID lists at
runtime. Unknown IDs keep the existing behavior of being unavailable, while a
template with no resolvable exercises still fails explicitly.

Workout snapshots retain their stored `libraryId`, name, muscle label, sets,
weight, and reps. New snapshots use canonical IDs. Previous-performance matching
canonicalizes both IDs, allowing old history to match new catalog entries
without modifying saved history.

## Persistence boundary

The AsyncStorage document remains schema version 1. `WorkoutExercise` remains a
snapshot type and the repository validator is not weakened or expanded for
catalog metadata. Starting or appending an exercise copies the canonical ID,
current display name, and primary-muscle display label into the workout
snapshot. Later catalog changes therefore cannot alter historical display,
volume, or completed sets.

## Query behavior

A React-independent selector accepts a query, optional muscle, and optional
equipment value. Name search is trimmed and case-insensitive. Muscle matching
checks both primary and secondary muscles. Equipment checks the equipment list.
All active criteria combine with AND. Results preserve curated catalog order;
no fuzzy dependency or ranking layer is added.

## User interface

`ExerciseLibrary` is a reusable page-sheet component used by the active workout
picker and the existing template selector. It contains:

- a clear header and close action;
- an accessible search field;
- compact horizontally scrolling muscle and equipment filters, one active
  value per group plus `All`;
- a vertically scrolling result list;
- an intentional artwork placeholder boundary;
- exercise name, primary-muscle labels, and equipment labels;
- a 44-point-or-larger Add action in active-workout mode;
- a clear selected/check state in template-selection mode;
- a no-results state that preserves access to the filters.

The component uses only the existing theme tokens and shared controls. Filters
remain horizontal instead of wrapping dozens of chips. Search uses
`keyboardShouldPersistTaps="handled"`, long names can wrap, and the result list
remains usable at 320-point width.

`ExerciseArtwork` receives `imageKey` and renders the placeholder. Future local
artwork resolution will be implemented behind that component or an internal
asset map, without changing catalog records, query logic, or Workout Engine.

## Integration

The existing inline workout picker will be replaced by `ExerciseLibrary` while
retaining the same `appendExercise` update path. `WorkoutStore.start` and
`startWorkout` will resolve template IDs through the catalog resolver. No Finish,
rest timer, set logging, write ordering, or repository behavior changes.

The existing template editor continues storing exercise IDs. Its available
choices move from an exhaustive wrapping chip list to the same library sheet in
multi-select mode, preventing roughly 50 simultaneous chips on a phone. Newly
saved templates use canonical IDs; legacy saved templates remain supported by
runtime resolution. This is only the compatibility adaptation required by the
larger catalog, not a Workout Templates redesign.

## Testing

Tests will be written before each production behavior and will cover:

- unique exercise and taxonomy IDs;
- valid muscles, equipment, movement patterns, and image keys;
- no duplicate primary/secondary muscle assignment;
- reasonable starter-dataset size;
- deterministic legacy and canonical resolution, including unknown IDs;
- case-insensitive search and independent/combined filters;
- default, legacy, and mixed template resolution;
- appending a canonical exercise to a workout snapshot;
- snapshot independence from later catalog mutation;
- Exercise Library no-results and Add behavior;
- all existing Workout Engine, persistence, and screen tests.

Final validation includes `npm run check`, `npm run export:check`, a focused
320-point UI review, and an independent code review. Physical-device validation
will be reported separately if unavailable.

## Files and responsibilities

- `lib/exercise-taxonomy.ts`: typed muscle, equipment, and movement definitions.
- `lib/exercise-library.ts`: curated data, legacy resolver, and pure query logic.
- `lib/workout-model.ts`: canonical `LibraryExercise` type references.
- `lib/workout-catalog.ts`: default templates and compatibility re-exports.
- `lib/workout-engine.ts`: snapshot creation and template resolution boundary.
- `lib/workout-store.ts`: starts templates using the resolver-backed catalog.
- `components/ExerciseArtwork.tsx`: isolated placeholder/asset boundary.
- `components/ExerciseLibrary.tsx`: reusable search/filter/list UI.
- `components/Workout.tsx`: invokes the reusable library for Add Exercise.
- `app/index.tsx`: canonical catalog use in template creation.
- `lib/__tests__/exercise-library.test.ts`: domain and dataset invariants.
- existing engine/screen tests: focused integration regressions.
