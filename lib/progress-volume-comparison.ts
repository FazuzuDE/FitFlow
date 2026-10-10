import {
  filterProgressWorkouts,
  progressPeriodStart,
  projectPeriodAnalytics,
  type ProgressPeriodId,
} from './progress-periods';
import { projectProgressAnalytics } from './progress-analytics';
import { completedSetMetrics } from './workout-metrics';
import type { WorkoutSession } from './workout-model';

export type VolumeComparison =
  | { kind: 'unavailable' }
  | {
      kind: 'increase' | 'decrease' | 'unchanged';
      delta: number;
      previousVolume: number;
    };

export const projectVolumeComparison = (
  history: readonly WorkoutSession[],
  period: ProgressPeriodId,
  now: number,
): VolumeComparison | undefined => {
  const start = progressPeriodStart(period, now);
  if (start === undefined) return;
  const previous = filterProgressWorkouts(history, period, start).filter(
    (session) => session.finishedAt! < start,
  );
  const current = projectPeriodAnalytics(history, period, now);
  const usable = (workouts: readonly WorkoutSession[]) =>
    workouts.some((session) =>
      session.exercises.some((exercise) =>
        exercise.sets.some((set) => completedSetMetrics(set) !== undefined),
      ),
    );
  if (
    !usable(previous) ||
    (current.workouts.length > 0 && !usable(current.workouts))
  ) {
    return { kind: 'unavailable' };
  }
  const previousVolume = projectProgressAnalytics(previous).totalVolume;
  const difference = current.totalVolume - previousVolume;
  // Suppress only floating-point roundoff, not a fixed kg-sized threshold.
  const tolerance =
    Number.EPSILON * Math.max(current.totalVolume, previousVolume) * 8;
  const delta = Math.abs(difference) <= tolerance ? 0 : difference;
  return {
    kind: delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'unchanged',
    delta,
    previousVolume,
  };
};
