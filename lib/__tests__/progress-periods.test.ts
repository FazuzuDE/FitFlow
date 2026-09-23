import {
  DEFAULT_PROGRESS_PERIOD,
  filterProgressWorkouts,
  progressPeriodStart,
  projectPeriodAnalytics,
  PROGRESS_PERIODS,
} from '../progress-periods';
import type { WorkoutSession } from '../workout-model';

const workout = (
  id: string,
  finishedAt: number,
  weight = '50',
  libraryId = 'barbell-bench-press',
): WorkoutSession => ({
  id,
  templateId: `template-${id}`,
  name: `Workout ${id}`,
  startedAt: finishedAt - 1_000,
  finishedAt,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [
    {
      id: `exercise-${id}`,
      libraryId,
      name: `Saved ${libraryId}`,
      muscle: 'Chest',
      sets: [
        {
          id: `set-${id}`,
          weight,
          reps: '5',
          completedAt: finishedAt - 100,
        },
      ],
    },
  ],
});

describe('Progress local-calendar boundaries', () => {
  it('provides the approved six periods and defaults to the one-month view', () => {
    expect(PROGRESS_PERIODS.map((period) => period.id)).toEqual([
      '1W',
      '1M',
      '3M',
      '6M',
      '1Y',
      'ALL',
    ]);
    const now = new Date(2026, 8, 23, 12).getTime();
    const older = workout('older', new Date(2026, 7, 22, 12).getTime());
    const inside = workout('inside', new Date(2026, 7, 24, 12).getTime());
    expect(
      projectPeriodAnalytics([older, inside], DEFAULT_PROGRESS_PERIOD, now)
        .workoutCount,
    ).toBe(1);
  });

  it('subtracts one local-calendar week while preserving local time', () => {
    const now = new Date(2026, 8, 23, 12, 34, 56, 789).getTime();
    expect(progressPeriodStart('1W', now)).toBe(
      new Date(2026, 8, 16, 12, 34, 56, 789).getTime(),
    );
  });

  it('clamps one-, three-, and six-month boundaries to shorter months', () => {
    const now = new Date(2025, 2, 31, 15, 20).getTime();
    expect(progressPeriodStart('1M', now)).toBe(
      new Date(2025, 1, 28, 15, 20).getTime(),
    );
    expect(progressPeriodStart('3M', now)).toBe(
      new Date(2024, 11, 31, 15, 20).getTime(),
    );
    expect(progressPeriodStart('6M', now)).toBe(
      new Date(2024, 8, 30, 15, 20).getTime(),
    );
  });

  it('handles leap-year February for month and year subtraction', () => {
    expect(progressPeriodStart('1M', new Date(2024, 2, 31, 9).getTime())).toBe(
      new Date(2024, 1, 29, 9).getTime(),
    );
    expect(progressPeriodStart('1Y', new Date(2024, 1, 29, 9).getTime())).toBe(
      new Date(2023, 1, 28, 9).getTime(),
    );
    expect(progressPeriodStart('ALL', Date.now())).toBeUndefined();
  });

  it('uses local calendar arithmetic across a DST change when supported', () => {
    const originalTimezone = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      const now = new Date(2026, 2, 15, 12).getTime();
      const expected = new Date(2026, 2, 8, 12).getTime();
      expect(progressPeriodStart('1W', now)).toBe(expected);
      if (
        new Date(now).getTimezoneOffset() !==
        new Date(expected).getTimezoneOffset()
      ) {
        expect(now - expected).toBe(167 * 60 * 60 * 1_000);
      }
    } finally {
      if (originalTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimezone;
    }
  });
});

describe('Progress period projection', () => {
  const now = new Date(2026, 8, 23, 12).getTime();
  const start = new Date(2026, 7, 23, 12).getTime();

  it('includes both exact boundaries and excludes adjacent and future workouts', () => {
    const history = [
      workout('future', now + 1),
      workout('at-now', now),
      workout('before', start - 1),
      workout('at-start', start),
    ];
    const selected = filterProgressWorkouts(history, '1M', now);
    expect(selected.map((session) => session.id)).toEqual([
      'at-start',
      'at-now',
    ]);
    expect(history.map((session) => session.id)).toEqual([
      'future',
      'at-now',
      'before',
      'at-start',
    ]);
  });

  it('keeps ALL historical but excludes future and structurally invalid dates', () => {
    const history = [
      workout('future', now + 1),
      workout('recent', now),
      workout('old', 1_000),
      { ...workout('inverted', now), startedAt: now + 10 },
      { ...workout('missing', now), finishedAt: undefined },
    ];
    expect(
      filterProgressWorkouts(history, 'ALL', now).map((item) => item.id),
    ).toEqual(['old', 'recent']);
  });

  it('sorts shuffled workouts chronologically with deterministic identical-time ties', () => {
    const a = workout('a', now);
    const b = workout('b', now);
    const earlier = workout('earlier', start);
    const forward = projectPeriodAnalytics([b, earlier, a], '1M', now);
    const reverse = projectPeriodAnalytics([a, b, earlier], '1M', now);
    expect(forward.workouts.map((session) => session.id)).toEqual([
      'earlier',
      'a',
      'b',
    ]);
    expect(reverse.workouts.map((session) => session.id)).toEqual([
      'earlier',
      'a',
      'b',
    ]);
    expect(forward.workoutVolumes.map((item) => item.workoutId)).toEqual([
      'a',
      'b',
      'earlier',
    ]);
  });

  it('keeps two same-day workouts and scopes volume, records, and identity', () => {
    const older = workout('outside', start - 1, '100');
    const alias = workout('alias', start + 1, '50', 'bench');
    const canonical = workout('canonical', start + 2, '60');
    const invalid = workout('invalid', start + 3, '-1');
    const result = projectPeriodAnalytics(
      [older, canonical, invalid, alias],
      '1M',
      now,
    );
    expect(result.workoutCount).toBe(3);
    expect(result.totalVolume).toBe(550);
    expect(result.excludedSampleCount).toBe(1);
    expect(result.estimatedOneRepMaxRecords).toHaveLength(1);
    expect(result.estimatedOneRepMaxRecords[0]).toMatchObject({
      exerciseId: 'barbell-bench-press',
      weight: 60,
    });
  });

  it('returns zero metrics and no workouts when a selected period is empty', () => {
    const result = projectPeriodAnalytics(
      [workout('old', start - 1, '100')],
      '1M',
      now,
    );
    expect(result.workoutCount).toBe(0);
    expect(result.totalVolume).toBe(0);
    expect(result.workouts).toEqual([]);
    expect(result.workoutVolumes).toEqual([]);
    expect(result.estimatedOneRepMaxRecords).toEqual([]);
  });
});
