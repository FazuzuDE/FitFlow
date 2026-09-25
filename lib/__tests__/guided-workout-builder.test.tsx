import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { TemplateEditor } from '../../components/TemplateEditor';
import type { WorkoutTemplate } from '../workout-model';
import { isPressable } from './pressable';

const { act, create } = jest.requireActual('react-test-renderer');

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));

const render = (element: ReactElement) => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(element);
  });
  return view;
};
const button = (view: ReturnType<typeof create>, title: string) =>
  view.root
    .findAllByType(AppButton)
    .find((item: { props: { title: string } }) => item.props.title === title);
const action = (view: ReturnType<typeof create>, label: string) =>
  view.root
    .findAll(isPressable)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === label,
    );
const input = (view: ReturnType<typeof create>, label: string) =>
  view.root
    .findAllByType(TextInput)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === label,
    );

describe('guided workout builder', () => {
  it('requires a name and automatically opens the library after Next without persisting', () => {
    const onSave = jest.fn();
    const view = render(
      <TemplateEditor
        mode="create"
        busy={false}
        onSave={onSave}
        onCancel={jest.fn()}
      />,
    );
    expect(JSON.stringify(view.toJSON())).toContain('Create Workout');
    expect(input(view, 'Workout Name')?.props.value).toBe('');
    act(() => button(view, 'Next')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain('Enter a workout name.');
    act(() => input(view, 'Workout Name')?.props.onChangeText('  Push Day  '));
    act(() => button(view, 'Next')?.props.onPress());
    expect(view.root.findByType(ExerciseLibrary).props.visible).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('selects one exercise, configures it, preserves draft through Back, and adds a second', async () => {
    const onSave = jest.fn(async () => ({ ok: true as const }));
    const view = render(
      <TemplateEditor
        mode="create"
        busy={false}
        onSave={onSave}
        onCancel={jest.fn()}
      />,
    );
    act(() => input(view, 'Workout Name')?.props.onChangeText('Push Day'));
    act(() => button(view, 'Next')?.props.onPress());
    act(() =>
      view.root.findByType(ExerciseLibrary).props.onAdd({
        id: 'barbell-bench-press',
        name: 'Barbell Bench Press',
      }),
    );
    expect(JSON.stringify(view.toJSON())).toContain('Barbell Bench Press');
    act(() => input(view, 'Planned sets')?.props.onChangeText('4'));
    act(() =>
      input(view, 'Starting weight in kilograms')?.props.onChangeText('60,5'),
    );
    act(() => button(view, 'Add Exercise')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain('60.5 kg');
    act(() => button(view, 'Back')?.props.onPress());
    expect(input(view, 'Workout Name')?.props.value).toBe('Push Day');
    act(() => button(view, 'Next')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain('60.5 kg');
    act(() => button(view, 'Add Exercise')?.props.onPress());
    act(() =>
      view.root
        .findByType(ExerciseLibrary)
        .props.onAdd({ id: 'seated-cable-row', name: 'Seated Cable Row' }),
    );
    act(() => button(view, 'Add Exercise')?.props.onPress());
    await act(async () => button(view, 'Save Workout')?.props.onPress());
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      name: 'Push Day',
      exerciseIds: ['barbell-bench-press', 'seated-cable-row'],
      plannedExercises: [
        { exerciseId: 'barbell-bench-press', sets: 4, weight: '60.5' },
        { exerciseId: 'seated-cable-row', sets: 3 },
      ],
    });
  });

  it('edits and removes configured exercises, prevents duplicate selection, and retains draft after failed save', async () => {
    const template: WorkoutTemplate = {
      id: 'push',
      name: 'Push',
      exerciseIds: ['barbell-bench-press'],
      plannedExercises: [
        { exerciseId: 'barbell-bench-press', sets: 4, weight: '60' },
      ],
    };
    const onSave = jest.fn(async () => ({
      ok: false as const,
      error: 'Disk full.',
    }));
    const view = render(
      <TemplateEditor
        mode="edit"
        template={template}
        busy={false}
        onSave={onSave}
        onCancel={jest.fn()}
      />,
    );
    act(() => action(view, 'Edit Barbell Bench Press')?.props.onPress());
    expect(input(view, 'Planned sets')?.props.value).toBe('4');
    act(() => input(view, 'Planned sets')?.props.onChangeText('5'));
    act(() => button(view, 'Update Exercise')?.props.onPress());
    act(() => button(view, 'Add Exercise')?.props.onPress());
    expect(
      action(view, 'Already added Barbell Bench Press')?.props.disabled,
    ).toBe(true);
    act(() => view.root.findByType(ExerciseLibrary).props.onClose());
    await act(async () => button(view, 'Save Workout')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain('Disk full.');
    expect(JSON.stringify(view.toJSON())).toContain('60 kg');
    act(() => action(view, 'Remove Barbell Bench Press')?.props.onPress());
    await act(async () => button(view, 'Save Workout')?.props.onPress());
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(view.toJSON())).toContain(
      'Choose at least one exercise.',
    );
  });

  it('confirms abandoning meaningful changes and preserves draft when kept', () => {
    const onCancel = jest.fn();
    const view = render(
      <TemplateEditor
        mode="create"
        busy={false}
        onSave={jest.fn()}
        onCancel={onCancel}
      />,
    );
    act(() => input(view, 'Workout Name')?.props.onChangeText('Unsaved'));
    act(() => button(view, 'Cancel')?.props.onPress());
    const confirmation = view.root.findByType(Confirmation);
    expect(confirmation.props.visible).toBe(true);
    act(() => confirmation.props.onCancel());
    expect(input(view, 'Workout Name')?.props.value).toBe('Unsaved');
    expect(onCancel).not.toHaveBeenCalled();
    act(() => button(view, 'Cancel')?.props.onPress());
    act(() => view.root.findByType(Confirmation).props.onConfirm());
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('keeps unfinished configuration when returning to the library and selecting the same exercise', () => {
    const view = render(
      <TemplateEditor
        mode="create"
        busy={false}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    act(() => input(view, 'Workout Name')?.props.onChangeText('Push'));
    act(() => button(view, 'Next')?.props.onPress());
    act(() =>
      view.root
        .findByType(ExerciseLibrary)
        .props.onAdd({ id: 'barbell-bench-press' }),
    );
    act(() => input(view, 'Planned sets')?.props.onChangeText('5'));
    act(() =>
      input(view, 'Starting weight in kilograms')?.props.onChangeText('62.5'),
    );
    act(() => button(view, 'Back')?.props.onPress());
    act(() =>
      view.root
        .findByType(ExerciseLibrary)
        .props.onAdd({ id: 'barbell-bench-press' }),
    );
    expect(input(view, 'Planned sets')?.props.value).toBe('5');
    expect(input(view, 'Starting weight in kilograms')?.props.value).toBe(
      '62.5',
    );
  });

  it('rejects invalid set count and weight without adding an exercise', () => {
    const view = render(
      <TemplateEditor
        mode="create"
        busy={false}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    act(() => input(view, 'Workout Name')?.props.onChangeText('Push'));
    act(() => button(view, 'Next')?.props.onPress());
    act(() =>
      view.root
        .findByType(ExerciseLibrary)
        .props.onAdd({ id: 'barbell-bench-press' }),
    );
    act(() => input(view, 'Planned sets')?.props.onChangeText('0'));
    act(() => button(view, 'Add Exercise')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain('Enter 1–20 planned sets.');
    act(() => input(view, 'Planned sets')?.props.onChangeText('3'));
    act(() =>
      input(view, 'Starting weight in kilograms')?.props.onChangeText('-5'),
    );
    act(() => button(view, 'Add Exercise')?.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain(
      'Enter a valid non-negative weight.',
    );
  });
});
