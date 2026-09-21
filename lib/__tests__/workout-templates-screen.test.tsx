import { Pressable, TextInput } from 'react-native';
import type { ReactElement } from 'react';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { TemplateEditor } from '../../components/TemplateEditor';
import { WorkoutTemplates } from '../../components/WorkoutTemplates';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import type { WorkoutTemplate } from '../workout-model';

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
    .findAllByType(Pressable)
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
    expect(JSON.stringify(view.toJSON())).toContain('Create workout template');

    act(() =>
      view.root
        .findByProps({ accessibilityLabel: 'Template name' })
        .props.onChangeText('Unsaved name'),
    );
    act(() => appButton(view, 'Cancel')?.props.onPress());
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
    expect(JSON.stringify(view.toJSON())).toContain('Edit workout template');
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
    await act(async () => appButton(view, 'Save Template')?.props.onPress());
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
    await act(async () => appButton(view, 'Save Template')?.props.onPress());
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

    expect(view.root.findByType(TextInput).props.value).toBe(many.name);
    expect(
      view.root
        .findAllByType(Pressable)
        .filter((node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel?.startsWith('Remove '),
        ),
    ).toHaveLength(many.exerciseIds.length);

    await act(async () => appButton(view, 'Save Template')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain(
      'Template changes could not be saved. Try again.',
    );
    expect(view.root.findByType(TextInput).props.value).toBe(many.name);
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
