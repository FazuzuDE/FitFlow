import { useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light' },
}));
// Only the native attachment is replaced. Tests deliver events to the actual
// Gesture.Pan callbacks and render the production list/state/engine.
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  GestureDetector: jest.requireActual('react-native').View,
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

it('accessible reordering leaves the program open and preserves the current exercise and rest', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() =>
      input(view, 'Set 1 weight in kilograms')?.props.onChangeText('60.5'),
    );
    act(() => pressable(view, 'Complete set 1')?.props.onPress());
    const before: WorkoutSession = view.root.findByType(Workout).props.session;
    act(() => pressable(view, 'All exercises')?.props.onPress());
    const first = choices(view)[0];
    expect(first.props.accessibilityActions ?? []).toContainEqual({
      name: 'moveDown',
      label: 'Move down',
    });
    expect(first.props.accessibilityActions).not.toContainEqual({
      name: 'moveUp',
      label: 'Move up',
    });
    act(() =>
      first.props.onAccessibilityAction({
        nativeEvent: { actionName: 'moveDown' },
      }),
    );
    const next: WorkoutSession = view.root.findByType(Workout).props.session;
    expect(next.currentExerciseIndex).toBe(1);
    expect(next.exercises[1]).toEqual(before.exercises[0]);
    expect(next.restEndsAt).toBe(before.restEndsAt);
    expect(choices(view)).toHaveLength(4);
    expect(choices(view)[1].props.accessibilityState.selected).toBe(true);
    // Retain the native row element so screen-reader focus can stay on it.
    expect(choices(view)[1]).toBe(first);
    expect(input(view, 'Set 1 weight in kilograms')?.props.value).toBe('60.5');
  } finally {
    act(() => view.unmount());
  }
});

const gestures = (view: ReturnType<typeof create>) =>
  view.root
    .findAllByType(View)
    .filter(
      (node: {
        props: { gesture?: { config: { activateAfterLongPress?: number } } };
      }) => node.props.gesture?.config.activateAfterLongPress === 450,
    );
function measureProgram(view: ReturnType<typeof create>) {
  const session: WorkoutSession = view.root.findByType(Workout).props.session;
  session.exercises.forEach((item, index) => {
    act(() =>
      view.root
        .findByProps({ testID: `program-row-${item.id}` })
        .props.onLayout({
          nativeEvent: { layout: { y: index * 68, height: 60, width: 280 } },
        }),
    );
  });
}

it('holds and drops a row using measured heights without selecting it or collapsing', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() => pressable(view, 'All exercises')?.props.onPress());
    const before: WorkoutSession = view.root.findByType(Workout).props.session;
    expect(gestures(view)).toHaveLength(4);
    measureProgram(view);
    const gesture = gestures(view)[0].props.gesture;
    act(() => gesture.handlers.onStart({ translationY: 0, absoluteY: 100 }));
    expect(view.root.findByType(Workout).props.session).toEqual(before);
    act(() => gesture.handlers.onUpdate({ translationY: 150, absoluteY: 250 }));
    expect(view.root.findByType(Workout).props.session).toEqual(before);
    act(() => {
      gesture.handlers.onEnd({ translationY: 150, absoluteY: 250 }, true);
      gesture.handlers.onFinalize({}, true);
    });
    const next: WorkoutSession = view.root.findByType(Workout).props.session;
    expect(next.exercises.map((item) => item.id)).toEqual([
      before.exercises[1].id,
      before.exercises[2].id,
      before.exercises[0].id,
      before.exercises[3].id,
    ]);
    expect(next.currentExerciseIndex).toBe(2);
    expect(choices(view)).toHaveLength(4);
    // A native release must never also act as a tap.
    act(() => choices(view)[2].props.onPress());
    expect(choices(view)).toHaveLength(4);
  } finally {
    act(() => view.unmount());
  }
});

it('cancels a native drag without committing any exercise order', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() => pressable(view, 'All exercises')?.props.onPress());
    expect(gestures(view)).toHaveLength(4);
    measureProgram(view);
    const before = view.root.findByType(Workout).props.session;
    const gesture = gestures(view)[3].props.gesture;
    act(() => gesture.handlers.onStart({ translationY: 0, absoluteY: 300 }));
    act(() =>
      gesture.handlers.onUpdate({ translationY: -180, absoluteY: 120 }),
    );
    act(() => {
      gesture.handlers.onEnd({}, false);
      gesture.handlers.onFinalize({}, false);
    });
    expect(view.root.findByType(Workout).props.session).toEqual(before);
    expect(choices(view)).toHaveLength(4);
  } finally {
    act(() => view.unmount());
  }
});

