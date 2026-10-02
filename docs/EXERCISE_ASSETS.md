# CRESUM Exercise Assets — approved production rules

This document owns future exercise-asset production and acceptance rules. The current app uses an artwork placeholder; no production exercise-image manifest, renderer, automated biomechanics QA, or asset-tracker integration is implemented. Canonical exercise identity and variant boundaries belong to `EXERCISE_LIBRARY.md`; visual language belongs to `DESIGN_SYSTEM.md`. Asset production status is not Exercise Library metadata.

## Identity and file naming

Production files use `{exercise_id}__{variant_id}__{phase}__{model}.png/webp`, for example:

- `lat_pulldown__close_neutral_v_handle__start__male.png`
- `lat_pulldown__close_neutral_v_handle__finish__male.png`

The phase is `start` or `finish`; male and female are separate visual assets for the same family/variant semantics. One file depicts one movement phase only: no split-screen or combined START/FINISH production image. Do not put a muscle group in the filename; one variant may engage several muscles. Asset slugs and paths are independent of display labels and may be mapped from existing saved IDs without renaming those IDs. Adding variants must not require renaming unrelated assets.

## START / FINISH and model consistency

For one exact variant, START and FINISH retain the same character identity, body proportions, machine/equipment, attachment, grip, attachment point, camera/view, and visual style. Only movement phase materially changes. Male and Female use the same family, variant, muscle IDs, and movement semantics; presentation does not create a separate exercise definition.

The approved male production identity is **CRESUM Male Master Reference**. Future reference-based male generation or editing must preserve that identity and body proportions. No binary master-reference file is added by this documentation sync.

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

If any materially relevant point is wrong, do not mark the asset approved. This is a human production QA gate, not a claim of automated biomechanical validation.

## Separate asset tracker

Track each planned family/variant/model and its START/FINISH pair separately from canonical Exercise Library records. The lifecycle is `planned → generated draft → approved → needs revision`; after correction, a revised draft must pass QA again before approval. Generation alone is never approval. Record the identity, model, phase-file references, status, and QA/revision notes when asset production starts. No production entries or integration are created in this documentation PR.
