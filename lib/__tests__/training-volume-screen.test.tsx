import { isPressable } from './pressable';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
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
    .findAll(isPressable)
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
  jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
});
afterEach(() => jest.restoreAllMocks());

it('selects actual curve points without rounding tiny positive volume to zero', async () => {
  const view = await renderProgress([
    session('tiny', at(21), '0.000000000000000000000000000001'),
    session('latest', at(22), '100'),
  ]);
  try {
    const curve = view.root
      .findAllByProps({ accessibilityRole: 'adjustable' })
      .find(
        (item: { props: { onAccessibilityAction?: unknown } }) =>
          typeof item.props.onAccessibilityAction === 'function',
      );
    expect(curve).toBeDefined();
    act(() =>
      curve!.props.onAccessibilityAction({
        nativeEvent: { actionName: 'decrement' },
      }),
    );
    expect(
      text(view).some(
        (item: string) =>
          item.includes('tiny workout') && item.includes('1e-30 kg'),
      ),
    ).toBe(true);
    act(() =>
      curve!.props.onAccessibilityAction({
        nativeEvent: { actionName: 'increment' },
      }),
    );
    expect(
      text(view).some(
        (item: string) =>
          item.includes('latest workout') && item.includes('100 kg'),
      ),
    ).toBe(true);
  } finally {
    act(() => view.unmount());
  }
});

it('shows source-derived volume change, updates the comparison with periods and omits it for ALL', async () => {
  const view = await renderProgress([
    session('previous', at(-10), '200'),
    session('current', at(21), '500'),
  ]);
  try {
    expect(
      view.root.findByProps({
        accessibilityLabel:
          'Training volume increased by 300 kg vs previous period',
      }),
    ).toBeDefined();
    press(view, 'Progress period 1W');
    expect(text(view)).toContain('No data');
    press(view, 'Progress period ALL');
    expect(text(view)).not.toContain('No data');
    expect(view.root.findByType(WorkoutHistory).props.history).toHaveLength(2);
  } finally {
    act(() => view.unmount());
  }
});

it('shows factual values beside dated bars, including fractional and zero volumes', async () => {
  const view = await renderProgress([
    session('fraction', at(21), '100.25'),
    session('zero', at(22), '0'),
  ]);
  press(view, 'Progress period 1W');
  try {
    const points = chartPoints(view);
    expect(points).toHaveLength(2);
    expect(
      points[0]
        .findAllByType(Text)
        .map((node: { props: { children: unknown } }) => node.props.children),
    ).toContain('100.25');
    expect(
      points[1]
        .findAllByType(Text)
        .map((node: { props: { children: unknown } }) => node.props.children),
    ).toContain('0');
    expect(view.root.findByType(WorkoutHistory).props.history).toHaveLength(2);
  } finally {
    act(() => view.unmount());
  }
});

