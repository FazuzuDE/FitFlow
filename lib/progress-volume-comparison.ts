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
  const sampleCount = (workouts: readonly WorkoutSession[]) =>
    workouts.reduce(
      (total, session) =>
        total +
        session.exercises.reduce(
          (exerciseTotal, exercise) =>
            exerciseTotal +
            exercise.sets.filter(
              (set) => completedSetMetrics(set) !== undefined,
            ).length,
          0,
        ),
      0,
    );
  const previousSamples = sampleCount(previous);
  const currentSamples = sampleCount(current.workouts);
  if (
    previousSamples === 0 ||
    (current.workouts.length > 0 && currentSamples === 0)
  ) {
    return { kind: 'unavailable' };
  }
  const previousVolume = projectProgressAnalytics(previous).totalVolume;
  const difference = current.totalVolume - previousVolume;
  // Allow for decimal parsing, multiplication, and the set/workout sums.
  // Scale with sample count so accumulated roundoff cannot create a trend.
  // There is no fixed kg-sized threshold that would hide real small changes.
  const roundingOperations =
    Math.max(currentSamples, previousSamples) +
    Math.max(current.workouts.length, previous.length) +
    2;
  const tolerance =
    Number.EPSILON *
    Math.max(current.totalVolume, previousVolume) *
    roundingOperations *
    2;
  // Keep the reliable significant digits of the difference; rounding error must
  // not leak into the displayed amount. The rounding step is <= tolerance,
  // so a difference exceeding that tolerance retains its direction.
  const reliableDigits =
    tolerance > 0
      ? Math.min(
          100,
          Math.max(
            1,
            Math.ceil(Math.log10(Math.abs(difference))) -
              Math.floor(Math.log10(tolerance)),
          ),
        )
      : 100;
  const roundedDelta =
    Math.abs(difference) <= tolerance
      ? 0
      : tolerance > 0
        ? Number(difference.toPrecision(reliableDigits))
        : difference;
  const delta = Number.isFinite(roundedDelta) ? roundedDelta : difference;
  return {
    kind: delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'unchanged',
    delta,
    previousVolume,
  };
};
