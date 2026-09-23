import {
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { Dock } from '../../components/Dock';
import { GlassCard } from '../../components/GlassCard';
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

it('derives stable safe Progress analytics from persisted History after reload', async () => {
  await AsyncStorage.clear();
  const saved = (
    id: string,
    finishedAt: number,
    libraryId: string,
    exerciseName: string,
    weight: string,
    reps: string,
  ): WorkoutSession => ({
    id,
    templateId: `deleted-${id}`,
    name: `Saved ${id}`,
    startedAt: finishedAt - 1_000,
    finishedAt,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: [
      {
        id: `${id}-exercise`,
        libraryId,
        name: exerciseName,
        muscle: 'Saved muscle',
        sets: [
          {
            id: `${id}-set`,
            weight,
            reps,
            completedAt: finishedAt - 100,
          },
        ],
      },
    ],
  });
  const olderBest = saved(
    'older',
    1_700_000_002_000,
    'barbell-bench-press',
    'Original Saved Bench Name',
    '100',
    '5',
  );
  const newerLabel = saved(
    'newer',
    1_700_000_004_000,
    'bench',
    'Newest Saved Bench Name',
    '40',
    '5',
  );
  const invalid = saved(
    'invalid',
    1_700_000_003_000,
    'stale-id',
    'Invalid Legacy Snapshot',
    '-100',
    '10',
  );
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [olderBest, newerLabel, invalid],
      templates: [],
    }),
  );

  const renderProgress = async () => {
    let view!: ReturnType<typeof create>;
    await act(async () => {
      view = create(<App />);
    });
    act(() => view.root.findByType(Dock).props.onChange('progress'));
    act(() =>
      view.root
        .findAllByType(Pressable)
        .find(
          (node: { props: { accessibilityLabel?: string } }) =>
            node.props.accessibilityLabel === 'Progress period ALL',
        )
        ?.props.onPress(),
    );
    return view;
  };

  for (let pass = 0; pass < 2; pass += 1) {
    const view = await renderProgress();
    const progress = JSON.stringify(view.toJSON());
    const text = view.root
      .findAllByType(Text)
      .map((node: { props: { children?: unknown } }) =>
        Array.isArray(node.props.children)
          ? node.props.children
              .filter(
                (child) =>
                  typeof child === 'string' || typeof child === 'number',
              )
              .join('')
          : String(node.props.children ?? ''),
      );

    expect(progress).toContain('TRAINING VOLUME');
    expect(progress).toContain('700');
    expect(progress).toContain('Estimated 1RM');
    expect(progress).toContain('Newest Saved Bench Name');
    expect(text).toContain('100 kg × 5');
    expect(text).toContain('116.7 kg');
    expect(progress).not.toContain('Original Saved Bench Name');
    expect(progress).not.toContain('Invalid Legacy Snapshot');
    expect(progress).not.toContain('Barbell Bench Press');
    expect(progress).toContain('Some saved sets could not be included.');

    await act(async () => view.unmount());
  }
});

