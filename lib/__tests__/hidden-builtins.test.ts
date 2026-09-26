import { defaultTemplates } from '../workout-catalog';
import {
  HIDDEN_BUILT_INS_KEY,
  HiddenBuiltInsRepository,
} from '../hidden-builtins';

const firstId = defaultTemplates[0].id;

function storage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: jest.fn(async (key: string) =>
      key === HIDDEN_BUILT_INS_KEY ? value : null,
    ),
    setItem: jest.fn(async (key: string, next: string) => {
      if (key === HIDDEN_BUILT_INS_KEY) value = next;
    }),
    raw: () => value,
  };
}

it('persists explicit built-in IDs and restores them on relaunch without changing workout state', async () => {
  const disk = storage();
  const repository = new HiddenBuiltInsRepository(disk);
  await repository.save([firstId]);
  expect(disk.raw()).toBe(JSON.stringify({ version: 1, ids: [firstId] }));
  expect(await new HiddenBuiltInsRepository(disk).load()).toEqual([firstId]);
  expect(disk.setItem).toHaveBeenCalledWith(
    HIDDEN_BUILT_INS_KEY,
    expect.any(String),
  );
  await repository.save([]);
  expect(await new HiddenBuiltInsRepository(disk).load()).toEqual([]);
});

it('ignores corrupt, unknown, and duplicate preference IDs without blocking workout data', async () => {
  expect(await new HiddenBuiltInsRepository(storage('{broken')).load()).toEqual(
    [],
  );
  const disk = storage(
    JSON.stringify({ version: 1, ids: [firstId, 'not-built-in', firstId] }),
  );
  expect(await new HiddenBuiltInsRepository(disk).load()).toEqual([firstId]);
});
