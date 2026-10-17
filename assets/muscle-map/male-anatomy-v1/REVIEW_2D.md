# 2D refinement pass 2 — 2026-10-17

Status: draft, visual/source-landmark review only. No expert anatomical approval.
The user deferred 3D availability and requested continuing with 2D. Work stays
on the unchanged selected image; no 3D dataset has been imported or registered.

## Scope

- Chest: independently drawn left/right clavicular and sternocostal surface
  regions. These are parts of pectoralis major, not two new exercise groups.
  The visible fiber change guides the proposed separator; it is not proof of
  a measured boundary. The deeper pectoralis minor is not painted on the surface.
- Lats: expand the former small triangular approximation to follow the visible
  fan-shaped lower posterior thoracic surface. Keep lumbar/aponeurotic areas
  neutral where they cannot confidently be assigned from this illustration.
  Tendon/insertion hidden toward the humerus is not invented on the back image.
- Quadriceps: separate visible rectus femoris, vastus lateralis and vastus
  medialis. Avoid the diagonal sartorius band, pelvis insert and patella.
  Vastus intermedius lies deep to rectus femoris and has no fabricated surface
  region. The catalog's quadriceps group still aggregates the visible parts.

These three groups now use explicit anatomical-side paths. Other groups retain
their first-pass mirrored proposals and require their own refinement. Adjoining
groups, edge gaps, overlaps and generated anatomy inconsistencies still need
review before the complete atlas can become a production highlight source.

## Reference basis

The following anatomy descriptions informed structure/visibility decisions.
Pixel contours were manually fitted to the selected illustration; no source
figures, atlas meshes or third-party mask geometry were copied.

- [StatPearls: Pectoralis Major](https://www.ncbi.nlm.nih.gov/books/NBK525991/):
  fan-shaped anterior muscle and clavicular/sternocostal heads.
- [StatPearls: Latissimus Dorsi](https://www.ncbi.nlm.nih.gov/books/NBK448120/):
  broad lower posterior thorax surface and convergence toward the axilla.
- [StatPearls: Femoral Muscles](https://www.ncbi.nlm.nih.gov/books/NBK500008/):
  quadriceps components and deep position of vastus intermedius.

Z-Anatomy remains a possible future reference/source evaluation. The current
pass does not claim Z-Anatomy-derived precision, registered 3D geometry or
clinically exact segmentation. The source's appearance approval is retained.

## Export and review

`structures/` supplies six separately editable component masks in addition to
the 17 group masks. All use the shared 1312 × 1199 canvas. `data-structure`,
`data-view` and anatomical `data-side` identify parts without changing catalog
IDs or training calculations. The viewer's part selector isolates structures
for the selected group; All layers shows complete group masks.
