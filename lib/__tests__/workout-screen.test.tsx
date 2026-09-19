import { TextInput, Pressable } from 'react-native';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { Workout } from '../../components/Workout';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
