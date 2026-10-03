import {
  buildExercisePromptPackage,
  createAssetTrackerRecord,
  evaluateAssetApproval,
  EXERCISE_ASSET_QA_CHECKS,
  approvedAssetReferenceFromTracker,
  isProvenanceStale,
  requiredQaChecksFor,
  QA_CHECKLIST_REFERENCE,
  transitionAssetTrackerRecord,
} from '../exercise-assets';
import { approvedExerciseAssetSpecifications } from '../exercise-assets/specifications';
import type {
  ApprovedAssetReference,
  AssetQaReview,
  AssetTrackerRecord,
  PromptPackage,
} from '../exercise-assets/types';

const buildStartPackage = (): PromptPackage => {
  const result = buildExercisePromptPackage(
    {
      variantId: 'lat-pulldown-close-neutral-v-handle',
      phase: 'start',
      model: 'male',
      visualMode: 'technique',
    },
    approvedExerciseAssetSpecifications,
  );
  if (!result.ok) {
    throw new Error(JSON.stringify(result.issues));
  }
  return result.package;
};

const approvedStartReference = (
  startPackage: PromptPackage,
): ApprovedAssetReference => ({
  assetId: 'lat-pulldown-close-neutral-v-handle-male-start',
  assetRevision: '1',
  contentHash: 'approved-start-content-sha256',
  status: 'approved',
  identity: startPackage.identity,
  provenance: startPackage.provenance,
});

const buildFinishPackage = (startPackage: PromptPackage): PromptPackage => {
  const result = buildExercisePromptPackage(
    {
      variantId: 'lat-pulldown-close-neutral-v-handle',
      phase: 'finish',
      model: 'male',
      visualMode: 'technique',
      approvedStartReference: approvedStartReference(startPackage),
    },
    approvedExerciseAssetSpecifications,
  );
  if (!result.ok) {
    throw new Error(JSON.stringify(result.issues));
  }
  return result.package;
};

const generatedDraft = (
  promptPackage: PromptPackage,
  trackerId: string,
  providerAssetId = 'draft-1',
): AssetTrackerRecord => {
  const planned = createAssetTrackerRecord({
    trackerId,
    recordRevision: '1',
    promptPackage,
  });
  const draft = transitionAssetTrackerRecord(planned, {
    type: 'record-generation',
    generation: {
      providerId: 'test-provider',
      modelId: 'test-model',
      providerAssetId,
      contentHash: `${providerAssetId}-content-sha256`,
    },
  });
  if (!draft.ok) throw new Error(draft.reason);
  return draft.record;
};

const completePassingReview = (record: AssetTrackerRecord): AssetQaReview => {
  const candidate = record.generationHistory.at(-1);
  if (!candidate) throw new Error('Generated candidate fixture is required.');
  return {
    reviewId: `${record.identity.phase}-review-1`,
    qaChecklistRevision: QA_CHECKLIST_REFERENCE.revision,
    trackerId: record.trackerId,
    recordRevision: record.recordRevision,
    promptPackageHash: record.promptPackage.hash,
    candidate,
    phase: record.identity.phase,
    results: requiredQaChecksFor(record.identity.phase).map(({ id }) => ({
      checkId: id,
      outcome: 'pass',
    })),
  };
};

