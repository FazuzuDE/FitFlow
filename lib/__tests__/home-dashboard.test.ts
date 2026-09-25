import { projectHomeDashboard, HOME_WIDGET_LAYOUT } from '../home-dashboard';
import { defaultTemplates } from '../workout-catalog';
import type { WorkoutSession } from '../workout-model';

const saved = (
  id: string,
  finishedAt: number,
  weight: string,
): WorkoutSession => ({
  id,
  templateId: 'upper',
  name: id,
  startedAt: finishedAt - 1000,
  finishedAt,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [
    {
      id: `${id}-exercise`,
      libraryId: 'barbell-bench-press',
      name: 'Bench',
      muscle: 'Chest',
      sets: [
        { id: `${id}-set`, weight, reps: '5', completedAt: finishedAt - 100 },
      ],
    },
  ],
});

it('projects factual totals and latest workout independently of history order', () => {
  const projection = projectHomeDashboard(
    [saved('newer', 2000, '0'), saved('older', 1000, '60')],
    null,
    defaultTemplates,
  );
  expect(projection.totalVolume).toBe(300);
  expect(projection.latestWorkout?.session.name).toBe('newer');
  expect(projection.latestWorkout?.volume).toBe(0);
  expect(projection.primaryTemplate?.template.id).toBe('upper');
});

it('keeps unavailable templates visible but selects a startable primary', () => {
  const projection = projectHomeDashboard([], null, [
    { id: 'stale', name: 'Old', exerciseIds: ['missing'] },
    defaultTemplates[0],
  ]);
  expect(projection.primaryTemplate?.template.id).toBe('upper');
  expect(projection.otherTemplates.map((item) => item.template.id)).toEqual([
    'stale',
  ]);
  expect(projection.otherTemplates[0].availableCount).toBe(0);
});

it('keeps all templates secondary when a workout is active', () => {
  const projection = projectHomeDashboard(
    [],
    saved('active', 2000, '60'),
    defaultTemplates,
  );
  expect(projection.otherTemplates).toHaveLength(defaultTemplates.length);
});

it('defines stable module identity and order with explicit supported sizes', () => {
  expect(
    HOME_WIDGET_LAYOUT.map((item) => [
      item.id,
      item.defaultSize,
      item.supportedSizes,
    ]),
  ).toEqual([
    ['primary', 'medium', ['medium']],
    ['summary', 'medium', ['medium']],
    ['latest', 'medium', ['medium']],
    ['templates', 'medium', ['medium']],
  ]);
});
