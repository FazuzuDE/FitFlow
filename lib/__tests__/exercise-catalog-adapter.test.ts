import {
  catalogFamilies,
  catalogVariants,
  getCatalogFamily,
  getCatalogVariant,
  getFamilyForExercise,
  listFamilyVariants,
  unmappedExerciseIds,
} from '../exercise-catalog-adapter';
import {
  canonicalExerciseId,
  exerciseLibrary,
  findExercise,
} from '../exercise-library';
import { isValidExerciseVariantCatalog } from '../exercise-variant-model';
import { stableExerciseIdentity } from '../progress-analytics';
import type { WorkoutSession } from '../workout-model';

const snapshot = (libraryId: string): WorkoutSession => ({
  id: `workout-${libraryId}`,
  templateId: 'template',
  name: 'Saved workout',
  startedAt: 1,
  finishedAt: 2,
  currentExerciseIndex: 0,
  restDurationSeconds: 60,
  exercises: [
    {
      id: `set-${libraryId}`,
      libraryId,
      name: 'Saved name',
      muscle: 'Saved muscle',
      sets: [],
    },
  ],
});

describe('non-destructive exercise catalog adapter', () => {
  it('keeps the existing catalog as the source of display and movement metadata', () => {
    expect(exerciseLibrary).toHaveLength(58);
    expect(catalogVariants.map(({ id }) => id)).toEqual([
      'barbell-bench-press',
      'incline-dumbbell-press',
      'dumbbell-bench-press',
      'cable-chest-fly',
      'pec-deck-fly',
      'lat-pulldown',
      'pull-up',
      'assisted-pull-up',
      'dumbbell-shoulder-press',
      'barbell-overhead-press',
      'machine-shoulder-press',
      'dumbbell-lateral-raise',
      'cable-lateral-raise',
      'dumbbell-biceps-curl',
      'barbell-curl',
      'ez-bar-curl',
      'hammer-curl',
      'cable-biceps-curl',
      'overhead-cable-triceps-extension',
      'dumbbell-overhead-triceps-extension',
      'barbell-back-squat',
      'barbell-front-squat',
      'smith-machine-squat',
      'goblet-squat',
      'lying-leg-curl',
      'seated-leg-curl',
      'barbell-romanian-deadlift',
      'dumbbell-romanian-deadlift',
      'standing-calf-raise',
      'seated-calf-raise',
    ]);
    for (const variant of catalogVariants) {
      const source = findExercise(variant.id)!;
      expect(variant.name).toBe(source.name);
      expect(variant.movementPattern).toBe(source.movementPattern);
      expect(variant.muscles).toEqual({
        primary: source.primaryMuscles,
        secondary: source.secondaryMuscles,
      });
      expect(source.equipment).toContain(variant.equipmentType);
      expect(variant).not.toBe(source);
    }
    expect(findExercise('bench')).toBe(exerciseLibrary[0]);
  });

  it('maps only defensible families and keeps generic IDs unspecified', () => {
    expect(listFamilyVariants('bench-press').map(({ id }) => id)).toEqual([
      'barbell-bench-press',
      'incline-dumbbell-press',
      'dumbbell-bench-press',
    ]);
    expect(listFamilyVariants('romanian-deadlift').map(({ id }) => id)).toEqual(
      ['barbell-romanian-deadlift', 'dumbbell-romanian-deadlift'],
    );
    expect(getCatalogVariant('lat-pulldown')?.configuration).toBe(
      'unspecified',
    );
    expect(getCatalogVariant('lat-pulldown')?.grip).toBeUndefined();
    expect(getCatalogVariant('lat-pulldown')?.attachmentType).toBeUndefined();
    expect(getCatalogVariant('machine-shoulder-press')?.configuration).toBe(
      'unspecified',
    );
    for (const id of [
      'cable-chest-fly',
      'pec-deck-fly',
      'cable-lateral-raise',
      'cable-biceps-curl',
      'overhead-cable-triceps-extension',
      'lying-leg-curl',
      'seated-leg-curl',
      'standing-calf-raise',
      'seated-calf-raise',
    ]) {
      expect(getCatalogVariant(id)?.configuration).toBe('unspecified');
    }
  });

  it('leaves unresolved exercises explicitly unmapped rather than inventing families', () => {
    expect(unmappedExerciseIds).toContain('seated-cable-row');
    expect(unmappedExerciseIds).toContain('machine-chest-press');
    expect(getCatalogVariant('seated-cable-row')).toBeUndefined();
    expect(getFamilyForExercise('seated-cable-row')).toBeUndefined();
    expect(getCatalogFamily('row')).toBeUndefined();
    expect(getCatalogVariant('unknown')).toBeUndefined();
    expect(getCatalogVariant('toString')).toBeUndefined();
    expect(listFamilyVariants('missing')).toEqual([]);
  });

  it('keeps family and variant identities valid, unique and deterministic', () => {
    expect(
      isValidExerciseVariantCatalog(catalogFamilies, catalogVariants),
    ).toBe(true);
    expect(new Set(catalogFamilies.map(({ id }) => id)).size).toBe(
      catalogFamilies.length,
    );
    expect(new Set(catalogVariants.map(({ id }) => id)).size).toBe(
      catalogVariants.length,
    );
    expect(
      catalogVariants.every(({ id }) =>
        exerciseLibrary.some((item) => item.id === id),
      ),
    ).toBe(true);
    expect(catalogVariants.length + unmappedExerciseIds.length).toBe(58);
    expect(getFamilyForExercise('barbell-bench-press')).toBe(
      getCatalogFamily('bench-press'),
    );
    expect(getCatalogVariant('bench')).toBe(
      getCatalogVariant('barbell-bench-press'),
    );
    expect(canonicalExerciseId('row')).toBe('seated-cable-row');
  });

  it('does not change saved identities or combine distinct variants in Progress', () => {
    const barbell = snapshot('barbell-bench-press');
    const dumbbell = snapshot('dumbbell-bench-press');
    const legacy = snapshot('bench');
    const unknown = snapshot('unknown-old-id');
    expect(stableExerciseIdentity(barbell, barbell.exercises[0])).toEqual({
      identityKey: 'canonical:barbell-bench-press',
      exerciseId: 'barbell-bench-press',
    });
    expect(
      stableExerciseIdentity(dumbbell, dumbbell.exercises[0]).identityKey,
    ).not.toBe('canonical:barbell-bench-press');
    expect(
      stableExerciseIdentity(legacy, legacy.exercises[0]).identityKey,
    ).toBe('canonical:barbell-bench-press');
    expect(stableExerciseIdentity(unknown, unknown.exercises[0])).toEqual({
      identityKey: 'unknown:"unknown-old-id"',
      exerciseId: 'unknown-old-id',
    });
    expect(legacy.exercises[0].libraryId).toBe('bench');
    expect(legacy.exercises[0].name).toBe('Saved name');
  });
});
