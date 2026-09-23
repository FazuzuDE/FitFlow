import { Pressable, Text, TextInput } from 'react-native';
import type { ReactElement } from 'react';
import { ExercisePerformance } from '../../components/ExercisePerformance';
import { WorkoutHistory } from '../../components/WorkoutHistory';
import { Dock } from '../../components/Dock';
import App from '../../app/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSession } from '../workout-model';

const { act, create } = jest.requireActual('react-test-renderer');
const render = (element: ReactElement) => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(element);
  });
  return view;
};

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));

const at = (day: number) => new Date(2026, 8, day, 12).getTime();
const now = at(23);
const workout = (
  id: string,
  day: number,
  libraryId: string,
  name: string,
  weight: string,
): WorkoutSession => ({
  id,
  templateId: 'template',
  name: `${id} workout`,
  startedAt: at(day) - 3_600_000,
  finishedAt: at(day),
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [
    {
      id: `${id}-exercise`,
      libraryId,
      name,
      muscle: 'Saved',
      sets: [
        { id: `${id}-set`, weight, reps: '8', completedAt: at(day) - 1 },
        { id: `${id}-planned`, weight: '95', reps: '5' },
      ],
    },
  ],
});

it('uses the same Progress period after loading history without filtering the archive', async () => {
  const history = [workout('saved', 22, 'bench', 'Saved Bench', '65')];
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    'fitflow_state_v1',
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
  expect(view.root.findByType(ExercisePerformance).props.period).toBe('1M');
  press(view, 'Progress period ALL');
  expect(view.root.findByType(ExercisePerformance).props.period).toBe('ALL');
  expect(view.root.findByType(WorkoutHistory).props.history).toEqual(history);
  act(() => view.unmount());
});

const press = (view: ReturnType<typeof create>, label: string) => {
  const node = view.root
    .findAllByType(Pressable)
    .find(
      (candidate: { props: { accessibilityLabel?: string } }) =>
        candidate.props.accessibilityLabel === label,
    );
  expect(node).toBeDefined();
  act(() => node!.props.onPress());
};
const visibleText = (view: ReturnType<typeof create>) =>
  view.root
    .findAllByType(Text)
    .map((node: { props: { children: string[] | string } }) =>
      Array.isArray(node.props.children)
        ? node.props.children.join('')
        : node.props.children,
    );

describe('ExercisePerformance', () => {
  it('offers only trained exercises, searches saved names, and displays saved valid sets', () => {
    const history = [
      workout('recent', 22, 'unknown-exercise', 'My saved lift', '77,5'),
      workout('old', 3, 'bench', 'Saved Bench', '60'),
    ];
    const view = render(
      <ExercisePerformance history={history} period="1M" now={now} />,
    );

    press(view, 'Choose exercise for logged performance');
    expect(
      view.root
        .findAllByType(Pressable)
        .map(
          (item: { props: { accessibilityLabel?: string } }) =>
            item.props.accessibilityLabel,
        ),
    ).toContain('View My saved lift performance');
    expect(JSON.stringify(view.toJSON())).not.toContain('Farmer');
    act(() => view.root.findByType(TextInput).props.onChangeText('SAVED LIFT'));
    expect(JSON.stringify(view.toJSON())).not.toContain('Saved Bench');
    press(view, 'View My saved lift performance');
    const rendered = JSON.stringify(view.toJSON());
    expect(rendered).toContain('recent workout');
    expect(visibleText(view)).toContain('77.5 kg × 8');
    expect(visibleText(view)).not.toContain('95 kg × 5');
    act(() => view.unmount());
  });

  it('retains selection across period changes and shows an honest empty period', () => {
    const history = [workout('old', 3, 'bench', 'Saved Bench', '60')];
    const view = render(
      <ExercisePerformance history={history} period="1M" now={now} />,
    );
    press(view, 'Choose exercise for logged performance');
    press(view, 'View Saved Bench performance');
    expect(visibleText(view)).toContain('60 kg × 8');
    act(() =>
      view.update(
        <ExercisePerformance history={history} period="1W" now={now} />,
      ),
    );
    expect(visibleText(view)).toContain(
      'No logged sets for this exercise in 1W.',
    );
    expect(visibleText(view)).not.toContain('60 kg × 8');
    act(() => view.unmount());
  });

  it('distinguishes no history from no valid completed sets', () => {
    const empty = render(
      <ExercisePerformance history={[]} period="1M" now={now} />,
    );
    expect(JSON.stringify(empty.toJSON())).toContain(
      'Finish a workout to see logged exercise performance.',
    );
    act(() => empty.unmount());

    const invalid = workout('invalid', 22, 'bench', 'Bench', 'bad');
    const view = render(
      <ExercisePerformance history={[invalid]} period="1M" now={now} />,
    );
    expect(JSON.stringify(view.toJSON())).toContain(
      'No valid completed exercise sets yet.',
    );
    act(() => view.unmount());
  });

  it('distinguishes separate saved identities with the same exercise name', () => {
    const history = [
      workout('first', 22, 'unknown-a', 'Same label', '40'),
      workout('second', 21, 'unknown-b', 'Same label', '50'),
    ];
    const view = render(
      <ExercisePerformance history={history} period="1M" now={now} />,
    );
    press(view, 'Choose exercise for logged performance');
    const labels = view.root
      .findAllByType(Pressable)
      .map(
        (item: { props: { accessibilityLabel?: string } }) =>
          item.props.accessibilityLabel,
      );
    expect(labels).toContain('View Same label (unknown-a) performance');
    expect(labels).toContain('View Same label (unknown-b) performance');
    press(view, 'View Same label (unknown-b) performance');
    expect(visibleText(view)).toContain('Same label (unknown-b)');
    expect(visibleText(view)).toContain('50 kg × 8');
    expect(visibleText(view)).not.toContain('40 kg × 8');
    act(() => view.unmount());
  });
});
