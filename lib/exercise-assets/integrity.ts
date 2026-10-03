import { getCatalogVariant } from '../exercise-catalog-adapter';
import { isProvenanceStale } from './provenance';
import {
  canonicalPromptRepresentation,
  hashCanonicalPromptRepresentation,
  PROMPT_SECTION_ORDER,
  renderPromptSections,
} from './canonical';
import type {
  ApprovedAssetReference,
  AssetTrackerRecord,
  GenerationRecord,
  PromptPackage,
} from './types';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const nonBlank = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const validIdentity = (
  value: unknown,
): value is PromptPackage['identity'] => {
  if (!isRecord(value) || !nonBlank(value.variantId)) return false;
  const canonical = getCatalogVariant(value.variantId);
  return (
    value.variantId === 'lat-pulldown-close-neutral-v-handle' &&
    canonical?.familyId === value.familyId &&
    (value.phase === 'start' || value.phase === 'finish') &&
    value.model === 'male' &&
    value.visualMode === 'technique'
  );
};

export const validGeneration = (value: unknown): value is GenerationRecord =>
  isRecord(value) &&
  ['providerId', 'modelId', 'providerAssetId', 'contentHash'].every((key) =>
    nonBlank(value[key]),
  );

export const validApprovedReference = (
  value: unknown,
): value is ApprovedAssetReference =>
  isRecord(value) &&
  value.status === 'approved' &&
  nonBlank(value.assetId) &&
  nonBlank(value.assetRevision) &&
  nonBlank(value.contentHash) &&
  validIdentity(value.identity) &&
  isRecord(value.provenance) &&
  !isProvenanceStale(
    value.provenance as ApprovedAssetReference['provenance'],
    value.provenance as ApprovedAssetReference['provenance'],
  );

const identityMatches = (
  left: PromptPackage['identity'],
  right: PromptPackage['identity'],
): boolean =>
  (['familyId', 'variantId', 'phase', 'model', 'visualMode'] as const).every(
    (key) => left[key] === right[key],
  );

export const validPromptEvidence = (value: unknown): value is PromptPackage => {
  if (
    !isRecord(value) ||
    !validIdentity(value.identity) ||
    !isRecord(value.provenance) ||
    isProvenanceStale(
      value.provenance as PromptPackage['provenance'],
      value.provenance as PromptPackage['provenance'],
    ) ||
    ![value.format, value.builder].every(
      (ref) => isRecord(ref) && nonBlank(ref.id) && nonBlank(ref.revision),
    ) ||
    !Array.isArray(value.requiredExternalReferences) ||
    value.requiredExternalReferences.length !== 1 ||
    !value.requiredExternalReferences.every(
      (ref) =>
        isRecord(ref) &&
        ref.kind === 'model-master' &&
        nonBlank(ref.logicalId) &&
        ref.requiredForGeneration === true &&
        ref.resolved === false,
    ) ||
    !Array.isArray(value.sections) ||
    value.sections.length !== PROMPT_SECTION_ORDER.length ||
    !value.sections.every(
      (section, index) =>
        isRecord(section) &&
        section.id === PROMPT_SECTION_ORDER[index] &&
        Array.isArray(section.instructions) &&
        section.instructions.length > 0 &&
        section.instructions.every(nonBlank),
    ) ||
    !Array.isArray(value.negativeConstraints) ||
    !value.negativeConstraints.every(nonBlank) ||
    !nonBlank(value.renderedPrompt) ||
    !nonBlank(value.canonicalRepresentation) ||
    !nonBlank(value.hash)
  )
    return false;
  // Shape checks above make reconstruction safe; no text is inferred here.
  const prompt = value as PromptPackage;
  const start = prompt.approvedStartReference;
  if (
    prompt.identity.phase === 'start'
      ? start !== undefined
      : !validApprovedReference(start) ||
        start.identity.phase !== 'start' ||
        !identityMatches(
          { ...start.identity, phase: 'finish' },
          prompt.identity,
        ) ||
        isProvenanceStale(start.provenance, prompt.provenance)
  )
    return false;
  const canonical = canonicalPromptRepresentation(prompt);
  return (
    prompt.format.id === prompt.provenance.promptPackageFormat.id &&
    prompt.format.revision === prompt.provenance.promptPackageFormat.revision &&
    prompt.builder.id === prompt.provenance.promptBuilder.id &&
    prompt.builder.revision === prompt.provenance.promptBuilder.revision &&
    prompt.canonicalRepresentation === canonical &&
    prompt.hash === hashCanonicalPromptRepresentation(canonical) &&
    prompt.renderedPrompt === renderPromptSections(prompt.sections) &&
    JSON.stringify(prompt.negativeConstraints) ===
      JSON.stringify(prompt.sections.at(-1)?.instructions)
  );
};

