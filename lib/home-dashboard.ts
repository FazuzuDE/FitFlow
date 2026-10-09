import { findExercise } from './exercise-library';
import { volume } from './workout-metrics';
import { filterProgressWorkouts } from './progress-periods';
import { exerciseIdsMatch } from './workout-engine';
import { validPlannedSets } from './planned-exercise';
import type { WorkoutSession, WorkoutTemplate } from './workout-model';

export const HOME_WIDGET_LAYOUT = [
  { id: 'primary', supportedSizes: ['medium'], defaultSize: 'medium' },
  { id: 'summary', supportedSizes: ['medium'], defaultSize: 'medium' },
  { id: 'week', supportedSizes: ['medium'], defaultSize: 'medium' },
  { id: 'latest', supportedSizes: ['medium'], defaultSize: 'medium' },
  { id: 'templates', supportedSizes: ['medium'], defaultSize: 'medium' },
] as const;

export type HomeTemplateDetails = {
  template: WorkoutTemplate;
  availableCount: number;
  count: string;
  preview: string;
  plannedSetCount: number;
};

function templateDetails(template: WorkoutTemplate): HomeTemplateDetails {
  const available = template.exerciseIds.flatMap((id) => {
    const exercise = findExercise(id);
    return exercise ? [exercise] : [];
  });
  const unavailable = template.exerciseIds.length - available.length;
  return {
    template,
    availableCount: available.length,
    plannedSetCount: available.reduce((total, exercise) => {
      const planned = template.plannedExercises?.find((item) =>
        exerciseIdsMatch(item.exerciseId, exercise.id),
      );
      return (
        total + (planned && validPlannedSets(planned.sets) ? planned.sets : 3)
      );
    }, 0),
    count: unavailable
      ? `${available.length} available · ${unavailable} unavailable`
      : `${available.length} exercise${available.length === 1 ? '' : 's'}`,
    preview: available
      .slice(0, 3)
      .map((exercise) => exercise.name)
      .join(' · '),
  };
}

export function projectHomeDashboard(
  history: WorkoutSession[],
  activeWorkout: WorkoutSession | null,
  templates: WorkoutTemplate[],
  now = Date.now(),
) {
  const completed = filterProgressWorkouts(history, 'ALL', now);
  const fourWeeksStart = new Date(now);
  fourWeeksStart.setDate(fourWeeksStart.getDate() - 28);
  const recent = completed.filter(
    (session) => session.finishedAt! >= fourWeeksStart.getTime(),
  );
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const today = new Date(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    return {
      timestamp: date.getTime(),
      dayOfMonth: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      completedCount: completed.filter(
        (session) =>
          session.finishedAt! >= date.getTime() &&
          session.finishedAt! < end.getTime(),
      ).length,
    };
  });
  const detailedTemplates = templates.map(templateDetails);
  const featuredIndex = detailedTemplates.findIndex(
    (item) => item.availableCount > 0,
  );
  const latest = completed.reduce<WorkoutSession | undefined>(
    (last, session) =>
      !last || (session.finishedAt ?? 0) > (last.finishedAt ?? 0)
        ? session
        : last,
    undefined,
  );
  return {
    fourWeeks: {
      totalVolume: recent.reduce(
        (total, session) => total + volume(session),
        0,
      ),
      completedCount: recent.length,
    },
    week: {
      days,
      completedCount: days.reduce(
        (total, day) => total + day.completedCount,
        0,
      ),
    },
    totalVolume: history.reduce((total, session) => total + volume(session), 0),
    completedCount: history.length,
    latestWorkout: latest ? { session: latest, volume: volume(latest) } : null,
    primaryTemplate: detailedTemplates[featuredIndex],
    otherTemplates: detailedTemplates.filter(
      (_, index) => activeWorkout || index !== featuredIndex,
    ),
  };
}
