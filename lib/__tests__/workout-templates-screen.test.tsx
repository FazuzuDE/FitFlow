import { isPressable } from './pressable';
import { StyleSheet, TextInput } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { ReactElement, ReactNode } from 'react';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { TemplateEditor } from '../../components/TemplateEditor';
import { WorkoutTemplates } from '../../components/WorkoutTemplates';
import { Workout } from '../../components/Workout';
import { Dock } from '../../components/Dock';
import App from '../../app/index';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import type { WorkoutTemplate } from '../workout-model';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboardingForTest } from './onboarding-fixture';

const { act, create } = jest.requireActual('react-test-renderer');
const mockSwipeMethods = new Map<string, { close: jest.Mock }>();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = jest.requireActual('react');
  const View = jest.requireActual('react-native').View;
  return {
    __esModule: true,
    default: React.forwardRef(function MockSwipeable(
      props: {
        children: ReactNode;
        testID: string;
        renderRightActions?: (...args: unknown[]) => ReactNode;
      },
      ref: unknown,
    ) {
      const methods = React.useMemo(
        () => ({
          close: jest.fn(),
          openLeft: jest.fn(),
          openRight: jest.fn(),
          reset: jest.fn(),
        }),
        [],
      );
      mockSwipeMethods.set(props.testID, methods);
      React.useImperativeHandle(ref, () => methods);
      return React.createElement(
        View,
        { testID: props.testID },
        props.children,
        props.renderRightActions?.({ value: 0 }, { value: 0 }, methods),
      );
    }),
  };
});

const custom: WorkoutTemplate = {
  id: 'custom-one',
  name: 'My Push',
  exerciseIds: ['barbell-bench-press', 'seated-cable-row'],
};

const render = (element: ReactElement) => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(element);
  });
  return view;
};

const appButton = (view: ReturnType<typeof create>, title: string) =>
  view.root
    .findAllByType(AppButton)
    .find((node: { props: { title: string } }) => node.props.title === title);

const action = (view: ReturnType<typeof create>, label: string) =>
  view.root
    .findAll(isPressable)
    .find(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel === label,
    );

