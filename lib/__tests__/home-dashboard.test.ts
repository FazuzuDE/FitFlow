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
    ['week', 'medium', ['medium']],
    ['latest', 'medium', ['medium']],
    ['templates', 'medium', ['medium']],
  ]);
});

it('scopes Home summary to 28 local calendar days, excluding unfinished and future workouts', () => {
  const now = new Date(2026, 9, 9, 16).getTime();
  const start = new Date(2026, 8, 11, 16).getTime();
  const unfinished = {
    ...saved('unfinished', now, '60'),
    finishedAt: undefined,
  };
  const result = projectHomeDashboard(
    [
      saved('boundary', start, '1.25'),
      saved('old', start - 1, '100'),
      saved('today', now, '60'),
      saved('future', now + 1000, '100'),
      unfinished,
    ],
    null,
    defaultTemplates,
    now,
  );
  expect(result.fourWeeks.completedCount).toBe(2);
  expect(result.fourWeeks.totalVolume).toBe(306.25);
  expect(result.latestWorkout?.session.id).toBe('today');
});

it('projects Monday through Sunday, counting multiple workouts without marking a future day completed', () => {
  const now = new Date(2026, 9, 9, 16).getTime();
  const result = projectHomeDashboard(
    [
      saved('monday', new Date(2026, 9, 5, 12).getTime(), '60'),
      saved('monday2', new Date(2026, 9, 5, 18).getTime(), '60'),
      saved('wednesday', new Date(2026, 9, 7, 12).getTime(), '60'),
      saved('saturday', new Date(2026, 9, 10, 12).getTime(), '60'),
    ],
    null,
    defaultTemplates,
    now,
  );
  expect(result.week.completedCount).toBe(3);
  expect(result.week.days.map((day) => day.dayOfMonth)).toEqual([
    5, 6, 7, 8, 9, 10, 11,
  ]);
  expect(result.week.days.map((day) => day.completedCount)).toEqual([
    2, 0, 1, 0, 0, 0, 0,
  ]);
  expect(
    result.week.days.filter((day) => day.isToday).map((day) => day.dayOfMonth),
  ).toEqual([9]);
});

it('shows factual planned set counts without inventing a duration', () => {
  const result = projectHomeDashboard([], null, [
    {
      id: 'custom',
      name: 'Custom',
      exerciseIds: ['barbell-bench-press', 'missing'],
      plannedExercises: [{ exerciseId: 'barbell-bench-press', sets: 5 }],
    },
  ]);
  expect(result.primaryTemplate?.plannedSetCount).toBe(5);
});
