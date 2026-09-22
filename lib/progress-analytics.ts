import { canonicalExerciseId } from './exercise-library';
import { completedSetMetrics, volume } from './workout-metrics';
import type { WorkoutSession } from './workout-model';

export type WorkoutVolume = {
  workoutId: string;
  finishedAt: number;
  volume: number;
};

export type EstimatedOneRepMaxRecord = {
  identityKey: string;
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

type StableExerciseIdentity = {
  identityKey: string;
  exerciseId: string;
};

const completedAt = (session: WorkoutSession): number =>
  session.finishedAt ?? session.startedAt;

const stableExerciseId = (
  session: WorkoutSession,
  exercise: WorkoutSession['exercises'][number],
): StableExerciseIdentity => {
  const savedId = exercise.libraryId.trim();
  const canonicalId = canonicalExerciseId(savedId);
  if (canonicalId) {
    return {
      identityKey: `canonical:${canonicalId}`,
      exerciseId: canonicalId,
    };
  }
  if (savedId) {
    return {
      identityKey: `unknown:${JSON.stringify(savedId)}`,
      exerciseId: savedId,
    };
  }
  const snapshotKey = `snapshot:${JSON.stringify([session.id, exercise.id])}`;
  return { identityKey: snapshotKey, exerciseId: snapshotKey };
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
      const identity = stableExerciseId(session, exercise);
      for (const savedSet of exercise.sets) {
        if (typeof savedSet.completedAt !== 'number') continue;
        const metrics = completedSetMetrics(savedSet);
        if (!metrics) {
          excludedSampleCount += 1;
          continue;
        }

        const sourceKey = JSON.stringify([
          session.id,
          exercise.id,
          savedSet.id,
        ]);
        const record: RecordCandidate = {
          identityKey: identity.identityKey,
          exerciseId: identity.exerciseId,
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
        const current = aggregates.get(identity.identityKey);
        if (!current) {
          aggregates.set(identity.identityKey, { best: record, label });
          continue;
        }
        if (isBetterRecord(record, current.best)) current.best = record;
        if (isNewerLabel(label, current.label)) current.label = label;
      }
    }
  }

  const estimatedOneRepMaxRecords = [...aggregates.values()]
    .map(({ best, label }) => ({
      identityKey: best.identityKey,
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
        left.identityKey.localeCompare(right.identityKey),
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