describe('exercise asset structured QA', () => {
  it('publishes the critical checklist derived from the approved specifications', () => {
    expect(EXERCISE_ASSET_QA_CHECKS.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        'biomechanics.exact-variant',
        'biomechanics.start-position',
        'biomechanics.finish-endpoint',
        'biomechanics.natural-scapular-motion',
        'grip.neutral-orientation',
        'grip.fingers-thumbs-wrists',
        'equipment.machine-geometry',
        'equipment.attachment-geometry',
        'equipment.cable-path',
        'visual.no-anatomy-overlay',
        'pair.identity-and-clothing-lock',
        'pair.machine-camera-rendering-lock',
        'pair.only-approved-phase-changes',
      ]),
    );
    expect(
      EXERCISE_ASSET_QA_CHECKS.every(({ requirement }) => requirement),
    ).toBe(true);
  });

  it('blocks approval on a critical QA failure', () => {
    const promptPackage = buildStartPackage();
    const record = generatedDraft(promptPackage, 'qa-critical');
    const review = completePassingReview(record);
    review.results = review.results.map((result) =>
      result.checkId === 'grip.fingers-thumbs-wrists'
        ? { ...result, outcome: 'fail', notes: 'wrist break detected' }
        : result,
    );

    expect(
      evaluateAssetApproval({
        record,
        review,
        currentProvenance: promptPackage.provenance,
      }),
    ).toEqual(
      expect.objectContaining({
        approved: false,
        reasons: expect.arrayContaining([
          expect.stringContaining('grip.fingers-thumbs-wrists'),
        ]),
      }),
    );
  });

  it('blocks approval when any required QA result is incomplete', () => {
    const promptPackage = buildStartPackage();
    const record = generatedDraft(promptPackage, 'qa-incomplete');
    const review = completePassingReview(record);
    review.results = review.results.slice(1);

    expect(
      evaluateAssetApproval({
        record,
        review,
        currentProvenance: promptPackage.provenance,
      }),
    ).toEqual(
      expect.objectContaining({
        approved: false,
        reasons: expect.arrayContaining([expect.stringContaining('Missing')]),
      }),
    );
  });

  it('blocks approval when the QA checklist revision does not match', () => {
    const promptPackage = buildStartPackage();
    const record = generatedDraft(promptPackage, 'qa-revision');
    const review = completePassingReview(record);
    review.qaChecklistRevision = 'unsupported';

    expect(
      evaluateAssetApproval({
        record,
        review,
        currentProvenance: promptPackage.provenance,
      }),
    ).toEqual(
      expect.objectContaining({
        approved: false,
        reasons: expect.arrayContaining([
          expect.stringContaining('QA checklist revision'),
        ]),
      }),
    );
  });

  it('requires approved START and completed pair QA for FINISH approval', () => {
    const startPackage = buildStartPackage();
    const finishPackage = buildFinishPackage(startPackage);
    const record = generatedDraft(finishPackage, 'qa-finish');
    const incompletePairReview = completePassingReview(record);
    incompletePairReview.results = incompletePairReview.results.filter(
      ({ checkId }) => !checkId.startsWith('pair.'),
    );

    expect(
      evaluateAssetApproval({
        record,
        review: incompletePairReview,
        currentProvenance: finishPackage.provenance,
      }).approved,
    ).toBe(false);
    expect(
      evaluateAssetApproval({
        record,
        review: completePassingReview(record),
        currentProvenance: finishPackage.provenance,
      }),
    ).toEqual({ approved: true, reasons: [] });
  });
});

