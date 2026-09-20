import type {
  EquipmentId,
  MovementPatternId,
  MuscleId,
} from './exercise-taxonomy';

export type WorkoutSet = {
  id: string;
  weight: string;
  reps: string;
  completedAt?: number;
};

export type WorkoutExercise = {
  id: string;
  libraryId: string;
  name: string;
  muscle: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  templateId: string;
  name: string;
  startedAt: number;
  finishedAt?: number;
  currentExerciseIndex: number;
  restDurationSeconds: number;
  restEndsAt?: number;
  exercises: WorkoutExercise[];
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  exerciseIds: string[];
};

export type LibraryExercise = {
  id: string;
  name: string;
  primaryMuscles: readonly MuscleId[];
  secondaryMuscles: readonly MuscleId[];
  equipment: readonly EquipmentId[];
  movementPattern: MovementPatternId;
  imageKey: string;
};

export type WorkoutState = {
  schemaVersion: 1;
  activeWorkout: WorkoutSession | null;
  history: WorkoutSession[];
  templates: WorkoutTemplate[];
};

export const isSetComplete = (set: WorkoutSet): boolean =>
  typeof set.completedAt === 'number';
