import {
  canonicalExerciseId,
  exerciseLibrary,
  filterExercises,
  findExercise,
  legacyExerciseIds,
} from '../exercise-library';
import {
  equipmentTaxonomy,
  movementPatterns,
  muscleTaxonomy,
} from '../exercise-taxonomy';

describe('canonical exercise metadata', () => {
  it('contains a curated catalog with unique stable ids', () => {
    expect(exerciseLibrary.length).toBeGreaterThanOrEqual(45);
    expect(exerciseLibrary.length).toBeLessThanOrEqual(60);
    expect(new Set(exerciseLibrary.map((item) => item.id)).size).toBe(
      exerciseLibrary.length,
    );
  });

  it('owns unique, labeled taxonomy values', () => {
    for (const taxonomy of [muscleTaxonomy, equipmentTaxonomy]) {
      expect(new Set(taxonomy.map((item) => item.id)).size).toBe(
        taxonomy.length,
      );
      expect(taxonomy.every((item) => item.label.trim().length > 0)).toBe(true);
    }
    expect(new Set(movementPatterns).size).toBe(movementPatterns.length);
  });

  it('keeps every exercise internally valid', () => {
    const muscles = new Set(muscleTaxonomy.map((item) => item.id));
    const equipment = new Set(equipmentTaxonomy.map((item) => item.id));
    const patterns = new Set(movementPatterns);

    for (const exercise of exerciseLibrary) {
      expect(exercise.primaryMuscles.length).toBeGreaterThan(0);
      expect(new Set(exercise.primaryMuscles).size).toBe(
        exercise.primaryMuscles.length,
      );
      expect(new Set(exercise.secondaryMuscles).size).toBe(
        exercise.secondaryMuscles.length,
      );
      expect(exercise.primaryMuscles.every((id) => muscles.has(id))).toBe(true);
      expect(exercise.secondaryMuscles.every((id) => muscles.has(id))).toBe(
        true,
      );
      expect(
        exercise.primaryMuscles.every(
          (id) => !exercise.secondaryMuscles.includes(id),
        ),
      ).toBe(true);
      expect(exercise.equipment.length).toBeGreaterThan(0);
      expect(exercise.equipment.every((id) => equipment.has(id))).toBe(true);
      expect(patterns.has(exercise.movementPattern)).toBe(true);
      expect(exercise.imageKey).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(exercise.imageKey).not.toMatch(/\.(png|jpe?g|webp|svg)$/i);
    }
  });

  it('maps every known legacy id to its literal canonical id', () => {
    expect(legacyExerciseIds).toEqual({
      bench: 'barbell-bench-press',
      incline: 'incline-dumbbell-press',
      row: 'seated-cable-row',
      pulldown: 'lat-pulldown',
      press: 'dumbbell-shoulder-press',
      lateral: 'dumbbell-lateral-raise',
      squat: 'barbell-back-squat',
      legpress: 'leg-press',
      deadlift: 'barbell-deadlift',
      curl: 'dumbbell-biceps-curl',
      triceps: 'cable-triceps-pushdown',
      calf: 'standing-calf-raise',
    });
  });

  it('resolves legacy, canonical and unknown ids predictably', () => {
    expect(canonicalExerciseId('bench')).toBe('barbell-bench-press');
    expect(canonicalExerciseId('barbell-bench-press')).toBe(
      'barbell-bench-press',
    );
    expect(canonicalExerciseId('unknown')).toBeUndefined();
    expect(findExercise('bench')?.id).toBe('barbell-bench-press');
    expect(findExercise('unknown')).toBeUndefined();
  });

  it('does not treat inherited object properties as legacy aliases', () => {
    expect(canonicalExerciseId('toString')).toBeUndefined();
    expect(canonicalExerciseId('constructor')).toBeUndefined();
    expect(findExercise('toString')).toBeUndefined();
    expect(findExercise('constructor')).toBeUndefined();
  });
});

describe('exercise library filtering', () => {
  it('searches names case-insensitively and trims whitespace', () => {
    expect(
      filterExercises(exerciseLibrary, { query: '  BENCH  ' }).map(
        (item) => item.id,
      ),
    ).toContain('barbell-bench-press');
    expect(
      filterExercises(exerciseLibrary, { query: '  BENCH  ' }).map(
        (item) => item.id,
      ),
    ).not.toContain('barbell-back-squat');
  });

  it('matches both primary and secondary muscles', () => {
    const ids = filterExercises(exerciseLibrary, { muscle: 'triceps' }).map(
      (item) => item.id,
    );

    expect(ids).toContain('cable-triceps-pushdown');
    expect(ids).toContain('barbell-bench-press');
  });

  it('filters equipment and combines all criteria with AND', () => {
    expect(
      filterExercises(exerciseLibrary, { equipment: 'cable' }).every((item) =>
        item.equipment.includes('cable'),
      ),
    ).toBe(true);
    expect(
      filterExercises(exerciseLibrary, {
        query: 'press',
        muscle: 'chest',
        equipment: 'dumbbell',
      }).map((item) => item.id),
    ).toEqual(['incline-dumbbell-press', 'dumbbell-bench-press']);
  });

  it('preserves catalog order for blank criteria and returns no false matches', () => {
    expect(filterExercises(exerciseLibrary).map((item) => item.id)).toEqual(
      exerciseLibrary.map((item) => item.id),
    );
    expect(
      filterExercises(exerciseLibrary, { query: 'not-a-real-exercise' }),
    ).toEqual([]);
  });
});
