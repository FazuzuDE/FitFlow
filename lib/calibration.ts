import { canonicalExerciseId, findExercise } from './exercise-library';
import { completedSetMetrics } from './workout-metrics';
import {
  isSetComplete,
  type WorkoutSession,
  type WorkoutSet,
} from './workout-model';

export type CalibrationLoadKind =
  'external' | 'bodyweight' | 'assistance' | 'unsupported';
export type CalibrationPathChoice = 'known' | 'help' | 'use-today';
export type CalibrationFeedback = 'too-easy' | 'good' | 'hard' | 'too-hard';
export type CalibrationState = {
  version: 1;
  paths: {
    sessionId: string;
    exerciseId: string;
    choice: CalibrationPathChoice;
  }[];
  feedback: {
    sessionId: string;
    exerciseId: string;
    setId: string;
    completedAt?: number;
    failedAt?: number;
    feedback: CalibrationFeedback;
  }[];
};

export const initialCalibrationState = (): CalibrationState => ({
  version: 1,
  paths: [],
  feedback: [],
});

const assistedIds = new Set(['assisted-pull-up', 'assisted-dip-machine']);
const externalEquipment = new Set([
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'smith-machine',
  'kettlebell',
  'ez-bar',
]);
const identity = (id: string) => canonicalExerciseId(id) ?? id;

export function calibrationLoadKind(exerciseId: string): CalibrationLoadKind {
  const id = identity(exerciseId);
  const exercise = findExercise(id);
  if (!exercise) return 'unsupported';
  if (assistedIds.has(id)) return 'assistance';
  if (exercise.equipment.includes('bodyweight')) return 'bodyweight';
  return exercise.equipment.some((item) => externalEquipment.has(item))
    ? 'external'
    : 'unsupported';
}

export function needsCalibration(
  exerciseId: string,
  history: readonly WorkoutSession[],
  now = Date.now(),
): boolean {
  if (calibrationLoadKind(exerciseId) !== 'external') return false;
  return !history.some(
    (session) =>
      typeof session.finishedAt === 'number' &&
      session.finishedAt <= now &&
      session.exercises.some(
        (exercise) =>
          identity(exercise.libraryId) === identity(exerciseId) &&
          exercise.sets.some(
            (set) => (completedSetMetrics(set)?.weight ?? 0) > 0,
          ),
      ),
  );
}

export function calibrationPath(
  state: CalibrationState,
  sessionId: string,
  exerciseId: string,
): CalibrationPathChoice | undefined {
  return state.paths.find(
    (item) =>
      item.sessionId === sessionId && item.exerciseId === identity(exerciseId),
  )?.choice;
}

export function chooseCalibrationPath(
  state: CalibrationState,
  sessionId: string,
  exerciseId: string,
  choice: CalibrationPathChoice,
): CalibrationState {
  if (!sessionId || calibrationLoadKind(exerciseId) !== 'external')
    return state;
  const canonicalId = identity(exerciseId);
  return {
    ...state,
    paths: [
      ...state.paths.filter(
        (item) =>
          item.sessionId !== sessionId || item.exerciseId !== canonicalId,
      ),
      { sessionId, exerciseId: canonicalId, choice },
    ],
  };
}

export function recordCalibrationFeedback(
  state: CalibrationState,
  session: WorkoutSession,
  exerciseId: string,
  setId: string,
  feedback: CalibrationFeedback,
): CalibrationState {
  const canonicalId = identity(exerciseId);
  if (calibrationLoadKind(canonicalId) !== 'external') return state;
  const set = session.exercises
    .filter((item) => identity(item.libraryId) === canonicalId)
    .flatMap((item) => item.sets)
    .find((item) => item.id === setId);
  if (
    !set ||
    !isSetComplete(set) ||
    (completedSetMetrics(set)?.weight ?? 0) <= 0
  )
    return state;
  return {
    ...state,
    feedback: [
      ...state.feedback.filter(
        (item) => item.sessionId !== session.id || item.setId !== setId,
      ),
      {
        sessionId: session.id,
        exerciseId: canonicalId,
        setId,
        completedAt: set.completedAt!,
        feedback,
      },
    ],
  };
}

export function recordFailedCalibrationAttempt(
  state: CalibrationState,
  session: WorkoutSession,
  exerciseId: string,
  setId: string,
  failedAt = Date.now(),
): CalibrationState {
  const canonicalId = identity(exerciseId);
  if (
    calibrationLoadKind(canonicalId) !== 'external' ||
    !Number.isFinite(failedAt) ||
    failedAt < 0
  )
    return state;
  const set = session.exercises
    .filter((item) => identity(item.libraryId) === canonicalId)
    .flatMap((item) => item.sets)
    .find((item) => item.id === setId);
  const normalized = set?.weight.replace(',', '.').trim() ?? '';
  if (
    !set ||
    isSetComplete(set) ||
    state.feedback.some(
      (item) =>
        item.sessionId === session.id &&
        item.setId === setId &&
        item.failedAt !== undefined,
    ) ||
    !/^\d+(\.\d+)?$/.test(normalized) ||
    !Number.isFinite(Number(normalized)) ||
    Number(normalized) <= 0
  )
    return state;
  return {
    ...state,
    feedback: [
      ...state.feedback,
      {
        sessionId: session.id,
        exerciseId: canonicalId,
        setId,
        failedAt,
        feedback: 'too-hard',
      },
    ],
  };
}

