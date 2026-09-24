import { projectEstimatedOneRepMaxSeries } from '../exercise-performance';
import type { WorkoutSession, WorkoutSet } from '../workout-model';

const at = (day: number, hour = 12) => new Date(2026, 8, day, hour).getTime();
const now = at(23);
const saved = (
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

const bench = 'canonical:barbell-bench-press';

it('selects the highest finite Epley estimate per workout and retains its source', () => {
  const history = [
    workout('mixed', at(22), 'bench', 'Saved Bench', [
      saved('heavy', '100', '1', at(22) - 3),
      saved('higher-estimate', '90', '10', at(22) - 2),
      saved('lighter', '80', '8', at(22) - 1),
      saved('malformed', '-1', '8', at(22)),
      { id: 'planned', weight: '200', reps: '10' },
    ]),
  ];
  expect(projectEstimatedOneRepMaxSeries(history, '1M', now, bench)).toEqual([
    {
      identityKey: bench,
      workoutId: 'mixed',
      workoutName: 'mixed workout',
      finishedAt: at(22),
      exerciseSnapshotId: 'mixed-exercise',
      setId: 'higher-estimate',
      exerciseIndex: 0,
      setIndex: 1,
      completedAt: at(22) - 2,
      weight: 90,
      reps: 10,
      estimatedOneRepMax: 120,
    },
  ]);
});

it('resolves equal estimates by later completion then stable ID and saved order', () => {
  const entry = workout('tie', at(22), 'bench', 'Saved Bench', [
    saved('z', '100', '1', at(22) - 2),
    saved('b', '75', '10', at(22) - 1),
    saved('a', '75', '10', at(22) - 1),
    saved('a', '75', '10', at(22) - 1),
  ]);
  entry.exercises.push({
    id: 'other-snapshot',
    libraryId: 'barbell-bench-press',
    name: 'Renamed Bench',
    muscle: 'Saved',
    sets: [saved('a', '75', '10', at(22) - 1)],
  });
  const point = projectEstimatedOneRepMaxSeries([entry], '1M', now, bench)[0];
  expect(point).toMatchObject({
    exerciseSnapshotId: 'other-snapshot',
    setId: 'a',
    exerciseIndex: 1,
    setIndex: 0,
    completedAt: at(22) - 1,
    estimatedOneRepMax: 100,
  });
});

it('combines canonical and legacy IDs but keeps unknown IDs distinct and orders same-day sessions', () => {
  const first = workout('a', at(22), 'bench', 'Old Bench', [
    saved('a', '75', '10', at(22) - 1),
  ]);
  const second = workout('b', at(22), 'barbell-bench-press', 'New Bench', [
    saved('b', '80', '10', at(22) - 1),
  ]);
  const unknown = workout('unknown', at(22), 'custom-bench', 'New Bench', [
    saved('c', '200', '10', at(22) - 1),
  ]);
  const before = JSON.stringify([second, unknown, first]);
  const result = projectEstimatedOneRepMaxSeries(
    [second, unknown, first],
    '1M',
    now,
    bench,
  );
  expect(
    result.map((point) => [point.workoutId, point.estimatedOneRepMax]),
  ).toEqual([
    ['a', 100],
    ['b', 106.66666666666666],
  ]);
  expect(
    projectEstimatedOneRepMaxSeries(
      [unknown],
      'ALL',
      now,
      'unknown:"custom-bench"',
    ),
  ).toHaveLength(1);
  expect(JSON.stringify([second, unknown, first])).toBe(before);
});

it('uses finishedAt for inclusive periods, excludes future sessions, and preserves empty and zero series', () => {
  const start = new Date(2026, 7, 23, 12).getTime();
  const make = (id: string, finishedAt: number, weight: string) =>
    workout(id, finishedAt, 'bench', 'Bench', [
      saved(`${id}-set`, weight, '5', finishedAt - 1),
    ]);
  const history = [
    make('future', now + 1, '50'),
    make('now', now, '50'),
    make('before', start - 1, '50'),
    make('start', start, '0'),
  ];
  expect(
    projectEstimatedOneRepMaxSeries(history, '1M', now, bench).map((point) => [
      point.workoutId,
      point.estimatedOneRepMax,
    ]),
  ).toEqual([
    ['start', 0],
    ['now', 58.333333333333336],
  ]);
  expect(
    projectEstimatedOneRepMaxSeries(history, 'ALL', now, bench).map(
      (point) => point.workoutId,
    ),
  ).toEqual(['before', 'start', 'now']);
  expect(
    projectEstimatedOneRepMaxSeries(history, '1W', now, 'unknown:"none"'),
  ).toEqual([]);
});

it('matches normalized legacy done completion and direct in-memory done completion', () => {
  const legacy = workout('old', at(22), 'bench', 'Bench', [
    { id: 'done', weight: '42', reps: '6', done: true } as WorkoutSet,
  ]);
  const normalized = workout('old', at(22), 'bench', 'Bench', [
    saved('done', '42', '6', at(22)),
  ]);
  expect(projectEstimatedOneRepMaxSeries([legacy], 'ALL', now, bench)).toEqual(
    projectEstimatedOneRepMaxSeries([normalized], 'ALL', now, bench),
  );
});
