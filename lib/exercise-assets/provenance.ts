import type {
  ExerciseAssetSpecificationBundle,
  ModelProfile,
  SpecificationProvenance,
} from './types';
import { selectedMaleOutfit } from './outfits';

export const PROMPT_BUILDER_REFERENCE = {
  id: 'cresum-exercise-prompt-builder',
  revision: '3',
} as const;

export const PROMPT_PACKAGE_FORMAT_REFERENCE = {
  id: 'cresum-exercise-prompt-package',
  revision: '3',
} as const;

const reference = ({ id, revision }: { id: string; revision: string }) => ({
  id,
  revision,
});

export const specificationProvenance = (
  bundle: ExerciseAssetSpecificationBundle,
  modelProfile: ModelProfile,
): SpecificationProvenance => {
  const outfit = selectedMaleOutfit(bundle);
  if (!outfit)
    throw new Error('A validated selected outfit is required for provenance.');
  return {
    productionProfile: reference(bundle.productionProfile),
    biomechanicsSource: reference(bundle.biomechanics.source),
    variant: reference(bundle.variantRef),
    biomechanics: reference(bundle.biomechanics),
    visual: reference(bundle.visual),
    machine: reference(bundle.machine),
    attachment: reference(bundle.attachment),
    modelProfile: reference(modelProfile),
    outfitProfile: reference(outfit),
    muscleMapping: reference(bundle.muscleMapping),
    promptBuilder: reference(PROMPT_BUILDER_REFERENCE),
    promptPackageFormat: reference(PROMPT_PACKAGE_FORMAT_REFERENCE),
  };
};

// Closed ordering also defines the provenance portion of canonical packages.
export const PROVENANCE_KEYS = [
  'productionProfile',
  'biomechanicsSource',
  'variant',
  'biomechanics',
  'visual',
  'machine',
  'attachment',
  'modelProfile',
  'outfitProfile',
  'muscleMapping',
  'promptBuilder',
  'promptPackageFormat',
] as const satisfies readonly (keyof SpecificationProvenance)[];

export const isProvenanceStale = (
  recorded: SpecificationProvenance,
  current: SpecificationProvenance,
): boolean =>
  PROVENANCE_KEYS.some((key) => {
    const a = recorded?.[key];
    const b = current?.[key];
    return (
      typeof a?.id !== 'string' ||
      !a.id.trim() ||
      typeof a.revision !== 'string' ||
      !a.revision.trim() ||
      typeof b?.id !== 'string' ||
      !b.id.trim() ||
      typeof b.revision !== 'string' ||
      !b.revision.trim() ||
      a.id !== b.id ||
      a.revision !== b.revision
    );
  });