export function pendingCalibrationSet(
  state: CalibrationState,
  session: WorkoutSession,
  exerciseId: string,
  exerciseInstanceId: string,
): WorkoutSet | undefined {
  const canonicalId = identity(exerciseId);
  const exercise = session.exercises.find(
    (item) =>
      item.id === exerciseInstanceId &&
      identity(item.libraryId) === canonicalId,
  );
  const latest = (exercise?.sets ?? [])
    .filter(isSetComplete)
    .reduce<WorkoutSet | undefined>(
      (newest, set) =>
        !newest || set.completedAt! >= newest.completedAt! ? set : newest,
      undefined,
    );
  if (!latest || (completedSetMetrics(latest)?.weight ?? 0) <= 0) return;
  return state.feedback.some(
    (item) =>
      item.sessionId === session.id &&
      item.setId === latest.id &&
      item.completedAt === latest.completedAt,
  )
    ? undefined
    : latest;
}

export function calibrationAttemptCount(
  state: CalibrationState,
  session: WorkoutSession,
  exerciseId: string,
): number {
  const sets = session.exercises
    .filter((item) => identity(item.libraryId) === identity(exerciseId))
    .flatMap((item) => item.sets);
  return state.feedback.filter(
    (item) =>
      item.sessionId === session.id &&
      item.exerciseId === identity(exerciseId) &&
      sets.some(
        (set) =>
          set.id === item.setId &&
          (item.failedAt !== undefined || set.completedAt === item.completedAt),
      ),
  ).length;
}

export function latestCalibrationFeedback(
  state: CalibrationState,
  session: WorkoutSession,
  exerciseId: string,
  exerciseInstanceId: string,
): CalibrationFeedback | undefined {
  const exercise = session.exercises.find(
    (item) =>
      item.id === exerciseInstanceId &&
      identity(item.libraryId) === identity(exerciseId),
  );
  return [...state.feedback]
    .reverse()
    .find(
      (item) =>
        item.sessionId === session.id &&
        item.exerciseId === identity(exerciseId) &&
        exercise?.sets.some(
          (set) =>
            set.id === item.setId &&
            (item.failedAt !== undefined ||
              set.completedAt === item.completedAt),
        ),
    )?.feedback;
}

export const feedbackGuidance = (feedback: CalibrationFeedback): string => {
  switch (feedback) {
    case 'too-easy':
      return 'If you want another attempt, choose a small available increase and enter the actual weight. You can keep this load instead.';
    case 'good':
      return 'This load can become your Starting baseline after the workout is saved.';
    case 'hard':
      return 'Do not increase. You can keep or reduce the load for another attempt.';
    case 'too-hard':
      return 'Choose a controllable reduction and try again when ready.';
  }
};

export type StartingBaseline = {
  exerciseId: string;
  weight: number;
  reps: number;
  sessionId: string;
  setId: string;
};

export function startingBaseline(
  state: CalibrationState,
  history: readonly WorkoutSession[],
  exerciseId: string,
): StartingBaseline | undefined {
  if (calibrationLoadKind(exerciseId) !== 'external') return;
  const canonicalId = identity(exerciseId);
  const sessions = [...history]
    .filter((item) => typeof item.finishedAt === 'number')
    .sort((a, b) => a.finishedAt! - b.finishedAt!);
  for (const session of sessions) {
    const sets = session.exercises
      .filter((item) => identity(item.libraryId) === canonicalId)
      .flatMap((item) => item.sets);
    if (!sets.length) continue;
    const matching = state.feedback.filter(
      (item) =>
        item.sessionId === session.id &&
        item.exerciseId === canonicalId &&
        item.feedback === 'good' &&
        item.completedAt !== undefined,
    );
    for (const item of matching.reverse()) {
      const set = sets.find(
        (candidate) =>
          candidate.id === item.setId &&
          candidate.completedAt === item.completedAt,
      );
      if (!set) continue;
      const metrics = completedSetMetrics(set);
      if (!metrics || metrics.weight <= 0) continue;
      return {
        exerciseId: canonicalId,
        weight: metrics.weight,
        reps: metrics.reps,
        sessionId: session.id,
        setId: set.id,
      };
    }
  }
}
