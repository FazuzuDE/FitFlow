import { defaultTemplates } from './workout-catalog';
import { WorkoutSession, WorkoutState, WorkoutTemplate } from './workout-model';
import { validPlannedExerciseShape } from './planned-exercise';
import { canonicalExerciseId } from './exercise-library';

export const STATE_KEY = 'fitflow_state_v1';
export const LEGACY_KEYS = [
  'fitflow_history',
  'fitflow_active',
  'fitflow_templates',
] as const;

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const number = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const optionalNumber = (value: unknown) => value === undefined || number(value);
const string = (value: unknown): value is string => typeof value === 'string';
const invalid = (): never => {
  throw new Error(
    'Saved workout data could not be read. No data has been overwritten.',
  );
};

function parse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return invalid();
  }
}

function template(value: unknown): WorkoutTemplate {
  if (
    !object(value) ||
    !string(value.id) ||
    !string(value.name) ||
    !Array.isArray(value.exerciseIds) ||
    !value.exerciseIds.every(string)
  )
    return invalid();
  const exerciseIds = value.exerciseIds as string[];
  let plannedExercises: WorkoutTemplate['plannedExercises'];
  if (value.plannedExercises !== undefined) {
    if (
      !Array.isArray(value.plannedExercises) ||
      !value.plannedExercises.every(validPlannedExerciseShape)
    )
      return invalid();
    const canonical = (id: string) => canonicalExerciseId(id) ?? id;
    const availableIds = new Set(exerciseIds.map(canonical));
    const ids = value.plannedExercises.map((item) =>
      canonical(item.exerciseId),
    );
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !availableIds.has(id))
    )
      return invalid();
    plannedExercises = value.plannedExercises.map((item) => ({ ...item }));
  }
  return {
    id: value.id,
    name: value.name,
    exerciseIds,
    ...(plannedExercises === undefined ? {} : { plannedExercises }),
  };
}

type SessionKind = 'active' | 'history';

// Current v1 documents are strict: invalid nested data must stay untouched so a
// bad field can never silently reset an in-progress workout. Only the separate
// legacy-key migration below may fill fields that did not exist in that format.
function session(
  value: unknown,
  kind: SessionKind,
  legacy = false,
): WorkoutSession {
  if (
    !object(value) ||
    !string(value.id) ||
    !string(value.name) ||
    !number(value.startedAt) ||
    !optionalNumber(value.finishedAt) ||
    !optionalNumber(value.restEndsAt) ||
    !Array.isArray(value.exercises)
  )
    return invalid();
  const startedAt = value.startedAt;
  const finishedAt = value.finishedAt as number | undefined;
  if (
    (kind === 'active' && finishedAt !== undefined) ||
    (kind === 'history' &&
      (finishedAt === undefined ||
        finishedAt < startedAt ||
        value.restEndsAt !== undefined))
  )
    return invalid();
  const exercises = value.exercises.map((exercise) => {
    if (
      !object(exercise) ||
      !string(exercise.id) ||
      !string(exercise.name) ||
      !string(exercise.muscle) ||
      (!legacy && !string(exercise.libraryId)) ||
      !Array.isArray(exercise.sets)
    )
      return invalid();
    return {
      id: exercise.id,
      libraryId: string(exercise.libraryId)
        ? exercise.libraryId
        : exercise.id.split('-')[0],
      name: exercise.name,
      muscle: exercise.muscle,
      sets: exercise.sets.map((set) => {
        if (
          !object(set) ||
          !string(set.id) ||
          !string(set.weight) ||
          !string(set.reps) ||
          !optionalNumber(set.completedAt) ||
          (legacy
            ? set.done !== undefined && typeof set.done !== 'boolean'
            : set.done !== undefined)
        )
          return invalid();
        return {
          id: set.id,
          weight: legacy ? set.weight.replace(',', '.') : set.weight,
          reps: set.reps,
          completedAt:
            (set.completedAt as number | undefined) ??
            (legacy && set.done === true
              ? (finishedAt ?? startedAt)
              : undefined),
        };
      }),
    };
  });
  if (
    !legacy &&
    (!Number.isInteger(value.currentExerciseIndex) ||
      !number(value.currentExerciseIndex) ||
      (exercises.length === 0
        ? value.currentExerciseIndex !== 0
        : value.currentExerciseIndex >= exercises.length) ||
      !Number.isInteger(value.restDurationSeconds) ||
      !number(value.restDurationSeconds) ||
      value.restDurationSeconds === 0 ||
      !string(value.templateId))
  )
    return invalid();
  const index = Number.isInteger(value.currentExerciseIndex)
    ? Number(value.currentExerciseIndex)
    : 0;
  return {
    id: value.id,
    name: value.name,
    templateId: string(value.templateId) ? value.templateId : 'legacy',
    startedAt,
    finishedAt,
    currentExerciseIndex: Math.max(0, Math.min(index, exercises.length - 1)),
    restDurationSeconds: number(value.restDurationSeconds)
      ? value.restDurationSeconds
      : 90,
    restEndsAt: value.restEndsAt as number | undefined,
    exercises,
  };
}

export const emptyWorkoutState = (): WorkoutState => ({
  schemaVersion: 1,
  activeWorkout: null,
  history: [],
  templates: defaultTemplates,
});

function normalize(value: unknown, legacy = false): WorkoutState {
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.history) ||
    !Array.isArray(value.templates)
  )
    return invalid();
  const history = value.history.map((item) => session(item, 'history', legacy));
  const active =
    value.activeWorkout === null
      ? null
      : session(value.activeWorkout, 'active', legacy);
  const historyIds = new Set(history.map((item) => item.id));
  if (historyIds.size !== history.length) return invalid();
  if (!legacy && active && historyIds.has(active.id)) return invalid();
  // A duplicated active/history session can only be recovered while importing
  // the pre-v1 multi-key format, where an interrupted finish was non-atomic.
  return {
    schemaVersion: 1,
    history,
    activeWorkout: active && !historyIds.has(active.id) ? active : null,
    templates: value.templates.map(template),
  };
}

export class WorkoutRepository {
  private pending: Promise<void> = Promise.resolve();
  constructor(private readonly storage: KeyValueStorage) {}

  async load(): Promise<WorkoutState> {
    const raw = await this.storage.getItem(STATE_KEY);
    if (raw !== null) return normalize(parse(raw));
    const [history, active, templates] = await Promise.all(
      LEGACY_KEYS.map((key) => this.storage.getItem(key)),
    );
    const state = normalize(
      {
        schemaVersion: 1,
        history: history === null ? [] : parse(history),
        activeWorkout: active === null ? null : parse(active),
        templates: templates === null ? defaultTemplates : parse(templates),
      },
      true,
    );
    // One document commits history + active atomically; keep legacy keys as a backup.
    await this.save(state);
    return state;
  }

  save(state: WorkoutState): Promise<void> {
    const payload = JSON.stringify(state);
    const write = this.pending
      .catch(() => {})
      .then(() => this.storage.setItem(STATE_KEY, payload));
    this.pending = write;
    return write;
  }

  async waitForWrites(): Promise<void> {
    // A failed write is still settled; reset intentionally removes local data.
    await this.pending.catch(() => undefined);
  }
}
