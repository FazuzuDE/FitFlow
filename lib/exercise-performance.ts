import { stableExerciseIdentity } from './progress-analytics';
import {
  filterProgressWorkouts,
  type ProgressPeriodId,
} from './progress-periods';
import { completedSetMetrics } from './workout-metrics';
import type { WorkoutSession } from './workout-model';

export type PerformanceExercise = {
  identityKey: string;
  name: string;
};

export type PerformanceOccurrence = {
  workoutId: string;
  workoutName: string;
  exerciseSnapshotId: string;
  finishedAt: number;
  sets: { id: string; weight: number; reps: number }[];
};

export const listPerformanceExercises = (
  history: readonly WorkoutSession[],
  now: number,
): PerformanceExercise[] => {
  const choices = new Map<string, PerformanceExercise>();
  for (const session of filterProgressWorkouts(history, 'ALL', now)) {
    for (const exercise of session.exercises) {
      if (!exercise.sets.some((set) => completedSetMetrics(set))) continue;
      const { identityKey } = stableExerciseIdentity(session, exercise);
      choices.set(identityKey, { identityKey, name: exercise.name });
    }
  }
  return [...choices.values()].sort(
    (left, right) =>
      left.name.localeCompare(right.name) ||
      left.identityKey.localeCompare(right.identityKey),
  );
};

export const projectExercisePerformance = (
  history: readonly WorkoutSession[],
  period: ProgressPeriodId,
  now: number,
  identityKey: string,
): PerformanceOccurrence[] =>
  filterProgressWorkouts(history, period, now).flatMap((session) =>
    session.exercises.flatMap((exercise) => {
      if (
        stableExerciseIdentity(session, exercise).identityKey !== identityKey
      ) {
        return [];
      }
      const sets = exercise.sets.flatMap((savedSet) => {
        const metrics = completedSetMetrics(savedSet);
        return metrics
          ? [{ id: savedSet.id, weight: metrics.weight, reps: metrics.reps }]
          : [];
      });
      return sets.length
        ? [
            {
              workoutId: session.id,
              workoutName: session.name,
              exerciseSnapshotId: exercise.id,
              finishedAt: session.finishedAt!,
              sets,
            },
          ]
        : [];
    }),
  );
