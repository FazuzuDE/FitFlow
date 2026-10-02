import {
  canonicalExerciseId,
  exerciseLibrary,
  type ExerciseId,
} from './exercise-library';
import type { EquipmentId } from './exercise-taxonomy';
import {
  isValidExerciseVariantCatalog,
  type ExerciseFamily,
  type ExerciseVariant,
} from './exercise-variant-model';

type CatalogMapping = {
  familyId: string;
  configuration: ExerciseVariant['configuration'];
  equipmentType: EquipmentId;
};

export const catalogFamilies = [
  { id: 'bench-press', name: 'Bench Press' },
  { id: 'chest-fly', name: 'Chest Fly' },
  { id: 'shoulder-press', name: 'Shoulder Press' },
  { id: 'lateral-raise', name: 'Lateral Raise' },
  { id: 'biceps-curl', name: 'Biceps Curl' },
  { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension' },
  { id: 'squat', name: 'Squat' },
  { id: 'leg-curl', name: 'Leg Curl' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift' },
  { id: 'calf-raise', name: 'Calf Raise' },
  { id: 'pull-up', name: 'Pull-Up' },
  { id: 'lat-pulldown', name: 'Lat Pulldown' },
] as const satisfies readonly ExerciseFamily[];

// The existing catalog does not identify primary equipment separately from
// accessory equipment such as a bench. Keep that choice explicit and checked.
const mapping = {
  'barbell-bench-press': {
    familyId: 'bench-press',
    configuration: 'specific',
    equipmentType: 'barbell',
  },
  'incline-dumbbell-press': {
    familyId: 'bench-press',
    configuration: 'specific',
    equipmentType: 'dumbbell',
  },
  'dumbbell-bench-press': {
    familyId: 'bench-press',
    configuration: 'specific',
    equipmentType: 'dumbbell',
  },
  'cable-chest-fly': {
    familyId: 'chest-fly',
    configuration: 'unspecified',
    equipmentType: 'cable',
  },
  'pec-deck-fly': {
    familyId: 'chest-fly',
    configuration: 'unspecified',
    equipmentType: 'machine',
  },
  'dumbbell-shoulder-press': {
    familyId: 'shoulder-press',
    configuration: 'specific',
    equipmentType: 'dumbbell',
  },
  'barbell-overhead-press': {
    familyId: 'shoulder-press',
    configuration: 'specific',
    equipmentType: 'barbell',
  },
  'machine-shoulder-press': {
    familyId: 'shoulder-press',
    configuration: 'unspecified',
    equipmentType: 'machine',
  },
  'dumbbell-lateral-raise': {
    familyId: 'lateral-raise',
    configuration: 'specific',
    equipmentType: 'dumbbell',
  },
  'cable-lateral-raise': {
    familyId: 'lateral-raise',
    configuration: 'unspecified',
    equipmentType: 'cable',
  },
  'dumbbell-biceps-curl': {
    familyId: 'biceps-curl',
    configuration: 'specific',
    equipmentType: 'dumbbell',
  },
  'barbell-curl': {
    familyId: 'biceps-curl',
    configuration: 'specific',
    equipmentType: 'barbell',
  },
  'ez-bar-curl': {
    familyId: 'biceps-curl',
    configuration: 'specific',
    equipmentType: 'ez-bar',
  },
  'hammer-curl': {
    familyId: 'biceps-curl',
    configuration: 'specific',
    equipmentType: 'dumbbell',
  },
  'cable-biceps-curl': {
    familyId: 'biceps-curl',
    configuration: 'unspecified',
    equipmentType: 'cable',
  },
  'overhead-cable-triceps-extension': {
    familyId: 'overhead-triceps-extension',
    configuration: 'unspecified',
    equipmentType: 'cable',
  },
  'dumbbell-overhead-triceps-extension': {
    familyId: 'overhead-triceps-extension',
    configuration: 'specific',
    equipmentType: 'dumbbell',
  },
  'barbell-back-squat': {
    familyId: 'squat',
    configuration: 'specific',
    equipmentType: 'barbell',
  },
  'barbell-front-squat': {
    familyId: 'squat',
    configuration: 'specific',
    equipmentType: 'barbell',
  },
  'smith-machine-squat': {
    familyId: 'squat',
    configuration: 'specific',
    equipmentType: 'smith-machine',
  },
  'goblet-squat': {
    familyId: 'squat',
    configuration: 'specific',
    equipmentType: 'dumbbell',
  },
  'lying-leg-curl': {
    familyId: 'leg-curl',
    configuration: 'unspecified',
    equipmentType: 'machine',
  },
  'seated-leg-curl': {
    familyId: 'leg-curl',
    configuration: 'unspecified',
    equipmentType: 'machine',
  },
  'barbell-romanian-deadlift': {
    familyId: 'romanian-deadlift',
    configuration: 'specific',
    equipmentType: 'barbell',
  },
  'dumbbell-romanian-deadlift': {
    familyId: 'romanian-deadlift',
    configuration: 'specific',
    equipmentType: 'dumbbell',
  },
  'standing-calf-raise': {
    familyId: 'calf-raise',
    configuration: 'unspecified',
    equipmentType: 'machine',
  },
  'seated-calf-raise': {
    familyId: 'calf-raise',
    configuration: 'unspecified',
    equipmentType: 'machine',
  },
  'pull-up': {
    familyId: 'pull-up',
    configuration: 'unspecified',
    equipmentType: 'bodyweight',
  },
  'assisted-pull-up': {
    familyId: 'pull-up',
    configuration: 'unspecified',
    equipmentType: 'machine',
  },
  'lat-pulldown': {
    familyId: 'lat-pulldown',
    configuration: 'unspecified',
    equipmentType: 'cable',
  },
} as const satisfies Partial<Record<ExerciseId, CatalogMapping>>;

const hasMapping = (id: string): id is keyof typeof mapping =>
  Object.prototype.hasOwnProperty.call(mapping, id);

export const catalogVariants: readonly ExerciseVariant[] =
  exerciseLibrary.flatMap((source) => {
    if (!hasMapping(source.id)) return [];
    const { familyId, configuration, equipmentType } = mapping[source.id];
    if (!source.equipment.includes(equipmentType)) {
      throw new Error(`Invalid primary equipment for ${source.id}`);
    }
    return [
      {
        id: source.id,
        familyId,
        name: source.name,
        equipmentType,
        configuration,
        movementPattern: source.movementPattern,
        // Existing flat-catalog labels remain the source, not reviewed
        // exact-variant biomechanics or a new muscle calculation.
        muscles: {
          primary: [...source.primaryMuscles],
          secondary: [...source.secondaryMuscles],
        },
      },
    ];
  });

export const unmappedExerciseIds: readonly ExerciseId[] = exerciseLibrary
  .filter(({ id }) => !hasMapping(id))
  .map(({ id }) => id);

if (
  catalogVariants.length !== Object.keys(mapping).length ||
  !isValidExerciseVariantCatalog(catalogFamilies, catalogVariants)
) {
  throw new Error('Invalid exercise catalog adapter');
}

const familyById = new Map(
  catalogFamilies.map((family) => [family.id, family]),
);
const variantById = new Map(
  catalogVariants.map((variant) => [variant.id, variant]),
);

export const getCatalogFamily = (id: string): ExerciseFamily | undefined =>
  familyById.get(id as (typeof catalogFamilies)[number]['id']);

export const getCatalogVariant = (id: string): ExerciseVariant | undefined => {
  const canonicalId = canonicalExerciseId(id);
  return canonicalId ? variantById.get(canonicalId) : undefined;
};

export const getFamilyForExercise = (
  id: string,
): ExerciseFamily | undefined => {
  const variant = getCatalogVariant(id);
  return variant ? getCatalogFamily(variant.familyId) : undefined;
};

export const listFamilyVariants = (familyId: string): ExerciseVariant[] =>
  catalogVariants.filter((variant) => variant.familyId === familyId);
