import type {
  ExerciseAssetSpecificationBundle,
  ModelProfile,
  SpecificationProvenance,
} from './types';

export const PROMPT_BUILDER_REFERENCE = {
  id: 'cresum-exercise-prompt-builder',
  revision: '1',
} as const;

export const PROMPT_PACKAGE_FORMAT_REFERENCE = {
  id: 'cresum-exercise-prompt-package',
  revision: '1',
} as const;

const reference = ({ id, revision }: { id: string; revision: string }) => ({
  id,
  revision,
});

export const specificationProvenance = (
  bundle: ExerciseAssetSpecificationBundle,
  modelProfile: ModelProfile,
): SpecificationProvenance => ({
  variant: reference(bundle.variantRef),
  biomechanics: reference(bundle.biomechanics),
  visual: reference(bundle.visual),
  machine: reference(bundle.machine),
  attachment: reference(bundle.attachment),
  modelProfile: reference(modelProfile),
  muscleMapping: reference(bundle.muscleMapping),
  promptBuilder: reference(PROMPT_BUILDER_REFERENCE),
  promptPackageFormat: reference(PROMPT_PACKAGE_FORMAT_REFERENCE),
});

export const isProvenanceStale = (
  recorded: SpecificationProvenance,
  current: SpecificationProvenance,
): boolean =>
  (Object.keys(current) as (keyof SpecificationProvenance)[]).some(
    (key) =>
      recorded[key]?.id !== current[key].id ||
      recorded[key]?.revision !== current[key].revision,
  );
