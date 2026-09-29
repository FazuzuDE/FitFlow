import {
  CalibrationRepository,
  CALIBRATION_KEY,
} from '../calibration-repository';
import { initialCalibrationState } from '../calibration';

function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

it('roundtrips a versioned auxiliary record without touching workout storage', async () => {
  const target = storage();
  const repository = new CalibrationRepository(target);
  const state = {
    ...initialCalibrationState(),
    paths: [
      {
        sessionId: 's1',
        exerciseId: 'barbell-bench-press',
        choice: 'help' as const,
      },
    ],
    feedback: [
      {
        sessionId: 's1',
        exerciseId: 'barbell-bench-press',
        setId: 'set1',
        completedAt: 2000,
        feedback: 'good' as const,
      },
    ],
  };
  await repository.save(state);
  expect([...target.values.keys()]).toEqual([CALIBRATION_KEY]);
  expect(await new CalibrationRepository(target).load()).toEqual(state);
});

it('roundtrips a failed attempt without turning it into a completed set', async () => {
  const target = storage();
  const state = {
    ...initialCalibrationState(),
    feedback: [
      {
        sessionId: 's1',
        exerciseId: 'barbell-bench-press',
        setId: 'set1',
        failedAt: 2000,
        feedback: 'too-hard' as const,
      },
    ],
  };
  await new CalibrationRepository(target).save(state);
  expect(await new CalibrationRepository(target).load()).toEqual(state);
});

it.each(['{', '{"version":99}', '{"version":1,"paths":{},"feedback":[]}'])(
  'treats malformed auxiliary data as unavailable without deleting it',
  async (raw) => {
    const target = storage();
    target.values.set(CALIBRATION_KEY, raw);
    expect(await new CalibrationRepository(target).load()).toEqual(
      initialCalibrationState(),
    );
    expect(target.values.get(CALIBRATION_KEY)).toBe(raw);
  },
);

it('does not make workout data unavailable when calibration read fails', async () => {
  const target = storage();
  target.getItem.mockRejectedValueOnce(new Error('storage failure'));
  expect(await new CalibrationRepository(target).load()).toEqual(
    initialCalibrationState(),
  );
});

it('serializes saves and lets reset await the last pending write', async () => {
  const target = storage();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const original = target.setItem.getMockImplementation()!;
  target.setItem.mockImplementationOnce(async (key, value) => {
    await gate;
    return original(key, value);
  });
  const repository = new CalibrationRepository(target);
  const first = repository.save(initialCalibrationState());
  const second = repository.save({
    ...initialCalibrationState(),
    paths: [
      { sessionId: 's', exerciseId: 'barbell-bench-press', choice: 'known' },
    ],
  });
  let settled = false;
  void repository.waitForWrites().then(() => {
    settled = true;
  });
  await Promise.resolve();
  expect(settled).toBe(false);
  release();
  await Promise.all([first, second, repository.waitForWrites()]);
  expect(settled).toBe(true);
  expect((await repository.load()).paths[0].choice).toBe('known');
});

it('reports a failed auxiliary save rather than a durable baseline', async () => {
  const target = storage();
  target.setItem.mockRejectedValueOnce(new Error('disk full'));
  await expect(
    new CalibrationRepository(target).save(initialCalibrationState()),
  ).rejects.toThrow('disk full');
  expect(target.values.has(CALIBRATION_KEY)).toBe(false);
});
