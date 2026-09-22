import type { WorkoutSession } from './workout-model';

const completedAt = (session: WorkoutSession): number =>
  session.finishedAt ?? session.startedAt;

export const newestFirstHistory = (
  history: readonly WorkoutSession[],
): WorkoutSession[] =>
  history
    .map((session, index) => ({ session, index }))
    .sort(
      (left, right) =>
        completedAt(right.session) - completedAt(left.session) ||
        left.index - right.index,
    )
    .map(({ session }) => session);