describe('TemplateEditor', () => {
  it('distinguishes Create and Edit and cancels a local draft without saving', () => {
    const onSave = jest.fn(async () => ({ ok: true as const }));
    const onCancel = jest.fn();
    const view = render(
      <TemplateEditor
        mode="create"
        busy={false}
        onSave={onSave}
        onCancel={onCancel}
      />,
    );
    expect(JSON.stringify(view.toJSON())).toContain('Create Workout');

    act(() =>
      view.root
        .findByProps({ accessibilityLabel: 'Workout Name' })
        .props.onChangeText('Unsaved name'),
    );
    act(() => appButton(view, 'Cancel')?.props.onPress());
    act(() => view.root.findByType(Confirmation).props.onConfirm());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();

    act(() =>
      view.update(
        <TemplateEditor
          key={custom.id}
          mode="edit"
          template={custom}
          busy={false}
          onSave={onSave}
          onCancel={onCancel}
        />,
      ),
    );
    expect(JSON.stringify(view.toJSON())).toContain('Edit Workout');
    act(() => appButton(view, 'Back')?.props.onPress());
    expect(view.root.findByType(TextInput).props.value).toBe('My Push');
  });

  it('reuses Exercise Library and exposes ordered accessible controls', () => {
    const view = render(
      <TemplateEditor
        mode="edit"
        template={custom}
        busy={false}
        onSave={jest.fn(async () => ({ ok: true as const }))}
        onCancel={jest.fn()}
      />,
    );

    const sheet = view.root.findByType(ExerciseLibrary);
    expect(sheet.props.selectedIds).toEqual(custom.exerciseIds);
    expect(action(view, 'Move Barbell Bench Press up')?.props.disabled).toBe(
      true,
    );
    expect(action(view, 'Move Barbell Bench Press down')?.props.disabled).toBe(
      false,
    );

    act(() => action(view, 'Move Barbell Bench Press down')?.props.onPress());
    let rendered = JSON.stringify(view.toJSON());
    expect(rendered.indexOf('Seated Cable Row')).toBeLessThan(
      rendered.indexOf('Barbell Bench Press'),
    );

    act(() => action(view, 'Remove Seated Cable Row')?.props.onPress());
    rendered = JSON.stringify(view.toJSON());
    expect(rendered).not.toContain('Seated Cable Row');
    expect(rendered).toContain('Barbell Bench Press');
  });

  it('shows stale references and blocks Save until they are explicitly removed', async () => {
    const onSave = jest.fn(async () => ({ ok: true as const }));
    const stale: WorkoutTemplate = {
      id: 'stale',
      name: 'Old day',
      exerciseIds: ['bench', 'removed-exercise'],
    };
    const view = render(
      <TemplateEditor
        mode="edit"
        template={stale}
        busy={false}
        onSave={onSave}
        onCancel={jest.fn()}
      />,
    );

    expect(JSON.stringify(view.toJSON())).toContain('removed-exercise');
    await act(async () => appButton(view, 'Save Workout')?.props.onPress());
    expect(onSave).not.toHaveBeenCalled();
    expect(JSON.stringify(view.toJSON())).toContain(
      'Remove or replace unavailable exercises before saving.',
    );

    act(() =>
      action(
        view,
        'Remove unavailable exercise removed-exercise',
      )?.props.onPress(),
    );
    await act(async () => appButton(view, 'Save Workout')?.props.onPress());
    expect(onSave).toHaveBeenCalledWith({
      name: 'Old day',
      exerciseIds: ['barbell-bench-press'],
    });
  });

  it('keeps a long, many-exercise draft open when durable Save fails', async () => {
    const onSave = jest.fn(async () => ({
      ok: false as const,
      error: 'Template changes could not be saved. Try again.',
    }));
    const many: WorkoutTemplate = {
      id: 'many',
      name: 'A very long workout template name that must remain editable',
      exerciseIds: exerciseLibrary.slice(0, 12).map((exercise) => exercise.id),
    };
    const view = render(
      <TemplateEditor
        mode="edit"
        template={many}
        busy={false}
        onSave={onSave}
        onCancel={jest.fn()}
      />,
    );

    expect(JSON.stringify(view.toJSON())).toContain(many.name);
    expect(
      view.root
        .findAll(isPressable)
        .filter((node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel?.startsWith('Remove '),
        ),
    ).toHaveLength(many.exerciseIds.length);

    await act(async () => appButton(view, 'Save Workout')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain(
      'Template changes could not be saved. Try again.',
    );
    expect(JSON.stringify(view.toJSON())).toContain(many.name);
  });
});

describe('WorkoutTemplates', () => {
  beforeEach(() => mockSwipeMethods.clear());

  it('stacks equal full-row rounded foreground and action background without closed-state gutters', () => {
    const view = render(
      <WorkoutTemplates
        templates={[custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    const swipe = view.root.findByType(Swipeable);
    const foreground = StyleSheet.flatten(swipe.props.childrenContainerStyle);
    const row = StyleSheet.flatten(swipe.props.children.props.style);
    const underlay = StyleSheet.flatten(swipe.props.containerStyle);
    const rail = StyleSheet.flatten(
      view.root.findByProps({ testID: 'quick-actions-custom-one' }).props.style,
    );
    const actionBackground = StyleSheet.flatten(
      view.root.findByProps({ testID: 'quick-background-custom-one' }).props
        .style,
    );

    expect(foreground).toMatchObject({
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      overflow: 'hidden',
    });
    expect(row.backgroundColor).toBeUndefined();
    expect(underlay.backgroundColor).toBe('#FFFFFF');
    expect(actionBackground).toMatchObject({
      backgroundColor: '#F7F7F9',
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      borderRadius: 14,
    });
    expect(actionBackground.borderTopRightRadius).toBeUndefined();
    expect(rail.width).toBe(112);
    expect(rail.backgroundColor).toBeUndefined();
  });

  it('gives More and the two quick actions a symmetric 8pt edge rhythm', () => {
    const view = render(
      <WorkoutTemplates
        templates={[custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    const swipe = view.root.findByType(Swipeable);
    const row = StyleSheet.flatten(swipe.props.children.props.style);
    const rail = StyleSheet.flatten(
      view.root.findByProps({ testID: 'quick-actions-custom-one' }).props.style,
    );

    expect(row.paddingRight).toBe(8);
    expect(rail).toMatchObject({
      width: 112,
      gap: 8,
      paddingHorizontal: 8,
    });
  });

  it('suppresses a row press after swipe and permits a later tap after close', () => {
    const onStart = jest.fn();
    const view = render(
      <WorkoutTemplates
        templates={[custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onStart={onStart}
      />,
    );
    const swipe = view.root.findByType(Swipeable);
    act(() => swipe.props.onSwipeableOpenStartDrag('left'));
    act(() => action(view, 'Start My Push')?.props.onPress());
    expect(onStart).not.toHaveBeenCalled();
    act(() => swipe.props.onSwipeableClose('left'));
    act(() => action(view, 'Start My Push')?.props.onPress());
    expect(onStart).toHaveBeenCalledWith(custom);
  });

  it('allows a fresh tap after an interrupted swipe without a close callback', () => {
    const onStart = jest.fn();
    const view = render(
      <WorkoutTemplates
        templates={[custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onStart={onStart}
      />,
    );
    const swipe = view.root.findByType(Swipeable);
    act(() => swipe.props.onSwipeableOpenStartDrag('left'));
    act(() => action(view, 'Start My Push')?.props.onTouchStart?.());
    act(() => action(view, 'Start My Push')?.props.onPress());
    expect(onStart).toHaveBeenCalledWith(custom);
  });

  it('closes the previous row when another row opens', () => {
    const view = render(
      <WorkoutTemplates
        templates={[...defaultTemplates, custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    const swipes = view.root.findAllByType(Swipeable);
    act(() => swipes[0].props.onSwipeableWillOpen('left'));
    act(() => swipes[2].props.onSwipeableWillOpen('left'));
    expect(
      mockSwipeMethods.get(`template-swipe-${defaultTemplates[0].id}`)?.close,
    ).toHaveBeenCalledTimes(1);
  });

  it('allows a normal tap after an open workout row is removed', () => {
    const onStart = jest.fn();
    const props = {
      busy: false,
      onCreate: jest.fn(),
      onUpdate: jest.fn(),
      onDelete: jest.fn(),
      onStart,
    };
    const view = render(
      <WorkoutTemplates templates={[defaultTemplates[0], custom]} {...props} />,
    );
    act(() =>
      view.root.findAllByType(Swipeable)[0].props.onSwipeableWillOpen('left'),
    );
    act(() =>
      view.update(<WorkoutTemplates templates={[custom]} {...props} />),
    );
    act(() => action(view, 'Start My Push')?.props.onPress());
    expect(onStart).toHaveBeenCalledWith(custom);
  });
  it('starts a workout from a row tap while quick actions remain hidden to accessibility', () => {
    const onStart = jest.fn();
    const view = render(
      <WorkoutTemplates
        templates={[...defaultTemplates, custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onStart={onStart}
      />,
    );
    expect(
      view.root.findByProps({ testID: 'quick-actions-custom-one' }).props
        .accessibilityElementsHidden,
    ).toBe(true);
    act(() => action(view, 'Start My Push')?.props.onPress());
    expect(onStart).toHaveBeenCalledWith(custom);
  });

  it('reveals quick actions on left swipe and assigns no right-swipe actions', () => {
    const view = render(
      <WorkoutTemplates
        templates={[...defaultTemplates, custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    const swipe = view.root
      .findAllByType(Swipeable)
      .find((item: { props: { testID: string } }) =>
        item.props.testID.endsWith('custom-one'),
      )!;
    expect(swipe.props.renderLeftActions).toBeUndefined();
    act(() => swipe.props.onSwipeableWillOpen('left'));
    expect(action(view, 'Edit My Push')).toBeDefined();
    expect(action(view, 'Delete My Push')).toBeDefined();
    expect(
      view.root.findByProps({ testID: 'quick-actions-custom-one' }).props
        .accessibilityElementsHidden,
    ).toBe(false);
    act(() => swipe.props.onSwipeableClose('right'));
    expect(
      view.root.findByProps({ testID: 'quick-actions-custom-one' }).props
        .accessibilityElementsHidden,
    ).toBe(true);
  });

  it('does not start a workout when closing an open swipe also emits a row press', () => {
    const onStart = jest.fn();
    const view = render(
      <WorkoutTemplates
        templates={[custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onStart={onStart}
      />,
    );
    const swipe = view.root.findByType(Swipeable);
    act(() => {
      swipe.props.onSwipeableWillOpen('left');
      swipe.props.onSwipeableCloseStartDrag('right');
      action(view, 'Start My Push')?.props.onPress();
    });
    expect(onStart).not.toHaveBeenCalled();
  });

  it('opens complete custom actions on long press and through accessible More actions', async () => {
    const onDuplicate = jest.fn(async () => ({ ok: true as const }));
    const view = render(
      <WorkoutTemplates
        templates={[...defaultTemplates, custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onDuplicate={onDuplicate}
      />,
    );
    act(() => action(view, 'Start My Push')?.props.onLongPress());
    expect(appButton(view, 'Start Workout')).toBeDefined();
    expect(appButton(view, 'Edit')).toBeDefined();
    expect(appButton(view, 'Duplicate')).toBeDefined();
    expect(appButton(view, 'Delete')).toBeDefined();
    await act(async () => appButton(view, 'Duplicate')?.props.onPress());
    expect(onDuplicate).toHaveBeenCalledWith(custom.id);
    act(() => action(view, 'More actions for My Push')?.props.onPress());
    expect(appButton(view, 'Edit')).toBeDefined();
  });

  it('offers built-in Duplicate/Customize and Hide but never Edit/Delete', async () => {
    const onDuplicate = jest.fn(async () => ({ ok: true as const }));
    const onHide = jest.fn(async () => true);
    const view = render(
      <WorkoutTemplates
        templates={defaultTemplates}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onDuplicate={onDuplicate}
        onHide={onHide}
      />,
    );
    act(() => action(view, 'More actions for Upper Body')?.props.onPress());
    expect(appButton(view, 'Duplicate / Customize')).toBeDefined();
    expect(appButton(view, 'Hide from My Workouts')).toBeDefined();
    expect(appButton(view, 'Edit')).toBeUndefined();
    expect(appButton(view, 'Delete')).toBeUndefined();
    await act(async () =>
      appButton(view, 'Duplicate / Customize')?.props.onPress(),
    );
    expect(onDuplicate).toHaveBeenCalledWith(defaultTemplates[0].id);
    act(() => action(view, 'More actions for Upper Body')?.props.onPress());
    await act(async () =>
      appButton(view, 'Hide from My Workouts')?.props.onPress(),
    );
    expect(onHide).toHaveBeenCalledWith(defaultTemplates[0].id);
  });

  it('keeps built-ins immutable and exposes Edit/Delete only for custom templates', () => {
    const view = render(
      <WorkoutTemplates
        templates={[...defaultTemplates, custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(action(view, 'Edit Upper Body')).toBeUndefined();
    expect(action(view, 'Delete Upper Body')).toBeUndefined();
    act(() => action(view, 'More actions for My Push')?.props.onPress());
    expect(appButton(view, 'Edit')).toBeDefined();
    expect(appButton(view, 'Delete')).toBeDefined();
  });

  it('disables competing template actions while a local draft is open', () => {
    const view = render(
      <WorkoutTemplates
        templates={[...defaultTemplates, custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    act(() => action(view, 'More actions for My Push')?.props.onPress());
    act(() => appButton(view, 'Edit')?.props.onPress());

    expect(action(view, 'More actions for My Push')?.props.disabled).toBe(true);
    expect(action(view, 'More actions for Upper Body')?.props.disabled).toBe(
      true,
    );
  });

  it('does not create a replacement when an edited template disappears', async () => {
    const onCreate = jest.fn(async () => ({ ok: true as const }));
    const onUpdate = jest.fn(async () => ({ ok: true as const }));
    const view = render(
      <WorkoutTemplates
        templates={[...defaultTemplates, custom]}
        busy={false}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />,
    );

    act(() => action(view, 'More actions for My Push')?.props.onPress());
    act(() => appButton(view, 'Edit')?.props.onPress());
    act(() =>
      view.update(
        <WorkoutTemplates
          templates={defaultTemplates}
          busy={false}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={jest.fn()}
        />,
      ),
    );
    await act(async () => appButton(view, 'Save Workout')?.props.onPress());

    expect(onCreate).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(JSON.stringify(view.toJSON())).toContain(
      'Template is no longer available.',
    );
  });

  it('requires confirmation and distinguishes delete cancel from confirm', async () => {
    const onDelete = jest.fn(async () => ({ ok: true as const }));
    const view = render(
      <WorkoutTemplates
        templates={[...defaultTemplates, custom]}
        busy={false}
        onCreate={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={onDelete}
      />,
    );

    act(() => action(view, 'More actions for My Push')?.props.onPress());
    act(() => appButton(view, 'Delete')?.props.onPress());
    let confirmation = view.root.findByType(Confirmation);
    expect(confirmation.props.visible).toBe(true);
    act(() => confirmation.props.onCancel());
    expect(onDelete).not.toHaveBeenCalled();

    act(() => action(view, 'More actions for My Push')?.props.onPress());
    act(() => appButton(view, 'Delete')?.props.onPress());
    confirmation = view.root.findByType(Confirmation);
    await act(async () => confirmation.props.onConfirm());
    expect(onDelete).toHaveBeenCalledWith(custom.id);
    expect(view.root.findByType(Confirmation).props.visible).toBe(false);
  });
});

const storedState = (templates: WorkoutTemplate[]) => ({
  schemaVersion: 1,
  activeWorkout: null,
  history: [],
  templates,
});

const renderApp = async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  return view;
};

const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('Workout Templates app integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await completeOnboardingForTest();
  });

  it('keeps an unfinished workout draft when switching tabs and returning to Profile', async () => {
    const view = await renderApp();
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => appButton(view, 'Create Workout')?.props.onPress());
    act(() =>
      view.root
        .findByProps({ accessibilityLabel: 'Workout Name' })
        .props.onChangeText('Draft day'),
    );
    act(() => appButton(view, 'Next')?.props.onPress());
    act(() =>
      view.root
        .findByType(ExerciseLibrary)
        .props.onAdd({ id: 'barbell-bench-press' }),
    );
    act(() => appButton(view, 'Add Exercise')?.props.onPress());
    act(() => view.root.findByType(Dock).props.onChange('home'));
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    expect(JSON.stringify(view.toJSON())).toContain('Draft day');
    expect(JSON.stringify(view.toJSON())).toContain('Barbell Bench Press');
    expect(appButton(view, 'Save Workout')).toBeDefined();
    act(() => view.unmount());
  });

  it('creates, reloads, and starts a custom template in saved order', async () => {
    let view = await renderApp();
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => appButton(view, 'Create Workout')?.props.onPress());
    act(() =>
      view.root
        .findByProps({ accessibilityLabel: 'Workout Name' })
        .props.onChangeText('Pull first'),
    );
    act(() => appButton(view, 'Next')?.props.onPress());
    act(() =>
      view.root
        .findByType(ExerciseLibrary)
        .props.onAdd({ id: 'seated-cable-row' }),
    );
    act(() => appButton(view, 'Add Exercise')?.props.onPress());
    act(() => appButton(view, 'Add Exercise')?.props.onPress());
    act(() =>
      view.root
        .findByType(ExerciseLibrary)
        .props.onAdd({ id: 'barbell-bench-press' }),
    );
    act(() => appButton(view, 'Add Exercise')?.props.onPress());
    await act(async () => {
      appButton(view, 'Save Workout')?.props.onPress();
      await settle();
    });
    act(() => view.unmount());

    view = await renderApp();
    act(() => action(view, 'Start Pull first')?.props.onPress());
    expect(
      view.root
        .findByType(Workout)
        .props.session.exercises.map(
          (exercise: { libraryId: string }) => exercise.libraryId,
        ),
    ).toEqual(['seated-cable-row', 'barbell-bench-press']);
    act(() => view.unmount());
  });

  it('edits, reorders, reloads, and starts the updated template', async () => {
    await AsyncStorage.setItem(
      'fitflow_state_v1',
      JSON.stringify(storedState([...defaultTemplates, custom])),
    );
    let view = await renderApp();
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => action(view, 'More actions for My Push')?.props.onPress());
    act(() => appButton(view, 'Edit')?.props.onPress());
    act(() => appButton(view, 'Back')?.props.onPress());
    act(() =>
      view.root
        .findByProps({ accessibilityLabel: 'Workout Name' })
        .props.onChangeText('Pull first'),
    );
    act(() => appButton(view, 'Next')?.props.onPress());
    act(() => action(view, 'Move Barbell Bench Press down')?.props.onPress());
    await act(async () => {
      appButton(view, 'Save Workout')?.props.onPress();
      await settle();
    });
    act(() => view.unmount());

    view = await renderApp();
    act(() => action(view, 'Start Pull first')?.props.onPress());
    expect(
      view.root
        .findByType(Workout)
        .props.session.exercises.map(
          (exercise: { libraryId: string }) => exercise.libraryId,
        ),
    ).toEqual(['seated-cable-row', 'barbell-bench-press']);
    act(() => view.unmount());
  });

  it('persists deletion only after confirmation', async () => {
    await AsyncStorage.setItem(
      'fitflow_state_v1',
      JSON.stringify(storedState([...defaultTemplates, custom])),
    );
    const view = await renderApp();
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => action(view, 'More actions for My Push')?.props.onPress());
    act(() => appButton(view, 'Delete')?.props.onPress());
    act(() => view.root.findAllByType(Confirmation).at(-1)?.props.onCancel());
    expect(
      JSON.parse((await AsyncStorage.getItem('fitflow_state_v1'))!).templates,
    ).toContainEqual(custom);

    act(() => action(view, 'More actions for My Push')?.props.onPress());
    act(() => appButton(view, 'Delete')?.props.onPress());
    await act(async () => {
      view.root.findAllByType(Confirmation).at(-1)?.props.onConfirm();
      await settle();
    });
    expect(
      JSON.parse((await AsyncStorage.getItem('fitflow_state_v1'))!).templates,
    ).toEqual(defaultTemplates);
    act(() => view.unmount());
  });

  it('cancels a legacy/stale edit without rewriting persisted data', async () => {
    const raw = JSON.stringify(
      storedState([
        ...defaultTemplates,
        {
          id: 'old-custom',
          name: 'Old custom',
          exerciseIds: ['bench', 'removed-exercise'],
        },
      ]),
    );
    await AsyncStorage.setItem('fitflow_state_v1', raw);
    const view = await renderApp();
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => action(view, 'More actions for Old custom')?.props.onPress());
    act(() => appButton(view, 'Edit')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain('removed-exercise');
    act(() => appButton(view, 'Cancel')?.props.onPress());

    expect(await AsyncStorage.getItem('fitflow_state_v1')).toBe(raw);
    act(() => view.unmount());
  });
});
