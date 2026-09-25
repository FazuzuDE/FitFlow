import type { PlannedExercise } from './workout-model';

export const MAX_PLANNED_SETS = 20;

export const validPlannedSets = (sets: unknown): sets is number =>
  typeof sets === 'number' &&
  Number.isInteger(sets) &&
  sets >= 1 &&
  sets <= MAX_PLANNED_SETS;

export const normalizePlannedWeight = (weight: string): string | null => {
  const normalized = weight.replace(',', '.').trim();
  if (!/^\d+(\.\d+)?$/.test(normalized) || !Number.isFinite(Number(normalized)))
    return null;
  return normalized;
};

export const validPlannedExerciseShape = (
  value: unknown,
): value is PlannedExercise => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.exerciseId === 'string' &&
    validPlannedSets(item.sets) &&
    (item.weight === undefined ||
      (typeof item.weight === 'string' &&
        normalizePlannedWeight(item.weight) !== null))
  );
};
