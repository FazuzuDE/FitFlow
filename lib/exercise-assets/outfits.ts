import type {
  ExerciseAssetSpecificationBundle,
  MaleOutfitProfile,
  ValidationIssue,
} from './types';

const nonBlank = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Validate unknown input before the builder consumes the selected preset.
export const validateMaleOutfits = (
  profiles: unknown,
  reference: unknown,
): ValidationIssue[] => {
  const invalid = (path: string, message: string): ValidationIssue[] => [
    { code: 'invalid-outfit-profile', path, message },
  ];
  if (
    !isRecord(reference) ||
    !nonBlank(reference.id) ||
    !nonBlank(reference.revision)
  )
    return invalid(
      'productionProfile.outfitProfileRef',
      'An explicit outfit ID and revision are required; no fallback is available.',
    );
  if (!Array.isArray(profiles) || profiles.length === 0)
    return invalid(
      'outfitProfiles',
      'Approved Male outfit profiles are required.',
    );
  const ids = new Set<string>();
  for (const [index, profile] of profiles.entries()) {
    if (
      !isRecord(profile) ||
      !nonBlank(profile.id) ||
      !['revision', 'top', 'bottoms', 'footwear'].every((key) =>
        nonBlank(profile[key]),
      ) ||
      profile.approvalStatus !== 'approved' ||
      profile.model !== 'male' ||
      !(
        nonBlank(profile.socks) ||
        (profile.id === 'cresum-male-outfit-black-v1' && profile.socks === null)
      )
    )
      return invalid(
        `outfitProfiles.${index}`,
        'Each outfit must be approved, Male, and contain valid clothing fields; only the historical black preset permits unspecified socks.',
      );
    const id = profile.id;
    if (ids.has(id))
      return invalid('outfitProfiles', 'Outfit IDs must be unique.');
    ids.add(id);
  }
  const selected = profiles.find(
    (profile) =>
      profile.id === reference.id && profile.revision === reference.revision,
  );
  return selected
    ? []
    : invalid(
        'productionProfile.outfitProfileRef',
        'The referenced approved outfit revision does not exist.',
      );
};

// Called only after complete bundle validation; never selects a default.
export const selectedMaleOutfit = (
  bundle: ExerciseAssetSpecificationBundle,
): MaleOutfitProfile | undefined =>
  bundle.outfitProfiles.find(
    ({ id, revision }) =>
      id === bundle.productionProfile.outfitProfileRef.id &&
      revision === bundle.productionProfile.outfitProfileRef.revision,
  );
