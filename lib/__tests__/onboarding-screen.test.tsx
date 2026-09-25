import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Onboarding } from '../../components/Onboarding';
import { TemplateEditor } from '../../components/TemplateEditor';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { Dock } from '../../components/Dock';
import { ONBOARDING_KEY } from '../onboarding-repository';
import { initialOnboardingState } from '../onboarding';
import { STATE_KEY } from '../workout-repository';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import { startWorkout } from '../workout-engine';

const { act, create } = jest.requireActual('react-test-renderer');

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));

const button = (view: ReturnType<typeof create>, title: string) =>
  view.root
    .findAllByType(AppButton)
    .find((item: { props: { title: string } }) => item.props.title === title);

const mount = async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  return view;
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('shows exactly the two welcome paths on first launch, not the normal dock', async () => {
  const view = await mount();
  expect(view.root.findByType(Onboarding)).toBeDefined();
  expect(button(view, 'Personalize my training')).toBeDefined();
  expect(button(view, 'Set up workouts myself')).toBeDefined();
  expect(view.root.findAllByType(Dock)).toHaveLength(0);
  expect(
    button(view, 'Personalize my training')?.props.accessibilityLabel,
  ).toBe('Personalize my training');
  await act(async () => view.unmount());
});

it('persists selections through Back and reload and allows optional body fields to be skipped', async () => {
  const view = await mount();
  await act(async () =>
    button(view, 'Personalize my training')?.props.onPress(),
  );
  await act(async () => button(view, 'Build muscle')?.props.onPress());
  await act(async () => button(view, 'Beginner')?.props.onPress());
  await act(async () => button(view, 'Gym')?.props.onPress());
  expect(button(view, 'Continue without body details')).toBeDefined();
  await act(async () => button(view, 'Back')?.props.onPress());
  expect(button(view, 'Gym')?.props.selected).toBe(true);
  await act(async () => view.unmount());
  const restored = await mount();
  expect(button(restored, 'Gym')?.props.selected).toBe(true);
  await act(async () => button(restored, 'Back')?.props.onPress());
  expect(button(restored, 'Beginner')?.props.selected).toBe(true);
  await act(async () => button(restored, 'Back')?.props.onPress());
  expect(button(restored, 'Build muscle')?.props.selected).toBe(true);
  await act(async () => button(restored, 'Next')?.props.onPress());
  await act(async () => button(restored, 'Next')?.props.onPress());
  await act(async () => button(restored, 'Next')?.props.onPress());
  await act(async () =>
    button(restored, 'Continue without body details')?.props.onPress(),
  );
  expect(button(restored, 'Go to Home')).toBeDefined();
  await act(async () => button(restored, 'Go to Home')?.props.onPress());
  expect(restored.root.findByType(Dock)).toBeDefined();
  await act(async () => restored.unmount());
  const completed = await mount();
  expect(completed.root.findAllByType(Onboarding)).toHaveLength(0);
  await act(async () => completed.unmount());
});

it('uses the existing Guided Workout Builder and cancel does not complete onboarding', async () => {
  const view = await mount();
  await act(async () =>
    button(view, 'Set up workouts myself')?.props.onPress(),
  );
  expect(view.root.findByType(TemplateEditor).props.mode).toBe('create');
  await act(async () => button(view, 'Cancel')?.props.onPress());
  expect(button(view, 'Set up workouts myself')).toBeDefined();
  expect(
    JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY)) ?? '{}').status,
  ).toBe('in_progress');
  await act(async () => view.unmount());
});

it('completes self-setup only after the existing builder durably saves a custom workout', async () => {
  const view = await mount();
  await act(async () =>
    button(view, 'Set up workouts myself')?.props.onPress(),
  );
  const name = view.root
    .findAllByType(TextInput)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === 'Workout Name',
    );
  act(() => name?.props.onChangeText('My first workout'));
  act(() => button(view, 'Next')?.props.onPress());
  act(() =>
    view.root
      .findByType(ExerciseLibrary)
      .props.onAdd({ id: 'barbell-bench-press' }),
  );
  act(() => button(view, 'Add Exercise')?.props.onPress());
  expect(view.root.findAllByType(Dock)).toHaveLength(0);
  await act(async () => button(view, 'Save Workout')?.props.onPress());
  expect(view.root.findByType(Dock)).toBeDefined();
  const workout = JSON.parse((await AsyncStorage.getItem(STATE_KEY)) ?? '{}');
  expect(
    workout.templates.filter(
      (item: { name: string }) => item.name === 'My first workout',
    ),
  ).toHaveLength(1);
  expect(workout.history).toEqual([]);
  expect(
    JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY)) ?? '{}').status,
  ).toBe('completed');
  await act(async () => view.unmount());
});

it('keeps self-setup incomplete when the builder cannot save a workout', async () => {
  const view = await mount();
  await act(async () =>
    button(view, 'Set up workouts myself')?.props.onPress(),
  );
  const name = view.root
    .findAllByType(TextInput)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === 'Workout Name',
    );
  act(() => name?.props.onChangeText('Unsaved workout'));
  act(() => button(view, 'Next')?.props.onPress());
  act(() =>
    view.root
      .findByType(ExerciseLibrary)
      .props.onAdd({ id: 'barbell-bench-press' }),
  );
  act(() => button(view, 'Add Exercise')?.props.onPress());
  jest
    .spyOn(AsyncStorage, 'setItem')
    .mockRejectedValueOnce(new Error('disk full'));
  await act(async () => button(view, 'Save Workout')?.props.onPress());
  expect(view.root.findByType(TemplateEditor)).toBeDefined();
  expect(view.root.findAllByType(Dock)).toHaveLength(0);
  expect(
    JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY)) ?? '{}').status,
  ).toBe('in_progress');
  expect(JSON.stringify(view.toJSON())).toContain(
    'Template changes could not be saved',
  );
  await act(async () => view.unmount());
});

