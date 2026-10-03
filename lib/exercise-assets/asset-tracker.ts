import { evaluateAssetApproval } from './qa';
import {
  immutableSnapshot,
  isRecord,
  nonBlank,
  validApprovedReference,
  validGeneration,
  validPromptEvidence,
  validTrackerRecord,
} from './integrity';
import { isProvenanceStale } from './provenance';
import type {
  ApprovedAssetReferenceResult,
  AssetTrackerRecord,
  AssetTrackerTransition,
  AssetTrackerTransitionResult,
  PromptPackage,
  SpecificationProvenance,
} from './types';

export const createAssetTrackerRecord = ({
  trackerId,
  recordRevision,
  promptPackage,
}: {
  trackerId: string;
  recordRevision: string;
  promptPackage: PromptPackage;
}): AssetTrackerRecord => {
  const record: AssetTrackerRecord = {
    trackerId,
    recordRevision,
    identity: promptPackage.identity,
    status: 'planned',
    promptPackage,
    provenance: promptPackage.provenance,
    ...(promptPackage.approvedStartReference
      ? { approvedStartReference: promptPackage.approvedStartReference }
      : {}),
    generationHistory: [],
    usedRevisions: [recordRevision],
    revisionReasons: [],
  };
  if (!validTrackerRecord(record))
    throw new Error(
      'Valid non-blank tracker identity, revision, package provenance and phase dependency are required.',
    );
  return immutableSnapshot(record);
};

export const transitionAssetTrackerRecord = (
  record: AssetTrackerRecord,
  transition: AssetTrackerTransition,
): AssetTrackerTransitionResult => {
  if (!validTrackerRecord(record) || !isRecord(transition))
    return { ok: false, reason: 'Invalid tracker record or transition.' };
  if (transition.type === 'record-generation') {
    if (record.status !== 'planned' && record.status !== 'needs-revision')
      return {
        ok: false,
        reason:
          'Generation requires a planned asset or an asset that needs revision.',
      };
    if (!validGeneration(transition.generation))
      return {
        ok: false,
        reason: 'Complete generation provenance is required.',
      };
    const revision = transition.recordRevision ?? record.recordRevision;
    if (
      !nonBlank(revision) ||
      (record.status === 'planned' && revision !== record.recordRevision) ||
      (record.status === 'needs-revision' &&
        record.usedRevisions.includes(revision))
    )
      return {
        ok: false,
        reason: 'A revised draft requires a new non-blank asset revision.',
      };
    return {
      ok: true,
      record: immutableSnapshot({
        ...record,
        recordRevision: revision,
        usedRevisions: record.usedRevisions.includes(revision)
          ? record.usedRevisions
          : [...record.usedRevisions, revision],
        status: 'generated-draft',
        approvalSnapshot: undefined,
        generationHistory: [...record.generationHistory, transition.generation],
      }),
    };
  }
  if (transition.type === 'request-revision') {
    if (
      !['generated-draft', 'approved'].includes(record.status) ||
      !nonBlank(transition.reason)
    )
      return {
        ok: false,
        reason:
          'Revision requires a draft or approved asset and a non-blank reason.',
      };
    if (
      record.status === 'approved' &&
      !approvedAssetReferenceFromTracker(record, record.provenance).ok
    )
      return {
        ok: false,
        reason:
          'Revision of an approved record requires intact approval evidence.',
      };
    return {
      ok: true,
      record: immutableSnapshot({
        ...record,
        status: 'needs-revision',
        approvalSnapshot: undefined,
        revisionReasons: [...record.revisionReasons, transition.reason],
      }),
    };
  }
  if (transition.type !== 'submit-qa' || record.status !== 'generated-draft')
    return { ok: false, reason: 'Approval requires a generated draft.' };
  const gate = evaluateAssetApproval({
    record,
    review: transition.review,
    currentProvenance: transition.currentProvenance,
  });
  if (!gate.approved) return { ok: false, reason: gate.reasons.join(' ') };
  return {
    ok: true,
    record: immutableSnapshot({
      ...record,
      status: 'approved',
      approvalSnapshot: {
        reference: {
          assetId: record.trackerId,
          assetRevision: record.recordRevision,
          contentHash: transition.review.candidate.contentHash,
          status: 'approved',
          identity: record.identity,
          provenance: record.provenance,
        },
        review: transition.review,
        promptPackage: record.promptPackage,
      },
    }),
  };
};

// A status string is not approval evidence. Recheck the value snapshot, complete
// QA/candidate binding and caller-supplied current upstream revisions on export.
// This is integrity validation, not authentication of a human reviewer.
export const approvedAssetReferenceFromTracker = (
  record: AssetTrackerRecord,
  currentProvenance: SpecificationProvenance,
): ApprovedAssetReferenceResult => {
  if (!validTrackerRecord(record) || record.status !== 'approved')
    return {
      ok: false,
      reason:
        'Only a valid approved tracker record can become an asset reference.',
    };
  const snapshot = record.approvalSnapshot;
  if (
    !isRecord(snapshot) ||
    !validApprovedReference(snapshot.reference) ||
    !validPromptEvidence(snapshot.promptPackage)
  )
    return {
      ok: false,
      reason: 'Complete approval snapshot evidence is required.',
    };
  const reference = snapshot.reference;
  const identityFields = [
    'familyId',
    'variantId',
    'phase',
    'model',
    'visualMode',
  ] as const;
  const prompt = snapshot.promptPackage;
  if (
    reference.assetId !== record.trackerId ||
    reference.assetRevision !== record.recordRevision ||
    reference.contentHash !== record.generationHistory.at(-1)?.contentHash ||
    identityFields.some(
      (key) => reference.identity[key] !== record.identity[key],
    ) ||
    isProvenanceStale(reference.provenance, record.provenance) ||
    prompt.hash !== record.promptPackage.hash ||
    prompt.canonicalRepresentation !==
      record.promptPackage.canonicalRepresentation ||
    !isRecord(prompt.format) ||
    !isRecord(prompt.builder) ||
    prompt.format.id !== record.promptPackage.format.id ||
    prompt.format.revision !== record.promptPackage.format.revision ||
    prompt.builder.id !== record.promptPackage.builder.id ||
    prompt.builder.revision !== record.promptPackage.builder.revision
  )
    return {
      ok: false,
      reason: 'Approval snapshot integrity does not match the tracker.',
    };
  const gate = evaluateAssetApproval({
    record: {
      ...record,
      status: 'generated-draft',
      approvalSnapshot: undefined,
    },
    review: snapshot.review,
    currentProvenance,
  });
  if (!gate.approved) return { ok: false, reason: gate.reasons.join(' ') };
  return { ok: true, reference: immutableSnapshot(reference) };
};
