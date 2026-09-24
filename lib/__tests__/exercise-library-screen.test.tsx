import { isPressable } from './pressable';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ReactElement } from 'react';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { Workout } from '../../components/Workout';
import { AppButton } from '../../components/AppButton';
import { exerciseLibrary } from '../exercise-library';
import { defaultTemplates } from '../workout-catalog';
import { startWorkout } from '../workout-engine';
import App from '../../app/index';
import { Dock } from '../../components/Dock';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { act, create } = jest.requireActual('react-test-renderer');
type ScrollNode = {
  props: {
    horizontal?: boolean;
    keyboardShouldPersistTaps?: string;
    style?: StyleProp<ViewStyle>;
  };
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

const renderLibrary = (element: ReactElement) => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(element);
  });
  return view;
};

const findPressable = (
  view: ReturnType<typeof create>,
  accessibilityLabel: string,
) =>
  view.root
    .findAll(isPressable)
    .find((node: { props: { accessibilityLabel?: string } }) =>
      node.props.accessibilityLabel?.startsWith(accessibilityLabel),
    );

const resultLabels = (view: ReturnType<typeof create>, prefix: string) =>
  view.root
    .findAll(isPressable)
    .map(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel,
    )
    .filter((label: string | undefined): label is string =>
      Boolean(label?.startsWith(prefix)),
    );

describe('ExerciseLibrary', () => {
  it('searches names case-insensitively and renders no-results state', () => {
    const view = renderLibrary(
      <ExerciseLibrary visible onClose={jest.fn()} onAdd={jest.fn()} />,
    );
    const search = view.root.findByType(TextInput);

    act(() => search.props.onChangeText('BENCH'));
    expect(resultLabels(view, 'Add Barbell Bench Press')).toHaveLength(1);
    expect(resultLabels(view, 'Add Barbell Back Squat')).toHaveLength(0);

    act(() => search.props.onChangeText('not-a-real-exercise'));
    expect(JSON.stringify(view.toJSON())).toContain('No exercises found');
  });

  it('combines muscle and equipment filters through real presses', () => {
    const view = renderLibrary(
      <ExerciseLibrary visible onClose={jest.fn()} onAdd={jest.fn()} />,
    );

    act(() => findPressable(view, 'Filter muscle Chest')?.props.onPress());
    act(() =>
      findPressable(view, 'Filter equipment Dumbbell')?.props.onPress(),
    );

    expect(resultLabels(view, 'Add Incline Dumbbell Press')).toHaveLength(1);
    expect(resultLabels(view, 'Add Barbell Bench Press')).toHaveLength(0);
  });

  it('keeps horizontal filters compact so the result list owns remaining height', () => {
    const view = renderLibrary(
      <ExerciseLibrary visible onClose={jest.fn()} onAdd={jest.fn()} />,
    );
    const scrollViews = view.root.findAllByType(ScrollView);
    const horizontal = scrollViews.filter(
      (node: ScrollNode) => node.props.horizontal,
    );
    const results = scrollViews.find(
      (node: ScrollNode) => node.props.keyboardShouldPersistTaps === 'handled',
    );

    expect(horizontal).toHaveLength(2);
    expect(
      horizontal.every(
        (node: ScrollNode) =>
          StyleSheet.flatten(node.props.style).flexGrow === 0,
      ),
    ).toBe(true);
    expect(StyleSheet.flatten(results?.props.style).flex).toBe(1);
  });

  it('adds an exercise and exposes controlled selection state', () => {
    const onAdd = jest.fn();
    const onToggle = jest.fn();
    const view = renderLibrary(
      <ExerciseLibrary visible onClose={jest.fn()} onAdd={onAdd} />,
    );

    act(() => findPressable(view, 'Add Barbell Bench Press')?.props.onPress());
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'barbell-bench-press' }),
    );

    act(() =>
      view.update(
        <ExerciseLibrary
          visible
          onClose={jest.fn()}
          selectedIds={['barbell-bench-press']}
          onToggle={onToggle}
        />,
      ),
    );

    const selected = findPressable(view, 'Select Barbell Bench Press');
    expect(selected?.props.accessibilityState).toMatchObject({ checked: true });
    act(() => selected?.props.onPress());
    expect(onToggle).toHaveBeenCalledWith('barbell-bench-press');
  });

  it('resets transient search and filters on close without owning selection', () => {
    const onClose = jest.fn();
    const props = {
      visible: true,
      onClose,
      selectedIds: ['barbell-bench-press'],
      onToggle: jest.fn(),
    };
    const view = renderLibrary(<ExerciseLibrary {...props} />);

    act(() => view.root.findByType(TextInput).props.onChangeText('squat'));
    act(() => findPressable(view, 'Filter muscle Quadriceps')?.props.onPress());
    act(() => findPressable(view, 'Close exercise library')?.props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => view.update(<ExerciseLibrary {...props} visible={false} />));
    act(() => view.update(<ExerciseLibrary {...props} visible />));

    expect(view.root.findByType(TextInput).props.value).toBe('');
    expect(resultLabels(view, 'Select Barbell Bench Press')).toHaveLength(1);
    expect(
      findPressable(view, 'Select Barbell Bench Press')?.props
        .accessibilityState,
    ).toMatchObject({ checked: true });
  });
});

