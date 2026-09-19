import { LibraryExercise, WorkoutTemplate } from './workout-model';

export const exerciseLibrary: LibraryExercise[] = [
  { id: 'bench', name: 'Barbell Bench Press', muscle: 'Chest' },
  { id: 'incline', name: 'Incline Dumbbell Press', muscle: 'Chest' },
  { id: 'row', name: 'Seated Cable Row', muscle: 'Back' },
  { id: 'pulldown', name: 'Lat Pulldown', muscle: 'Back' },
  { id: 'press', name: 'Shoulder Press', muscle: 'Shoulders' },
  { id: 'lateral', name: 'Lateral Raise', muscle: 'Shoulders' },
  { id: 'squat', name: 'Barbell Squat', muscle: 'Legs' },
  { id: 'legpress', name: 'Leg Press', muscle: 'Legs' },
  { id: 'deadlift', name: 'Deadlift', muscle: 'Back' },
  { id: 'curl', name: 'Biceps Curl', muscle: 'Arms' },
  { id: 'triceps', name: 'Triceps Pushdown', muscle: 'Arms' },
  { id: 'calf', name: 'Standing Calf Raise', muscle: 'Legs' },
];

export const defaultTemplates: WorkoutTemplate[] = [
  {
    id: 'upper',
    name: 'Upper Body',
    exerciseIds: ['bench', 'row', 'press', 'pulldown'],
  },
  {
    id: 'push',
    name: 'Push Day',
    exerciseIds: ['bench', 'incline', 'press', 'lateral', 'triceps'],
  },
  { id: 'legs', name: 'Leg Day', exerciseIds: ['squat', 'legpress', 'calf'] },
];
