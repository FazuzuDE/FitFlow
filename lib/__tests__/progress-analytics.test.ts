import { projectProgressAnalytics } from '../progress-analytics';
import type {
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from '../workout-model';

const set = (
  id: string,
  weight: string,
  reps: string,
  completedAt?: number,
): WorkoutSet => ({ id, weight, reps, completedAt });

const exercise = (
  id: string,
  libraryId: string,
  name: string,
  sets: WorkoutSet[],
): WorkoutExercise => ({ id, libraryId, name, muscle: 'Saved muscle', sets });

const workout = (
  id: string,
  finishedAt: number,
  exercises: WorkoutExercise[],
): WorkoutSession => ({
  id,
  templateId: `template-${id}`,
  name: `Workout ${id}`,
  startedAt: finishedAt - 1_000,
  finishedAt,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises,
});

describe('Progress analytics stable exercise identity', () => {
  it('aggregates repeated canonical snapshots and keeps the best record', () => {
    const older = workout('older', 2_000, [
      exercise('older-exercise', 'barbell-bench-press', 'Saved Bench', [
        set('older-set', '75', '10', 1_900),
      ]),
    ]);
    const newer = workout('newer', 4_000, [
      exercise('newer-exercise', 'barbell-bench-press', 'Saved Bench', [
        set('newer-set', '80', '10', 3_900),
      ]),
    ]);

    const result = projectProgressAnalytics([older, newer]);

    expect(result.estimatedOneRepMaxRecords).toEqual([
      {
        identityKey: 'canonical:barbell-bench-press',
        exerciseId: 'barbell-bench-press',
        name: 'Saved Bench',
        weight: 80,
        reps: 10,
        estimatedOneRepMax: 106.66666666666666,
        recordedAt: 3_900,
      },
    ]);
    expect(result.totalVolume).toBe(1_550);
  });

  it('combines a known legacy alias with its canonical identity', () => {
    const result = projectProgressAnalytics([
      workout('legacy', 2_000, [
        exercise('legacy-exercise', 'bench', 'Legacy Bench Name', [
          set('legacy-set', '80', '8', 1_900),
        ]),
      ]),
      workout('canonical', 3_000, [
        exercise(
          'canonical-exercise',
          'barbell-bench-press',
          'Canonical Saved Name',
          [set('canonical-set', '85', '8', 2_900)],
        ),
      ]),
    ]);

    expect(result.estimatedOneRepMaxRecords).toHaveLength(1);
    expect(result.estimatedOneRepMaxRecords[0]).toMatchObject({
      exerciseId: 'barbell-bench-press',
      name: 'Canonical Saved Name',
      weight: 85,
    });
  });

  it('uses the newest saved label without replacing an older best record', () => {
    const result = projectProgressAnalytics([
      workout('newer', 5_000, [
        exercise('newer-exercise', 'barbell-bench-press', 'Renamed Snapshot', [
          set('newer-set', '40', '5', 4_900),
        ]),
      ]),
      workout('older', 2_000, [
        exercise('older-exercise', 'barbell-bench-press', 'Original Snapshot', [
          set('older-set', '100', '5', 1_900),
        ]),
      ]),
    ]);

    expect(result.estimatedOneRepMaxRecords[0]).toMatchObject({
      name: 'Renamed Snapshot',
      weight: 100,
      recordedAt: 1_900,
    });
    expect(result.estimatedOneRepMaxRecords[0].name).not.toBe(
      'Barbell Bench Press',
    );
  });

  it('keeps matching display names separate when stable ids differ', () => {
    const result = projectProgressAnalytics([
      workout('same-name', 2_000, [
        exercise('first', 'custom-first', 'Shared Saved Name', [
          set('first-set', '50', '5', 1_800),
        ]),
        exercise('second', 'custom-second', 'Shared Saved Name', [
          set('second-set', '60', '5', 1_900),
        ]),
      ]),
    ]);

    expect(
      result.estimatedOneRepMaxRecords.map((record) => record.exerciseId),
    ).toEqual(['custom-second', 'custom-first']);
  });

  it('preserves unknown ids and isolates unusable ids by snapshot', () => {
    const result = projectProgressAnalytics([
      workout('unknown-older', 2_000, [
        exercise('unknown-a', 'stale-id', 'Old Stale Name', [
          set('unknown-a-set', '50', '5', 1_900),
        ]),
        exercise('blank-a', '   ', 'Blank Name', [
          set('blank-a-set', '30', '5', 1_800),
        ]),
      ]),
      workout('unknown-newer', 3_000, [
        exercise('unknown-b', 'stale-id', 'New Stale Name', [
          set('unknown-b-set', '60', '5', 2_900),
        ]),
        exercise('blank-b', '', 'Blank Name', [
          set('blank-b-set', '40', '5', 2_800),
        ]),
      ]),
    ]);

    expect(
      result.estimatedOneRepMaxRecords.map((record) => record.exerciseId),
    ).toEqual([
      'stale-id',
      'snapshot:["unknown-newer","blank-b"]',
      'snapshot:["unknown-older","blank-a"]',
    ]);
    expect(result.estimatedOneRepMaxRecords[0].name).toBe('New Stale Name');
  });

  it('keeps inherited-property ids and snapshot-like raw ids collision-safe', () => {
    const result = projectProgressAnalytics([
      workout('a', 2_000, [
        exercise('ex', '', 'Blank Snapshot', [
          set('blank-set', '30', '5', 1_700),
        ]),
        exercise('raw', 'snapshot:a:ex', 'Raw Snapshot-Like ID', [
          set('raw-set', '40', '5', 1_800),
        ]),
        exercise('prototype-a', 'toString', 'Prototype A', [
          set('prototype-a-set', '50', '5', 1_900),
        ]),
        exercise('prototype-b', 'constructor', 'Prototype B', [
          set('prototype-b-set', '60', '5', 1_950),
        ]),
      ]),
    ]);

    expect(result.estimatedOneRepMaxRecords).toHaveLength(4);
    expect(
      result.estimatedOneRepMaxRecords.map((record) => record.identityKey),
    ).toEqual([
      'unknown:"constructor"',
      'unknown:"toString"',
      'unknown:"snapshot:a:ex"',
      'snapshot:["a","ex"]',
    ]);
  });
});

describe('Progress analytics safe samples and ordering', () => {
  it('excludes every invalid completed value while retaining zero weight', () => {
    const invalid = [
      set('negative-weight', '-1', '10', 10),
      set('zero-reps', '50', '0', 11),
      set('negative-reps', '50', '-2', 12),
      set('fractional-reps', '50', '1.5', 13),
      set('nan', 'NaN', '10', 14),
      set('infinity', 'Infinity', '10', 15),
      set('scientific', '1e2', '10', 16),
      set('hex', '0x10', '10', 17),
      set('overflow', `1${'0'.repeat(308)}`, '10', 18),
    ];
    const result = projectProgressAnalytics([
      workout('mixed', 1_000, [
        exercise('mixed-exercise', 'mixed-id', 'Mixed Snapshot', [
          ...invalid,
          set('zero-weight', '0', '10', 19),
          set('valid', '50', '10', 20),
          set('planned', '999', '10'),
        ]),
        exercise('partial', 'partial-id', 'Partial Snapshot', [
          set('partial-set', '70', '8'),
        ]),
      ]),
    ]);

    expect(result.excludedSampleCount).toBe(invalid.length);
    expect(result.totalVolume).toBe(500);
    expect(Number.isFinite(result.totalVolume)).toBe(true);
    expect(result.estimatedOneRepMaxRecords).toHaveLength(1);
    expect(result.estimatedOneRepMaxRecords[0]).toMatchObject({
      exerciseId: 'mixed-id',
      weight: 50,
      reps: 10,
    });
  });

  it('keeps the aggregate finite when valid workout totals would overflow', () => {
    const large = `1${'0'.repeat(307)}`;
    const result = projectProgressAnalytics([
      workout('a', 1_000, [
        exercise('a-exercise', 'a-id', 'A', [set('a-set', large, '10', 900)]),
      ]),
      workout('b', 2_000, [
        exercise('b-exercise', 'b-id', 'B', [set('b-set', large, '10', 1_900)]),
      ]),
    ]);

    expect(result.totalVolume).toBe(Number(large) * 10);
    expect(Number.isFinite(result.totalVolume)).toBe(true);
  });

  it('orders workout volumes by timestamps rather than input position', () => {
    const result = projectProgressAnalytics([
      workout('middle', 2_000, []),
      workout('newer-b', 3_000, []),
      workout('older', 1_000, []),
      workout('newer-a', 3_000, []),
    ]);

    expect(result.workoutVolumes.map((item) => item.workoutId)).toEqual([
      'newer-a',
      'newer-b',
      'middle',
      'older',
    ]);
  });

  it('keeps the saved workout name with each individual volume point', () => {
    const first = workout('morning', 2_000, []);
    const second = workout('evening', 3_000, []);
    first.name = 'Saved morning name';
    second.name = 'Saved evening name';

    expect(projectProgressAnalytics([first, second]).workoutVolumes).toEqual([
      {
        workoutId: 'evening',
        workoutName: 'Saved evening name',
        finishedAt: 3_000,
        volume: 0,
      },
      {
        workoutId: 'morning',
        workoutName: 'Saved morning name',
        finishedAt: 2_000,
        volume: 0,
      },
    ]);
  });

  it('selects equal records deterministically regardless of History order', () => {
    const a = workout('a-session', 2_000, [
      exercise('a-exercise', 'barbell-bench-press', 'A Saved Name', [
        set('a-set', '75', '10', 1_900),
      ]),
    ]);
    const b = workout('b-session', 2_000, [
      exercise('b-exercise', 'barbell-bench-press', 'B Saved Name', [
        set('b-set', '100', '1', 1_900),
      ]),
    ]);

    const forward = projectProgressAnalytics([a, b]);
    const reverse = projectProgressAnalytics([b, a]);

    expect(forward.estimatedOneRepMaxRecords).toEqual(
      reverse.estimatedOneRepMaxRecords,
    );
    expect(forward.estimatedOneRepMaxRecords[0]).toMatchObject({
      name: 'A Saved Name',
      weight: 75,
      reps: 10,
      estimatedOneRepMax: 100,
      recordedAt: 1_900,
    });
  });
});
