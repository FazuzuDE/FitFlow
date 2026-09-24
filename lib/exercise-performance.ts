import { stableExerciseIdentity } from './progress-analytics';
import {
  filterProgressWorkouts,
  type ProgressPeriodId,
} from './progress-periods';
import { completedSetMetrics, completedSetTimestamp } from './workout-metrics';
import type { WorkoutSession } from './workout-model';

export type PerformanceExercise = {
  identityKey: string;
  name: string;
  sourceId: string;
};

export type PerformanceOccurrence = {
  workoutId: string;
  workoutName: string;
  exerciseSnapshotId: string;
  finishedAt: number;
  sets: { id: string; weight: number; reps: number }[];
};

export type EstimatedOneRepMaxPoint = {
  identityKey: string;
  workoutId: string;
  workoutName: string;
  finishedAt: number;
  exerciseSnapshotId: string;
  setId: string;
  exerciseIndex: number;
  setIndex: number;
  completedAt: number;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
};

const betterEstimate = (
  candidate: EstimatedOneRepMaxPoint,
  current: EstimatedOneRepMaxPoint,
): boolean =>
  candidate.estimatedOneRepMax > current.estimatedOneRepMax ||
  (candidate.estimatedOneRepMax === current.estimatedOneRepMax &&
    (candidate.completedAt > current.completedAt ||
      (candidate.completedAt === current.completedAt &&
        (candidate.exerciseSnapshotId < current.exerciseSnapshotId ||
          (candidate.exerciseSnapshotId === current.exerciseSnapshotId &&
            (candidate.setId < current.setId ||
              (candidate.setId === current.setId &&
                (candidate.exerciseIndex < current.exerciseIndex ||
                  (candidate.exerciseIndex === current.exerciseIndex &&
                    candidate.setIndex < current.setIndex)))))))));

export const projectEstimatedOneRepMaxSeries = (
  history: readonly WorkoutSession[],
  period: ProgressPeriodId,
  now: number,
  identityKey: string,
): EstimatedOneRepMaxPoint[] =>
  filterProgressWorkouts(history, period, now).flatMap((session) => {
    let best: EstimatedOneRepMaxPoint | undefined;
    session.exercises.forEach((exercise, exerciseIndex) => {
      if (stableExerciseIdentity(session, exercise).identityKey !== identityKey)
        return;
      exercise.sets.forEach((set, setIndex) => {
        const completedAt = completedSetTimestamp(set, session.finishedAt!);
        if (completedAt === undefined) return;
        const metrics = completedSetMetrics(set);
        if (!metrics) return;
        const candidate: EstimatedOneRepMaxPoint = {
          identityKey,
          workoutId: session.id,
          workoutName: session.name,
          finishedAt: session.finishedAt!,
          exerciseSnapshotId: exercise.id,
          setId: set.id,
          exerciseIndex,
          setIndex,
          completedAt,
          weight: metrics.weight,
          reps: metrics.reps,
          estimatedOneRepMax: metrics.estimatedOneRepMax,
        };
        if (!best || betterEstimate(candidate, best)) best = candidate;
      });
    });
    return best ? [best] : [];
  });

export const listPerformanceExercises = (
  history: readonly WorkoutSession[],
  now: number,
): PerformanceExercise[] => {
  const choices = new Map<string, PerformanceExercise>();
  for (const session of filterProgressWorkouts(history, 'ALL', now)) {
    for (const exercise of session.exercises) {
      if (!exercise.sets.some((set) => completedSetMetrics(set))) continue;
      const { identityKey } = stableExerciseIdentity(session, exercise);
      choices.set(identityKey, {
        identityKey,
        name: exercise.name,
        sourceId: exercise.libraryId.trim() || `${session.id} / ${exercise.id}`,
      });
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
