import { projectVolumeComparison } from '../progress-volume-comparison';
import {
  progressPeriodStart,
  type ProgressPeriodId,
} from '../progress-periods';
import type { WorkoutSession } from '../workout-model';

const now = new Date(2026, 9, 10, 12).getTime();
const workout = (id: string, at: number, weight = '50'): WorkoutSession => ({
  id,
  templateId: id,
  name: id,
  startedAt: at - 1000,
  finishedAt: at,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [
    {
      id,
      libraryId: 'bench',
      name: 'Bench',
      muscle: 'Chest',
      sets: [{ id, weight, reps: '10', completedAt: at - 100 }],
    },
  ],
});

it.each(['1W', '1M', '3M', '6M', '1Y'] as ProgressPeriodId[])(
  'compares adjacent %s windows without counting their boundary twice',
  (period) => {
    const start = progressPeriodStart(period, now)!;
    const previousStart = progressPeriodStart(period, start)!;
    const history = [
      workout('outside', previousStart - 1, '999'),
      workout('previous', previousStart, '20'),
      workout('boundary', start, '50'),
      workout('now', now, '10'),
      workout('future', now + 1, '999'),
    ];
    expect(projectVolumeComparison(history, period, now)).toEqual({
      kind: 'increase',
      delta: 400,
      previousVolume: 200,
    });
  },
);

it('preserves month-end clamping for the previous calendar window', () => {
  const end = new Date(2025, 2, 31, 12).getTime();
  const history = [
    workout('previous', new Date(2025, 0, 28, 12).getTime(), '10'),
    workout('current', new Date(2025, 1, 28, 12).getTime(), '25'),
  ];
  expect(projectVolumeComparison(history, '1M', end)).toEqual({
    kind: 'increase',
    delta: 150,
    previousVolume: 100,
  });
});

it('shows a decrease for no current workouts and equality for equal volumes', () => {
  const previous = workout('previous', new Date(2026, 8, 1, 12).getTime());
  expect(projectVolumeComparison([previous], '1M', now)).toEqual({
    kind: 'decrease',
    delta: -500,
    previousVolume: 500,
  });
  expect(
    projectVolumeComparison([previous, workout('current', now)], '1M', now),
  ).toEqual({
    kind: 'unchanged',
    delta: 0,
    previousVolume: 500,
  });
});

it('keeps recorded zero-volume baselines and fractional completed-set volumes', () => {
  const previous = workout('previous', new Date(2026, 8, 1, 12).getTime(), '0');
  const current = workout('current', now, '1.25');
  current.exercises[0].sets.push({ id: 'planned', weight: '999', reps: '10' });
  expect(projectVolumeComparison([previous, current], '1M', now)).toEqual({
    kind: 'increase',
    delta: 12.5,
    previousVolume: 0,
  });
});

it('distinguishes missing or unusable records from a recorded zero baseline', () => {
  const current = workout('current', now);
  const invalid = workout(
    'invalid',
    new Date(2026, 8, 1, 12).getTime(),
    'invalid',
  );
  expect(projectVolumeComparison([current], '1M', now)).toEqual({
    kind: 'unavailable',
  });
  expect(projectVolumeComparison([invalid, current], '1M', now)).toEqual({
    kind: 'unavailable',
  });
  expect(
    projectVolumeComparison(
      [
        workout('previous', invalid.finishedAt!),
        workout('bad-current', now, 'invalid'),
      ],
      '1M',
      now,
    ),
  ).toEqual({ kind: 'unavailable' });
  expect(projectVolumeComparison([], 'ALL', now)).toBeUndefined();
});

it('treats floating-point noise as equality while preserving real small changes', () => {
  const previous = workout(
    'previous',
    new Date(2026, 8, 1, 12).getTime(),
    '60.3',
  );
  previous.exercises[0].sets[0].reps = '1';
  const current = workout('current', now, '20.1');
  current.exercises[0].sets[0].reps = '3';
  expect(projectVolumeComparison([previous, current], '1M', now)).toEqual({
    kind: 'unchanged',
    delta: 0,
    previousVolume: 60.3,
  });
  const tiny = workout('tiny', now, '0.0001');
  const zero = workout('zero', previous.finishedAt!, '0');
  expect(projectVolumeComparison([zero, tiny], '1M', now)).toEqual({
    kind: 'increase',
    delta: 0.001,
    previousVolume: 0,
  });
});

it('accounts for accumulated roundoff across many completed sets', () => {
  const previous = workout('previous', new Date(2026, 8, 1, 12).getTime());
  previous.exercises[0].sets = Array.from({ length: 10 }, (_, index) => ({
    id: `previous-${index}`,
    weight: '201',
    reps: '3',
    completedAt: previous.finishedAt! - 100,
  }));
  const current = workout('current', now);
  current.exercises[0].sets = Array.from({ length: 100 }, (_, index) => ({
    id: `current-${index}`,
    weight: '20.1',
    reps: '3',
    completedAt: now - 100,
  }));
  expect(projectVolumeComparison([previous, current], '1M', now)).toEqual({
    kind: 'unchanged',
    delta: 0,
    previousVolume: 6030,
  });
  current.exercises[0].sets.push({
    id: 'tiny-change',
    weight: '0.001',
    reps: '1',
    completedAt: now - 100,
  });
  const comparison = projectVolumeComparison([previous, current], '1M', now);
  expect(comparison?.kind).toBe('increase');
  if (comparison?.kind === 'increase')
    expect(comparison.delta).toBeCloseTo(0.001, 10);
});
