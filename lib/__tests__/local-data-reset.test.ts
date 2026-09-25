import { LocalDataResetError, resetLocalData } from '../local-data-reset';
import { WorkoutRepository } from '../workout-repository';
import { defaultTemplates } from '../workout-catalog';

const original = new Map([
  ['cresum_onboarding_v1', '{"version":1}'],
  ['cresum_hidden_builtins_v1', '{"version":1,"ids":["upper"]}'],
  ['fitflow_history', '[{"id":"legacy"}]'],
  ['fitflow_active', '{"id":"active"}'],
  ['fitflow_templates', '[{"id":"custom"}]'],
  ['fitflow_state_v1', '{"schemaVersion":1}'],
  ['unrelated_app_key', 'keep me'],
]);

function memoryStorage() {
  const values = new Map(original);
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
}

it('waits for pending writes, then deletes all CRESUM storage keys including hidden built-ins', async () => {
  const storage = memoryStorage();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const reset = resetLocalData(storage, () => pending);
  await Promise.resolve();
  expect(storage.removeItem).not.toHaveBeenCalled();
  release();
  await reset;
  expect([...storage.values.entries()]).toEqual([
    ['unrelated_app_key', 'keep me'],
  ]);
});

it('restores the original values after a partial remove failure', async () => {
  const storage = memoryStorage();
  const remove = storage.removeItem.getMockImplementation()!;
  storage.removeItem.mockImplementation(async (key: string) => {
    if (key === 'fitflow_active') throw new Error('disk failure');
    return remove(key);
  });
  await expect(resetLocalData(storage, async () => {})).rejects.toThrow(
    'Local data could not be reset',
  );
  expect(storage.values).toEqual(original);
});

it('does not remove anything when the backup cannot be read', async () => {
  const storage = memoryStorage();
  storage.getItem.mockRejectedValueOnce(new Error('read failure'));
  await expect(resetLocalData(storage, async () => {})).rejects.toThrow(
    'No data was removed',
  );
  expect(storage.removeItem).not.toHaveBeenCalled();
  expect(storage.values).toEqual(original);
});

it('reports incomplete recovery rather than claiming saved data was restored', async () => {
  const storage = memoryStorage();
  storage.removeItem.mockImplementation(async (key: string) => {
    storage.values.delete(key);
    if (key === 'fitflow_active') throw new Error('remove failure');
  });
  storage.setItem.mockRejectedValueOnce(new Error('restore failure'));
  await expect(resetLocalData(storage, async () => {})).rejects.toMatchObject({
    recoveryIncomplete: true,
    message: expect.stringContaining('recovery was incomplete'),
  } satisfies Partial<LocalDataResetError>);
});

it('rejects a silent incomplete deletion and rolls back rather than reporting success', async () => {
  const storage = memoryStorage();
  const remove = storage.removeItem.getMockImplementation()!;
  storage.removeItem.mockImplementation(async (key: string) => {
    if (key === 'fitflow_state_v1') return;
    return remove(key);
  });
  await expect(resetLocalData(storage, async () => {})).rejects.toThrow(
    'Local data could not be reset',
  );
  expect(storage.values).toEqual(original);
});

it('cannot reimport old legacy workouts on the next launch after reset', async () => {
  const storage = memoryStorage();
  await resetLocalData(storage, async () => {});
  const workout = await new WorkoutRepository(storage).load();
  expect(workout.activeWorkout).toBeNull();
  expect(workout.history).toEqual([]);
  expect(workout.templates).toEqual(defaultTemplates);
});
