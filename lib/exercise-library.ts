import type { LibraryExercise } from './workout-model';
import type { EquipmentId, MuscleId } from './exercise-taxonomy';

const exercise = (
  value: Omit<LibraryExercise, 'imageKey'> & { imageKey?: string },
): LibraryExercise => ({ ...value, imageKey: value.imageKey ?? value.id });

export const exerciseLibrary = [
  exercise({
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front-delts'],
    equipment: ['barbell', 'bench'],
    movementPattern: 'horizontal-push',
  }),
  exercise({
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts', 'triceps'],
    equipment: ['dumbbell', 'bench'],
    movementPattern: 'horizontal-push',
  }),
  exercise({
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front-delts'],
    equipment: ['dumbbell', 'bench'],
    movementPattern: 'horizontal-push',
  }),
  exercise({
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front-delts'],
    equipment: ['machine'],
    movementPattern: 'horizontal-push',
  }),
  exercise({
    id: 'cable-chest-fly',
    name: 'Cable Chest Fly',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts'],
    equipment: ['cable'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'pec-deck-fly',
    name: 'Pec Deck Fly',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts'],
    equipment: ['machine'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'push-up',
    name: 'Push-Up',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front-delts', 'abs'],
    equipment: ['bodyweight'],
    movementPattern: 'horizontal-push',
  }),
  exercise({
    id: 'barbell-bent-over-row',
    name: 'Barbell Bent-Over Row',
    primaryMuscles: ['upper-back', 'lats'],
    secondaryMuscles: ['rear-delts', 'biceps', 'lower-back'],
    equipment: ['barbell'],
    movementPattern: 'horizontal-pull',
  }),
  exercise({
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    primaryMuscles: ['upper-back', 'lats'],
    secondaryMuscles: ['biceps', 'rear-delts'],
    equipment: ['cable'],
    movementPattern: 'horizontal-pull',
  }),
  exercise({
    id: 'one-arm-dumbbell-row',
    name: 'One-Arm Dumbbell Row',
    primaryMuscles: ['lats', 'upper-back'],
    secondaryMuscles: ['biceps', 'rear-delts'],
    equipment: ['dumbbell', 'bench'],
    movementPattern: 'horizontal-pull',
  }),
  exercise({
    id: 'chest-supported-dumbbell-row',
    name: 'Chest-Supported Dumbbell Row',
    primaryMuscles: ['upper-back', 'lats'],
    secondaryMuscles: ['biceps', 'rear-delts'],
    equipment: ['dumbbell', 'bench'],
    movementPattern: 'horizontal-pull',
  }),
  exercise({
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper-back'],
    equipment: ['cable'],
    movementPattern: 'vertical-pull',
  }),
  exercise({
    id: 'pull-up',
    name: 'Pull-Up',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper-back', 'forearms'],
    equipment: ['bodyweight'],
    movementPattern: 'vertical-pull',
  }),
  exercise({
    id: 'assisted-pull-up',
    name: 'Assisted Pull-Up',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper-back'],
    equipment: ['machine'],
    movementPattern: 'vertical-pull',
  }),
  exercise({
    id: 'machine-high-row',
    name: 'Machine High Row',
    primaryMuscles: ['upper-back', 'lats'],
    secondaryMuscles: ['rear-delts', 'biceps'],
    equipment: ['machine'],
    movementPattern: 'horizontal-pull',
  }),
  exercise({
    id: 'cable-straight-arm-pulldown',
    name: 'Cable Straight-Arm Pulldown',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['triceps'],
    equipment: ['cable'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'barbell-deadlift',
    name: 'Barbell Deadlift',
    primaryMuscles: ['glutes', 'hamstrings', 'lower-back'],
    secondaryMuscles: ['traps', 'forearms', 'quadriceps'],
    equipment: ['barbell'],
    movementPattern: 'hinge',
  }),
  exercise({
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    primaryMuscles: ['front-delts', 'side-delts'],
    secondaryMuscles: ['triceps'],
    equipment: ['dumbbell'],
    movementPattern: 'vertical-push',
  }),
  exercise({
    id: 'barbell-overhead-press',
    name: 'Barbell Overhead Press',
    primaryMuscles: ['front-delts', 'side-delts'],
    secondaryMuscles: ['triceps', 'abs'],
    equipment: ['barbell'],
    movementPattern: 'vertical-push',
  }),
  exercise({
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    primaryMuscles: ['front-delts', 'side-delts'],
    secondaryMuscles: ['triceps'],
    equipment: ['machine'],
    movementPattern: 'vertical-push',
  }),
  exercise({
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    primaryMuscles: ['side-delts'],
    secondaryMuscles: ['front-delts'],
    equipment: ['dumbbell'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    primaryMuscles: ['side-delts'],
    secondaryMuscles: ['front-delts'],
    equipment: ['cable'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'reverse-pec-deck',
    name: 'Reverse Pec Deck',
    primaryMuscles: ['rear-delts'],
    secondaryMuscles: ['upper-back'],
    equipment: ['machine'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'resistance-band-pull-apart',
    name: 'Resistance Band Pull-Apart',
    primaryMuscles: ['rear-delts', 'upper-back'],
    secondaryMuscles: ['traps'],
    equipment: ['resistance-band'],
    movementPattern: 'horizontal-pull',
  }),
  exercise({
    id: 'dumbbell-biceps-curl',
    name: 'Dumbbell Biceps Curl',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['dumbbell'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'barbell-curl',
    name: 'Barbell Curl',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['barbell'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'ez-bar-curl',
    name: 'EZ Bar Curl',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['ez-bar'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'hammer-curl',
    name: 'Hammer Curl',
    primaryMuscles: ['biceps', 'forearms'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'cable-biceps-curl',
    name: 'Cable Biceps Curl',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['cable'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'cable-triceps-pushdown',
    name: 'Cable Triceps Pushdown',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['cable'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'overhead-cable-triceps-extension',
    name: 'Overhead Cable Triceps Extension',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['cable'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'dumbbell-overhead-triceps-extension',
    name: 'Dumbbell Overhead Triceps Extension',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'front-delts'],
    equipment: ['barbell', 'bench'],
    movementPattern: 'horizontal-push',
  }),
  exercise({
    id: 'assisted-dip-machine',
    name: 'Assisted Dip Machine',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'front-delts'],
    equipment: ['machine'],
    movementPattern: 'vertical-push',
  }),
  exercise({
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'adductors', 'lower-back'],
    equipment: ['barbell'],
    movementPattern: 'squat',
  }),
  exercise({
    id: 'barbell-front-squat',
    name: 'Barbell Front Squat',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['abs', 'upper-back'],
    equipment: ['barbell'],
    movementPattern: 'squat',
  }),
  exercise({
    id: 'leg-press',
    name: 'Leg Press',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'adductors'],
    equipment: ['machine'],
    movementPattern: 'squat',
  }),
  exercise({
    id: 'smith-machine-squat',
    name: 'Smith Machine Squat',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'adductors'],
    equipment: ['smith-machine'],
    movementPattern: 'squat',
  }),
  exercise({
    id: 'goblet-squat',
    name: 'Goblet Squat',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'adductors', 'abs'],
    equipment: ['dumbbell'],
    movementPattern: 'squat',
  }),
  exercise({
    id: 'dumbbell-reverse-lunge',
    name: 'Dumbbell Reverse Lunge',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'adductors'],
    equipment: ['dumbbell'],
    movementPattern: 'lunge',
  }),
  exercise({
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'adductors'],
    equipment: ['dumbbell', 'bench'],
    movementPattern: 'lunge',
  }),
  exercise({
    id: 'leg-extension',
    name: 'Leg Extension',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: [],
    equipment: ['machine'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['calves'],
    equipment: ['machine'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['calves'],
    equipment: ['machine'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'barbell-romanian-deadlift',
    name: 'Barbell Romanian Deadlift',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['lower-back', 'forearms'],
    equipment: ['barbell'],
    movementPattern: 'hinge',
  }),
  exercise({
    id: 'dumbbell-romanian-deadlift',
    name: 'Dumbbell Romanian Deadlift',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['lower-back', 'forearms'],
    equipment: ['dumbbell'],
    movementPattern: 'hinge',
  }),
  exercise({
    id: 'barbell-hip-thrust',
    name: 'Barbell Hip Thrust',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'quadriceps'],
    equipment: ['barbell', 'bench'],
    movementPattern: 'hinge',
  }),
  exercise({
    id: 'cable-glute-kickback',
    name: 'Cable Glute Kickback',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: ['cable'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    equipment: ['machine'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    equipment: ['machine'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'machine-hip-adduction',
    name: 'Machine Hip Adduction',
    primaryMuscles: ['adductors'],
    secondaryMuscles: [],
    equipment: ['machine'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    primaryMuscles: ['glutes', 'hamstrings'],
    secondaryMuscles: ['lower-back', 'forearms'],
    equipment: ['kettlebell'],
    movementPattern: 'hinge',
  }),
  exercise({
    id: 'plank',
    name: 'Plank',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['glutes'],
    equipment: ['bodyweight'],
    movementPattern: 'core',
  }),
  exercise({
    id: 'hanging-knee-raise',
    name: 'Hanging Knee Raise',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['forearms'],
    equipment: ['bodyweight'],
    movementPattern: 'core',
  }),
  exercise({
    id: 'cable-crunch',
    name: 'Cable Crunch',
    primaryMuscles: ['abs'],
    secondaryMuscles: [],
    equipment: ['cable'],
    movementPattern: 'core',
  }),
  exercise({
    id: 'back-extension',
    name: 'Back Extension',
    primaryMuscles: ['lower-back'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: ['machine'],
    movementPattern: 'hinge',
  }),
  exercise({
    id: 'dumbbell-shrug',
    name: 'Dumbbell Shrug',
    primaryMuscles: ['traps'],
    secondaryMuscles: ['forearms'],
    equipment: ['dumbbell'],
    movementPattern: 'isolation',
  }),
  exercise({
    id: 'farmers-carry',
    name: "Farmer's Carry",
    primaryMuscles: ['forearms', 'traps'],
    secondaryMuscles: ['abs', 'glutes'],
    equipment: ['dumbbell'],
    movementPattern: 'carry',
  }),
] as const satisfies readonly LibraryExercise[];

export type ExerciseId = (typeof exerciseLibrary)[number]['id'];

export const legacyExerciseIds = {
  bench: 'barbell-bench-press',
  incline: 'incline-dumbbell-press',
  row: 'seated-cable-row',
  pulldown: 'lat-pulldown',
  press: 'dumbbell-shoulder-press',
  lateral: 'dumbbell-lateral-raise',
  squat: 'barbell-back-squat',
  legpress: 'leg-press',
  deadlift: 'barbell-deadlift',
  curl: 'dumbbell-biceps-curl',
  triceps: 'cable-triceps-pushdown',
  calf: 'standing-calf-raise',
} as const satisfies Record<string, ExerciseId>;

const exerciseById = new Map(exerciseLibrary.map((item) => [item.id, item]));

export const canonicalExerciseId = (id: string): ExerciseId | undefined => {
  if (exerciseById.has(id as ExerciseId)) return id as ExerciseId;
  return Object.prototype.hasOwnProperty.call(legacyExerciseIds, id)
    ? legacyExerciseIds[id as keyof typeof legacyExerciseIds]
    : undefined;
};

export const findExercise = (id: string): LibraryExercise | undefined => {
  const canonicalId = canonicalExerciseId(id);
  return canonicalId ? exerciseById.get(canonicalId) : undefined;
};

export type ExerciseFilters = {
  query?: string;
  muscle?: MuscleId;
  equipment?: EquipmentId;
};

export const filterExercises = (
  catalog: readonly LibraryExercise[],
  filters: ExerciseFilters = {},
): LibraryExercise[] => {
  const query = filters.query?.trim().toLocaleLowerCase() ?? '';

  return catalog.filter(
    (item) =>
      (!query || item.name.toLocaleLowerCase().includes(query)) &&
      (!filters.muscle ||
        item.primaryMuscles.some((id) => id === filters.muscle) ||
        item.secondaryMuscles.some((id) => id === filters.muscle)) &&
      (!filters.equipment ||
        item.equipment.some((id) => id === filters.equipment)),
  );
};