it('shows a zero-based kg scale without dropping any of the seven recent workouts', async () => {
  const values = [5200, 6200, 5600, 7000, 6000, 7400, 6600];
  const view = await renderProgress(
    values.map((value, index) =>
      session(`chart-${index}`, at(index + 16), String(value)),
    ),
  );
  press(view, 'Progress period 1W');
  try {
    const chart = view.root.findByProps({
      accessibilityLabel: 'Workout volume chart',
    });
    act(() =>
      chart.props.onLayout({ nativeEvent: { layout: { width: 326 } } }),
    );
    const axes = view.root
      .findAllByType(View)
      .filter(
        (node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel === 'Workout volume scale in kilograms',
      );
    expect(axes).toHaveLength(1);
    expect(
      axes[0]
        .findAllByType(Text)
        .map((node: { props: { children: string } }) => node.props.children),
    ).toEqual(['10,000', '7,500', '5,000', '2,500', '0']);
    expect(chartPoints(view)).toHaveLength(7);
    const bar = chartPoints(view)[0]
      .findAllByType(View)
      .find(
        (node: { props: { style: unknown } }) =>
          viewStyle(node.props.style).backgroundColor === '#5E5CE6',
      );
    expect(viewStyle(bar?.props.style).height).toBeCloseTo((96 * 5200) / 10000);
  } finally {
    act(() => view.unmount());
  }
});

it('repeats the same scale for large text without losing workouts or value labels', async () => {
  jest
    .mocked(Dimensions.get)
    .mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 2 });
  const view = await renderProgress(
    Array.from({ length: 7 }, (_, index) =>
      session(
        `large-text-${index}`,
        at(index + 16),
        String(5200 + index * 100),
      ),
    ),
  );
  press(view, 'Progress period 1W');
  try {
    const chart = view.root.findByProps({
      accessibilityLabel: 'Workout volume chart',
    });
    act(() =>
      chart.props.onLayout({ nativeEvent: { layout: { width: 326 } } }),
    );
    const axes = view.root
      .findAllByType(View)
      .filter(
        (node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel === 'Workout volume scale in kilograms',
      );
    expect(axes.length).toBeGreaterThan(1);
    const ticks = axes.map(
      (axis: { findAllByType: typeof view.root.findAllByType }) =>
        axis
          .findAllByType(Text)
          .map((node: { props: { children: string } }) => node.props.children),
    );
    expect(
      ticks.every(
        (values: string[]) => values.join('|') === ticks[0].join('|'),
      ),
    ).toBe(true);
    expect(chartPoints(view)).toHaveLength(7);
    expect(text(view)).toContain('5,800');
  } finally {
    act(() => view.unmount());
  }
});

it('shows sparse same-day workouts as separate dated points and preserves full History', async () => {
  const morning = session('morning', at(22, 9), '100');
  const evening = session('evening', at(22, 19), '150');
  const old = session('old', new Date(2026, 6, 1, 12).getTime(), '80');
  const future = session('future', at(24), '200');
  const history = [future, evening, old, morning];
  const view = await renderProgress(history);
  expect(text(view)).toContain('Last 30 days · kg');
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

it('shows all ten individual workouts on the ALL curve and in details', async () => {
  const history = Array.from({ length: 10 }, (_, index) =>
    session(`day-${index + 1}`, at(index + 1), String(index + 1)),
  );
  const view = await renderProgress(history);
  press(view, 'Progress period ALL');
  expect(text(view)).toContain('Volume by workout · kg');
  expect(chartPoints(view)).toHaveLength(10);
  press(view, 'View all 10 workout volumes in ALL');
  const all = view.root.findByType(FlatList).props.data;
  expect(all).toHaveLength(10);
  expect(all.at(-1).workoutId).toBe('day-1');
  expect(all[0].workoutId).toBe('day-10');
  act(() => view.unmount());
});

it('shows a single zero-volume workout without a positive bar height', async () => {
  const view = await renderProgress([session('zero', at(22), '0')]);
  press(view, 'Progress period 1W');

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
  press(view, 'Progress period 1W');

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
  press(view, 'View all 1 workout volumes in 1W');
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
        Number.isFinite(height) && height >= 0 && height <= 120,
    ),
  ).toBe(true);
  press(view, 'Progress period 1W');
  expect(chartPoints(view)).toHaveLength(0);
  expect(text(view)).toContain('No workouts in this period yet.');
  expect(
    view.root
      .findAll(isPressable)
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
  press(view, 'Progress period 1W');
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

  expect(heights[0]).toBeCloseTo(9.6);
  expect(heights[1]).toBe(96);
  act(() => view.unmount());
});

it('keeps every workout accessible in a long ALL curve and full details', async () => {
  const history = Array.from({ length: 40 }, (_, index) =>
    session(
      `archive-${index}`,
      new Date(2026, 8, 23 - index, 12).getTime(),
      '10',
    ),
  );
  const view = await renderProgress(history);
  press(view, 'Progress period ALL');
  expect(chartPoints(view)).toHaveLength(40);
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
