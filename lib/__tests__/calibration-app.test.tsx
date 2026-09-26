import { TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { Dock } from '../../components/Dock';
import { WorkoutCalibration } from '../../components/WorkoutCalibration';
import { completeOnboardingForTest } from './onboarding-fixture';
import { isPressable } from './pressable';
import { CALIBRATION_KEY } from '../calibration-repository';
import { STATE_KEY } from '../workout-repository';

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

it('calibrates a real first workout, saves only actual sets, and restores its baseline after relaunch', async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  const button = (title: string) =>
    view.root
      .findAllByType(AppButton)
      .find((item: { props: { title: string } }) => item.props.title === title);
  const input = (label: string) =>
    view.root
      .findAllByType(TextInput)
      .find(
        (item: { props: { accessibilityLabel?: string } }) =>
          item.props.accessibilityLabel === label,
      );
  const press = (label: string) =>
    view.root
      .findAll(isPressable)
      .find(
        (item: { props: { accessibilityLabel?: string } }) =>
          item.props.accessibilityLabel === label,
      );
  await act(async () => {
    press('Start Upper Body')!.props.onPress();
  });
  expect(view.root.findByType(WorkoutCalibration)).toBeDefined();
  await act(async () => {
    button('I know my usual weight')!.props.onPress();
  });
  await act(async () => {
    input('Set 1 weight in kilograms')!.props.onChangeText('57,5');
  });
  await act(async () => {
    input('Set 1 repetitions')!.props.onChangeText('8');
  });
  await act(async () => {
    press('Complete set 1')!.props.onPress();
  });
  await act(async () => {
    button('Good')!.props.onPress();
  });
  expect(await AsyncStorage.getItem(CALIBRATION_KEY)).toContain('"good"');
  await act(async () => {
    button('Finish workout')!.props.onPress();
  });
  await act(async () => {
    view.root
      .findAllByType(Confirmation)
      .find(
        (item: { props: { title: string } }) =>
          item.props.title === 'Finish workout?',
      )!
      .props.onConfirm();
  });
  const saved = JSON.parse((await AsyncStorage.getItem(STATE_KEY))!);
  expect(saved.schemaVersion).toBe(1);
  expect(saved.history[0].exercises[0].sets[0]).toMatchObject({
    weight: '57.5',
    reps: '8',
  });
  expect(JSON.stringify(view.toJSON())).toContain('Starting baseline');
  await act(async () => {
    view.unmount();
  });
  await act(async () => {
    view = create(<App />);
  });
  await act(async () => {
    press('Start Upper Body')!.props.onPress();
  });
  expect(JSON.stringify(view.toJSON())).toContain('57.5');
  await act(async () => {
    view.unmount();
  });
}, 20_000);

it('keeps normal workout logging available when auxiliary calibration storage fails', async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
  const getItem = (AsyncStorage.getItem as jest.Mock).getMockImplementation()!;
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
    key === CALIBRATION_KEY
      ? Promise.reject(new Error('unavailable'))
      : getItem(key),
  );
  let view: ReturnType<typeof create>;
  try {
    await act(async () => {
      view = create(<App />);
    });
    const press = view.root
      .findAll(isPressable)
      .find(
        (item: { props: { accessibilityLabel?: string } }) =>
          item.props.accessibilityLabel === 'Start Upper Body',
      );
    await act(async () => {
      press!.props.onPress();
    });
    expect(view.root.findByType(WorkoutCalibration)).toBeDefined();
    expect(
      view.root
        .findAllByType(TextInput)
        .some(
          (item: { props: { accessibilityLabel?: string } }) =>
            item.props.accessibilityLabel === 'Set 1 weight in kilograms',
        ),
    ).toBe(true);
    await act(async () => {
      view.unmount();
    });
  } finally {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(getItem);
  }
});

it('retains a completed calibration choice in memory when reset fails after an in-flight auxiliary write', async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  const press = (label: string) =>
    view.root
      .findAll(isPressable)
      .find(
        (item: { props: { accessibilityLabel?: string } }) =>
          item.props.accessibilityLabel === label,
      );
  const button = (title: string) =>
    view.root
      .findAllByType(AppButton)
      .find((item: { props: { title: string } }) => item.props.title === title);
  await act(async () => {
    press('Start Upper Body')!.props.onPress();
  });
  const set = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  const remove = (
    AsyncStorage.removeItem as jest.Mock
  ).getMockImplementation()!;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  (AsyncStorage.setItem as jest.Mock).mockImplementation(
    async (key: string, value: string) => {
      if (key === CALIBRATION_KEY) await pending;
      return set(key, value);
    },
  );
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(
    async (key: string) => {
      if (key === CALIBRATION_KEY) throw new Error('remove failed');
      return remove(key);
    },
  );
  try {
    act(() => {
      button('I know my usual weight')!.props.onPress();
    });
    act(() => {
      view.root.findByType(Dock).props.onChange('profile');
    });
    act(() => {
      button('Reset local data')!.props.onPress();
    });
    const reset = view.root
      .findAllByType(Confirmation)
      .find(
        (item: { props: { title: string } }) =>
          item.props.title === 'Reset CRESUM?',
      );
    (AsyncStorage.removeItem as jest.Mock).mockClear();
    act(() => {
      reset!.props.onConfirm();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    release();
    await act(async () => {
      await pending;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(reset!.props.error).toContain('could not be reset');
    act(() => {
      view.root.findByType(Dock).props.onChange('workout');
    });
    expect(
      view.root.findByType(WorkoutCalibration).props.state.paths[0].choice,
    ).toBe('known');
    expect(view.root.findByType(WorkoutCalibration).props.busy).toBe(false);
  } finally {
    release();
    (AsyncStorage.setItem as jest.Mock).mockImplementation(set);
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(remove);
    await act(async () => {
      view.unmount();
    });
  }
}, 20_000);
