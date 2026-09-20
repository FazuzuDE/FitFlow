import {
  isSetComplete,
  LibraryExercise,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
} from './workout-model';
import { canonicalExerciseId } from './exercise-library';
import { muscleLabel } from './exercise-taxonomy';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export type IdFactory = () => string;

const defaultIdFactory: IdFactory = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const createExercise = (
  exercise: LibraryExercise,
  idFactory: IdFactory = defaultIdFactory,
): WorkoutExercise => ({
  id: idFactory(),
  libraryId: exercise.id,
  name: exercise.name,
  muscle: muscleLabel(exercise.primaryMuscles[0]),
  sets: Array.from({ length: 3 }, () => ({
    id: idFactory(),
    weight: '',
    reps: '10',
  })),
});

export const startWorkout = (
  template: WorkoutTemplate,
  library: readonly LibraryExercise[],
  now = Date.now(),
  idFactory: IdFactory = defaultIdFactory,
): WorkoutSession => ({
  id: idFactory(),
  templateId: template.id,
  name: template.name,
  startedAt: now,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: template.exerciseIds
    .map((id) => {
      const canonicalId = canonicalExerciseId(id) ?? id;
      return library.find((item) => item.id === canonicalId);
    })
    .filter((item): item is LibraryExercise => Boolean(item))
    .map((item) => createExercise(item, idFactory)),
});

export const exerciseIdsMatch = (left: string, right: string): boolean =>
  (canonicalExerciseId(left) ?? left) === (canonicalExerciseId(right) ?? right);

export const updateSet = (
  session: WorkoutSession,
  exerciseIndex: number,
  setIndex: number,
  values: Partial<Pick<WorkoutSet, 'weight' | 'reps'>>,
): WorkoutSession => {
  const next = clone(session);
  if (isSetComplete(next.exercises[exerciseIndex].sets[setIndex]))
    return session;
  Object.assign(next.exercises[exerciseIndex].sets[setIndex], values);
  return next;
};

export const setInputIsValid = (set: WorkoutSet): boolean => {
  const normalizedWeight = set.weight.replace(',', '.').trim();
  const weight = Number(normalizedWeight);
  const reps = Number(set.reps.trim());
  return (
    normalizedWeight.length > 0 &&
    /^\d+(\.\d+)?$/.test(normalizedWeight) &&
    /^\d+$/.test(set.reps.trim()) &&
    Number.isFinite(weight) &&
    weight >= 0 &&
    Number.isInteger(reps) &&
    reps > 0
  );
};

export type CompleteSetResult = {
  session: WorkoutSession;
  startedRest: boolean;
  advancedExercise: boolean;
};

const nextIncompleteExerciseIndex = (
  session: WorkoutSession,
  afterIndex: number,
): number | undefined => {
  for (
    let index = afterIndex + 1;
    index < session.exercises.length;
    index += 1
  ) {
    if (session.exercises[index].sets.some((set) => !isSetComplete(set))) {
      return index;
    }
  }
  for (let index = 0; index < afterIndex; index += 1) {
    if (session.exercises[index].sets.some((set) => !isSetComplete(set)))
      return index;
  }
  return undefined;
};

export const toggleSet = (
  session: WorkoutSession,
  exerciseIndex: number,
  setIndex: number,
  now = Date.now(),
): CompleteSetResult => {
  const next = clone(session);
  const set = next.exercises[exerciseIndex].sets[setIndex];

  if (isSetComplete(set)) {
    delete set.completedAt;
    next.restEndsAt = undefined;
    next.currentExerciseIndex = exerciseIndex;
    return { session: next, startedRest: false, advancedExercise: false };
  }

  if (!setInputIsValid(set)) {
    throw new Error('Enter a valid weight and a whole number of reps.');
  }

  set.weight = set.weight.replace(',', '.').trim();
  set.reps = set.reps.trim();
  set.completedAt = now;
  next.restEndsAt = now + next.restDurationSeconds * 1000;

  const exerciseComplete =
    next.exercises[exerciseIndex].sets.every(isSetComplete);
  const followingIndex = exerciseComplete
    ? nextIncompleteExerciseIndex(next, exerciseIndex)
    : undefined;
  if (followingIndex !== undefined) next.currentExerciseIndex = followingIndex;
  if (workoutIsComplete(next)) next.restEndsAt = undefined;

  return {
    session: next,
    startedRest: !workoutIsComplete(next),
    advancedExercise: followingIndex !== undefined,
  };
};

export const addSet = (
  session: WorkoutSession,
  exerciseIndex: number,
  idFactory: IdFactory = defaultIdFactory,
): WorkoutSession => {
  const next = clone(session);
  const previous = next.exercises[exerciseIndex].sets.at(-1);
  next.exercises[exerciseIndex].sets.push({
    id: idFactory(),
    weight: previous?.weight ?? '',
    reps: previous?.reps ?? '10',
  });
  return next;
};

export const removeSet = (
  session: WorkoutSession,
  exerciseIndex: number,
  setIndex: number,
): WorkoutSession => {
  const next = clone(session);
  if (next.exercises[exerciseIndex].sets.length <= 1) return next;
  next.exercises[exerciseIndex].sets.splice(setIndex, 1);
  return next;
};

export const appendExercise = (
  session: WorkoutSession,
  exercise: LibraryExercise,
  idFactory: IdFactory = defaultIdFactory,
): WorkoutSession => {
  const next = clone(session);
  next.exercises.push(createExercise(exercise, idFactory));
  return next;
};

export const setCurrentExercise = (
  session: WorkoutSession,
  index: number,
): WorkoutSession => ({
  ...session,
  currentExerciseIndex: Math.max(
    0,
    Math.min(index, session.exercises.length - 1),
  ),
});

export const restartRest = (
  session: WorkoutSession,
  now = Date.now(),
): WorkoutSession => ({
  ...session,
  restEndsAt: now + session.restDurationSeconds * 1000,
});

export const extendRest = (
  session: WorkoutSession,
  seconds: number,
  now = Date.now(),
): WorkoutSession => ({
  ...session,
  restEndsAt: Math.max(
    now,
    Math.max(session.restEndsAt ?? now, now) + seconds * 1000,
  ),
});

export const skipRest = (session: WorkoutSession): WorkoutSession => ({
  ...session,
  restEndsAt: undefined,
});

export const remainingRestSeconds = (
  session: WorkoutSession,
  now = Date.now(),
): number =>
  session.restEndsAt
    ? Math.max(0, Math.ceil((session.restEndsAt - now) / 1000))
    : 0;

export const completedSetCount = (session: WorkoutSession): number =>
  session.exercises.reduce(
    (count, exercise) => count + exercise.sets.filter(isSetComplete).length,
    0,
  );

export const totalSetCount = (session: WorkoutSession): number =>
  session.exercises.reduce(
    (count, exercise) => count + exercise.sets.length,
    0,
  );

export const workoutIsComplete = (session: WorkoutSession): boolean =>
  totalSetCount(session) > 0 &&
  completedSetCount(session) === totalSetCount(session);

export const finishWorkout = (
  session: WorkoutSession,
  now = Date.now(),
): WorkoutSession => {
  if (completedSetCount(session) === 0) {
    throw new Error('Complete at least one set before finishing.');
  }
  return { ...session, finishedAt: now, restEndsAt: undefined };
};
