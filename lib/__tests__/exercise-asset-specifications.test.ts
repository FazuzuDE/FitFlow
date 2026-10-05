import { approvedExerciseAssetSpecifications } from '../exercise-assets/specifications';
import type { ExerciseAssetSpecificationBundle } from '../exercise-assets/types';
import { validateExerciseAssetSpecificationBundle } from '../exercise-assets/validation';
import { exerciseLibrary, findExercise } from '../exercise-library';
import { getCatalogVariant } from '../exercise-catalog-adapter';

const cloneSpecifications = (): ExerciseAssetSpecificationBundle =>
  structuredClone(
    approvedExerciseAssetSpecifications,
  ) as ExerciseAssetSpecificationBundle;

describe('exercise asset specifications', () => {
  it('accepts the approved close neutral V-handle vertical slice', () => {
    expect(
      validateExerciseAssetSpecificationBundle(
        approvedExerciseAssetSpecifications,
      ),
    ).toEqual({ ok: true });
    expect(approvedExerciseAssetSpecifications.variant).toMatchObject({
      id: 'lat-pulldown-close-neutral-v-handle',
      familyId: 'lat-pulldown',
      configuration: 'specific',
      attachmentType: {
        kind: 'attachment',
        id: 'v-handle',
      },
      grip: { kind: 'grip', id: 'neutral' },
      gripWidth: 'close',
    });
  });

  it('keeps the approved Technique View muscle mapping in the existing taxonomy', () => {
    expect(approvedExerciseAssetSpecifications.biomechanics.muscles).toEqual({
      primary: ['lats'],
      secondary: ['biceps', 'upper-back'],
    });
  });

  it('rejects missing attachment, grip, or phase biomechanics', () => {
    const missingAttachment = cloneSpecifications();
    delete (missingAttachment as { attachment?: unknown }).attachment;
    const missingGrip = cloneSpecifications();
    delete (missingGrip.biomechanics as { grip?: unknown }).grip;
    const missingStart = cloneSpecifications();
    delete (missingStart.biomechanics.movement as { start?: unknown }).start;

    expect(validateExerciseAssetSpecificationBundle(missingAttachment)).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'missing-attachment' }),
        ]),
      }),
    );
    expect(validateExerciseAssetSpecificationBundle(missingGrip)).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'missing-grip' }),
        ]),
      }),
    );
    expect(validateExerciseAssetSpecificationBundle(missingStart)).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'missing-phase' }),
        ]),
      }),
    );
  });

  it('rejects unknown, duplicate, and overlapping muscle mappings', () => {
    const unknown = cloneSpecifications();
    unknown.biomechanics.muscles.primary = ['invented-muscle' as 'lats'];
    const duplicate = cloneSpecifications();
    duplicate.biomechanics.muscles.secondary = ['biceps', 'biceps'];
    const overlap = cloneSpecifications();
    overlap.biomechanics.muscles.secondary = ['biceps', 'lats'];
    const techniqueViewOverlap = cloneSpecifications();
    techniqueViewOverlap.muscleMapping.secondary = ['biceps', 'lats'];
    const inconsistent = cloneSpecifications();
    inconsistent.muscleMapping.secondary = ['biceps'];

    for (const candidate of [
      unknown,
      duplicate,
      overlap,
      techniqueViewOverlap,
      inconsistent,
    ]) {
      expect(validateExerciseAssetSpecificationBundle(candidate)).toEqual(
        expect.objectContaining({
          ok: false,
          issues: expect.arrayContaining([
            expect.objectContaining({ code: 'invalid-muscle-mapping' }),
          ]),
        }),
      );
    }
  });

  it('rejects cross-specification drift from the exact approved variant', () => {
    const wrongAttachment = cloneSpecifications();
    wrongAttachment.variant.attachmentType = {
      kind: 'attachment',
      id: 'another-handle',
    };
    const wrongMachine = cloneSpecifications();
    wrongMachine.machine.id = 'another-machine';
    wrongMachine.biomechanics.machineRef.id = 'another-machine';
    const wrongVisualVariant = cloneSpecifications();
    wrongVisualVariant.visual.variantId = 'another-variant';

    for (const candidate of [
      wrongAttachment,
      wrongMachine,
      wrongVisualVariant,
    ]) {
      expect(validateExerciseAssetSpecificationBundle(candidate)).toEqual(
        expect.objectContaining({
          ok: false,
          issues: expect.arrayContaining([
            expect.objectContaining({
              code: 'exact-variant-specification-mismatch',
            }),
          ]),
        }),
      );
    }
  });

  it('keeps approved outfits separate from the CRESUM Male Master identity', () => {
    expect(approvedExerciseAssetSpecifications.modelProfiles).toEqual([
      expect.objectContaining({
        id: 'cresum-male-master',
        model: 'male',
        identitySource: 'external-master-reference',
      }),
    ]);
    expect(
      approvedExerciseAssetSpecifications.modelProfiles[0],
    ).not.toHaveProperty('clothing');
    expect(approvedExerciseAssetSpecifications.outfitProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'cresum-male-outfit-black-v1',
          approvalStatus: 'approved',
          socks: null,
        }),
        expect.objectContaining({
          id: 'cresum-male-outfit-blue-gray-v1',
          approvalStatus: 'approved',
        }),
      ]),
    );
  });

  it('rejects an unapproved model profile', () => {
    const candidate = cloneSpecifications();
    (candidate.modelProfiles[0] as { approvalStatus: string }).approvalStatus =
      'draft';

    expect(validateExerciseAssetSpecificationBundle(candidate)).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'unapproved-specification' }),
        ]),
      }),
    );
  });

  it('records unresolved production constraints without fabricating assets or dimensions', () => {
    expect(
      approvedExerciseAssetSpecifications.modelProfiles[0].externalReference,
    ).toEqual({
      logicalId: 'cresum-male-master-reference',
      requiredForGeneration: true,
      asset: null,
    });
    expect(
      approvedExerciseAssetSpecifications.machine.canonicalVisualReference,
    ).toBeNull();
    expect(
      approvedExerciseAssetSpecifications.machine.visualReferenceStatus,
    ).toBe('requires-equipment-geometry-qa');
    expect(approvedExerciseAssetSpecifications.attachment.dimensions).toBe(
      'qualitative-realistic-proportions',
    );
    expect(approvedExerciseAssetSpecifications.visual.canvasContract).toBe(
      'unresolved',
    );
  });

  it('leaves the existing generic Exercise Library contract unchanged', () => {
    expect(exerciseLibrary).toHaveLength(61);
    expect(findExercise('lat-pulldown')).toEqual({
      id: 'lat-pulldown',
      name: 'Lat Pulldown',
      primaryMuscles: ['lats'],
      secondaryMuscles: ['biceps', 'upper-back'],
      equipment: ['cable'],
      movementPattern: 'vertical-pull',
      imageKey: 'lat-pulldown',
    });
    const exactIds = [
      'lat-pulldown-wide-pronated-bar',
      'lat-pulldown-close-neutral-v-handle',
      'lat-pulldown-reverse-grip',
    ];
    for (const id of exactIds) expect(findExercise(id)?.id).toBe(id);
    expect(
      exerciseLibrary.filter(({ id }) => !exactIds.includes(id)),
    ).toHaveLength(58);
    expect(getCatalogVariant('lat-pulldown')).toMatchObject({
      configuration: 'unspecified',
    });
    expect(getCatalogVariant('lat-pulldown')?.grip).toBeUndefined();
    expect(getCatalogVariant('lat-pulldown')?.attachmentType).toBeUndefined();
    expect(approvedExerciseAssetSpecifications.variant).toEqual(
      getCatalogVariant('lat-pulldown-close-neutral-v-handle'),
    );
    expect(new Set(exerciseLibrary.map(({ id }) => id)).size).toBe(61);
  });
});
