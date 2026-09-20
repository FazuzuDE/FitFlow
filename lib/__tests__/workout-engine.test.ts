import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import {
  addSet,
  appendExercise,
  completedSetCount,
  createExercise,
  exerciseIdsMatch,
  extendRest,
  finishWorkout,
  remainingRestSeconds,
  removeSet,
  restartRest,
  setCurrentExercise,
  setInputIsValid,
  skipRest,
  startWorkout,
  toggleSet,
  totalSetCount,
  updateSet,
  workoutIsComplete,
} from '../workout-engine';
import { volume } from '../workout-metrics';
import {
  WorkoutRepository,
  STATE_KEY,
  KeyValueStorage,
} from '../workout-repository';
import { WorkoutStore } from '../workout-store';

function memoryStorage(): KeyValueStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
  };
}
const start = () => startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
const logSet = (session = start(), ei = 0, si = 0, now = 2000) =>
  toggleSet(
    updateSet(session, ei, si, { weight: '80,5', reps: '10' }),
    ei,
    si,
    now,
  ).session;

describe('workout engine', () => {
  it('resolves legacy template ids to canonical snapshot ids', () => {
    const session = startWorkout(
      { id: 'legacy', name: 'Legacy', exerciseIds: ['bench', 'row'] },
      exerciseLibrary,
      1000,
    );

    expect(session.exercises.map((item) => item.libraryId)).toEqual([
      'barbell-bench-press',
      'seated-cable-row',
    ]);
  });

  it('snapshots canonical catalog metadata without live joins', () => {
    const catalogExercise = {
      ...exerciseLibrary[0],
      primaryMuscles: [...exerciseLibrary[0].primaryMuscles],
    };
    const snapshot = createExercise(catalogExercise, () => 'snapshot-id');

    catalogExercise.name = 'Renamed later';
    catalogExercise.primaryMuscles[0] = 'triceps';

    expect(snapshot).toMatchObject({
      libraryId: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      muscle: 'Chest',
    });
  });

  it('matches legacy history ids against canonical catalog ids', () => {
    expect(exerciseIdsMatch('bench', 'barbell-bench-press')).toBe(true);
    expect(exerciseIdsMatch('bench', 'barbell-back-squat')).toBe(false);
    expect(exerciseIdsMatch('custom-id', 'custom-id')).toBe(true);
  });

  it('starts isolated snapshots and leaves the catalog untouched', () => {
    const one = start(),
      two = start();
    expect(one.id).not.toBe(two.id);
    expect(one.exercises[0].sets[0].id).not.toBe(two.exercises[0].sets[0].id);
    expect(totalSetCount(one)).toBe(12);
    expect(one.restEndsAt).toBeUndefined();
    const edited = updateSet(one, 0, 0, { weight: '50' });
    expect(one.exercises[0].sets[0].weight).toBe('');
    expect(edited.exercises[0].sets[0].weight).toBe('50');
  });
  it.each([
    ['', '10'],
    ['-1', '10'],
    ['Infinity', '10'],
    ['50', '0'],
    ['50', '1.5'],
    ['50', '-2'],
    ['1e2', '10'],
    ['0x10', '10'],
  ])('rejects invalid completion %s × %s', (weight, reps) => {
    const session = updateSet(start(), 0, 0, { weight, reps });
    expect(() => toggleSet(session, 0, 0)).toThrow();
    expect(completedSetCount(session)).toBe(0);
  });
  it('accepts bodyweight zero and decimal comma, and only counts completed sets', () => {
    expect(setInputIsValid({ id: 'a', weight: '0', reps: '10' })).toBe(true);
    const logged = logSet();
    expect(logged.exercises[0].sets[0].weight).toBe('80.5');
    expect(volume(logged)).toBe(805);
    expect(updateSet(logged, 0, 0, { weight: '999' })).toEqual(logged);
    const undone = toggleSet(logged, 0, 0).session;
    expect(volume(undone)).toBe(0);
    expect(undone.restEndsAt).toBeUndefined();
  });
  it('advances only after the last set, wraps skipped exercises, and stops resting at the end', () => {
    let session = start();
    session = logSet(session, 0, 0);
    expect(session.currentExerciseIndex).toBe(0);
    session = logSet(logSet(session, 0, 1), 0, 2);
    expect(session.currentExerciseIndex).toBe(1);
    for (const ei of [3, 2, 1]) {
      session = setCurrentExercise(session, ei);
      for (let si = 0; si < 3; si++) session = logSet(session, ei, si);
      if (ei === 3) expect(session.currentExerciseIndex).toBe(1);
    }
    expect(workoutIsComplete(session)).toBe(true);
    expect(session.restEndsAt).toBeUndefined();
    expect(volume(session)).toBe(9660);
  });
  it('uses absolute time across navigation, backgrounding and restart', () => {
    let session = logSet();
    expect(remainingRestSeconds(session, 32000)).toBe(60);
    expect(remainingRestSeconds(session, 1_000_000)).toBe(0);
    session = extendRest(session, 15, 32000);
    expect(remainingRestSeconds(session, 32000)).toBe(75);
    session = extendRest(session, -15, 32000);
    expect(remainingRestSeconds(session, 32000)).toBe(60);
    expect(remainingRestSeconds(restartRest(session, 32000), 32000)).toBe(90);
    expect(remainingRestSeconds(skipRest(session), 32000)).toBe(0);
  });
  it('copies previous set defaults without completion and keeps at least one set', () => {
    let session = logSet(start(), 0, 2);
    session = addSet(session, 0);
    expect(session.exercises[0].sets[3]).toMatchObject({
      weight: '80.5',
      reps: '10',
    });
    expect(session.exercises[0].sets[3].completedAt).toBeUndefined();
    for (let i = 0; i < 6; i++) session = removeSet(session, 0, 0);
    expect(session.exercises[0].sets).toHaveLength(1);
    expect(appendExercise(session, exerciseLibrary[0]).exercises).toHaveLength(
      5,
    );
  });
  it('prevents empty finish and supports intentional partial finish', () => {
    expect(() => finishWorkout(start())).toThrow();
    expect(finishWorkout(logSet(), 6000)).toMatchObject({
      finishedAt: 6000,
      restEndsAt: undefined,
    });
  });
});

