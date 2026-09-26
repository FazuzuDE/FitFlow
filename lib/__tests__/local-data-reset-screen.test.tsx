import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { Dock } from '../../components/Dock';
import { Onboarding } from '../../components/Onboarding';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import {
  startWorkout,
  updateSet,
  toggleSet,
  finishWorkout,
} from '../workout-engine';
import { LOCAL_DATA_KEYS } from '../local-data-reset';
import { ONBOARDING_KEY } from '../onboarding-repository';
import { STATE_KEY } from '../workout-repository';

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
    .find((node: { props: { title: string } }) => node.props.title === title);
const resetConfirmation = (view: ReturnType<typeof create>) =>
  view.root
    .findAllByType(Confirmation)
    .find(
      (node: { props: { title: string } }) =>
        node.props.title === 'Reset CRESUM?',
    );

const seed = async () => {
  const active = startWorkout(
    defaultTemplates[0],
    exerciseLibrary,
    5000,
    () => 'active-id',
  );
  const started = startWorkout(
    defaultTemplates[1],
    exerciseLibrary,
    1000,
    () => 'history-id',
  );
  const logged = toggleSet(
    updateSet(started, 0, 0, { weight: '50', reps: '8' }),
    0,
    0,
    1500,
  ).session;
  const history = finishWorkout(logged, 2000);
  const records = {
    [STATE_KEY]: JSON.stringify({
      schemaVersion: 1,
      activeWorkout: active,
      history: [history],
      templates: [
        ...defaultTemplates,
        {
          id: 'custom-reset',
          name: 'My plan',
          exerciseIds: ['barbell-bench-press'],
        },
      ],
    }),
    [ONBOARDING_KEY]: JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: { goal: 'build_muscle' },
    }),
    fitflow_history: '[{"id":"legacy-history"}]',
    fitflow_active: '{"id":"legacy-active"}',
    fitflow_templates: '[{"id":"legacy-template"}]',
  };
  await Promise.all(
    Object.entries(records).map(([key, value]) =>
      AsyncStorage.setItem(key, value),
    ),
  );
  return records;
};

const mountProfile = async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  return view;
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('asks for explicit destructive confirmation and Cancel leaves every key unchanged', async () => {
  const original = await seed();
  const view = await mountProfile();
  expect(button(view, 'Reset local data')?.props.destructive).toBe(true);
  act(() => button(view, 'Reset local data')?.props.onPress());
  const confirmation = resetConfirmation(view);
  expect(confirmation?.props.visible).toBe(true);
  expect(confirmation?.props.message).toContain('active workout');
  expect(confirmation?.props.message).toContain('personalization');
  act(() => confirmation?.props.onCancel());
  expect(resetConfirmation(view)?.props.visible).toBe(false);
  for (const [key, value] of Object.entries(original)) {
    expect(await AsyncStorage.getItem(key)).toBe(value);
  }
  expect(view.root.findByType(Dock).props.active).toBe('profile');
  await act(async () => view.unmount());
});

it('removes all five keys and returns to Welcome, including after app restart', async () => {
  await seed();
  let view = await mountProfile();
  act(() => button(view, 'Reset local data')?.props.onPress());
  await act(async () => resetConfirmation(view)?.props.onConfirm());
  for (const key of LOCAL_DATA_KEYS)
    expect(await AsyncStorage.getItem(key)).toBeNull();
  expect(view.root.findByType(Onboarding)).toBeDefined();
  expect(button(view, 'Personalize my training')).toBeDefined();
  expect(view.root.findAllByType(Dock)).toHaveLength(0);
  await act(async () => view.unmount());
  await act(async () => {
    view = create(<App />);
  });
  expect(view.root.findByType(Onboarding)).toBeDefined();
  expect(button(view, 'Set up workouts myself')).toBeDefined();
  await act(async () => view.unmount());
});