it('backgrounding cancels an in-progress drag even if a delayed release arrives', () => {
  let view: ReturnType<typeof create>;
  let listener: (state: string) => void = () => {};
  const previous = (
    AppState.addEventListener as jest.Mock
  ).getMockImplementation();
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((type, callback) => {
      if (type === 'change') listener = callback as (state: string) => void;
      return { remove: jest.fn() };
    });
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() => pressable(view, 'All exercises')?.props.onPress());
    expect(gestures(view)).toHaveLength(4);
    measureProgram(view);
    const before = view.root.findByType(Workout).props.session;
    const gesture = gestures(view)[0].props.gesture;
    act(() => gesture.handlers.onStart({ translationY: 0, absoluteY: 100 }));
    act(() => gesture.handlers.onUpdate({ translationY: 150, absoluteY: 250 }));
    act(() => listener('background'));
    act(() => gesture.handlers.onEnd({}, true));
    expect(view.root.findByType(Workout).props.session).toEqual(before);
  } finally {
    act(() => view.unmount());
    subscription.mockImplementation(previous!);
  }
});

it('can move a tall wrapping row past a shorter last row', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() => pressable(view, 'All exercises')?.props.onPress());
    const before: WorkoutSession = view.root.findByType(Workout).props.session;
    const heights = [144, 60, 60, 44];
    let y = 0;
    before.exercises.forEach((item, index) => {
      act(() =>
        view.root
          .findByProps({ testID: `program-row-${item.id}` })
          .props.onLayout({
            nativeEvent: { layout: { y, height: heights[index], width: 280 } },
          }),
      );
      y += heights[index] + 8;
    });
    const gesture = gestures(view)[0].props.gesture;
    act(() => gesture.handlers.onStart({ absoluteY: 100 }));
    act(() => gesture.handlers.onUpdate({ translationY: 400, absoluteY: 500 }));
    act(() => gesture.handlers.onEnd({}, true));
    const next: WorkoutSession = view.root.findByType(Workout).props.session;
    expect(next.exercises[3].id).toBe(before.exercises[0].id);
    expect(next.currentExerciseIndex).toBe(3);
  } finally {
    act(() => view.unmount());
  }
});

it('saving cancels a held row and rejects its late drop or accessibility action', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() => pressable(view, 'All exercises')?.props.onPress());
    measureProgram(view);
    const before = view.root.findByType(Workout).props.session;
    const gesture = gestures(view)[0].props.gesture;
    act(() => gesture.handlers.onStart({ absoluteY: 100 }));
    expect(view.root.findByType(ScrollView).props.scrollEnabled).toBe(false);
    act(() => gesture.handlers.onUpdate({ translationY: 180, absoluteY: 280 }));
    act(() => view.update(<Harness busy />));
    act(() => gesture.handlers.onStart({ absoluteY: 100 }));
    expect(view.root.findByType(ScrollView).props.scrollEnabled).toBe(true);
    act(() => gesture.handlers.onEnd({}, true));
    act(() =>
      choices(view)[0].props.onAccessibilityAction({
        nativeEvent: { actionName: 'moveDown' },
      }),
    );
    expect(view.root.findByType(Workout).props.session).toEqual(before);
    expect(view.root.findByType(ScrollView).props.scrollEnabled).toBe(true);
    expect(choices(view)[0].props.accessibilityActions).toEqual([]);
  } finally {
    act(() => view.unmount());
  }
});

it('Reduce Motion allows reordering without starting the jiggle loop', async () => {
  const previousMotion = (
    AccessibilityInfo.isReduceMotionEnabled as jest.Mock
  ).getMockImplementation();
  const previousLoop = jest.isMockFunction(Animated.loop)
    ? (Animated.loop as jest.Mock).getMockImplementation()
    : undefined;
  const preference = jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  const loop = jest.spyOn(Animated, 'loop');
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<Harness />);
  });
  try {
    await act(async () => pressable(view, 'All exercises')?.props.onPress());
    measureProgram(view);
    const before: WorkoutSession = view.root.findByType(Workout).props.session;
    const gesture = gestures(view)[0].props.gesture;
    act(() => gesture.handlers.onStart({ absoluteY: 100 }));
    act(() => gesture.handlers.onUpdate({ translationY: 150, absoluteY: 250 }));
    act(() => gesture.handlers.onEnd({}, true));
    expect(view.root.findByType(Workout).props.session.exercises[2].id).toBe(
      before.exercises[0].id,
    );
    expect(loop).not.toHaveBeenCalled();
  } finally {
    act(() => view.unmount());
    preference.mockImplementation(previousMotion!);
    if (previousLoop) loop.mockImplementation(previousLoop);
    else loop.mockRestore();
  }
});