export const validTrackerRecord = (
  value: unknown,
): value is AssetTrackerRecord => {
  if (
    !isRecord(value) ||
    !nonBlank(value.trackerId) ||
    !nonBlank(value.recordRevision) ||
    !validIdentity(value.identity) ||
    !validPromptEvidence(value.promptPackage)
  )
    return false;
  const prompt = value.promptPackage;
  if (
    !isRecord(value.provenance) ||
    isProvenanceStale(
      value.provenance as AssetTrackerRecord['provenance'],
      value.provenance as AssetTrackerRecord['provenance'],
    )
  )
    return false;
  const provenance = value.provenance as AssetTrackerRecord['provenance'];
  const reference = value.approvedStartReference;
  const canonicalValid =
    identityMatches(prompt.identity, value.identity) &&
    !isProvenanceStale(prompt.provenance, provenance) &&
    (reference === undefined
      ? prompt.approvedStartReference === undefined
      : validApprovedReference(reference) &&
        validApprovedReference(prompt.approvedStartReference) &&
        reference.assetId === prompt.approvedStartReference.assetId &&
        reference.assetRevision ===
          prompt.approvedStartReference.assetRevision &&
        reference.contentHash === prompt.approvedStartReference.contentHash &&
        identityMatches(
          reference.identity,
          prompt.approvedStartReference.identity,
        ) &&
        !isProvenanceStale(
          reference.provenance,
          prompt.approvedStartReference.provenance,
        ));
  if (
    !Array.isArray(value.generationHistory) ||
    !Array.isArray(value.revisionReasons) ||
    !Array.isArray(value.usedRevisions)
  )
    return false;
  const snapshot = value.approvalSnapshot;
  const lifecycleValid =
    value.status === 'planned'
      ? value.generationHistory.length === 0 &&
        value.usedRevisions.length === 1 &&
        value.revisionReasons.length === 0 &&
        snapshot === undefined
      : value.status === 'generated-draft'
        ? value.generationHistory.length > 0 &&
          value.generationHistory.length === value.usedRevisions.length &&
          value.revisionReasons.length === value.usedRevisions.length - 1 &&
          snapshot === undefined
        : value.status === 'needs-revision'
          ? value.generationHistory.length > 0 &&
            value.generationHistory.length === value.usedRevisions.length &&
            value.revisionReasons.length === value.usedRevisions.length &&
            snapshot === undefined
          : value.status === 'approved' &&
            value.generationHistory.length > 0 &&
            value.generationHistory.length === value.usedRevisions.length &&
            value.revisionReasons.length === value.usedRevisions.length - 1 &&
            isRecord(snapshot) &&
            validApprovedReference(snapshot.reference) &&
            isRecord(snapshot.review) &&
            isRecord(snapshot.promptPackage);
  return (
    lifecycleValid &&
    canonicalValid &&
    nonBlank(prompt.hash) &&
    isRecord(value.provenance) &&
    !isProvenanceStale(
      value.provenance as AssetTrackerRecord['provenance'],
      value.provenance as AssetTrackerRecord['provenance'],
    ) &&
    Array.isArray(value.generationHistory) &&
    value.generationHistory.every(validGeneration) &&
    Array.isArray(value.usedRevisions) &&
    value.usedRevisions.length > 0 &&
    value.usedRevisions.every(nonBlank) &&
    new Set(value.usedRevisions).size === value.usedRevisions.length &&
    value.usedRevisions.at(-1) === value.recordRevision &&
    Array.isArray(value.revisionReasons) &&
    value.revisionReasons.every(nonBlank) &&
    ['planned', 'generated-draft', 'needs-revision', 'approved'].includes(
      String(value.status),
    ) &&
    (value.identity.phase === 'start'
      ? value.approvedStartReference === undefined
      : validApprovedReference(value.approvedStartReference) &&
        value.approvedStartReference.identity.phase === 'start' &&
        !isProvenanceStale(
          value.approvedStartReference.provenance,
          value.provenance as AssetTrackerRecord['provenance'],
        ))
  );
};

// Value copies protect callers too; recursive freezing protects approved outputs.
// Only JSON-serializable domain data enters this helper after validation.
export const immutableSnapshot = <T>(value: T): T => {
  const copy = structuredClone(value);
  const freeze = (item: unknown): void => {
    if (typeof item !== 'object' || item === null || Object.isFrozen(item))
      return;
    for (const child of Object.values(item)) freeze(child);
    Object.freeze(item);
  };
  freeze(copy);
  return copy;
};
