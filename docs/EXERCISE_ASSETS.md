# CRESUM Exercise Assets — approved production rules

This document owns future exercise-asset production and acceptance rules. The current app uses an artwork placeholder; no production exercise-image manifest, renderer, automated biomechanics QA, or asset-tracker integration is implemented. Canonical exercise identity and variant boundaries belong to `EXERCISE_LIBRARY.md`; visual language belongs to `DESIGN_SYSTEM.md`. Asset production status is not Exercise Library metadata.

## Pipeline boundary

Future production preserves this responsibility chain:

`Exercise Library → Exercise Variant → Biomechanics Specification → Visual Specification → Prompt Builder → Image Generation → Biomechanics/Visual QA → Asset Tracker → Approved Production Asset`

The exact variant and reviewed biomechanics establish movement truth before visual or prompt work begins. Generation produces drafts only; QA gates technical and visual correctness; the tracker remains separate from canonical exercise metadata. This document does not define the Visual Specification, Prompt Builder, generator, tracker data model, providers, automation, or integration. Those require a separate approved design and implementation stage.

## Identity and file naming

The approved naming direction identifies family/exercise, exact variant, phase, and model, for example:

- `lat_pulldown__close_neutral_v_handle__start__male.png`
- `lat_pulldown__close_neutral_v_handle__finish__male.png`

The phase is START or FINISH; Male and Female are separate visual assets for the same family/variant semantics. One file depicts one movement phase only: no split-screen or combined START/FINISH production image. Do not put a muscle group in the filename; one variant may engage several muscles. Asset slugs and paths are independent of display labels and may be mapped from existing saved IDs without renaming those IDs. Adding variants must not require renaming unrelated assets. The examples do not approve the final filename schema, file format, path layout, canvas/export specification, slug contract, or manifest.

## START / FINISH and model consistency

For one exact variant, START and FINISH retain the same character identity, body proportions, clothing, machine/equipment, attachment, grip, attachment point, camera/view, framing, background, and visual style. Only movement phase materially changes. Create and review the second phase against the approved first phase, then inspect the pair together. Male and Female use the same family, variant, muscle IDs, and movement semantics; presentation does not create a separate exercise definition.

The approved male production identity is **CRESUM Male Master Reference**. Future reference-based male generation or editing preserves the same face, hair, age type, athletic build, proportions, fitted black T-shirt, black shorts, black athletic shoes, camera language, and premium semi-realistic 3D rendering. Use a clean white background with soft natural contact shadows. Avoid heavy cinematic lighting, dirty shadows or textures, and visual noise that obscures mechanics. No binary master-reference file is added by this documentation sync.

Female production follows the same consistency architecture and movement/muscle semantics. This document does not invent an unapproved Female Master appearance.

## Exercise and Anatomy visual modes

Exercise/Technique View and Anatomy/Muscle View are separate production modes for the same exact variant. Exercise/Technique View communicates setup and movement. Anatomy/Muscle View uses a grayscale body and non-engaged anatomy, red only for highlighted muscles, stronger red for Primary, and a lower intensity of the same red family for Secondary.

Primary/Secondary meaning remains consistent between START and FINISH; pose or framing must not imply that a mapped muscle exists or contributes only in one phase. Do not add redundant in-image labels when the app supplies context, overpaint red regions for aesthetics, or highlight muscles from a related generic exercise instead of the exact variant.

## Biomechanics acceptance gate

Biomechanical and technical correctness takes priority over visual beauty. An attractive but mechanically incorrect image is not production-ready. Before approval, review every relevant point for the exact variant:

1. Correct exercise family and exact variant.
2. Correct equipment, machine archetype, attachment, grip, and grip width.
3. Hand and (where visible/relevant) thumb placement; wrist alignment.
4. Elbow position/path, shoulder position, and relevant scapular mechanics.
5. Torso posture/angle, pelvis, support, and body contact.
6. Relevant leg, foot, and knee placement.
7. Cable/bar/load path, line of resistance, pulley/attachment-point geometry, and machine geometry.
8. Correct START and FINISH positions, realistic and safe range of motion, and pair consistency.
9. Primary/Secondary muscle highlighting matches the exact variant.

Reject an asset when hands do not actually grip the implement, fingers/thumb are impossible, grip orientation or width is wrong, wrists are implausible, expected symmetry breaks, elbows/scapula are incorrect, attachment/cable path is wrong, machine geometry cannot perform the movement, START/FINISH do not form the intended range, or muscle highlighting contradicts the exact variant. Do not promote a muscle to Primary merely because it is primary for a related family member.

If any materially relevant point is wrong, return the asset for revision and full re-review; do not mark it approved. This is a human production QA gate, not a claim of automated biomechanical validation.

## Separate asset tracker

Track each planned family/variant/model and its START/FINISH pair separately from canonical Exercise Library records. The lifecycle is `planned → generated draft → approved → needs revision`; after correction, a revised draft must pass QA again before approval. Generation alone is never approval. Record the identity, model, phase-file references, status, and QA/revision notes when asset production starts. No production entries or integration are created in this documentation PR.
