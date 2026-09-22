import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { WorkoutHistory } from '../../components/WorkoutHistory';
import type { WorkoutSession } from '../workout-model';

const { act, create } = jest.requireActual('react-test-renderer');

const completed = (
  overrides: Partial<WorkoutSession> = {},
): WorkoutSession => ({
  id: 'saved-newer',
  templateId: 'template-that-can-change-later',
  name: 'Saved Snapshot Workout',
  startedAt: 1_700_000_000_000,
  finishedAt: 1_700_000_120_000,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [
    {
      id: 'saved-exercise',
      libraryId: 'barbell-bench-press',
      name: 'Saved Bench Snapshot',
      muscle: 'Saved Chest Snapshot',
      sets: [
        {
          id: 'completed-set',
          weight: '50',
          reps: '10',
          completedAt: 1_700_000_030_000,
        },
        { id: 'planned-set', weight: '200', reps: '5' },
      ],
    },
    {
      id: 'partial-exercise',
      libraryId: 'seated-cable-row',
      name: 'Saved Partial Exercise',
      muscle: 'Saved Back Snapshot',
      sets: [{ id: 'incomplete-set', weight: '70', reps: '8' }],
    },
  ],
  ...overrides,
});

const render = (element: ReactElement) => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(element);
  });
  return view;
};

const serialized = (view: ReturnType<typeof create>) =>
  JSON.stringify(view.toJSON());

const summary = (view: ReturnType<typeof create>, name: string) =>
  view.root
    .findAllByType(Pressable)
    .find(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel === `Open ${name} workout details`,
    );

describe('WorkoutHistory', () => {
  it('renders an intentional empty state', () => {
    const view = render(<WorkoutHistory history={[]} />);

    expect(serialized(view)).toContain('Finish your first workout');
    expect(view.root.findAllByType(Pressable)).toHaveLength(0);
  });

  it('shows compact newest-first summaries without eager snapshot details', () => {
    const older = completed({
      id: 'older',
      name: 'Older Workout',
      startedAt: 1_600_000_000_000,
      finishedAt: 1_600_000_060_000,
    });
    const newer = completed({ id: 'newer', name: 'Newer Workout' });
    const view = render(<WorkoutHistory history={[older, newer]} />);
    const labels = view.root
      .findAllByType(Pressable)
      .map(
        (node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel,
      )
      .filter(Boolean);

    expect(labels).toEqual([
      'Open Newer Workout workout details',
      'Open Older Workout workout details',
    ]);
    expect(serialized(view)).not.toContain('Saved Bench Snapshot');
    expect(serialized(view)).not.toContain('50 kg × 10');
    const style = StyleSheet.flatten(
      summary(view, 'Newer Workout')?.props.style({ pressed: false }),
    );
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });

  it('opens one saved snapshot with accurate details and returns to summaries', () => {
    const workout = completed();
    const view = render(<WorkoutHistory history={[workout]} />);

    act(() => summary(view, workout.name)?.props.onPress());

    const detail = serialized(view);
    expect(detail).toContain('Workout details');
    expect(detail).toContain('Saved Snapshot Workout');
    expect(detail).toContain(new Date(workout.finishedAt!).toLocaleString());
    expect(detail).toContain('02:00 elapsed');
    expect(detail).toContain('1 completed set');
    expect(detail).toContain('500 kg');
    expect(detail).toContain('Saved Bench Snapshot');
    expect(detail).toContain('50 kg × 10');
    expect(detail).toContain('Saved Partial Exercise');
    expect(detail).toContain('No completed sets');
    expect(detail).not.toContain('200 kg × 5');
    expect(detail).not.toContain('Current Catalog Bench Name');

    act(() =>
      view.root
        .findAllByType(AppButton)
        .find(
          (node: { props: { title?: string } }) =>
            node.props.title === 'Back to History',
        )
        ?.props.onPress(),
    );

    expect(summary(view, workout.name)).toBeDefined();
    expect(serialized(view)).not.toContain('Saved Bench Snapshot');
  });

  it('keeps long snapshot names and many completed sets readable in detail', () => {
    const longWorkoutName =
      'Very Long Saved Workout Name That Must Remain Available on a Compact Phone';
    const longExerciseName =
      'Very Long Saved Exercise Name That Must Wrap Without Losing Snapshot Data';
    const sets = Array.from({ length: 8 }, (_, index) => ({
      id: `set-${index}`,
      weight: String(40 + index),
      reps: String(12 - index),
      completedAt: 1_700_000_010_000 + index,
    }));
    const workout = completed({
      name: longWorkoutName,
      exercises: [
        {
          id: 'long-exercise',
          libraryId: 'saved-library-id',
          name: longExerciseName,
          muscle: 'Saved muscle',
          sets,
        },
      ],
    });
    const view = render(<WorkoutHistory history={[workout]} />);

    act(() => summary(view, longWorkoutName)?.props.onPress());

    expect(serialized(view)).toContain(longWorkoutName);
    expect(serialized(view)).toContain(longExerciseName);
    expect(serialized(view)).toContain('47 kg × 5');
    const detailName = view.root
      .findAllByType(Text)
      .find((node: { props: { children?: string } }) =>
        String(node.props.children).includes(longExerciseName),
      );
    expect(detailName?.props.numberOfLines).toBeUndefined();
  });

  it('returns safely to summaries when the selected snapshot disappears', () => {
    const selected = completed();
    const remaining = completed({
      id: 'remaining',
      name: 'Remaining Workout',
      finishedAt: 1_600_000_060_000,
    });
    const view = render(<WorkoutHistory history={[selected, remaining]} />);

    act(() => summary(view, selected.name)?.props.onPress());
    act(() => view.update(<WorkoutHistory history={[remaining]} />));

    expect(summary(view, remaining.name)).toBeDefined();
    expect(serialized(view)).not.toContain('Workout details');
  });
});
