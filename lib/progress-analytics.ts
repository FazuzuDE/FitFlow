import { canonicalExerciseId } from './exercise-library';
import { completedSetMetrics, volume } from './workout-metrics';
import type { WorkoutSession } from './workout-model';

export type WorkoutVolume = {
  workoutId: string;
  finishedAt: number;
  volume: number;
};

export type EstimatedOneRepMaxRecord = {
  exerciseId: string;
  name: string;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
  recordedAt: number;
};

export type ProgressAnalytics = {
  totalVolume: number;
  workoutVolumes: WorkoutVolume[];
  estimatedOneRepMaxRecords: EstimatedOneRepMaxRecord[];
  excludedSampleCount: number;
};

type RecordCandidate = Omit<EstimatedOneRepMaxRecord, 'name'> & {
  sourceKey: string;
};

type LabelCandidate = {
  name: string;
  finishedAt: number;
  completedAt: number;
  sourceKey: string;
};

type ExerciseAggregate = {
  best: RecordCandidate;
  label: LabelCandidate;
};

const completedAt = (session: WorkoutSession): number =>
  session.finishedAt ?? session.startedAt;

const stableExerciseId = (
  session: WorkoutSession,
  exercise: WorkoutSession['exercises'][number],
): string => {
  const savedId = exercise.libraryId.trim();
  return (
    canonicalExerciseId(savedId) ??
    (savedId || `snapshot:${session.id}:${exercise.id}`)
  );
};

const sourceWinsTie = (left: string, right: string): boolean => left < right;

const isBetterRecord = (
  candidate: RecordCandidate,
  current: RecordCandidate,
): boolean =>
  candidate.estimatedOneRepMax > current.estimatedOneRepMax ||
  (candidate.estimatedOneRepMax === current.estimatedOneRepMax &&
    (candidate.recordedAt > current.recordedAt ||
      (candidate.recordedAt === current.recordedAt &&
        sourceWinsTie(candidate.sourceKey, current.sourceKey))));

const isNewerLabel = (
  candidate: LabelCandidate,
  current: LabelCandidate,
): boolean =>
  candidate.finishedAt > current.finishedAt ||
  (candidate.finishedAt === current.finishedAt &&
    (candidate.completedAt > current.completedAt ||
      (candidate.completedAt === current.completedAt &&
        sourceWinsTie(candidate.sourceKey, current.sourceKey))));

const compareDescending = (left: number, right: number): number =>
  left === right ? 0 : left > right ? -1 : 1;

export const projectProgressAnalytics = (
  history: readonly WorkoutSession[],
): ProgressAnalytics => {
  const aggregates = new Map<string, ExerciseAggregate>();
  let excludedSampleCount = 0;

  const workoutVolumes = history
    .map((session) => ({
      workoutId: session.id,
      finishedAt: completedAt(session),
      volume: volume(session),
    }))
    .sort(
      (left, right) =>
        compareDescending(left.finishedAt, right.finishedAt) ||
        left.workoutId.localeCompare(right.workoutId),
    );

  for (const session of history) {
    for (const exercise of session.exercises) {
      const exerciseId = stableExerciseId(session, exercise);
      for (const savedSet of exercise.sets) {
        if (typeof savedSet.completedAt !== 'number') continue;
        const metrics = completedSetMetrics(savedSet);
        if (!metrics) {
          excludedSampleCount += 1;
          continue;
        }

        const sourceKey = `${session.id}\u0000${exercise.id}\u0000${savedSet.id}`;
        const record: RecordCandidate = {
          exerciseId,
          weight: metrics.weight,
          reps: metrics.reps,
          estimatedOneRepMax: metrics.estimatedOneRepMax,
          recordedAt: savedSet.completedAt,
          sourceKey,
        };
        const label: LabelCandidate = {
          name: exercise.name,
          finishedAt: completedAt(session),
          completedAt: savedSet.completedAt,
          sourceKey,
        };
        const current = aggregates.get(exerciseId);
        if (!current) {
          aggregates.set(exerciseId, { best: record, label });
          continue;
        }
        if (isBetterRecord(record, current.best)) current.best = record;
        if (isNewerLabel(label, current.label)) current.label = label;
      }
    }
  }

  const estimatedOneRepMaxRecords = [...aggregates.values()]
    .map(({ best, label }) => ({
      exerciseId: best.exerciseId,
      name: label.name,
      weight: best.weight,
      reps: best.reps,
      estimatedOneRepMax: best.estimatedOneRepMax,
      recordedAt: best.recordedAt,
    }))
    .sort(
      (left, right) =>
        compareDescending(left.estimatedOneRepMax, right.estimatedOneRepMax) ||
        compareDescending(left.recordedAt, right.recordedAt) ||
        left.exerciseId.localeCompare(right.exerciseId),
    );

  const totalVolume = workoutVolumes.reduce((total, item) => {
    const next = total + item.volume;
    return Number.isFinite(next) ? next : total;
  }, 0);

  return {
    totalVolume,
    workoutVolumes,
    estimatedOneRepMaxRecords,
    excludedSampleCount,
  };
};
