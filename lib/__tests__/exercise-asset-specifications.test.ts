import { approvedExerciseAssetSpecifications } from '../exercise-assets/specifications';
import type { ExerciseAssetSpecificationBundle } from '../exercise-assets/types';
import { validateExerciseAssetSpecificationBundle } from '../exercise-assets/validation';
import { exerciseLibrary, findExercise } from '../exercise-library';

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
        id: 'cresum-close-neutral-v-handle',
      },
      grip: { kind: 'grip', id: 'neutral' },
      laterality: 'bilateral',
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

  it('uses the approved black CRESUM Male Master clothing contract', () => {
    expect(approvedExerciseAssetSpecifications.modelProfiles).toEqual([
      expect.objectContaining({
        id: 'cresum-male-master',
        model: 'male',
        clothing: {
          top: 'fitted black T-shirt',
          bottoms: 'black shorts',
          footwear: 'black athletic shoes',
        },
      }),
    ]);
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
    expect(exerciseLibrary).toHaveLength(58);
    expect(findExercise('lat-pulldown')).toEqual({
      id: 'lat-pulldown',
      name: 'Lat Pulldown',
      primaryMuscles: ['lats'],
      secondaryMuscles: ['biceps', 'upper-back'],
      equipment: ['cable'],
      movementPattern: 'vertical-pull',
      imageKey: 'lat-pulldown',
    });
    expect(findExercise('lat-pulldown-close-neutral-v-handle')).toBeUndefined();
  });
});
