type VolumeSession = {
  exercises: {
    sets: {
      weight: string;
      reps: string;
      completedAt?: number;
      done?: boolean;
    }[];
  }[];
};

export const epley = (weight: number, reps: number): number =>
  reps <= 1 ? weight : weight * (1 + reps / 30);

type AnalyticsSet = VolumeSession['exercises'][number]['sets'][number];

// The legacy loader normalizes done-only sets to the workout completion time.
export const completedSetTimestamp = (
  set: AnalyticsSet,
  workoutFinishedAt: number,
): number | undefined => {
  const timestamp =
    set.completedAt ?? (set.done === true ? workoutFinishedAt : undefined);
  return typeof timestamp === 'number' &&
    Number.isFinite(timestamp) &&
    timestamp >= 0
    ? timestamp
    : undefined;
};

export type CompletedSetMetrics = {
  weight: number;
  reps: number;
  volume: number;
  estimatedOneRepMax: number;
};

const decimalWeight = /^\d+(\.\d+)?$/;
const wholeRepetitions = /^\d+$/;

export const completedSetMetrics = (
  set: AnalyticsSet,
): CompletedSetMetrics | undefined => {
  if (typeof set.completedAt !== 'number' && set.done !== true) return;

  const normalizedWeight = set.weight.replace(',', '.').trim();
  const normalizedReps = set.reps.trim();
  if (
    !decimalWeight.test(normalizedWeight) ||
    !wholeRepetitions.test(normalizedReps)
  )
    return;

  const weight = Number(normalizedWeight);
  const reps = Number(normalizedReps);
  if (
    !Number.isFinite(weight) ||
    weight < 0 ||
    !Number.isFinite(reps) ||
    !Number.isInteger(reps) ||
    reps <= 0
  )
    return;

  const setVolume = weight * reps;
  const estimatedOneRepMax = epley(weight, reps);
  if (!Number.isFinite(setVolume) || !Number.isFinite(estimatedOneRepMax))
    return;

  return { weight, reps, volume: setVolume, estimatedOneRepMax };
};

// Preserve the existing completed-set definition while keeping every derived
// analytics total finite for both current and legacy workout snapshots.
export const volume = (session: VolumeSession): number =>
  session.exercises
    .flatMap((exercise) => exercise.sets)
    .reduce((total, set) => {
      const sample = completedSetMetrics(set);
      if (!sample) return total;
      const next = total + sample.volume;
      return Number.isFinite(next) ? next : total;
    }, 0);
