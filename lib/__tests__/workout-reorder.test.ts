import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import {
  appendExercise,
  moveWorkoutExercise,
  startWorkout,
  toggleSet,
  updateSet,
} from '../workout-engine';
import {
  emptyWorkoutState,
  STATE_KEY,
  WorkoutRepository,
} from '../workout-repository';
import { WorkoutStore } from '../workout-store';

const fixture = () => {
  let id = 0;
  let session = startWorkout(
    defaultTemplates[0],
    exerciseLibrary,
    1000,
    () => `id-${++id}`,
  );
  session = updateSet(session, 0, 0, { weight: '60.5', reps: '8' });
  return toggleSet(session, 0, 0, 2000).session;
};

it('moves an exercise downward while retaining current snapshot identity and logged state', () => {
  const before = fixture();
  const [first, second, third, fourth] = before.exercises;
  const next = moveWorkoutExercise(before, first.id, 2);
  expect(next.exercises).toEqual([second, third, first, fourth]);
  expect(next.currentExerciseIndex).toBe(2);
  expect(next.restEndsAt).toBe(before.restEndsAt);
  expect(next.exercises[2].sets).toEqual(first.sets);
  expect(before.exercises[0]).toBe(first);
  expect(before.currentExerciseIndex).toBe(0);
});

it('moves another exercise upward without switching the active exercise', () => {
  const before = fixture();
  const next = moveWorkoutExercise(before, before.exercises[3].id, 0);
  expect(next.exercises.map((item) => item.id)).toEqual([
    before.exercises[3].id,
    ...before.exercises.slice(0, 3).map((item) => item.id),
  ]);
  expect(next.exercises[next.currentExerciseIndex].id).toBe(
    before.exercises[0].id,
  );
});

it('distinguishes repeated library exercises by their session snapshot IDs', () => {
  const before = appendExercise(
    fixture(),
    exerciseLibrary.find(
      (item) => item.id === defaultTemplates[0].exerciseIds[0],
    )!,
    (() => {
      let id = 0;
      return () => `duplicate-${++id}`;
    })(),
  );
  const duplicate = before.exercises.at(-1)!;
  expect(duplicate.libraryId).toBe(before.exercises[0].libraryId);
  const next = moveWorkoutExercise(before, duplicate.id, 0);
  expect(next.exercises[0].id).toBe(duplicate.id);
  expect(next.currentExerciseIndex).toBe(1);
  expect(next.exercises[1].sets[0].completedAt).toBe(2000);
  expect(next.exercises[0].sets[0].completedAt).toBeUndefined();
});

it.each([-1, 4, 0.5, NaN, Infinity])(
  'ignores invalid destination %s',
  (target) => {
    const before = fixture();
    expect(moveWorkoutExercise(before, before.exercises[0].id, target)).toBe(
      before,
    );
  },
);

it('ignores absent IDs, unchanged positions and completed historical sessions', () => {
  const before = fixture();
  expect(moveWorkoutExercise(before, 'missing', 2)).toBe(before);
  expect(moveWorkoutExercise(before, before.exercises[0].id, 0)).toBe(before);
  const finished = { ...before, finishedAt: 5000 };
  expect(moveWorkoutExercise(finished, before.exercises[0].id, 2)).toBe(
    finished,
  );
});

it('automatic progression follows the reordered program', () => {
  let session = fixture();
  const original = session.exercises[0];
  session = moveWorkoutExercise(session, session.exercises[3].id, 1);
  const expectedNext = session.exercises[1].id;
  for (let i = 1; i < original.sets.length; i += 1) {
    session = updateSet(session, 0, i, { weight: '60' });
    session = toggleSet(session, 0, i, 3000 + i).session;
  }
  expect(session.exercises[session.currentExerciseIndex].id).toBe(expectedNext);
});

it('recovers the reordered active workout after reopening without modifying templates or history', async () => {
  const before = fixture();
  const previous = {
    ...before,
    id: 'history-id',
    finishedAt: 5000,
    restEndsAt: undefined,
  };
  const initial = {
    ...emptyWorkoutState(),
    activeWorkout: before,
    history: [previous],
  };
  const values = new Map([[STATE_KEY, JSON.stringify(initial)]]);
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const store = new WorkoutStore(new WorkoutRepository(storage));
  await store.load();
  store.updateWorkout((current) =>
    moveWorkoutExercise(current, before.exercises[0].id, 3),
  );
  await store.waitForPendingWrites();
  const reopened = new WorkoutStore(new WorkoutRepository(storage));
  await reopened.load();
  const data = reopened.getSnapshot().data;
  expect(data.activeWorkout?.exercises[3]).toEqual(before.exercises[0]);
  expect(data.activeWorkout?.currentExerciseIndex).toBe(3);
  expect(data.activeWorkout?.restEndsAt).toBe(before.restEndsAt);
  expect(data.templates).toEqual(initial.templates);
  expect(data.history).toEqual(initial.history);
  expect(data.schemaVersion).toBe(1);
});
