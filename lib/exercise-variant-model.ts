import {
  equipmentTaxonomy,
  movementPatterns,
  muscleTaxonomy,
} from './exercise-taxonomy';
import type {
  EquipmentId,
  MovementPatternId,
  MuscleId,
} from './exercise-taxonomy';

export type ExerciseFamily = {
  id: string;
  name: string;
};

type VariantMuscles = {
  primary: readonly MuscleId[];
  secondary: readonly MuscleId[];
};

type VariantBase = {
  id: string;
  familyId: string;
  name: string;
  equipmentType: EquipmentId;
  movementPattern?: MovementPatternId;
  muscles?: VariantMuscles;
};

type VariantQualifier<Kind extends string> = {
  kind: Kind;
  id: string;
};

export type AttachmentType = VariantQualifier<'attachment'>;
export type GripType = VariantQualifier<'grip'>;
export type BodyPositionType = VariantQualifier<'body-position'>;
export type SupportType = VariantQualifier<'support'>;

export type ExerciseVariant = VariantBase & {
  configuration: 'specific' | 'unspecified';
  machineArchetype?: 'selectorized' | 'plate-loaded';
  attachmentType?: AttachmentType;
  grip?: GripType;
  gripWidth?: 'wide' | 'close';
  bodyPosition?: BodyPositionType;
  support?: SupportType;
  laterality?: 'bilateral' | 'unilateral';
};

export type AssetPhase = 'start' | 'finish';
export type AssetModel = 'male' | 'female';
export type ExerciseAssetIdentity = {
  familyId: string;
  variantId: string;
  phase: AssetPhase;
  model: AssetModel;
};

export const exerciseAssetIdentity = (
  variant: ExerciseVariant,
  phase: AssetPhase,
  model: AssetModel,
): ExerciseAssetIdentity => ({
  familyId: variant.familyId,
  variantId: variant.id,
  phase,
  model,
});

const stableId = (value: string): boolean =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const validQualifier = (value: unknown, kind: string): boolean =>
  value === undefined ||
  (typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    value.kind === kind &&
    'id' in value &&
    typeof value.id === 'string' &&
    stableId(value.id));

const validMuscles = (muscles: VariantMuscles): boolean => {
  const known = new Set<string>(muscleTaxonomy.map(({ id }) => id));
  const primary = muscles.primary;
  const secondary = muscles.secondary;
  return (
    primary.length > 0 &&
    new Set(primary).size === primary.length &&
    new Set(secondary).size === secondary.length &&
    [...primary, ...secondary].every((id) => known.has(id)) &&
    primary.every((id) => !secondary.includes(id))
  );
};

export const isValidExerciseVariantCatalog = (
  families: readonly ExerciseFamily[],
  variants: readonly ExerciseVariant[],
): boolean => {
  const familyIds = new Set(families.map(({ id }) => id));
  const variantIds = new Set(variants.map(({ id }) => id));
  const equipment = new Set<string>(equipmentTaxonomy.map(({ id }) => id));
  const patterns = new Set<string>(movementPatterns);

  return (
    familyIds.size === families.length &&
    variantIds.size === variants.length &&
    families.every(({ id, name }) => stableId(id) && name.trim().length > 0) &&
    variants.every((variant) => {
      return (
        stableId(variant.id) &&
        familyIds.has(variant.familyId) &&
        variant.name.trim().length > 0 &&
        equipment.has(variant.equipmentType) &&
        (variant.movementPattern === undefined ||
          patterns.has(variant.movementPattern)) &&
        (variant.muscles === undefined || validMuscles(variant.muscles)) &&
        (variant.machineArchetype === undefined ||
          (variant.equipmentType === 'machine' &&
            ['selectorized', 'plate-loaded'].includes(
              variant.machineArchetype,
            ))) &&
        validQualifier(variant.attachmentType, 'attachment') &&
        validQualifier(variant.grip, 'grip') &&
        (variant.gripWidth === undefined ||
          ['wide', 'close'].includes(variant.gripWidth)) &&
        validQualifier(variant.bodyPosition, 'body-position') &&
        validQualifier(variant.support, 'support') &&
        (variant.laterality === undefined ||
          ['bilateral', 'unilateral'].includes(variant.laterality)) &&
        ['specific', 'unspecified'].includes(variant.configuration)
      );
    })
  );
};
