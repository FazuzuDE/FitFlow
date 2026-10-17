# CRESUM male anatomy — editable mask draft v1

The user selected the grayscale anatomical character with a smooth central
pelvic modesty insert on 2026-10-17. This folder locks that appearance candidate
and adds **manual draft surface masks**, not approved anatomical segmentation.
It does not replace the production app's SVG renderer or exercise artwork.

The user subsequently deferred 3D availability and continued with 2D. Revision 2
refines chest, lats and quadriceps using anatomy descriptions and visible image
landmarks; see `REVIEW_2D.md` for scope and limitations. This pack remains an
unmerged draft checkpoint. Future 3D-source evaluation remains optional work;
current manually fitted masks are not anatomical ground truth.

## Files

- `source.png`: unchanged generated front/back reference, 1312 × 1199.
- `layers.json`: authoritative editable paths, taxonomy IDs, view crops, mirror
  axes, source hash and review status.
- `masks/<muscle-id>.svg`: one transparent mask for each of 17 existing groups.
- `parts/<muscle-id>.svg`: the original muscle texture clipped by its mask;
  preserve the relative reference to `../source.png` when using these files.
- `structures/<structure-id>.svg`: six visible anatomical component masks for
  the three refined groups, still drafts and sharing the original canvas.
- `atlas.svg`: all masks as independently named groups.
- `viewer.html`: local offline review tool; keep beside `source.png`.

Run `node scripts/build-muscle-mask-atlas.cjs` from the repository to reproduce
the SVGs/viewer. It validates taxonomy coverage and the unchanged source hash.
Paths can be edited directly or in a vector editor. Re-export after edits.
Generated outputs are deterministic. The source image is not regenerated.

## Alignment and integration

Every exported SVG retains `viewBox="0 0 1312 1199"`, including transparent empty
space. Render the base image and mask with the same aspect ratio, crop and
transform. Never auto-trim individual masks independently. `views` supplies
matching crops for the front and back. Exported path IDs preserve view and
anatomical left/right identity. Revision 2 uses explicit left/right paths for
the three refined groups; others retain mirrored bilateral starting paths.
The source is not perfectly symmetric, so both sides require boundary review.
Do not infer side-specific training data from this.

SVGs default to `currentColor`. In a browser, use inline SVG plus multiply
blending/opacity to retain the grayscale detail beneath the color. For native
integration, use an alpha mask and an appropriate compositing layer, or retain
luminance detail in a separately prepared shading layer. Do not assume browser
CSS blend modes work identically in React Native SVG. Opacity alone is a
fallback and reduces contrast. Review primary/secondary fills in the real app.

## Boundaries and acceptance

17 groups follow the existing catalog, not every individual human muscle or
muscle head. `upper-back`, `lats` and `traps` stay separate even where anatomical
structures overlap in depth. The `abs` layer includes oblique surface regions;
the calf group is posterior. Only visible superficial areas are traced; these
are conservative selection/highlight proposals, not a medical atlas. No
exercise mappings, set calculations or stimulus/recovery scores change.

Before production: inspect each group and both sides at original and phone
scale, correct contour spill/undercoverage and inter-group overlap, verify the
chosen superficial representation of deeper groups, verify that the modesty
insert stays neutral, and approve primary/secondary and selected states.
The generated character itself has not undergone anatomical expert validation.
`draft-boundary-review-required` must remain until that review is recorded.

## Provenance

Original appearance candidate: generated in this conversation, then edited to
add the neutral central insert, `exec-af61b9f3-d55b-4cad-802c-1b1e12532625.png`.
Source SHA-256 is recorded in `layers.json` and enforced by the exporter.
The selected reference is separate from the blue-shirt Exercise Male Master.