it('shows an error and keeps prior in-memory data after partial deletion failure', async () => {
  const original = await seed();
  const view = await mountProfile();
  const remove = (
    AsyncStorage.removeItem as jest.Mock
  ).getMockImplementation()!;
  let calls = 0;
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(
    async (key: string) => {
      calls += 1;
      if (calls === 3) throw new Error('disk failure');
      return remove(key);
    },
  );
  try {
    act(() => button(view, 'Reset local data')?.props.onPress());
    await act(async () => resetConfirmation(view)?.props.onConfirm());
    expect(resetConfirmation(view)?.props.visible).toBe(true);
    expect(resetConfirmation(view)?.props.error).toContain(
      'could not be reset',
    );
    expect(view.root.findByType(Dock).props.active).toBe('profile');
    expect(view.root.findAllByType(Onboarding)).toHaveLength(0);
    for (const [key, value] of Object.entries(original)) {
      expect(await AsyncStorage.getItem(key)).toBe(value);
    }
  } finally {
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(remove);
    await act(async () => view.unmount());
  }
});

it('waits for an in-flight onboarding retry before deleting its key', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  const set = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  let releaseRetry!: () => void;
  const retryPending = new Promise<void>((resolve) => {
    releaseRetry = resolve;
  });
  let onboardingAttempts = 0;
  (AsyncStorage.setItem as jest.Mock).mockImplementation(
    async (key: string, value: string) => {
      if (key === ONBOARDING_KEY) {
        onboardingAttempts += 1;
        if (onboardingAttempts === 1) throw new Error('first write failed');
        if (onboardingAttempts === 2) await retryPending;
      }
      return set(key, value);
    },
  );
  try {
    await act(async () =>
      button(view, 'Personalize my training')?.props.onPress(),
    );
    expect(button(view, 'Retry onboarding')).toBeDefined();
    act(() => button(view, 'Retry onboarding')?.props.onPress());
    act(() => button(view, 'Continue to app')?.props.onPress());
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => button(view, 'Reset local data')?.props.onPress());
    (AsyncStorage.removeItem as jest.Mock).mockClear();
    act(() => resetConfirmation(view)?.props.onConfirm());
    await act(async () => Promise.resolve());
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    releaseRetry();
    await act(async () => retryPending);
    await act(async () => Promise.resolve());
    expect(await AsyncStorage.getItem(ONBOARDING_KEY)).toBeNull();
    expect(view.root.findByType(Onboarding)).toBeDefined();
  } finally {
    releaseRetry();
    (AsyncStorage.setItem as jest.Mock).mockImplementation(set);
    await act(async () => view.unmount());
  }
});

it('starts only one reset when confirmation is pressed twice before rerender', async () => {
  await seed();
  const view = await mountProfile();
  act(() => button(view, 'Reset local data')?.props.onPress());
  (AsyncStorage.removeItem as jest.Mock).mockClear();
  await act(async () => {
    const confirm = resetConfirmation(view)?.props.onConfirm;
    confirm();
    confirm();
  });
  expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(LOCAL_DATA_KEYS.length);
  expect(view.root.findByType(Onboarding)).toBeDefined();
  await act(async () => view.unmount());
});

it('ignores an old onboarding retry result that arrives after reset', async () => {
  const completed = JSON.stringify({
    version: 1,
    status: 'completed',
    step: 'complete',
    answers: {},
  });
  await AsyncStorage.setItem(ONBOARDING_KEY, completed);
  const get = (AsyncStorage.getItem as jest.Mock).getMockImplementation()!;
  let calls = 0;
  let releaseRetry!: () => void;
  const retryPending = new Promise<void>((resolve) => {
    releaseRetry = resolve;
  });
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    async (key: string) => {
      if (key === ONBOARDING_KEY) {
        calls += 1;
        if (calls === 1) throw new Error('initial read failed');
        if (calls === 2) {
          await retryPending;
          return completed;
        }
      }
      return get(key);
    },
  );
  let view!: ReturnType<typeof create>;
  try {
    await act(async () => {
      view = create(<App />);
    });
    expect(button(view, 'Retry onboarding')).toBeDefined();
    act(() => button(view, 'Retry onboarding')?.props.onPress());
    act(() => button(view, 'Continue to app')?.props.onPress());
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => button(view, 'Reset local data')?.props.onPress());
    await act(async () => resetConfirmation(view)?.props.onConfirm());
    expect(view.root.findByType(Onboarding)).toBeDefined();
    releaseRetry();
    await act(async () => retryPending);
    expect(view.root.findByType(Onboarding)).toBeDefined();
    expect(await AsyncStorage.getItem(ONBOARDING_KEY)).toBeNull();
  } finally {
    releaseRetry();
    (AsyncStorage.getItem as jest.Mock).mockImplementation(get);
    await act(async () => view.unmount());
  }
});
