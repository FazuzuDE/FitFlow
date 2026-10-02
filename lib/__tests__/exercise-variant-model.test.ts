import {
  exerciseAssetIdentity,
  isValidExerciseVariantCatalog,
  type ExerciseFamily,
  type ExerciseVariant,
} from '../exercise-variant-model';

const families = [
  { id: 'bench-press', name: 'Bench Press' },
  { id: 'lat-pulldown', name: 'Lat Pulldown' },
  { id: 'chest-press', name: 'Chest Press' },
] as const satisfies readonly ExerciseFamily[];

const variants = [
  {
    id: 'barbell-bench-press',
    familyId: 'bench-press',
    name: 'Barbell Bench Press',
    equipmentType: 'barbell',
    configuration: 'specific',
    movementPattern: 'horizontal-push',
    muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
  },
  {
    id: 'lat-pulldown-close-neutral-v-handle',
    familyId: 'lat-pulldown',
    name: 'Close Neutral Lat Pulldown',
    equipmentType: 'cable',
    configuration: 'specific',
    attachmentType: 'v-handle',
    grip: 'neutral',
    bodyPosition: 'seated',
    support: 'seat',
    laterality: 'bilateral',
  },
  {
    id: 'machine-chest-press-plate-loaded',
    familyId: 'chest-press',
    name: 'Plate-Loaded Chest Press',
    equipmentType: 'machine',
    configuration: 'specific',
    machineArchetype: 'plate-loaded',
  },
  {
    id: 'lat-pulldown',
    familyId: 'lat-pulldown',
    name: 'Lat Pulldown',
    equipmentType: 'cable',
    configuration: 'unspecified',
  },
] as const satisfies readonly ExerciseVariant[];

describe('exercise family and variant foundation', () => {
  it('accepts specific barbell, cable, machine and unspecified legacy variants', () => {
    expect(isValidExerciseVariantCatalog(families, variants)).toBe(true);
  });

  it('derives asset identity from stable IDs, not display labels', () => {
    const renamed = { ...variants[1], name: 'Pulldown — new display name' };
    expect(exerciseAssetIdentity(renamed, 'start', 'female')).toEqual({
      familyId: 'lat-pulldown',
      variantId: 'lat-pulldown-close-neutral-v-handle',
      phase: 'start',
      model: 'female',
    });
    expect(isValidExerciseVariantCatalog(families, [renamed])).toBe(true);
  });

  it('rejects duplicate family or variant IDs', () => {
    expect(
      isValidExerciseVariantCatalog([...families, families[0]], variants),
    ).toBe(false);
    expect(
      isValidExerciseVariantCatalog(families, [...variants, variants[0]]),
    ).toBe(false);
  });

  it('rejects variants whose family is unknown', () => {
    expect(
      isValidExerciseVariantCatalog(families, [
        { ...variants[0], familyId: 'missing-family' },
      ]),
    ).toBe(false);
  });

  it('rejects malformed identities and empty labels', () => {
    expect(
      isValidExerciseVariantCatalog([{ id: 'Bad ID', name: 'Bench' }], []),
    ).toBe(false);
    expect(
      isValidExerciseVariantCatalog([{ id: 'bench', name: ' ' }], []),
    ).toBe(false);
    expect(
      isValidExerciseVariantCatalog(families, [
        { ...variants[0], id: 'bad id' },
      ]),
    ).toBe(false);
  });

  it('rejects a machine archetype on non-machine equipment', () => {
    expect(
      isValidExerciseVariantCatalog(families, [
        { ...variants[0], machineArchetype: 'selectorized' },
      ]),
    ).toBe(false);
  });

  it('allows known details while leaving a legacy configuration unspecified', () => {
    expect(
      isValidExerciseVariantCatalog(families, [
        {
          id: 'legacy-machine-chest-press',
          familyId: 'chest-press',
          name: 'Legacy Machine Chest Press',
          equipmentType: 'machine',
          configuration: 'unspecified',
          machineArchetype: 'selectorized',
        },
      ]),
    ).toBe(true);
  });

  it('rejects malformed qualifiers and overlapping muscle mapping', () => {
    expect(
      isValidExerciseVariantCatalog(families, [
        { ...variants[1], attachmentType: 'V Handle' },
      ]),
    ).toBe(false);
    expect(
      isValidExerciseVariantCatalog(families, [
        {
          ...variants[0],
          muscles: { primary: ['chest'], secondary: ['chest'] },
        },
      ]),
    ).toBe(false);
  });
});
