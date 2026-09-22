import { newestFirstHistory } from '../workout-history';
import type { WorkoutSession } from '../workout-model';

const session = (
  id: string,
  startedAt: number,
  finishedAt: number,
): WorkoutSession => ({
  id,
  templateId: `template-${id}`,
  name: `Workout ${id}`,
  startedAt,
  finishedAt,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [],
});

describe('workout History ordering', () => {
  it('returns completed sessions newest-first without mutating snapshots or input order', () => {
    const oldest = session('oldest', 100, 200);
    const newest = session('newest', 300, 500);
    const middle = session('middle', 200, 400);
    const history = [oldest, newest, middle];

    const ordered = newestFirstHistory(history);

    expect(ordered.map((workout) => workout.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
    expect(history.map((workout) => workout.id)).toEqual([
      'oldest',
      'newest',
      'middle',
    ]);
    expect(ordered[0]).toBe(newest);
  });

  it('preserves persisted order when completion timestamps are equal', () => {
    const first = session('first', 100, 500);
    const second = session('second', 200, 500);

    expect(newestFirstHistory([first, second])).toEqual([first, second]);
  });
});