it('does not gate an existing active workout even when onboarding storage is damaged', async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, '{broken');
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: startWorkout(defaultTemplates[0], exerciseLibrary, 1000),
      history: [],
      templates: defaultTemplates,
    }),
  );
  const originalWorkout = await AsyncStorage.getItem(STATE_KEY);
  const view = await mount();
  expect(view.root.findByType(Dock)).toBeDefined();
  expect(await AsyncStorage.getItem(STATE_KEY)).toBe(originalWorkout);
  expect(await AsyncStorage.getItem(ONBOARDING_KEY)).toBe('{broken');
  await act(async () => view.unmount());
});

it('keeps malformed onboarding data untouched and allows safe app access', async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, '{broken');
  const view = await mount();
  expect(JSON.stringify(view.toJSON())).toContain(
    'Saved onboarding is unavailable',
  );
  await act(async () => button(view, 'Continue to app')?.props.onPress());
  expect(view.root.findByType(Dock)).toBeDefined();
  expect(await AsyncStorage.getItem(ONBOARDING_KEY)).toBe('{broken');
  await act(async () => view.unmount());
});

it('lets a completed user reopen and update personalization from Profile', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      ...initialOnboardingState,
      status: 'completed',
      step: 'complete',
    }),
  );
  const view = await mount();
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  await act(async () => button(view, 'Personalization')?.props.onPress());
  expect(button(view, 'Build muscle')).toBeDefined();
  await act(async () => button(view, 'Back to Profile')?.props.onPress());
  expect(view.root.findByType(Dock).props.active).toBe('profile');
  await act(async () => view.unmount());
});

it('resumes an unfinished Profile personalization edit after reopening', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: {},
    }),
  );
  const view = await mount();
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  await act(async () => button(view, 'Personalization')?.props.onPress());
  await act(async () => button(view, 'Build muscle')?.props.onPress());
  await act(async () => button(view, 'Beginner')?.props.onPress());
  await act(async () => button(view, 'Back to Profile')?.props.onPress());
  await act(async () => button(view, 'Personalization')?.props.onPress());
  expect(button(view, 'Gym')).toBeDefined();
  await act(async () => view.unmount());
  const restored = await mount();
  act(() => restored.root.findByType(Dock).props.onChange('profile'));
  await act(async () => button(restored, 'Personalization')?.props.onPress());
  expect(button(restored, 'Gym')).toBeDefined();
  await act(async () => restored.unmount());
});

it('retries a failed onboarding write without losing the latest in-memory step', async () => {
  const view = await mount();
  const write = jest.spyOn(AsyncStorage, 'setItem');
  write.mockRejectedValueOnce(new Error('temporary storage failure'));
  try {
    await act(async () =>
      button(view, 'Personalize my training')?.props.onPress(),
    );
    await act(async () => Promise.resolve());
    expect(button(view, 'Retry onboarding')).toBeDefined();
    await act(async () => button(view, 'Retry onboarding')?.props.onPress());
    expect(button(view, 'Build muscle')).toBeDefined();
    expect(
      JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY)) ?? '{}').step,
    ).toBe('goal');
  } finally {
    await act(async () => view.unmount());
  }
});

it('does not turn profile inputs into workout history', async () => {
  const view = await mount();
  await act(async () =>
    button(view, 'Personalize my training')?.props.onPress(),
  );
  await act(async () => button(view, 'Build muscle')?.props.onPress());
  await act(async () => button(view, 'Beginner')?.props.onPress());
  await act(async () => button(view, 'Gym')?.props.onPress());
  const age = view.root
    .findAllByType(TextInput)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === 'Age',
    );
  await act(async () => age?.props.onChangeText('27'));
  await act(async () => button(view, 'Continue')?.props.onPress());
  await act(async () => button(view, 'Go to Home')?.props.onPress());
  const workout = JSON.parse(
    (await AsyncStorage.getItem('fitflow_state_v1')) ?? '{}',
  );
  expect(workout.history).toEqual([]);
  await act(async () => view.unmount());
});

it('does not advance with malformed optional body details', async () => {
  const view = await mount();
  await act(async () =>
    button(view, 'Personalize my training')?.props.onPress(),
  );
  await act(async () => button(view, 'Build muscle')?.props.onPress());
  await act(async () => button(view, 'Beginner')?.props.onPress());
  await act(async () => button(view, 'Gym')?.props.onPress());
  const age = view.root
    .findAllByType(TextInput)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === 'Age',
    );
  await act(async () => age?.props.onChangeText('not an age'));
  await act(async () => button(view, 'Continue')?.props.onPress());
  expect(JSON.stringify(view.toJSON())).toContain('Enter a valid age');
  expect(button(view, 'Go to Home')).toBeUndefined();
  await act(async () => view.unmount());
});
