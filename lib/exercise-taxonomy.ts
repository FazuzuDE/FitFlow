export const muscleTaxonomy = [
  { id: 'chest', label: 'Chest' },
  { id: 'upper-back', label: 'Upper Back' },
  { id: 'lats', label: 'Lats' },
  { id: 'traps', label: 'Traps' },
  { id: 'front-delts', label: 'Front Delts' },
  { id: 'side-delts', label: 'Side Delts' },
  { id: 'rear-delts', label: 'Rear Delts' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'forearms', label: 'Forearms' },
  { id: 'abs', label: 'Abs' },
  { id: 'lower-back', label: 'Lower Back' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'quadriceps', label: 'Quadriceps' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'calves', label: 'Calves' },
  { id: 'adductors', label: 'Adductors' },
] as const;

export type MuscleId = (typeof muscleTaxonomy)[number]['id'];

export const equipmentTaxonomy = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'bench', label: 'Bench' },
  { id: 'cable', label: 'Cable' },
  { id: 'machine', label: 'Machine' },
  { id: 'smith-machine', label: 'Smith Machine' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'ez-bar', label: 'EZ Bar' },
  { id: 'resistance-band', label: 'Resistance Band' },
] as const;

export type EquipmentId = (typeof equipmentTaxonomy)[number]['id'];

export const movementPatterns = [
  'horizontal-push',
  'vertical-push',
  'horizontal-pull',
  'vertical-pull',
  'squat',
  'hinge',
  'lunge',
  'isolation',
  'carry',
  'core',
] as const;

export type MovementPatternId = (typeof movementPatterns)[number];

export const muscleLabel = (id: MuscleId): string =>
  muscleTaxonomy.find((item) => item.id === id)?.label ?? id;

export const equipmentLabel = (id: EquipmentId): string =>
  equipmentTaxonomy.find((item) => item.id === id)?.label ?? id;