it('keeps Progress chart heights finite for very large finite volumes', async () => {
  await AsyncStorage.clear();
  const large = `1${'0'.repeat(307)}`;
  const saved: WorkoutSession = {
    id: 'large-session',
    templateId: 'large-template',
    name: 'Large finite workout',
    startedAt: 1_700_000_000_000,
    finishedAt: 1_700_000_001_000,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: [
      {
        id: 'large-exercise',
        libraryId: 'custom-large',
        name: 'Large finite exercise',
        muscle: 'Saved muscle',
        sets: [
          {
            id: 'large-set',
            weight: large,
            reps: '10',
            completedAt: 1_700_000_000_900,
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

  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  act(() => view.root.findByType(Dock).props.onChange('progress'));
  act(() =>
    view.root
      .findAllByType(Pressable)
      .find(
        (node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel === 'Progress period ALL',
      )
      ?.props.onPress(),
  );

  const chart = view.root
    .findAllByType(ScrollView)
    .find((node: { props: { accessibilityLabel?: string } }) =>
      node.props.accessibilityLabel?.startsWith(
        'Recent workout volumes in kilograms:',
      ),
    );
  const heights = chart!
    .findAllByType(View)
    .filter((node: { props: { style?: unknown } }) =>
      Array.isArray(node.props.style),
    )
    .map((node: { props: { style?: unknown } }) =>
      StyleSheet.flatten(node.props.style),
    )
    .map((style: { height?: unknown } | undefined) => style?.height)
    .filter((height: unknown): height is number => typeof height === 'number');

  expect(heights.length).toBeGreaterThan(0);
  expect(heights.every((height: number) => Number.isFinite(height))).toBe(true);
  expect(Math.max(...heights)).toBeLessThanOrEqual(60);

  await act(async () => view.unmount());
});

it('scopes Progress by the selected period while keeping the full History archive', async () => {
  await AsyncStorage.clear();
  const now = new Date(2026, 8, 23, 12).getTime();
  const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
  const saved = (
    id: string,
    finishedAt: number,
    weight: string,
  ): WorkoutSession => ({
    id,
    templateId: `template-${id}`,
    name: `${id} workout`,
    startedAt: finishedAt - 1_000,
    finishedAt,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: [
      {
        id: `${id}-exercise`,
        libraryId: `custom-${id}`,
        name: `${id} exercise`,
        muscle: 'Saved muscle',
        sets: [
          {
            id: `${id}-set`,
            weight,
            reps: '5',
            completedAt: finishedAt - 100,
          },
        ],
      },
    ],
  });
  const older = saved('older', new Date(2026, 6, 23, 12).getTime(), '100');
  const recent = saved('recent', new Date(2026, 8, 13, 12).getTime(), '50');
  const future = saved('future', new Date(2026, 8, 24, 12).getTime(), '200');
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [future, older, recent],
      templates: [],
    }),
  );

  const renderProgress = async () => {
    let view!: ReturnType<typeof create>;
    await act(async () => {
      view = create(<App />);
    });
    act(() => view.root.findByType(Dock).props.onChange('progress'));
    return view;
  };
  const periodButton = (view: ReturnType<typeof create>, period: string) =>
    view.root
      .findAllByType(Pressable)
      .find(
        (node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel === `Progress period ${period}`,
      );
  const metricCard = (view: ReturnType<typeof create>, index: number) =>
    view.root
      .findAllByType(GlassCard)
      [index].findAllByType(Text)
      .map((node: { props: { children?: unknown } }) =>
        String(node.props.children),
      )
      .join(' ');

  try {
    for (let pass = 0; pass < 2; pass += 1) {
      const view = await renderProgress();
      expect(periodButton(view, '1M')?.props.accessibilityState.selected).toBe(
        true,
      );
      expect(metricCard(view, 0)).toContain('250');
      expect(metricCard(view, 0)).not.toContain('500');
      expect(metricCard(view, 1)).toContain('recent exercise');
      expect(metricCard(view, 1)).not.toContain('older exercise');
      expect(
        view.root
          .findAllByType(ScrollView)
          .some(
            (node: { props: { horizontal?: boolean } }) =>
              node.props.horizontal,
          ),
      ).toBe(true);
      for (const label of ['1W', '1M', '3M', '6M', '1Y', 'ALL']) {
        const button = periodButton(view, label);
        expect(button?.props.accessibilityRole).toBe('button');
        expect(
          StyleSheet.flatten(button?.props.style).minHeight,
        ).toBeGreaterThanOrEqual(44);
      }
      expect(
        view.root
          .findAllByType(Pressable)
          .filter((node: { props: { accessibilityLabel?: string } }) =>
            node.props.accessibilityLabel?.startsWith('Open '),
          ),
      ).toHaveLength(3);

      act(() => periodButton(view, '1W')?.props.onPress());
      expect(metricCard(view, 0)).toContain('0');
      expect(metricCard(view, 1)).toContain('No estimated records');
      expect(
        view.root
          .findAllByType(ScrollView)
          .some((node: { props: { accessibilityLabel?: string } }) =>
            node.props.accessibilityLabel?.startsWith(
              'Recent workout volumes in kilograms:',
            ),
          ),
      ).toBe(false);
      expect(
        view.root
          .findAllByType(Pressable)
          .filter((node: { props: { accessibilityLabel?: string } }) =>
            node.props.accessibilityLabel?.startsWith('Open '),
          ),
      ).toHaveLength(3);

      act(() => periodButton(view, 'ALL')?.props.onPress());
      expect(metricCard(view, 0)).toContain('750');
      expect(metricCard(view, 1)).toContain('older exercise');
      expect(metricCard(view, 1)).not.toContain('future exercise');
      await act(async () => view.unmount());
    }
  } finally {
    nowSpy.mockRestore();
  }
});
