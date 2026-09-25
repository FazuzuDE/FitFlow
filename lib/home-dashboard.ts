import { findExercise } from './exercise-library';
import { volume } from './workout-metrics';
import type { WorkoutSession, WorkoutTemplate } from './workout-model';

export const HOME_WIDGET_LAYOUT = [
  { id: 'primary', supportedSizes: ['medium'], defaultSize: 'medium' },
  { id: 'summary', supportedSizes: ['medium'], defaultSize: 'medium' },
  { id: 'latest', supportedSizes: ['medium'], defaultSize: 'medium' },
  { id: 'templates', supportedSizes: ['medium'], defaultSize: 'medium' },
] as const;

export type HomeTemplateDetails = {
  template: WorkoutTemplate;
  availableCount: number;
  count: string;
  preview: string;
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
) {
  const detailedTemplates = templates.map(templateDetails);
  const featuredIndex = detailedTemplates.findIndex(
    (item) => item.availableCount > 0,
  );
  const latest = history.reduce<WorkoutSession | undefined>(
    (last, session) =>
      !last || (session.finishedAt ?? 0) > (last.finishedAt ?? 0)
        ? session
        : last,
    undefined,
  );
  return {
    totalVolume: history.reduce((total, session) => total + volume(session), 0),
    completedCount: history.length,
    latestWorkout: latest ? { session: latest, volume: volume(latest) } : null,
    primaryTemplate: detailedTemplates[featuredIndex],
    otherTemplates: detailedTemplates.filter(
      (_, index) => activeWorkout || index !== featuredIndex,
    ),
  };
}
