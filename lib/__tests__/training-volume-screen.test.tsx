import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import App from '../../app/index';
import { Dock } from '../../components/Dock';
import { WorkoutHistory } from '../../components/WorkoutHistory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSession } from '../workout-model';
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

const at = (day: number, hour = 12) => new Date(2026, 8, day, hour).getTime();
const now = at(23);
const session = (
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
      libraryId: 'bench',
      name: 'Saved Bench',
      muscle: 'Saved',
      sets: [
        { id: `${id}-set`, weight, reps: '1', completedAt: finishedAt - 100 },
      ],
    },
  ],
});

const renderProgress = async (history: WorkoutSession[]) => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history,
      templates: [],
    }),
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  act(() => view.root.findByType(Dock).props.onChange('progress'));
  return view;
};
const press = (view: ReturnType<typeof create>, label: string) => {
  const button = view.root
    .findAllByType(Pressable)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === label,
    );
  expect(button).toBeDefined();
  act(() => button!.props.onPress());
};
const chartPoints = (view: ReturnType<typeof create>) =>
  view.root
    .findAllByType(View)
    .filter((item: { props: { accessibilityLabel?: string } }) =>
      item.props.accessibilityLabel?.startsWith('Workout volume: '),
    );
const text = (view: ReturnType<typeof create>) =>
  view.root
    .findAllByType(Text)
    .map((item: { props: { children: unknown } }) =>
      Array.isArray(item.props.children)
        ? item.props.children.join('')
        : String(item.props.children),
    );
const viewStyle = (style: unknown) =>
  StyleSheet.flatten(style as StyleProp<ViewStyle>) ?? {};

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(now);
});
afterEach(() => jest.restoreAllMocks());

it('shows sparse same-day workouts as separate dated points and preserves full History', async () => {
  const morning = session('morning', at(22, 9), '100');
  const evening = session('evening', at(22, 19), '150');
  const old = session('old', new Date(2026, 6, 1, 12).getTime(), '80');
  const future = session('future', at(24), '200');
  const history = [future, evening, old, morning];
  const view = await renderProgress(history);
  expect(text(view)).toContain('Recent workouts · 2 of 2 in 1M');
  expect(chartPoints(view)).toHaveLength(2);
  const labels = chartPoints(view).map(
    (item: { props: { accessibilityLabel: string } }) =>
      item.props.accessibilityLabel,
  );
  expect(labels[0]).toContain('morning workout');
  expect(labels[0]).toContain('100 kg');
  expect(labels[1]).toContain('evening workout');
  expect(labels[1]).toContain('150 kg');
  expect(labels[0]).toContain(new Date(at(22, 9)).toLocaleString());
  expect(labels[1]).toContain(new Date(at(22, 19)).toLocaleString());
  const shortDate = new Date(at(22)).toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
  });
  expect(text(view).filter((item: string) => item === shortDate)).toHaveLength(
    2,
  );
  expect(view.root.findByType(WorkoutHistory).props.history).toEqual(history);
  press(view, 'View all 2 workout volumes in 1M');
  const all = view.root.findByType(FlatList).props.data;
  expect(all.map((item: { workoutId: string }) => item.workoutId)).toEqual([
    'evening',
    'morning',
  ]);
  expect(text(view)).toContain('evening workout');
  expect(text(view)).toContain('morning workout');
  const fullLabels = view.root
    .findAllByType(View)
    .map(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel,
    );
  expect(fullLabels).toContain(
    `evening workout, ${new Date(at(22, 19)).toLocaleString()}, 150 kg`,
  );
  expect(fullLabels).toContain(
    `morning workout, ${new Date(at(22, 9)).toLocaleString()}, 100 kg`,
  );
  act(() => view.unmount());
});

it('keeps seven recent bars but exposes all ten individual workouts in ALL', async () => {
  const history = Array.from({ length: 10 }, (_, index) =>
    session(`day-${index + 1}`, at(index + 1), String(index + 1)),
  );
  const view = await renderProgress(history);
  press(view, 'Progress period ALL');
  expect(text(view)).toContain('Recent workouts · 7 of 10 in ALL');
  expect(chartPoints(view)).toHaveLength(7);
  press(view, 'View all 10 workout volumes in ALL');
  const all = view.root.findByType(FlatList).props.data;
  expect(all).toHaveLength(10);
  expect(all.at(-1).workoutId).toBe('day-1');
  expect(all[0].workoutId).toBe('day-10');
  act(() => view.unmount());
});

