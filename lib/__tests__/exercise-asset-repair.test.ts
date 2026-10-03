import { getCatalogVariant } from '../exercise-catalog-adapter';
import {
  approvedExerciseAssetSpecifications as baseline,
  approvedAssetReferenceFromTracker,
  buildExercisePromptPackage,
  createAssetTrackerRecord,
  evaluateAssetApproval,
  isProvenanceStale,
  hashCanonicalPromptRepresentation,
  QA_CHECKLIST_REFERENCE,
  requiredQaChecksFor,
  transitionAssetTrackerRecord,
} from '../exercise-assets';
import type {
  AssetQaReview,
  AssetTrackerRecord,
  ExerciseAssetSpecificationBundle,
  PromptBuildRequest,
  SpecificationProvenance,
} from '../exercise-assets';

const request = {
  variantId: 'lat-pulldown-close-neutral-v-handle',
  phase: 'start',
  model: 'male',
  visualMode: 'technique',
} as const;
const start = () => {
  const built = buildExercisePromptPackage(request, baseline);
  if (!built.ok) throw new Error(JSON.stringify(built.issues));
  return built.package;
};
const draft = () => {
  const planned = createAssetTrackerRecord({
    trackerId: 'repair-asset',
    recordRevision: '1',
    promptPackage: start(),
  });
  const result = transitionAssetTrackerRecord(planned, {
    type: 'record-generation',
    generation: {
      providerId: 'provider',
      modelId: 'model',
      providerAssetId: 'draft-1',
      contentHash: 'content-1',
    },
  });
  if (!result.ok) throw new Error(result.reason);
  return result.record;
};
const reviewFor = (record: AssetTrackerRecord): AssetQaReview => ({
  reviewId: 'review-1',
  qaChecklistRevision: QA_CHECKLIST_REFERENCE.revision,
  trackerId: record.trackerId,
  recordRevision: record.recordRevision,
  promptPackageHash: record.promptPackage.hash,
  phase: record.identity.phase,
  candidate: structuredClone(record.generationHistory.at(-1)!),
  results: requiredQaChecksFor(record.identity.phase).map(({ id }) => ({
    checkId: id,
    outcome: 'pass',
  })),
});
const approve = (record: AssetTrackerRecord, review = reviewFor(record)) => {
  const result = transitionAssetTrackerRecord(record, {
    type: 'submit-qa',
    review,
    currentProvenance: start().provenance,
  });
  if (!result.ok) throw new Error(result.reason);
  return result.record;
};

