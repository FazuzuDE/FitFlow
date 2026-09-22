import { TextInput, Pressable } from 'react-native';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { Dock } from '../../components/Dock';
import { Workout } from '../../components/Workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STATE_KEY } from '../workout-repository';
import type { WorkoutSession } from '../workout-model';

const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));

it('connects the actual screen inputs, timer, confirmation and persisted history', async () => {
  await AsyncStorage.clear();
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  const button = (title: string) =>
    view.root
      .findAllByType(AppButton)
      .find((node: { props: { title: string } }) => node.props.title === title);
  const input = (label: string) =>
    view.root
      .findAllByType(TextInput)
      .find(
        (node: { props: { accessibilityLabel: string } }) =>
          node.props.accessibilityLabel === label,
      );
  const pressable = (label: string) =>
    view.root
      .findAllByType(Pressable)
      .find(
        (node: { props: { accessibilityLabel: string } }) =>
          node.props.accessibilityLabel === label,
      );
  await act(async () => {
    pressable('Start Upper Body').props.onPress();
  });
  expect(button('Finish workout').props.disabled).toBe(true);
  await act(async () => {
    pressable('Complete set 1').props.onPress();
  });
  expect(
    view.root.findByType(Workout).props.session.exercises[0].sets[0]
      .completedAt,
  ).toBeUndefined();
  await act(async () => {
    input('Set 1 weight in kilograms').props.onChangeText('60,5');
  });
  await act(async () => {
    input('Set 1 repetitions').props.onChangeText('8');
  });
  await act(async () => {
    pressable('Complete set 1').props.onPress();
  });
  expect(input('Set 1 weight in kilograms').props.editable).toBe(false);
  expect(button('Skip rest')).toBeDefined();
  await act(async () => {
    button('Skip rest').props.onPress();
  });
  expect(
    view.root.findByType(Workout).props.session.restEndsAt,
  ).toBeUndefined();
  await act(async () => {
    button('Finish workout').props.onPress();
  });
  const confirm = () =>
    view.root
      .findAllByType(Confirmation)
      .find(
        (node: { props: { title: string } }) =>
          node.props.title === 'Finish workout?',
      );
  expect(confirm().props.visible).toBe(true);
  await act(async () => {
    confirm().props.onCancel();
  });
  expect(view.root.findByType(Workout).props.session).not.toBeNull();
  await act(async () => {
    button('Finish workout').props.onPress();
  });
  await act(async () => {
    confirm().props.onConfirm();
  });
  const saved = JSON.parse((await AsyncStorage.getItem('fitflow_state_v1'))!);
  expect(saved.activeWorkout).toBeNull();
  expect(saved.history).toHaveLength(1);
  expect(saved.history[0].exercises[0].sets[0]).toMatchObject({
    weight: '60.5',
    reps: '8',
  });
  expect(JSON.stringify(view.toJSON())).toContain('Workout saved');
  await act(async () => {
    view.unmount();
  });
});

it('restores a compact History summary and opens the saved snapshot after reload', async () => {
  await AsyncStorage.clear();
  const saved: WorkoutSession = {
    id: 'archived-session',
    templateId: 'deleted-template',
    name: 'Archived Session',
    startedAt: 1_700_000_000_000,
    finishedAt: 1_700_000_090_000,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: [
      {
        id: 'archived-exercise',
        libraryId: 'barbell-bench-press',
        name: 'Archived Bench Snapshot',
        muscle: 'Archived Chest Snapshot',
        sets: [
          {
            id: 'archived-set',
            weight: '62.5',
            reps: '7',
            completedAt: 1_700_000_030_000,
          },
        ],
      },
    ],
  };
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [saved],
      templates: [],
    }),
  );

  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  act(() => view.root.findByType(Dock).props.onChange('progress'));
  expect(
    view.root
      .findAllByType(Pressable)
      .find(
        (node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel ===
          'Open Archived Session workout details',
      ),
  ).toBeDefined();
  await act(async () => view.unmount());

  await act(async () => {
    view = create(<App />);
  });
  act(() => view.root.findByType(Dock).props.onChange('progress'));
  const open = view.root
    .findAllByType(Pressable)
    .find(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel ===
        'Open Archived Session workout details',
    );

  expect(open).toBeDefined();
  act(() => open?.props.onPress());
  const detail = JSON.stringify(view.toJSON());
  expect(detail).toContain('Archived Session');
  expect(detail).toContain('Archived Bench Snapshot');
  expect(detail).toContain('62.5 kg × 7');
  expect(detail).not.toContain('Barbell Bench Press');

  await act(async () => view.unmount());
});