it('shows a single zero-volume workout without a positive bar height', async () => {
  const view = await renderProgress([session('zero', at(22), '0')]);
  expect(chartPoints(view)).toHaveLength(1);
  expect(chartPoints(view)[0].props.accessibilityLabel).toContain('0 kg');
  const bar = chartPoints(view)[0]
    .findAllByType(View)
    .find(
      (item: { props: { style?: unknown } }) =>
        viewStyle(item.props.style).backgroundColor === '#0A84FF',
    );
  expect(viewStyle(bar?.props.style).height).toBe(0);
  act(() => view.unmount());
});

it('does not label a small positive workout volume as zero', async () => {
  const view = await renderProgress([session('small', at(22), '0.0001')]);
  expect(chartPoints(view)[0].props.accessibilityLabel).toContain('0.0001 kg');
  expect(
    view.root
      .findAllByType(Text)
      .some((item: { props: { children: unknown } }) =>
        Array.isArray(item.props.children)
          ? item.props.children[0] === '0.0001'
          : false,
      ),
  ).toBe(true);
  press(view, 'View all 1 workout volumes in 1M');
  expect(text(view)).toContain('0.0001 kg');
  act(() => view.unmount());
});

it('keeps large-volume dimensions finite and hides controls for an empty period', async () => {
  const huge = `1${'0'.repeat(307)}`;
  const view = await renderProgress([session('huge', at(1), huge)]);
  press(view, 'Progress period ALL');
  expect(chartPoints(view)).toHaveLength(1);
  const heights = chartPoints(view)[0]
    .findAllByType(View)
    .map(
      (item: { props: { style?: unknown } }) =>
        viewStyle(item.props.style).height,
    )
    .filter((height: unknown): height is number => typeof height === 'number');
  expect(
    heights.every(
      (height: number) =>
        Number.isFinite(height) && height >= 0 && height <= 60,
    ),
  ).toBe(true);
  press(view, 'Progress period 1W');
  expect(chartPoints(view)).toHaveLength(0);
  expect(text(view)).toContain('No workouts in this period yet.');
  expect(
    view.root
      .findAllByType(Pressable)
      .some((item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel?.startsWith('View all 1 workout volumes'),
      ),
  ).toBe(false);
  act(() => view.unmount());
});

it('preserves relative bar heights for very large finite workout volumes', async () => {
  const smaller = `1${'0'.repeat(307)}`;
  const larger = `1${'0'.repeat(308)}`;
  const view = await renderProgress([
    session('smaller', at(21), smaller),
    session('larger', at(22), larger),
  ]);
  const heights = chartPoints(view).map(
    (point: { findAllByType: typeof view.root.findAllByType }) => {
      const bar = point
        .findAllByType(View)
        .find(
          (item: { props: { style?: unknown } }) =>
            viewStyle(item.props.style).backgroundColor === '#5E5CE6' ||
            viewStyle(item.props.style).backgroundColor === '#0A84FF',
        );
      return viewStyle(bar?.props.style).height;
    },
  );
  expect(heights[0]).toBeCloseTo(6);
  expect(heights[1]).toBe(60);
  act(() => view.unmount());
});

it('keeps a long ALL dataset accessible without rendering more than seven overview bars', async () => {
  const history = Array.from({ length: 40 }, (_, index) =>
    session(
      `archive-${index}`,
      new Date(2026, 8, 23 - index, 12).getTime(),
      '10',
    ),
  );
  const view = await renderProgress(history);
  press(view, 'Progress period ALL');
  expect(chartPoints(view)).toHaveLength(7);
  press(view, 'View all 40 workout volumes in ALL');
  const list = view.root.findByType(FlatList);
  expect(list.props.data).toHaveLength(40);
  expect(
    new Set(
      list.props.data.map((item: { workoutId: string }) => item.workoutId),
    ).size,
  ).toBe(40);
  act(() => view.unmount());
});