describe('exercise asset tracker and provenance', () => {
  it('uses the planned -> generated draft -> needs revision -> generated draft -> approved lifecycle', () => {
    const promptPackage = buildStartPackage();
    const planned = createAssetTrackerRecord({
      trackerId: 'asset-track-start-1',
      recordRevision: '1',
      promptPackage,
    });
    expect(planned.status).toBe('planned');

    const firstDraft = transitionAssetTrackerRecord(planned, {
      type: 'record-generation',
      generation: {
        providerId: 'test-provider',
        modelId: 'test-model',
        providerAssetId: 'draft-1',
        contentHash: 'draft-1-content-sha256',
      },
    });
    expect(firstDraft).toEqual(
      expect.objectContaining({
        ok: true,
        record: expect.objectContaining({ status: 'generated-draft' }),
      }),
    );
    if (!firstDraft.ok) throw new Error(firstDraft.reason);

    const needsRevision = transitionAssetTrackerRecord(firstDraft.record, {
      type: 'request-revision',
      reason: 'critical grip QA failure',
    });
    expect(needsRevision).toEqual(
      expect.objectContaining({
        ok: true,
        record: expect.objectContaining({ status: 'needs-revision' }),
      }),
    );
    if (!needsRevision.ok) throw new Error(needsRevision.reason);

    const revisedDraft = transitionAssetTrackerRecord(needsRevision.record, {
      type: 'record-generation',
      recordRevision: '2',
      generation: {
        providerId: 'test-provider',
        modelId: 'test-model',
        providerAssetId: 'draft-2',
        contentHash: 'draft-2-content-sha256',
      },
    });
    expect(revisedDraft).toEqual(
      expect.objectContaining({
        ok: true,
        record: expect.objectContaining({ status: 'generated-draft' }),
      }),
    );
    if (!revisedDraft.ok) throw new Error(revisedDraft.reason);

    const approved = transitionAssetTrackerRecord(revisedDraft.record, {
      type: 'submit-qa',
      review: completePassingReview(revisedDraft.record),
      currentProvenance: promptPackage.provenance,
    });
    expect(approved).toEqual(
      expect.objectContaining({
        ok: true,
        record: expect.objectContaining({ status: 'approved' }),
      }),
    );
    if (!approved.ok) throw new Error(approved.reason);

    expect(
      approvedAssetReferenceFromTracker(
        approved.record,
        promptPackage.provenance,
      ),
    ).toEqual({
      ok: true,
      reference: {
        assetId: 'asset-track-start-1',
        assetRevision: '2',
        contentHash: 'draft-2-content-sha256',
        status: 'approved',
        identity: promptPackage.identity,
        provenance: promptPackage.provenance,
      },
    });
  });

  it('does not allow a planned record to bypass generation and QA', () => {
    const promptPackage = buildStartPackage();
    const planned = createAssetTrackerRecord({
      trackerId: 'asset-track-start-2',
      recordRevision: '1',
      promptPackage,
    });
    const reviewFixture = generatedDraft(promptPackage, 'review-fixture');

    expect(
      transitionAssetTrackerRecord(planned, {
        type: 'submit-qa',
        review: completePassingReview(reviewFixture),
        currentProvenance: promptPackage.provenance,
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        reason: expect.stringContaining('generated draft'),
      }),
    );
  });

  it('rejects incomplete generated-candidate provenance', () => {
    const promptPackage = buildStartPackage();
    const planned = createAssetTrackerRecord({
      trackerId: 'asset-track-invalid-generation',
      recordRevision: '1',
      promptPackage,
    });

    expect(
      transitionAssetTrackerRecord(planned, {
        type: 'record-generation',
        generation: {
          providerId: 'test-provider',
          modelId: 'test-model',
          providerAssetId: 'draft-without-content-hash',
          contentHash: '',
        },
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        reason: expect.stringContaining('generation provenance'),
      }),
    );
  });

  it('does not reuse one generated draft review to approve another draft', () => {
    const promptPackage = buildStartPackage();
    const firstDraft = generatedDraft(
      promptPackage,
      'asset-track-bound-review',
      'draft-1',
    );
    const firstReview = completePassingReview(firstDraft);
    const needsRevision = transitionAssetTrackerRecord(firstDraft, {
      type: 'request-revision',
      reason: 'replace the generated candidate',
    });
    if (!needsRevision.ok) throw new Error(needsRevision.reason);
    const secondDraft = transitionAssetTrackerRecord(needsRevision.record, {
      type: 'record-generation',
      recordRevision: '2',
      generation: {
        providerId: 'test-provider',
        modelId: 'test-model',
        providerAssetId: 'draft-2',
        contentHash: 'draft-2-content-sha256',
      },
    });
    if (!secondDraft.ok) throw new Error(secondDraft.reason);

    expect(
      transitionAssetTrackerRecord(secondDraft.record, {
        type: 'submit-qa',
        review: firstReview,
        currentProvenance: promptPackage.provenance,
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        reason: expect.stringContaining('generated candidate'),
      }),
    );
  });

  it('captures specification revisions and detects stale provenance', () => {
    const promptPackage = buildStartPackage();
    const current = promptPackage.provenance;
    const stale = structuredClone(current);
    stale.biomechanics.revision += '-changed';

    expect(isProvenanceStale(current, current)).toBe(false);
    expect(isProvenanceStale(current, stale)).toBe(true);

    const record = createAssetTrackerRecord({
      trackerId: 'asset-track-start-3',
      recordRevision: '1',
      promptPackage,
    });
    expect(record.provenance).toEqual(current);
    expect(record.promptPackage).toEqual(promptPackage);
  });

  it('blocks tracker approval when recorded provenance is stale', () => {
    const promptPackage = buildStartPackage();
    const planned = createAssetTrackerRecord({
      trackerId: 'asset-track-start-4',
      recordRevision: '1',
      promptPackage,
    });
    const draft = transitionAssetTrackerRecord(planned, {
      type: 'record-generation',
      generation: {
        providerId: 'test-provider',
        modelId: 'test-model',
        providerAssetId: 'draft-1',
        contentHash: 'draft-1-content-sha256',
      },
    });
    if (!draft.ok) throw new Error(draft.reason);
    const current = structuredClone(promptPackage.provenance);
    current.visual.revision += '-changed';

    const result = transitionAssetTrackerRecord(draft.record, {
      type: 'submit-qa',
      review: completePassingReview(draft.record),
      currentProvenance: current,
    });
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        reason: expect.stringContaining('stale provenance'),
      }),
    );
  });
});
