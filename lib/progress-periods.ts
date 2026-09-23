import { projectProgressAnalytics } from './progress-analytics';
import type { WorkoutSession } from './workout-model';

export const PROGRESS_PERIODS = [
  { id: '1W', label: '1W', accessibilityLabel: '1 week' },
  { id: '1M', label: '1M', accessibilityLabel: '1 month' },
  { id: '3M', label: '3M', accessibilityLabel: '3 months' },
  { id: '6M', label: '6M', accessibilityLabel: '6 months' },
  { id: '1Y', label: '1Y', accessibilityLabel: '1 year' },
  { id: 'ALL', label: 'ALL', accessibilityLabel: 'All time' },
] as const;

export type ProgressPeriodId = (typeof PROGRESS_PERIODS)[number]['id'];
export const DEFAULT_PROGRESS_PERIOD: ProgressPeriodId = '1M';

const validNow = (now: number): Date => {
  const date = new Date(now);
  if (!Number.isFinite(now) || !Number.isFinite(date.getTime())) {
    throw new RangeError('Progress now must be a valid timestamp.');
  }
  return date;
};

const subtractLocalMonths = (date: Date, months: number): number => {
  const target = new Date(
    date.getFullYear(),
    date.getMonth() - months,
    1,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target.getTime();
};

export const progressPeriodStart = (
  period: ProgressPeriodId,
  now: number,
): number | undefined => {
  const date = validNow(now);
  if (period === 'ALL') return undefined;
  if (period === '1W') {
    date.setDate(date.getDate() - 7);
    return date.getTime();
  }
  const months = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }[period];
  return subtractLocalMonths(date, months);
};

export const filterProgressWorkouts = (
  history: readonly WorkoutSession[],
  period: ProgressPeriodId,
  now: number,
): WorkoutSession[] => {
  const start = progressPeriodStart(period, now);
  return history
    .filter((session) => {
      const finishedAt = session.finishedAt;
      return (
        Number.isFinite(session.startedAt) &&
        session.startedAt >= 0 &&
        typeof finishedAt === 'number' &&
        Number.isFinite(finishedAt) &&
        finishedAt >= session.startedAt &&
        finishedAt <= now &&
        (start === undefined || finishedAt >= start)
      );
    })
    .sort(
      (left, right) =>
        left.finishedAt! - right.finishedAt! || left.id.localeCompare(right.id),
    );
};

export const projectPeriodAnalytics = (
  history: readonly WorkoutSession[],
  period: ProgressPeriodId,
  now: number,
) => {
  const workouts = filterProgressWorkouts(history, period, now);
  return {
    workoutCount: workouts.length,
    workouts,
    ...projectProgressAnalytics(workouts),
  };
};