describe('exercise asset repair contracts', () => {
  it('consumes the canonical catalog variant without leaking production qualifiers', () => {
    expect(baseline.variant).toEqual(getCatalogVariant(request.variantId));
    expect(baseline.variant.attachmentType?.id).toBe('v-handle');
    expect(baseline.variant.gripWidth).toBe('close');
    expect(baseline.variant.machineArchetype).toBeUndefined();
    expect(baseline.variant.bodyPosition).toBeUndefined();
    expect(baseline.attachment.id).toBe('cresum-close-neutral-v-handle');
  });

  it('accepts equivalent endpoint wording while rejecting contradictory structured constraints', () => {
    const specs = structuredClone(
      baseline,
    ) as unknown as ExerciseAssetSpecificationBundle;
    specs.biomechanics.movement.finish = [
      'Handle near the upper chest / upper sternum; touching is optional.',
    ];
    expect(buildExercisePromptPackage(request, specs).ok).toBe(true);
    const invalid = structuredClone(specs);
    (
      invalid.biomechanics as unknown as { constraints: { endpoint: string } }
    ).constraints.endpoint = 'abdomen';
    expect(buildExercisePromptPackage(request, invalid).ok).toBe(false);
  });

  it.each([null, {}, { results: [] }, { results: 'pass' }])(
    'rejects malformed QA input %j without throwing',
    (review) => {
      const record = draft();
      expect(
        evaluateAssetApproval({
          record,
          review: review as unknown as AssetQaReview,
          currentProvenance: start().provenance,
        }).approved,
      ).toBe(false);
    },
  );

  it.each(['unknown', undefined, null, 'not-reviewed'])(
    'blocks invalid or incomplete outcome %j',
    (outcome) => {
      const record = draft();
      const review = reviewFor(record);
      (review.results[0] as unknown as { outcome: unknown }).outcome = outcome;
      expect(
        evaluateAssetApproval({
          record,
          review,
          currentProvenance: start().provenance,
        }).approved,
      ).toBe(false);
    },
  );

  it('captures caller-owned review and provenance by value at approval', () => {
    const record = draft();
    const review = reviewFor(record);
    const current = structuredClone(start().provenance);
    const result = transitionAssetTrackerRecord(record, {
      type: 'submit-qa',
      review,
      currentProvenance: current,
    });
    if (!result.ok) throw new Error(result.reason);
    review.candidate.contentHash = 'unreviewed';
    review.results[0].outcome = 'fail';
    current.biomechanics.revision = 'changed';
    const ref = approvedAssetReferenceFromTracker(
      result.record,
      start().provenance,
    );
    expect(ref).toMatchObject({
      ok: true,
      reference: { contentHash: 'content-1' },
    });
  });

  it('does not retain caller prompt identity/provenance references', () => {
    const prompt = start();
    const planned = createAssetTrackerRecord({
      trackerId: 'snapshot',
      recordRevision: '1',
      promptPackage: prompt,
    });
    prompt.identity.variantId = 'tampered';
    prompt.provenance.visual.revision = 'tampered';
    expect(planned.identity.variantId).toBe(request.variantId);
    expect(planned.provenance.visual.revision).not.toBe('tampered');
  });

  it('rejects fabricated approved status and tampered approval evidence', () => {
    const record = draft();
    expect(
      approvedAssetReferenceFromTracker(
        {
          ...record,
          status: 'approved',
          qaReview: reviewFor(record),
        } as AssetTrackerRecord,
        start().provenance,
      ).ok,
    ).toBe(false);
    const approved = approve(record);
    expect(
      approvedAssetReferenceFromTracker(
        { ...approved, identity: { ...approved.identity, phase: 'finish' } },
        start().provenance,
      ).ok,
    ).toBe(false);
    expect(
      approvedAssetReferenceFromTracker(
        {
          ...approved,
          promptPackage: { ...approved.promptPackage, hash: 'tampered' },
        },
        start().provenance,
      ).ok,
    ).toBe(false);
  });

  it('revalidates complete serialized approval evidence and rejects damaged snapshots', () => {
    const approved = approve(draft());
    const restored: AssetTrackerRecord = JSON.parse(JSON.stringify(approved));
    expect(
      approvedAssetReferenceFromTracker(restored, start().provenance).ok,
    ).toBe(true);
    for (const mutation of [
      'hash',
      'review',
      'candidate',
      'missing-review',
    ] as const) {
      const damaged = structuredClone(restored);
      const snapshot = damaged.approvalSnapshot!;
      if (mutation === 'hash') snapshot.reference.contentHash = 'unreviewed';
      if (mutation === 'review') snapshot.review.results[0].outcome = 'fail';
      if (mutation === 'candidate')
        snapshot.review.candidate.providerAssetId = 'another-draft';
      if (mutation === 'missing-review')
        delete (snapshot as { review?: unknown }).review;
      expect(
        approvedAssetReferenceFromTracker(damaged, start().provenance).ok,
      ).toBe(false);
    }
    expect(Object.isFrozen(approved)).toBe(true);
    expect(Object.isFrozen(approved.approvalSnapshot?.review.candidate)).toBe(
      true,
    );
  });

  it.each([
    'endpoint',
    'chestContact',
    'elbowPath',
    'torsoMotion',
    'scapularMotion',
    'attachmentOrientation',
  ])('rejects missing or contradictory structured constraint %s', (key) => {
    for (const value of [undefined, 'contradictory']) {
      const specs = structuredClone(baseline);
      Object.assign(specs.biomechanics.constraints, { [key]: value });
      expect(buildExercisePromptPackage(request, specs).ok).toBe(false);
    }
  });

  it('rejects empty generation and malformed QA result collections', () => {
    const p = start();
    const planned = createAssetTrackerRecord({
      trackerId: 'asset',
      recordRevision: '1',
      promptPackage: p,
    });
    expect(
      transitionAssetTrackerRecord(planned, {
        type: 'record-generation',
        generation: {},
      } as unknown as Parameters<typeof transitionAssetTrackerRecord>[1]).ok,
    ).toBe(false);
    const record = draft();
    for (const results of [
      null,
      {},
      'pass',
      [null],
      [{ checkId: 'invented', outcome: 'pass' }],
    ]) {
      expect(
        evaluateAssetApproval({
          record,
          review: { ...reviewFor(record), results },
          currentProvenance: p.provenance,
        }).approved,
      ).toBe(false);
    }
  });

  it('requires a new revision, draft and review after an approved asset needs revision', () => {
    const approved = approve(draft());
    const needs = transitionAssetTrackerRecord(approved, {
      type: 'request-revision',
      reason: 'equipment geometry changed',
    });
    expect(needs.ok).toBe(true);
    if (!needs.ok) return;
    expect(
      approvedAssetReferenceFromTracker(needs.record, start().provenance).ok,
    ).toBe(false);
    expect(
      transitionAssetTrackerRecord(needs.record, {
        type: 'submit-qa',
        review: reviewFor(approved),
        currentProvenance: start().provenance,
      }).ok,
    ).toBe(false);
    const generation = {
      providerId: 'provider',
      modelId: 'model',
      providerAssetId: 'draft-2',
      contentHash: 'content-2',
    };
    expect(
      transitionAssetTrackerRecord(needs.record, {
        type: 'record-generation',
        generation,
      }).ok,
    ).toBe(false);
    const next = transitionAssetTrackerRecord(needs.record, {
      type: 'record-generation',
      generation,
      recordRevision: '2',
    });
    if (!next.ok) throw new Error(next.reason);
    expect(next.record.recordRevision).toBe('2');
    expect(
      transitionAssetTrackerRecord(next.record, {
        type: 'submit-qa',
        review: reviewFor(approved),
        currentProvenance: start().provenance,
      }).ok,
    ).toBe(false);
    expect(approve(next.record).status).toBe('approved');
    expect(
      transitionAssetTrackerRecord(approved, {
        type: 'request-revision',
        reason: ' ',
      }).ok,
    ).toBe(false);
  });

  it('never reuses an older asset revision for another candidate', () => {
    const first = approve(draft());
    const needs = transitionAssetTrackerRecord(first, {
      type: 'request-revision',
      reason: 'revise',
    });
    if (!needs.ok) throw new Error(needs.reason);
    const second = transitionAssetTrackerRecord(needs.record, {
      type: 'record-generation',
      recordRevision: '2',
      generation: {
        providerId: 'provider',
        modelId: 'model',
        providerAssetId: 'draft-2',
        contentHash: 'content-2',
      },
    });
    if (!second.ok) throw new Error(second.reason);
    const restoredOlderRevision = {
      ...second.record,
      recordRevision: '1',
    };
    expect(
      evaluateAssetApproval({
        record: restoredOlderRevision,
        review: reviewFor(restoredOlderRevision),
        currentProvenance: start().provenance,
      }).approved,
    ).toBe(false);
    expect(
      transitionAssetTrackerRecord(
        { ...second.record, revisionReasons: [] },
        {
          type: 'submit-qa',
          review: reviewFor(second.record),
          currentProvenance: start().provenance,
        },
      ).ok,
    ).toBe(false);
    const needsAgain = transitionAssetTrackerRecord(approve(second.record), {
      type: 'request-revision',
      reason: 'revise again',
    });
    if (!needsAgain.ok) throw new Error(needsAgain.reason);
    expect(
      transitionAssetTrackerRecord(needsAgain.record, {
        type: 'record-generation',
        recordRevision: '1',
        generation: {
          providerId: 'provider',
          modelId: 'model',
          providerAssetId: 'draft-3',
          contentHash: 'content-3',
        },
      }).ok,
    ).toBe(false);
  });

  it('rejects status labels inconsistent with lifecycle evidence', () => {
    const planned = createAssetTrackerRecord({
      trackerId: 'asset',
      recordRevision: '1',
      promptPackage: start(),
    });
    const generation = {
      providerId: 'provider',
      modelId: 'model',
      providerAssetId: 'draft',
      contentHash: 'content',
    };
    expect(
      transitionAssetTrackerRecord(
        { ...planned, status: 'needs-revision' },
        { type: 'record-generation', recordRevision: '2', generation },
      ).ok,
    ).toBe(false);
    expect(
      transitionAssetTrackerRecord(
        { ...planned, generationHistory: [generation] },
        { type: 'record-generation', generation },
      ).ok,
    ).toBe(false);
    expect(
      transitionAssetTrackerRecord(
        { ...planned, status: 'generated-draft' },
        { type: 'request-revision', reason: 'revise' },
      ).ok,
    ).toBe(false);
    expect(
      transitionAssetTrackerRecord(
        { ...draft(), status: 'approved' },
        { type: 'request-revision', reason: 'revise' },
      ).ok,
    ).toBe(false);
  });

  it.each(['hash', 'builder', 'format', 'canonicalRepresentation'])(
    'rejects forged prompt evidence %s at tracker creation',
    (field) => {
      const p = start();
      if (field === 'hash') p.hash = 'forged';
      if (field === 'builder') p.builder.revision = 'forged';
      if (field === 'format') p.format.revision = 'forged';
      if (field === 'canonicalRepresentation')
        p.canonicalRepresentation += '\nforged';
      expect(() =>
        createAssetTrackerRecord({
          trackerId: 'asset',
          recordRevision: '1',
          promptPackage: p,
        }),
      ).toThrow();
    },
  );

  it.each(['instruction', 'reference'])(
    'rejects coordinated canonical/hash forgery %s',
    (field) => {
      const p = start();
      p.canonicalRepresentation =
        field === 'reference'
          ? p.canonicalRepresentation.replace(
              'required-reference=cresum-male-master-reference',
              'required-reference=fabricated-master',
            )
          : p.canonicalRepresentation.replace(
              'instruction="fitted black T-shirt"',
              'instruction="red shirt"',
            );
      p.hash = hashCanonicalPromptRepresentation(p.canonicalRepresentation);
      expect(() =>
        createAssetTrackerRecord({
          trackerId: 'asset',
          recordRevision: '1',
          promptPackage: p,
        }),
      ).toThrow();
    },
  );

  it.each(['trackerId', 'recordRevision'])('rejects blank %s', (field) => {
    expect(() =>
      createAssetTrackerRecord({
        trackerId: 'asset',
        recordRevision: '1',
        promptPackage: start(),
        [field]: ' ',
      }),
    ).toThrow();
  });

  it.each(['familyId', 'variantId', 'phase', 'model', 'visualMode'])(
    'rejects invalid tracker identity %s',
    (field) => {
      const prompt = start();
      Object.assign(prompt.identity, { [field]: ' ' });
      expect(() =>
        createAssetTrackerRecord({
          trackerId: 'asset',
          recordRevision: '1',
          promptPackage: prompt,
        }),
      ).toThrow();
    },
  );

  it('rejects START dependencies and never serializes one into a START package', () => {
    const p = start();
    const reference = {
      assetId: 'start',
      assetRevision: '1',
      contentHash: 'hash',
      status: 'approved',
      identity: p.identity,
      provenance: p.provenance,
    } as const;
    expect(
      buildExercisePromptPackage(
        { ...request, approvedStartReference: reference },
        baseline,
      ).ok,
    ).toBe(false);
    expect(p.approvedStartReference).toBeUndefined();
    expect(p.canonicalRepresentation).toContain('approved-start=none');
  });

  it.each(['familyId', 'variantId', 'phase', 'model', 'visualMode'])(
    'rejects mismatched FINISH reference %s',
    (field) => {
      const p = start();
      const reference = {
        assetId: 'start',
        assetRevision: '1',
        contentHash: 'hash',
        status: 'approved',
        identity: { ...p.identity, [field]: 'mismatch' },
        provenance: p.provenance,
      };
      expect(
        buildExercisePromptPackage(
          {
            ...request,
            phase: 'finish',
            approvedStartReference: reference,
          } as PromptBuildRequest,
          baseline,
        ).ok,
      ).toBe(false);
    },
  );

  it('detects every provenance revision and rejects stale START/approval references', () => {
    const p = start();
    const record = draft();
    const approved = approve(record);
    expect(isProvenanceStale(p.provenance, p.provenance)).toBe(false);
    for (const key of Object.keys(
      p.provenance,
    ) as (keyof SpecificationProvenance)[]) {
      const stale = structuredClone(p.provenance);
      stale[key].revision += '-changed';
      expect(isProvenanceStale(stale, p.provenance)).toBe(true);
      expect(
        evaluateAssetApproval({
          record,
          review: reviewFor(record),
          currentProvenance: stale,
        }).approved,
      ).toBe(false);
      expect(approvedAssetReferenceFromTracker(approved, stale).ok).toBe(false);
      const reference = {
        assetId: 'start',
        assetRevision: '1',
        contentHash: 'hash',
        status: 'approved',
        identity: p.identity,
        provenance: stale,
      } as const;
      expect(
        buildExercisePromptPackage(
          { ...request, phase: 'finish', approvedStartReference: reference },
          baseline,
        ).ok,
      ).toBe(false);
    }
    expect(
      isProvenanceStale(
        {} as SpecificationProvenance,
        {} as SpecificationProvenance,
      ),
    ).toBe(true);
  });
});
