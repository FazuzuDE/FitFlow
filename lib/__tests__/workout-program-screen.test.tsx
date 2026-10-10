import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Workout } from '../../components/Workout';
import { AppButton } from '../../components/AppButton';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import { startWorkout } from '../workout-engine';
import type { WorkoutSession } from '../workout-model';
import { isPressable } from './pressable';

const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));

const initialSession = () =>
  startWorkout(defaultTemplates[0], exerciseLibrary, Date.now());

function Harness({ busy = false }: { busy?: boolean }) {
  const [session, setSession] = useState(initialSession);
  return (
    <Workout
      session={session}
      history={[]}
      update={(transform) => setSession(transform)}
      finish={() => {}}
      busy={busy}
    />
  );
}

const pressable = (view: ReturnType<typeof create>, label: string) =>
  view.root
    .findAll(isPressable)
    .find(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel === label,
    );
const choices = (view: ReturnType<typeof create>) =>
  view.root
    .findAll(isPressable)
    .filter((node: { props: { accessibilityLabel?: string } }) =>
      node.props.accessibilityLabel?.startsWith('Select exercise '),
    );
const input = (view: ReturnType<typeof create>, label: string) =>
  view.root
    .findAllByType(TextInput)
    .find(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel === label,
    );

it('shows only the current exercise until the program is explicitly expanded', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    const before = view.root.findByType(Workout).props.session;
    expect(choices(view)).toHaveLength(0);
    expect(
      view.root
        .findAllByType(Text)
        .filter(
          (node: { props: { children?: unknown } }) =>
            node.props.children === 'Barbell Bench Press',
        ),
    ).toHaveLength(1);
    expect(
      pressable(view, 'All exercises')?.props.accessibilityState,
    ).toMatchObject({ expanded: false });
    act(() => pressable(view, 'All exercises')?.props.onPress());
    expect(choices(view)).toHaveLength(4);
    expect(
      pressable(view, 'Collapse exercises')?.props.accessibilityState,
    ).toMatchObject({ expanded: true });
    act(() => pressable(view, 'Collapse exercises')?.props.onPress());
    expect(choices(view)).toHaveLength(0);
    act(() => pressable(view, 'All exercises')?.props.onPress());
    act(() =>
      pressable(
        view,
        'Select exercise 1: Barbell Bench Press',
      )?.props.onPress(),
    );
    expect(choices(view)).toHaveLength(0);
    expect(view.root.findByType(Workout).props.session).toEqual(before);
  } finally {
    act(() => view.unmount());
  }
});

it('selects an exercise, collapses the program and retains logged sets and rest', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() =>
      input(view, 'Set 1 weight in kilograms')?.props.onChangeText('60,5'),
    );
    act(() => pressable(view, 'Complete set 1')?.props.onPress());
    const logged: WorkoutSession = view.root.findByType(Workout).props.session;
    act(() => pressable(view, 'All exercises')?.props.onPress());
    const current = choices(view)[0];
    expect(current.props.accessibilityState.selected).toBe(true);
    act(() =>
      pressable(view, 'Select exercise 2: Seated Cable Row')?.props.onPress(),
    );
    const selected: WorkoutSession =
      view.root.findByType(Workout).props.session;
    expect(selected.currentExerciseIndex).toBe(1);
    expect(selected.exercises).toEqual(logged.exercises);
    expect(selected.restEndsAt).toBe(logged.restEndsAt);
    expect(choices(view)).toHaveLength(0);
    act(() => pressable(view, 'All exercises')?.props.onPress());
    act(() =>
      pressable(
        view,
        'Select exercise 1: Barbell Bench Press',
      )?.props.onPress(),
    );
    expect(input(view, 'Set 1 weight in kilograms')?.props.value).toBe('60.5');
    expect(input(view, 'Set 1 weight in kilograms')?.props.editable).toBe(
      false,
    );
  } finally {
    act(() => view.unmount());
  }
});

it('returns to the focused view after automatic progression and for a new session', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    for (let index = 1; index <= 3; index += 1) {
      act(() =>
        input(view, `Set ${index} weight in kilograms`)?.props.onChangeText(
          '60',
        ),
      );
    }
    act(() => pressable(view, 'All exercises')?.props.onPress());
    for (let index = 1; index <= 3; index += 1) {
      act(() => pressable(view, `Complete set ${index}`)?.props.onPress());
    }
    expect(
      view.root.findByType(Workout).props.session.currentExerciseIndex,
    ).toBe(1);
    expect(choices(view)).toHaveLength(0);
    act(() => pressable(view, 'All exercises')?.props.onPress());
    expect(choices(view)).toHaveLength(4);
    expect(choices(view)[0].props.accessibilityLabel).toBe(
      'Select exercise 1: Barbell Bench Press, completed',
    );
    act(() =>
      view.root.findByType(Workout).props.update(() => initialSession()),
    );
    expect(choices(view)).toHaveLength(0);
  } finally {
    act(() => view.unmount());
  }
});

it('disables the program controls while a workout save is pending', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() => pressable(view, 'All exercises')?.props.onPress());
    act(() => view.update(<Harness busy />));
    expect(pressable(view, 'Collapse exercises')?.props.disabled).toBe(true);
    expect(choices(view)).toHaveLength(4);
    expect(
      choices(view).every(
        (node: { props: { disabled: boolean } }) => node.props.disabled,
      ),
    ).toBe(true);
    expect(
      view.root
        .findAllByType(AppButton)
        .find(
          (node: { props: { title: string } }) =>
            node.props.title === 'Saving…',
        )?.props.disabled,
    ).toBe(true);
  } finally {
    act(() => view.unmount());
  }
});
