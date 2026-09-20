import { exerciseLibrary } from './exercise-library';
import { WorkoutTemplate } from './workout-model';

export { exerciseLibrary };

export const defaultTemplates: WorkoutTemplate[] = [
  {
    id: 'upper',
    name: 'Upper Body',
    exerciseIds: [
      'barbell-bench-press',
      'seated-cable-row',
      'dumbbell-shoulder-press',
      'lat-pulldown',
    ],
  },
  {
    id: 'push',
    name: 'Push Day',
    exerciseIds: [
      'barbell-bench-press',
      'incline-dumbbell-press',
      'dumbbell-shoulder-press',
      'dumbbell-lateral-raise',
      'cable-triceps-pushdown',
    ],
  },
  {
    id: 'legs',
    name: 'Leg Day',
    exerciseIds: ['barbell-back-squat', 'leg-press', 'standing-calf-raise'],
  },
];