describe('local persistence and migration', () => {
  it('runs Start → sets → rest → next → Finish → reload → History/Progress', async () => {
    const storage = memoryStorage();
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    store.start(defaultTemplates[0]);
    for (let ei = 0; ei < 4; ei++) {
      for (let si = 0; si < 3; si++) {
        store.updateWorkout((session) => logSet(session, ei, si));
      }
    }
    const result = await store.finish();
    expect(result).toBeDefined();
    const restored = new WorkoutStore(new WorkoutRepository(storage));
    await restored.load();
    expect(restored.getSnapshot().data.activeWorkout).toBeNull();
    expect(restored.getSnapshot().data.history).toHaveLength(1);
    expect(volume(restored.getSnapshot().data.history[0])).toBe(9660);
  });
  it('restores active inputs and timer after reopening', async () => {
    const storage = memoryStorage(),
      repo = new WorkoutRepository(storage);
    const state = await repo.load();
    await repo.save({ ...state, activeWorkout: logSet() });
    const restored = await new WorkoutRepository(storage).load();
    expect(restored.activeWorkout?.exercises[0].sets[0].weight).toBe('80.5');
    expect(remainingRestSeconds(restored.activeWorkout!, 32000)).toBe(60);
  });
  it('migrates legacy sets/templates and retains the original keys', async () => {
    const storage = memoryStorage();
    const legacy = {
      id: 'old',
      name: 'Old workout',
      startedAt: 1000,
      exercises: [
        {
          id: 'bench-12',
          name: 'Bench',
          muscle: 'Chest',
          sets: [{ id: 's', weight: '50', reps: '8', done: true }],
        },
      ],
    };
    storage.values.set('fitflow_active', JSON.stringify(legacy));
    storage.values.set(
      'fitflow_templates',
      JSON.stringify([
        { id: 'custom', name: 'Custom', exerciseIds: ['bench'] },
      ]),
    );
    const state = await new WorkoutRepository(storage).load();
    expect(volume(state.activeWorkout!)).toBe(400);
    expect(state.templates[0].name).toBe('Custom');
    expect(storage.values.has('fitflow_active')).toBe(true);
    expect(storage.values.has(STATE_KEY)).toBe(true);
  });
  it('recovers only a legacy interrupted finish without duplicating history', async () => {
    const storage = memoryStorage();
    const active = {
      id: 'interrupted',
      name: 'Old workout',
      startedAt: 1000,
      exercises: [
        {
          id: 'bench-12',
          name: 'Bench',
          muscle: 'Chest',
          sets: [{ id: 's', weight: '50', reps: '8', done: true }],
        },
      ],
    };
    storage.values.set('fitflow_active', JSON.stringify(active));
    storage.values.set(
      'fitflow_history',
      JSON.stringify([{ ...active, finishedAt: 2000 }]),
    );
    const state = await new WorkoutRepository(storage).load();
    expect(state.activeWorkout).toBeNull();
    expect(state.history).toHaveLength(1);
    expect(state.history[0].finishedAt).toBe(2000);
  });
  it.each([
    'invalid JSON',
    '{"schemaVersion":2}',
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: { id: 'bad', name: 'Bad', startedAt: 1, exercises: [{}] },
      history: [],
      templates: [],
    }),
  ])('keeps unreadable data intact and blocks edits: %s', async (raw) => {
    const storage = memoryStorage();
    storage.values.set(STATE_KEY, raw);
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    store.start(defaultTemplates[0]);
    expect(store.getSnapshot().ready).toBe(false);
    expect(store.getSnapshot().error).not.toBe('');
    expect(storage.values.get(STATE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it.each([
    [
      'duplicate history ids',
      (() => {
        const completed = finishWorkout(logSet(), 6000);
        return { activeWorkout: null, history: [completed, completed] };
      })(),
    ],
    [
      'an unfinished history entry',
      { activeWorkout: null, history: [logSet()] },
    ],
    [
      'a finished active workout',
      { activeWorkout: finishWorkout(logSet(), 6000), history: [] },
    ],
    [
      'an out-of-range current exercise',
      {
        activeWorkout: { ...logSet(), currentExerciseIndex: 99 },
        history: [],
      },
    ],
    [
      'a missing rest duration',
      (() => {
        const { restDurationSeconds: _removed, ...activeWorkout } = logSet();
        return { activeWorkout, history: [] };
      })(),
    ],
    [
      'a missing exercise library id',
      (() => {
        const activeWorkout = logSet();
        const { libraryId: _removed, ...exercise } = activeWorkout.exercises[0];
        return {
          activeWorkout: {
            ...activeWorkout,
            exercises: [exercise, ...activeWorkout.exercises.slice(1)],
          },
          history: [],
        };
      })(),
    ],
  ])('preserves strict v1 data containing %s', async (_label, sessions) => {
    const storage = memoryStorage();
    const raw = JSON.stringify({
      schemaVersion: 1,
      ...sessions,
      templates: defaultTemplates,
    });
    storage.values.set(STATE_KEY, raw);
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    expect(store.getSnapshot().ready).toBe(false);
    expect(storage.values.get(STATE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('keeps a workout after failed Finish, retries safely and never duplicates it', async () => {
    const storage = memoryStorage(),
      store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    store.start(defaultTemplates[0]);
    store.updateWorkout((session) => logSet(session));
    await new Promise((resolve) => setTimeout(resolve, 0));
    jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('disk full'));
    expect(await store.finish()).toBeUndefined();
    expect(store.getSnapshot().data.activeWorkout).not.toBeNull();
    expect(store.getSnapshot().data.history).toHaveLength(0);
    expect(store.getSnapshot().error).toContain('could not be saved');
    const [first, second] = await Promise.all([store.finish(), store.finish()]);
    expect(first).toBeDefined();
    expect(second).toBeUndefined();
    expect(store.getSnapshot().data.history).toHaveLength(1);
  });
  it('serializes slow edits before Finish instead of resurrecting active workouts', async () => {
    const storage = memoryStorage(),
      repo = new WorkoutRepository(storage);
    const state = await repo.load();
    let release!: () => void;
    jest.mocked(storage.setItem).mockImplementationOnce(async (key, value) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      storage.values.set(key, value);
    });
    const active = logSet();
    const first = repo.save({ ...state, activeWorkout: active });
    await Promise.resolve();
    await Promise.resolve();
    const second = repo.save({
      ...state,
      activeWorkout: null,
      history: [finishWorkout(active)],
    });
    release();
    await Promise.all([first, second]);
    expect((await repo.load()).activeWorkout).toBeNull();
    expect((await repo.load()).history).toHaveLength(1);
  });
  it('does not replace an active workout and retries a failed draft save', async () => {
    const storage = memoryStorage(),
      store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    store.start(defaultTemplates[0]);
    expect(() => store.start(defaultTemplates[1])).toThrow('Resume');
    await new Promise((resolve) => setTimeout(resolve, 0));
    jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('disk full'));
    store.updateWorkout((session) => logSet(session));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.getSnapshot().error).toContain('not saved');
    await store.retry();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.getSnapshot().error).toBe('');
    expect(
      volume((await new WorkoutRepository(storage).load()).activeWorkout!),
    ).toBe(805);
  });
});