it('edge scrolling stops at the program boundary before the following set/rest controls', () => {
  jest.useFakeTimers();
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() => pressable(view, 'All exercises')?.props.onPress());
    measureProgram(view);
    const before: WorkoutSession = view.root.findByType(Workout).props.session;
    const positions: number[] = [];
    const scroll = view.root.findByType(ScrollView);
    act(() =>
      scroll.props.ref({
        getNativeScrollRef: () => ({
          measureInWindow: (callback: (...args: number[]) => void) =>
            callback(0, 100, 280, 500),
        }),
        scrollTo: ({ y }: { y: number }) => positions.push(y),
      }),
    );
    act(() => scroll.props.onContentSizeChange(280, 1500));
    const gesture = gestures(view)[0].props.gesture;
    act(() => gesture.handlers.onStart({ absoluteY: 590 }));
    act(() => jest.advanceTimersByTime(4000));
    expect(positions.length).toBeGreaterThan(0);
    expect(Math.max(...positions)).toBe(204);
    expect(view.root.findByType(Workout).props.session).toEqual(before);
    act(() => gesture.handlers.onEnd({}, true));
    expect(
      view.root.findByType(Workout).props.session.currentExerciseIndex,
    ).toBe(3);
    const count = positions.length;
    act(() => jest.advanceTimersByTime(1000));
    expect(positions).toHaveLength(count);
  } finally {
    act(() => view.unmount());
    jest.useRealTimers();
  }
});

it('a different row finalizing cannot cancel or commit the held row', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() => pressable(view, 'All exercises')?.props.onPress());
    measureProgram(view);
    const before: WorkoutSession = view.root.findByType(Workout).props.session;
    const primary = gestures(view)[0].props.gesture;
    const other = gestures(view)[1].props.gesture;
    act(() => primary.handlers.onStart({ absoluteY: 100 }));
    act(() => primary.handlers.onUpdate({ translationY: 150, absoluteY: 250 }));
    act(() => other.handlers.onEnd({}, true));
    expect(view.root.findByType(Workout).props.session).toEqual(before);
    act(() => other.handlers.onFinalize({}, false));
    expect(view.root.findByType(ScrollView).props.scrollEnabled).toBe(false);
    act(() => primary.handlers.onEnd({}, true));
    expect(
      view.root.findByType(Workout).props.session.currentExerciseIndex,
    ).toBe(2);
  } finally {
    act(() => view.unmount());
  }
});

it('rebases animated neighbor offsets when their committed positions change', async () => {
  const previous = (
    AccessibilityInfo.isReduceMotionEnabled as jest.Mock
  ).getMockImplementation();
  const preference = jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<Harness />);
  });
  try {
    await act(async () => pressable(view, 'All exercises')?.props.onPress());
    measureProgram(view);
    const before: WorkoutSession = view.root.findByType(Workout).props.session;
    const neighbor = view.root.findByProps({
      testID: `program-row-${before.exercises[1].id}`,
    });
    const gesture = gestures(view)[0].props.gesture;
    act(() => gesture.handlers.onStart({ absoluteY: 100 }));
    act(() => gesture.handlers.onUpdate({ translationY: 150, absoluteY: 250 }));
    const displaced = neighbor.props.style[0].transform[0].translateY;
    // Native animation completion is outside React Test Renderer.
    act(() => displaced.setValue(-68));
    act(() => gesture.handlers.onEnd({}, true));
    const movedNeighbor = view.root.findByProps({
      testID: `program-row-${before.exercises[1].id}`,
    });
    expect(movedNeighbor).toBe(neighbor);
    expect(displaced.__getValue()).toBe(0);
  } finally {
    act(() => view.unmount());
    preference.mockImplementation(previous!);
  }
});

it('allows later non-pointer activation after suppressing the releasing press', () => {
  jest.useFakeTimers();
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() => pressable(view, 'All exercises')?.props.onPress());
    measureProgram(view);
    const gesture = gestures(view)[0].props.gesture;
    act(() => gesture.handlers.onStart({ absoluteY: 100 }));
    act(() => gesture.handlers.onUpdate({ translationY: 150, absoluteY: 250 }));
    act(() => gesture.handlers.onEnd({}, true));
    act(() => choices(view)[0].props.onPress());
    expect(choices(view)).toHaveLength(4);
    act(() => jest.advanceTimersByTime(250));
    act(() => choices(view)[0].props.onPress());
    expect(choices(view)).toHaveLength(0);
  } finally {
    act(() => view.unmount());
    jest.useRealTimers();
  }
});
