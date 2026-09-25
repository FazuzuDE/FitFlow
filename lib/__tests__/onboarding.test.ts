import { defaultTemplates } from '../workout-catalog';
import { emptyWorkoutState } from '../workout-repository';
import {
  initialOnboardingState,
  hasMeaningfulWorkoutData,
  parseOnboardingState,
} from '../onboarding';
import { OnboardingRepository, ONBOARDING_KEY } from '../onboarding-repository';

const storage = () => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
};

it('gates first launch and ignores built-in templates as legacy activity', () => {
  expect(hasMeaningfulWorkoutData(emptyWorkoutState())).toBe(false);
  expect(
    hasMeaningfulWorkoutData({
      ...emptyWorkoutState(),
      templates: defaultTemplates,
    }),
  ).toBe(false);
});

it('bypasses onboarding for an active session, history or a custom workout', () => {
  const empty = emptyWorkoutState();
  expect(
    hasMeaningfulWorkoutData({
      ...empty,
      activeWorkout: { id: 'existing' } as never,
    }),
  ).toBe(true);
  expect(
    hasMeaningfulWorkoutData({ ...empty, history: [{ id: 'saved' } as never] }),
  ).toBe(true);
  expect(
    hasMeaningfulWorkoutData({
      ...empty,
      templates: [
        ...defaultTemplates,
        { id: 'custom-1', name: 'My workout', exerciseIds: [] },
      ],
    }),
  ).toBe(true);
});

it('stores partial progress under a separate key and restores it without touching workouts', async () => {
  const memory = storage();
  const repository = new OnboardingRepository(memory);
  expect(await repository.load()).toEqual(initialOnboardingState);
  const progress = {
    ...initialOnboardingState,
    step: 'experience' as const,
    answers: { goal: 'build_muscle' as const },
  };
  await repository.save(progress);
  expect(memory.setItem).toHaveBeenCalledTimes(1);
  expect(memory.setItem.mock.calls[0][0]).toBe(ONBOARDING_KEY);
  expect(await repository.load()).toEqual(progress);
});

it('does not silently reset malformed or unsupported onboarding state', async () => {
  const memory = storage();
  memory.values.set(ONBOARDING_KEY, '{invalid');
  const repository = new OnboardingRepository(memory);
  await expect(repository.load()).rejects.toThrow('unavailable');
  expect(memory.values.get(ONBOARDING_KEY)).toBe('{invalid');
  expect(memory.setItem).not.toHaveBeenCalled();
  expect(() => parseOnboardingState({ version: 2 })).toThrow('unavailable');
  expect(() =>
    parseOnboardingState({
      version: 1,
      status: 'in_progress',
      step: 'goal',
      answers: { goal: 'unknown' },
    }),
  ).toThrow('unavailable');
});
