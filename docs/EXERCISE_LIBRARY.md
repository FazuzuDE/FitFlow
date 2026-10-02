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

## Approved family and variant direction

The current flat 58-record catalog remains the compatibility baseline. A future exercise family groups a shared movement identity; an exercise variant identifies one mechanically meaningful configuration within that family. The approved conceptual dimensions are:

`Exercise / Exercise Family → Exercise Variant → Equipment → Attachment → Grip → Phase → Sex/model presentation → Visual mode`

This is an architectural vocabulary, not an approved persistence schema, type definition, enum, or migration. Final storage shapes remain future implementation work.

A separate variant is justified when equipment or machine geometry, attachment, grip type or width, hand placement, support/body position, laterality, movement path, range of motion, setup/contact geometry, biomechanics, or Primary/Secondary muscle mapping materially changes. Small coaching cues that do not change the actual configuration remain technique metadata rather than new variants. Selectorized and plate-loaded machines, Smith machines, cable attachments, specialty bars, assisted bodyweight setups, benches/supports, and unilateral configurations must not be collapsed when the difference changes movement or asset meaning.

There is no generic visual definition of a lat pulldown grip: attachment, hand orientation, grip width, thumb/finger placement, wrist alignment, and machine geometry belong to the exact variant. The same exactness applies to other exercise families.

## Compatibility and historical truth

Existing IDs are not renamed, repurposed, or given a narrower meaning retroactively. A specific existing ID may later map to an exact variant without changing its stored identity. A generic ID such as `lat-pulldown` remains legacy/unspecified unless its historical contract already proves a specific configuration. New materially distinct variants receive new stable IDs.

Catalog evolution must not rewrite schema-v1 workout snapshots or the 12 legacy aliases. Progress must not silently merge mechanically different variants into one performance series. Display labels, family grouping, asset slugs, and current saved IDs may be connected by explicit future mappings without making any one of them substitute for another.

Canonical muscle identity, exact variant-level Primary/Secondary mapping, future load calculation, and visual rendering remain separate concerns. A muscle that is not primary for the exact variant must not be promoted merely because it is primary for a related family member. Male and Female presentations share the same exercise, variant, muscle IDs, and calculation semantics.

## Exercise asset pipeline foundation

Future production should preserve this responsibility chain:

`Exercise Library → Exercise Variant → Biomechanics Specification → Visual Specification → Prompt Builder → Image Generation → Biomechanics/Visual QA → Asset Tracker → Approved Production Asset`

The Exercise Library establishes stable identity; the exact variant removes mechanical ambiguity; a reviewed biomechanics specification establishes movement truth; a visual specification translates that truth into an approved presentation; a Prompt Builder may later consume those approved inputs; generation produces drafts only; QA gates technical and visual correctness; the tracker records lifecycle; only a passing result becomes an approved production asset.

This documentation does not define the Visual Specification, Prompt Builder, generator, tracker data model, providers, automation, or integration. Those belong to a separate approved design and implementation stage. The boundary exists now so later automation consumes explicit variant and biomechanics decisions instead of inventing them inside a prompt.

## Asset identity and phase direction

One production image represents one exact variant, one phase, one model presentation, and one visual mode. START and FINISH are separate files, not a split-panel composition. A likely semantic naming direction is:

- `lat_pulldown__close_neutral_v_handle__start__male.png`
- `lat_pulldown__close_neutral_v_handle__finish__male.png`

Do not encode a muscle group in the filename: one variant can involve several muscles and the mapping can evolve independently. The example establishes readable identity and ordering only. Final path layout, format, canvas/export specification, slug contract, and manifest are not approved here.

For one variant pair, START and FINISH keep the same character identity, body proportions, clothing, equipment, attachment, grip, camera/view, framing, and rendering language; only the movement phase materially changes. The second phase should be created and reviewed against the approved first phase, then the pair should be reviewed together.

## Exercise and Anatomy visual modes

Exercise/Technique View and Anatomy/Muscle View are separate visual modes for the same exact variant. Exercise/Technique View communicates setup and movement. Anatomy/Muscle View communicates the approved muscle mapping using a grayscale body, red only for highlighted muscles, stronger red for Primary, and a lower intensity of the same red family for Secondary. Primary/Secondary meaning remains consistent between START and FINISH; pose or framing must not imply that a mapped muscle exists or contributes only in one phase. The mode adds no redundant in-image labels when the app supplies context.

The approved male presentation follows one Male Master identity: consistent face, hair, age, athletic build, proportions, fitted black T-shirt, black shorts, black shoes, camera language, and premium semi-realistic 3D rendering on a clean white background with soft contact shadows. Avoid heavy cinematic lighting, dirty textures, and visual noise. Female assets follow the same consistency architecture and semantic rules, but the specific Female Master appearance is not approved by this document.

## Mandatory biomechanics and visual QA

Biomechanical correctness outranks visual beauty. Generation produces a draft, never an approval. Review every applicable point for the exact variant:

1. Correct exercise family and exact variant.
2. Correct equipment, machine archetype and geometry, attachment, attachment point, and line of resistance.
3. Correct grip type and width, hand placement, finger/thumb position, wrist alignment, and left/right symmetry where expected.
4. Correct elbow path, shoulder position, scapular mechanics, torso angle, pelvis, support/body contact, lower-body position, and feet.
5. Correct cable, bar, or load path and plausible machine mechanics.
6. Correct START and FINISH positions, safe and realistic range of motion, and pair continuity.
7. Correct exact-variant Primary and Secondary muscles, with no unrelated or overpainted red regions and no primary/secondary inversion.
8. Consistent approved model identity, equipment, camera, framing, clothing, lighting, background, and visual mode across the pair and library.

Reject an asset when hands do not actually grip the implement, fingers/thumb are impossible, grip orientation or width is wrong, wrists are implausible, expected symmetry breaks, elbows/scapula are incorrect, attachment/cable path is wrong, machine geometry cannot perform the movement, START/FINISH do not form the intended range, or muscle highlighting contradicts the exact variant. Any materially relevant failure returns the asset for revision and full re-review before it can become an Approved Production Asset.
