import {
  getCatalogVariant,
  listFamilyVariants,
} from '../exercise-catalog-adapter';
import {
  canonicalExerciseId,
  exerciseLibrary,
  filterExercises,
  findExercise,
  legacyExerciseIds,
} from '../exercise-library';
import { exerciseAssetIdentity } from '../exercise-variant-model';
import { stableExerciseIdentity } from '../progress-analytics';
import type { WorkoutSession } from '../workout-model';

const newIds = [
  'lat-pulldown-wide-pronated-bar',
  'lat-pulldown-close-neutral-v-handle',
  'lat-pulldown-reverse-grip',
] as const;

const sessionFor = (libraryId: string): WorkoutSession => ({
  id: `session-${libraryId}`,
  templateId: 'template',
  name: 'Saved workout',
  startedAt: 1,
  finishedAt: 2,
  currentExerciseIndex: 0,
  restDurationSeconds: 60,
  exercises: [
    {
      id: `exercise-${libraryId}`,
      libraryId,
      name: 'Saved exercise name',
      muscle: 'Saved muscle',
      sets: [],
    },
  ],
});

describe('Lat Pulldown Variant Pack v1', () => {
  it('preserves the legacy Lat Pulldown and its unspecified identity', () => {
    expect(findExercise('lat-pulldown')).toEqual({
      id: 'lat-pulldown',
      name: 'Lat Pulldown',
      primaryMuscles: ['lats'],
      secondaryMuscles: ['biceps', 'upper-back'],
      equipment: ['cable'],
      movementPattern: 'vertical-pull',
      imageKey: 'lat-pulldown',
    });
    expect(legacyExerciseIds.pulldown).toBe('lat-pulldown');
    expect(getCatalogVariant('lat-pulldown')).toMatchObject({
      id: 'lat-pulldown',
      familyId: 'lat-pulldown',
      configuration: 'unspecified',
    });
    expect(getCatalogVariant('lat-pulldown')?.attachmentType).toBeUndefined();
    expect(getCatalogVariant('lat-pulldown')?.grip).toBeUndefined();
    expect(getCatalogVariant('lat-pulldown')?.gripWidth).toBeUndefined();
  });

  it('adds exactly three distinct specific variants beside the existing exercise', () => {
    expect(exerciseLibrary).toHaveLength(61);
    const index = exerciseLibrary.findIndex(({ id }) => id === 'lat-pulldown');
    expect(
      exerciseLibrary.slice(index + 1, index + 4).map(({ id }) => id),
    ).toEqual(newIds);
    expect(listFamilyVariants('lat-pulldown').map(({ id }) => id)).toEqual([
      'lat-pulldown',
      ...newIds,
    ]);
    for (const id of newIds) {
      expect(canonicalExerciseId(id)).toBe(id);
      expect(getCatalogVariant(id)).toMatchObject({
        id,
        familyId: 'lat-pulldown',
        configuration: 'specific',
        equipmentType: 'cable',
        movementPattern: 'vertical-pull',
        muscles: { primary: ['lats'], secondary: ['biceps', 'upper-back'] },
      });
      expect(findExercise(id)?.imageKey).toBe(id);
      expect(
        exerciseAssetIdentity(getCatalogVariant(id)!, 'start', 'male'),
      ).toEqual({
        familyId: 'lat-pulldown',
        variantId: id,
        phase: 'start',
        model: 'male',
      });
    }
  });

  it('distinguishes only justified attachment, orientation, and grip width', () => {
    expect(getCatalogVariant(newIds[0])).toMatchObject({
      attachmentType: { kind: 'attachment', id: 'wide-bar' },
      grip: { kind: 'grip', id: 'pronated' },
      gripWidth: 'wide',
    });
    expect(getCatalogVariant(newIds[1])).toMatchObject({
      attachmentType: { kind: 'attachment', id: 'v-handle' },
      grip: { kind: 'grip', id: 'neutral' },
      gripWidth: 'close',
    });
    expect(getCatalogVariant(newIds[2])).toMatchObject({
      grip: { kind: 'grip', id: 'supinated' },
    });
    expect(getCatalogVariant(newIds[2])?.attachmentType).toBeUndefined();
    expect(getCatalogVariant(newIds[2])?.gripWidth).toBeUndefined();
    for (const id of newIds) {
      const variant = getCatalogVariant(id)!;
      expect(variant.machineArchetype).toBeUndefined();
      expect(variant.bodyPosition).toBeUndefined();
      expect(variant.support).toBeUndefined();
    }
  });

  it('keeps the four Progress identities distinct without rewriting saved snapshots', () => {
    const ids = ['lat-pulldown', ...newIds];
    const sessions = ids.map(sessionFor);
    expect(
      sessions.map(
        (session) =>
          stableExerciseIdentity(session, session.exercises[0]).identityKey,
      ),
    ).toEqual(ids.map((id) => `canonical:${id}`));
    const legacy = sessionFor('pulldown');
    expect(
      stableExerciseIdentity(legacy, legacy.exercises[0]).identityKey,
    ).toBe('canonical:lat-pulldown');
    expect(legacy.exercises[0].libraryId).toBe('pulldown');
    expect(legacy.exercises[0].name).toBe('Saved exercise name');
  });

  it('uses normal Library search and combined filters', () => {
    expect(
      filterExercises(exerciseLibrary, { query: '  PULLDOWN  ' }).map(
        ({ id }) => id,
      ),
    ).toEqual(['lat-pulldown', ...newIds, 'cable-straight-arm-pulldown']);
    expect(
      filterExercises(exerciseLibrary, {
        query: 'neutral',
        muscle: 'lats',
        equipment: 'cable',
      }).map(({ id }) => id),
    ).toEqual([newIds[1]]);
    expect(
      filterExercises(exerciseLibrary, {
        query: 'neutral',
        equipment: 'bodyweight',
      }),
    ).toEqual([]);
  });
});
