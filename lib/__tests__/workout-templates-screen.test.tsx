import { isPressable } from './pressable';
import { TextInput } from 'react-native';
import type { ReactElement } from 'react';
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

const { act, create } = jest.requireActual('react-test-renderer');

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
    expect(action(view, 'Edit My Push')).toBeDefined();
    expect(action(view, 'Delete My Push')).toBeDefined();
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

    act(() => action(view, 'Edit My Push')?.props.onPress());

    expect(action(view, 'Edit My Push')?.props.disabled).toBe(true);
    expect(action(view, 'Delete My Push')?.props.disabled).toBe(true);
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

    act(() => action(view, 'Edit My Push')?.props.onPress());
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

    act(() => action(view, 'Delete My Push')?.props.onPress());
    let confirmation = view.root.findByType(Confirmation);
    expect(confirmation.props.visible).toBe(true);
    act(() => confirmation.props.onCancel());
    expect(onDelete).not.toHaveBeenCalled();

    act(() => action(view, 'Delete My Push')?.props.onPress());
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
    act(() => action(view, 'Edit My Push')?.props.onPress());
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
    act(() => action(view, 'Delete My Push')?.props.onPress());
    act(() => view.root.findAllByType(Confirmation).at(-1)?.props.onCancel());
    expect(
      JSON.parse((await AsyncStorage.getItem('fitflow_state_v1'))!).templates,
    ).toContainEqual(custom);

    act(() => action(view, 'Delete My Push')?.props.onPress());
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
    act(() => action(view, 'Edit Old custom')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain('removed-exercise');
    act(() => appButton(view, 'Cancel')?.props.onPress());

    expect(await AsyncStorage.getItem('fitflow_state_v1')).toBe(raw);
    act(() => view.unmount());
  });
});
