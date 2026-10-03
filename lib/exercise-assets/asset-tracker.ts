import { evaluateAssetApproval } from './qa';
import type {
  ApprovedAssetReferenceResult,
  AssetTrackerRecord,
  AssetTrackerTransition,
  AssetTrackerTransitionResult,
  PromptPackage,
} from './types';

export const createAssetTrackerRecord = ({
  trackerId,
  recordRevision,
  promptPackage,
}: {
  trackerId: string;
  recordRevision: string;
  promptPackage: PromptPackage;
}): AssetTrackerRecord => ({
  trackerId,
  recordRevision,
  identity: promptPackage.identity,
  status: 'planned',
  promptPackage: {
    hash: promptPackage.hash,
    format: promptPackage.format,
    builder: promptPackage.builder,
  },
  provenance: promptPackage.provenance,
  ...(promptPackage.approvedStartReference
    ? { approvedStartReference: promptPackage.approvedStartReference }
    : {}),
  generationHistory: [],
  revisionReasons: [],
});

export const transitionAssetTrackerRecord = (
  record: AssetTrackerRecord,
  transition: AssetTrackerTransition,
): AssetTrackerTransitionResult => {
  if (transition.type === 'record-generation') {
    if (record.status !== 'planned' && record.status !== 'needs-revision') {
      return {
        ok: false,
        reason:
          'Generation can only be recorded for a planned asset or an asset that needs revision.',
      };
    }
    if (
      Object.values(transition.generation).some((value) => !value.trim().length)
    ) {
      return {
        ok: false,
        reason: 'Complete generation provenance is required.',
      };
    }
    return {
      ok: true,
      record: {
        ...record,
        status: 'generated-draft',
        generationHistory: [
          ...record.generationHistory,
          { ...transition.generation },
        ],
      },
    };
  }

  if (transition.type === 'request-revision') {
    if (record.status !== 'generated-draft') {
      return {
        ok: false,
        reason: 'Only a generated draft can be marked as needing revision.',
      };
    }
    return {
      ok: true,
      record: {
        ...record,
        status: 'needs-revision',
        revisionReasons: [...record.revisionReasons, transition.reason],
      },
    };
  }

  if (record.status !== 'generated-draft') {
    return {
      ok: false,
      reason: 'Approval requires a generated draft.',
    };
  }

  const gate = evaluateAssetApproval({
    record,
    review: transition.review,
    currentProvenance: transition.currentProvenance,
  });
  if (!gate.approved) {
    return { ok: false, reason: gate.reasons.join(' ') };
  }

  return {
    ok: true,
    record: {
      ...record,
      status: 'approved',
      qaReview: transition.review,
    },
  };
};

export const approvedAssetReferenceFromTracker = (
  record: AssetTrackerRecord,
): ApprovedAssetReferenceResult => {
  if (record.status !== 'approved') {
    return {
      ok: false,
      reason: 'Only an approved tracker record can become an asset reference.',
    };
  }
  const reviewedCandidate = record.qaReview?.candidate;
  if (!reviewedCandidate?.contentHash.trim()) {
    return {
      ok: false,
      reason: 'Approved QA-bound asset content hash is required.',
    };
  }
  return {
    ok: true,
    reference: {
      assetId: record.trackerId,
      assetRevision: record.recordRevision,
      contentHash: reviewedCandidate.contentHash,
      status: 'approved',
      identity: record.identity,
      provenance: record.provenance,
    },
  };
};
