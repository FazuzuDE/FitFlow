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

## Approved family and variant direction (not implemented)

The current flat catalog of 58 exercise records remains the compatibility baseline. A future exercise family groups a stable shared movement identity; an exercise variant identifies one exact mechanically meaningful configuration within that family. The approved conceptual dimensions are:

`Exercise / Exercise Family → Exercise Variant → Equipment → Attachment → Grip → Phase → Sex/model presentation → Visual mode`

This is architectural vocabulary, not an approved persistence shape, type definition, enum, or migration.

A distinct variant and corresponding asset are justified when machine/equipment geometry, attachment, grip or grip width, body position/support, laterality, movement path, range of motion, setup/contact geometry, or biomechanics materially change. Minor coaching cues that leave the actual configuration unchanged belong in technique metadata, not new variants. A family can gain variants without restructuring existing identities.

Equipment dimensions must not collapse mechanically different selectorized and plate-loaded machines, Smith machines, cable attachments or handles, assisted bodyweight, specialty bars, benches/support, or unilateral configurations into one ambiguous value where that distinction affects movement, assets, or training semantics. Barbell, dumbbell, cable, bodyweight, and other existing categories remain valid starting points. This direction does not prescribe a large final enum; model only distinctions with material meaning.

There is no generic visual definition of a lat pulldown or cable-row grip. Attachment, hand orientation, grip width, thumb/finger placement, wrist alignment, and machine geometry belong to the exact variant.

Existing specific IDs may later be linked to families as variants without changing their stored identity. Generic IDs such as `lat-pulldown` must not silently acquire one exact grip, attachment, machine, or position; they may remain legacy/unspecified variants. New exact configurations require new stable IDs. Do not rewrite historical snapshots or repurpose the 12 legacy aliases. Progress must not silently merge materially different variants into one strength or performance series. Asset filename slugs may differ from the existing hyphenated saved IDs; an explicit mapping can connect them without renaming IDs.

Canonical muscle IDs, exact variant-level Primary/Secondary mapping, future load calculation, and visual rendering are separate concerns. Grip, attachment, position, support, or laterality can change the mapping. Male and Female presentations share the same variant and muscle semantics. The future Anatomy/Muscle View visual treatment is specified in `DESIGN_SYSTEM.md`; production files and acceptance rules are specified in `EXERCISE_ASSETS.md`.

## Exercise asset pipeline boundary

Future production preserves this responsibility chain:

`Exercise Library → Exercise Variant → Biomechanics Specification → Visual Specification → Prompt Builder → Image Generation → Biomechanics/Visual QA → Asset Tracker → Approved Production Asset`

The library establishes stable identity; the exact variant removes mechanical ambiguity; reviewed biomechanics establishes movement truth; later visual and prompt stages consume those approved inputs rather than inventing them; generation creates drafts; QA gates approval; and tracking remains separate from catalog identity.

This documentation does not define the Visual Specification, Prompt Builder, generator, tracker data model, providers, automation, or integration. Those require a separate approved stage. Detailed production, naming, visual-mode, and QA rules live in `EXERCISE_ASSETS.md` and `DESIGN_SYSTEM.md`.
