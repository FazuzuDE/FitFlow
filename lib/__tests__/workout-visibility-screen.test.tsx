import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { Dock } from '../../components/Dock';
import { Onboarding } from '../../components/Onboarding';
import { Workout } from '../../components/Workout';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import {
  finishWorkout,
  startWorkout,
  toggleSet,
  updateSet,
} from '../workout-engine';
import { HIDDEN_BUILT_INS_KEY } from '../hidden-builtins';
import { STATE_KEY } from '../workout-repository';
import { completeOnboardingForTest } from './onboarding-fixture';
import { isPressable } from './pressable';

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

const custom = {
  id: 'my-day',
  name: 'My day',
  exerciseIds: ['barbell-bench-press'],
};
const row = (view: ReturnType<typeof create>, label: string) =>
  view.root
    .findAll(isPressable)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === label,
    );
const button = (view: ReturnType<typeof create>, title: string) =>
  view.root
    .findAllByType(AppButton)
    .find((item: { props: { title: string } }) => item.props.title === title);
const openProfile = (view: ReturnType<typeof create>) =>
  act(() => view.root.findByType(Dock).props.onChange('profile'));
const mount = async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  return view;
};

beforeEach(async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
});

it('starts a workout by tapping its Profile row', async () => {
  const view = await mount();
  openProfile(view);
  act(() => row(view, 'Start Upper Body')?.props.onPress());
  expect(view.root.findByType(Workout).props.session.templateId).toBe(
    defaultTemplates[0].id,
  );
  await act(async () => view.unmount());
});

it('hides a built-in, keeps its canonical definition, survives relaunch, and restores it', async () => {
  let view = await mount();
  const originalState = await AsyncStorage.getItem(STATE_KEY);
  openProfile(view);
  act(() => row(view, 'More actions for Upper Body')?.props.onPress());
  await act(async () => button(view, 'Hide from My Workouts')?.props.onPress());
  expect(
    JSON.parse((await AsyncStorage.getItem(HIDDEN_BUILT_INS_KEY))!).ids,
  ).toEqual([defaultTemplates[0].id]);
  expect(await AsyncStorage.getItem(STATE_KEY)).toBe(originalState);
  expect(row(view, 'Start Upper Body')).toBeUndefined();
  expect(button(view, 'Restore Upper Body')).toBeDefined();
  await act(async () => view.unmount());

  view = await mount();
  openProfile(view);
  expect(row(view, 'Start Upper Body')).toBeUndefined();
  await act(async () => button(view, 'Restore Upper Body')?.props.onPress());
  expect(row(view, 'Start Upper Body')).toBeDefined();
  expect(
    JSON.parse((await AsyncStorage.getItem(HIDDEN_BUILT_INS_KEY))!).ids,
  ).toEqual([]);
  await act(async () => view.unmount());
});

it('keeps saved History when a built-in is hidden and a custom workout is deleted', async () => {
  const started = startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
  const logged = toggleSet(
    updateSet(started, 0, 0, { weight: '50', reps: '8' }),
    0,
    0,
    1500,
  ).session;
  const history = finishWorkout(logged, 2000);
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [history],
      templates: [...defaultTemplates, custom],
    }),
  );
  const view = await mount();
  openProfile(view);
  act(() => row(view, 'More actions for Upper Body')?.props.onPress());
  await act(async () => button(view, 'Hide from My Workouts')?.props.onPress());
  act(() => row(view, 'More actions for My day')?.props.onPress());
  act(() => button(view, 'Delete')?.props.onPress());
  await act(async () =>
    view.root
      .findAllByType(Confirmation)
      .find(
        (item: { props: { title: string } }) =>
          item.props.title === 'Delete workout?',
      )
      ?.props.onConfirm(),
  );
  expect(JSON.parse((await AsyncStorage.getItem(STATE_KEY))!).history).toEqual([
    history,
  ]);
  await act(async () => view.unmount());
});

it('duplicates a built-in into a separately editable custom workout', async () => {
  const view = await mount();
  openProfile(view);
  act(() => row(view, 'More actions for Upper Body')?.props.onPress());
  await act(async () => button(view, 'Duplicate / Customize')?.props.onPress());
  const templates = JSON.parse(
    (await AsyncStorage.getItem(STATE_KEY))!,
  ).templates;
  const copy = templates.find(
    (item: { name: string }) => item.name === 'Upper Body Copy',
  );
  expect(copy.id).not.toBe(defaultTemplates[0].id);
  expect(copy.exerciseIds).toEqual(defaultTemplates[0].exerciseIds);
  expect(
    templates.find(
      (item: { id: string }) => item.id === defaultTemplates[0].id,
    ),
  ).toEqual(defaultTemplates[0]);
  act(() => row(view, 'More actions for Upper Body Copy')?.props.onPress());
  expect(button(view, 'Edit')).toBeDefined();
  await act(async () => view.unmount());
});

it('does not hide a built-in when the preference write fails', async () => {
  const view = await mount();
  const originalSet = (
    AsyncStorage.setItem as jest.Mock
  ).getMockImplementation()!;
  (AsyncStorage.setItem as jest.Mock).mockImplementation(
    async (key: string, value: string) => {
      if (key === HIDDEN_BUILT_INS_KEY) throw new Error('disk full');
      return originalSet(key, value);
    },
  );
  try {
    openProfile(view);
    act(() => row(view, 'More actions for Upper Body')?.props.onPress());
    await act(async () =>
      button(view, 'Hide from My Workouts')?.props.onPress(),
    );
    expect(row(view, 'Start Upper Body')).toBeDefined();
    expect(await AsyncStorage.getItem(HIDDEN_BUILT_INS_KEY)).toBeNull();
    expect(JSON.stringify(view.toJSON())).toContain(
      'Workout could not be hidden',
    );
  } finally {
    (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet);
    await act(async () => view.unmount());
  }
});

it('clears hidden preferences on Reset local data and returns to first-run catalog', async () => {
  const view = await mount();
  openProfile(view);
  act(() => row(view, 'More actions for Upper Body')?.props.onPress());
  await act(async () => button(view, 'Hide from My Workouts')?.props.onPress());
  act(() => button(view, 'Reset local data')?.props.onPress());
  await act(async () =>
    view.root
      .findAllByType(Confirmation)
      .find(
        (item: { props: { title: string } }) =>
          item.props.title === 'Reset CRESUM?',
      )
      ?.props.onConfirm(),
  );
  expect(await AsyncStorage.getItem(HIDDEN_BUILT_INS_KEY)).toBeNull();
  expect(view.root.findByType(Onboarding)).toBeDefined();
  await act(async () => view.unmount());
});