it('uses the reusable library to append an exercise to an active workout', () => {
  jest.useFakeTimers();
  const update = jest.fn();
  const session = startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
  const view = renderLibrary(
    <Workout
      session={session}
      history={[]}
      update={update}
      finish={jest.fn()}
      busy={false}
    />,
  );
  const addButton = view.root
    .findAllByType(AppButton)
    .find((node: { props: { title: string } }) =>
      node.props.title.startsWith('Add exercise'),
    );

  act(() => addButton?.props.onPress());
  const sheet = view.root.findByType(ExerciseLibrary);
  expect(sheet.props.visible).toBe(true);

  act(() => sheet.props.onAdd(exerciseLibrary.at(-1)));
  const transform = update.mock.calls.at(-1)?.[0];
  expect(transform(session).exercises.at(-1).libraryId).toBe('farmers-carry');
  act(() => view.unmount());
  jest.useRealTimers();
});

it('selects canonical exercises for a template without rendering the full catalog', async () => {
  await AsyncStorage.clear();
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });

  act(() => view.root.findByType(Dock).props.onChange('profile'));
  expect(JSON.stringify(view.toJSON())).not.toContain("Farmer's Carry");

  const button = (title: string) =>
    view.root
      .findAllByType(AppButton)
      .find((node: { props: { title: string } }) => node.props.title === title);
  act(() => button('Create Template')?.props.onPress());
  act(() => button('Choose exercises')?.props.onPress());

  const sheet = view.root.findByType(ExerciseLibrary);
  act(() => sheet.props.onToggle('barbell-bench-press'));
  act(() => sheet.props.onToggle('seated-cable-row'));
  act(() => sheet.props.onClose());
  await act(async () => {
    button('Save Template')?.props.onPress();
    await Promise.resolve();
  });

  const saved = JSON.parse((await AsyncStorage.getItem('fitflow_state_v1'))!);
  expect(saved.templates.at(-1).exerciseIds).toEqual([
    'barbell-bench-press',
    'seated-cable-row',
  ]);
  act(() => view.unmount());
});

it('shows canonical exercise names for saved legacy templates on Home', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    'fitflow_state_v1',
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [],
      templates: [
        {
          id: 'legacy-template',
          name: 'Legacy Template',
          exerciseIds: ['bench', 'row'],
        },
      ],
    }),
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });

  const rendered = JSON.stringify(view.toJSON());
  expect(rendered).toContain('Barbell Bench Press');
  expect(rendered).toContain('Seated Cable Row');
  act(() => view.unmount());
});

it('reports available and unavailable exercise counts truthfully on Home', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    'fitflow_state_v1',
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [],
      templates: [
        {
          id: 'partially-stale',
          name: 'Partially Stale',
          exerciseIds: ['bench', 'missing-exercise', 'row'],
        },
      ],
    }),
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });

  expect(JSON.stringify(view.toJSON())).toContain(
    '2 available · 1 unavailable',
  );
  act(() => view.unmount());
});
