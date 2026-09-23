import {
  listPerformanceExercises,
  projectExercisePerformance,
} from '../exercise-performance';
import type { WorkoutSession, WorkoutSet } from '../workout-model';

const at = (day: number, hour = 12) => new Date(2026, 8, day, hour).getTime();
const savedSet = (
  id: string,
  weight: string,
  reps: string,
  completedAt: number,
): WorkoutSet => ({ id, weight, reps, completedAt });
const workout = (
  id: string,
  finishedAt: number,
  libraryId: string,
  name: string,
  sets: WorkoutSet[],
): WorkoutSession => ({
  id,
  templateId: 'template',
  name: `${id} workout`,
  startedAt: finishedAt - 3_600_000,
  finishedAt,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [{ id: `${id}-exercise`, libraryId, name, muscle: 'Saved', sets }],
});

describe('exercise-specific logged performance', () => {
  const now = at(23);

  it('combines canonical and legacy snapshots, retaining the latest saved name', () => {
    const history = [
      workout('new', at(20), 'barbell-bench-press', 'Renamed Bench', [
        savedSet('new-set', '80', '8', at(20) - 100),
      ]),
      workout('old', at(10), 'bench', 'Original Bench', [
        savedSet('old-set', '75', '10', at(10) - 100),
      ]),
    ];
    expect(listPerformanceExercises(history, now)).toEqual([
      { identityKey: 'canonical:barbell-bench-press', name: 'Renamed Bench' },
    ]);
    expect(
      projectExercisePerformance(
        history,
        '1M',
        now,
        'canonical:barbell-bench-press',
      ).map((entry) => [entry.workoutId, entry.finishedAt, entry.sets]),
    ).toEqual([
      ['old', at(10), [{ id: 'old-set', weight: 75, reps: 10 }]],
      ['new', at(20), [{ id: 'new-set', weight: 80, reps: 8 }]],
    ]);
  });

  it('keeps unknown non-empty IDs distinct and blank IDs isolated by snapshot', () => {
    const history = [
      workout('a', at(10), 'unknown-a', 'Same label', [
        savedSet('a', '40', '5', at(10) - 1),
      ]),
      workout('b', at(11), 'unknown-b', 'Same label', [
        savedSet('b', '45', '5', at(11) - 1),
      ]),
      workout('c', at(12), '', 'Blank label', [
        savedSet('c', '50', '5', at(12) - 1),
      ]),
      workout('d', at(13), '   ', 'Blank label', [
        savedSet('d', '55', '5', at(13) - 1),
      ]),
    ];
    const choices = listPerformanceExercises(history, now);
    expect(choices.map((choice) => choice.identityKey)).toEqual([
      'snapshot:["c","c-exercise"]',
      'snapshot:["d","d-exercise"]',
      'unknown:"unknown-a"',
      'unknown:"unknown-b"',
    ]);
    expect(
      projectExercisePerformance(
        history,
        'ALL',
        now,
        'unknown:"unknown-a"',
      ).map((entry) => entry.workoutId),
    ).toEqual(['a']);
  });

  it('uses inclusive period boundaries and excludes future sessions even for ALL', () => {
    const start = new Date(2026, 7, 23, 12).getTime();
    const make = (id: string, finishedAt: number) =>
      workout(id, finishedAt, 'bench', 'Bench', [
        savedSet(`${id}-set`, '50', '5', finishedAt - 1),
      ]);
    const history = [
      make('future', now + 1),
      make('now', now),
      make('before', start - 1),
      make('start', start),
    ];
    const key = 'canonical:barbell-bench-press';
    expect(
      projectExercisePerformance(history, '1M', now, key).map(
        (entry) => entry.workoutId,
      ),
    ).toEqual(['start', 'now']);
    expect(
      projectExercisePerformance(history, 'ALL', now, key).map(
        (entry) => entry.workoutId,
      ),
    ).toEqual(['before', 'start', 'now']);
  });

  it('orders same-day equal-time sessions by ID and retains saved set order', () => {
    const a = workout('a', at(20), 'bench', 'Bench', [
      savedSet('third', '70', '7', at(20) - 10),
      savedSet('first', '80', '8', at(20) - 20),
      savedSet('second', '75', '9', at(20) - 15),
    ]);
    const b = workout('b', at(20), 'bench', 'Bench', [
      savedSet('b-set', '90', '4', at(20) - 1),
    ]);
    const earlier = workout('earlier', at(20, 9), 'bench', 'Bench', [
      savedSet('early', '60', '10', at(20, 9) - 1),
    ]);
    const key = 'canonical:barbell-bench-press';
    const forward = projectExercisePerformance([b, a, earlier], '1M', now, key);
    const reverse = projectExercisePerformance([a, earlier, b], '1M', now, key);
    expect(forward).toEqual(reverse);
    expect(forward.map((entry) => entry.workoutId)).toEqual([
      'earlier',
      'a',
      'b',
    ]);
    expect(forward[1].sets.map((set) => set.id)).toEqual([
      'third',
      'first',
      'second',
    ]);
  });

  it('excludes malformed samples, retains zero weight, and leaves snapshots unchanged', () => {
    const history = [
      workout('invalid', at(19), 'bench', 'Bench', [
        savedSet('negative', '-1', '5', at(19) - 2),
        savedSet('fraction', '50', '1.5', at(19) - 1),
      ]),
      workout('mixed', at(20), 'bench', 'Bench', [
        savedSet('zero', '0', '10', at(20) - 3),
        savedSet('malformed', 'NaN', '5', at(20) - 2),
        savedSet('decimal', '77,5', '8', at(20) - 1),
        { id: 'planned', weight: '90', reps: '5' },
      ]),
    ];
    const before = JSON.stringify(history);
    const key = 'canonical:barbell-bench-press';
    expect(listPerformanceExercises(history, now)).toEqual([
      { identityKey: key, name: 'Bench' },
    ]);
    expect(projectExercisePerformance(history, '1M', now, key)).toMatchObject([
      {
        workoutId: 'mixed',
        sets: [
          { id: 'zero', weight: 0, reps: 10 },
          { id: 'decimal', weight: 77.5, reps: 8 },
        ],
      },
    ]);
    expect(JSON.stringify(history)).toBe(before);
  });

  it('keeps outside-period exercises selectable, with empty and single-occurrence series', () => {
    const history = [
      workout('old', at(1), 'bench', 'Bench', [
        savedSet('old-set', '50', '5', at(1) - 1),
      ]),
      workout('recent', at(22), 'row', 'Row', [
        savedSet('recent-set', '60', '6', at(22) - 1),
      ]),
    ];
    expect(listPerformanceExercises([], now)).toEqual([]);
    expect(listPerformanceExercises(history, now)).toHaveLength(2);
    expect(
      projectExercisePerformance(
        history,
        '1W',
        now,
        'canonical:barbell-bench-press',
      ),
    ).toEqual([]);
    expect(
      projectExercisePerformance(
        history,
        '1W',
        now,
        'canonical:seated-cable-row',
      ),
    ).toHaveLength(1);
  });

  it('projects identically from reloaded schema-v1 snapshots with the same now', () => {
    const history = [
      workout('saved', at(22), 'bench', 'Saved Bench', [
        savedSet('set', '65', '8', at(22) - 1),
      ]),
    ];
    const reloaded = JSON.parse(JSON.stringify(history)) as WorkoutSession[];
    const key = 'canonical:barbell-bench-press';
    expect(listPerformanceExercises(history, now)).toEqual([
      { identityKey: key, name: 'Saved Bench' },
    ]);
    expect(projectExercisePerformance(history, '1M', now, key)).toMatchObject([
      {
        workoutId: 'saved',
        finishedAt: at(22),
        sets: [{ id: 'set', weight: 65, reps: 8 }],
      },
    ]);
    expect(listPerformanceExercises(reloaded, now)).toEqual(
      listPerformanceExercises(history, now),
    );
    expect(projectExercisePerformance(reloaded, '1M', now, key)).toEqual(
      projectExercisePerformance(history, '1M', now, key),
    );
  });

  it('offers legacy done-only saved sets consistently with the performance series', () => {
    const history = [
      workout('legacy', at(22), 'bench', 'Legacy Bench', [
        { id: 'done', weight: '42', reps: '6', done: true } as WorkoutSet,
      ]),
    ];
    const key = 'canonical:barbell-bench-press';
    expect(listPerformanceExercises(history, now)).toEqual([
      { identityKey: key, name: 'Legacy Bench' },
    ]);
    expect(projectExercisePerformance(history, '1M', now, key)[0].sets).toEqual(
      [{ id: 'done', weight: 42, reps: 6 }],
    );
  });
});
