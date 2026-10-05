import {
  approvedExerciseAssetSpecifications as baseline,
  approvedAssetReferenceFromTracker,
  buildExercisePromptPackage,
  createAssetTrackerRecord,
  isProvenanceStale,
  QA_CHECKLIST_REFERENCE,
  requiredQaChecksFor,
  transitionAssetTrackerRecord,
} from '../exercise-assets';
import type {
  ApprovedAssetReference,
  AssetQaReview,
  ExerciseAssetSpecificationBundle,
  PromptPackage,
} from '../exercise-assets';

const blue = 'cresum-male-outfit-blue-gray-v1';
const black = 'cresum-male-outfit-black-v1';
const request = {
  variantId: 'lat-pulldown-close-neutral-v-handle',
  phase: 'start',
  model: 'male',
  visualMode: 'technique',
} as const;
const clone = (): ExerciseAssetSpecificationBundle =>
  structuredClone(baseline) as unknown as ExerciseAssetSpecificationBundle;
const withOutfits = () => {
  const bundle = clone();
  expect(bundle).toHaveProperty('outfitProfiles');
  return bundle;
};
const build = (
  bundle: ExerciseAssetSpecificationBundle = baseline,
): PromptPackage => {
  const result = buildExercisePromptPackage(request, bundle);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.package;
};
const selectBlack = () => {
  const bundle = withOutfits();
  bundle.productionProfile.outfitProfileRef = { id: black, revision: '1' };
  return bundle;
};
const approveStart = (p: PromptPackage): ApprovedAssetReference => {
  const planned = createAssetTrackerRecord({
    trackerId: 'outfit-start',
    recordRevision: '1',
    promptPackage: p,
  });
  const generation = {
    providerId: 'fixture',
    modelId: 'fixture',
    providerAssetId: 'fixture-start',
    contentHash: 'fixture-content',
  };
  const draft = transitionAssetTrackerRecord(planned, {
    type: 'record-generation',
    generation,
  });
  if (!draft.ok) throw new Error(draft.reason);
  const review: AssetQaReview = {
    reviewId: 'outfit-review',
    qaChecklistRevision: QA_CHECKLIST_REFERENCE.revision,
    trackerId: planned.trackerId,
    recordRevision: '1',
    promptPackageHash: p.hash,
    candidate: generation,
    phase: 'start',
    results: requiredQaChecksFor('start').map(({ id }) => ({
      checkId: id,
      outcome: 'pass',
    })),
  };
  const approved = transitionAssetTrackerRecord(draft.record, {
    type: 'submit-qa',
    review,
    currentProvenance: p.provenance,
  });
  if (!approved.ok) throw new Error(approved.reason);
  const ref = approvedAssetReferenceFromTracker(approved.record, p.provenance);
  if (!ref.ok) throw new Error(ref.reason);
  return ref.reference;
};

describe('Male outfit production presets', () => {
  it('selects blue-gray while retaining exactly two approved Male presets', () => {
    expect(baseline.productionProfile).toMatchObject({
      outfitProfileRef: { id: blue, revision: '1' },
    });
    const bundle = withOutfits();
    expect(
      bundle.outfitProfiles.map(({ id, revision, approvalStatus, model }) => ({
        id,
        revision,
        approvalStatus,
        model,
      })),
    ).toEqual([
      { id: blue, revision: '1', approvalStatus: 'approved', model: 'male' },
      { id: black, revision: '1', approvalStatus: 'approved', model: 'male' },
    ]);
    expect(bundle.outfitProfiles[1].socks).toBeNull();
  });

  it('emits blue-gray clothes, visible white socks and no black-only requirement', () => {
    const p = build();
    for (const text of [
      'fitted muted blue / blue-gray T-shirt',
      'dark gray athletic shorts',
      'white athletic socks',
      'light gray athletic shoes',
      'normal training length',
      'no branding',
    ]) {
      expect(p.renderedPrompt).toContain(text);
    }
    expect(p.renderedPrompt).not.toMatch(
      /black T-shirt|black shorts|black athletic (?:shorts|shoes)/,
    );
  });

  it('keeps clothing outside stable Male Master identity when selecting black', () => {
    const p = build();
    const alternate = selectBlack();
    const b = build(alternate);
    expect(baseline.modelProfiles[0]).not.toHaveProperty('clothing');
    expect(alternate.modelProfiles).toEqual(baseline.modelProfiles);
    expect(p.sections.find(({ id }) => id === 'identity-lock')).toEqual(
      b.sections.find(({ id }) => id === 'identity-lock'),
    );
    expect(
      p.sections
        .find(({ id }) => id === 'identity-lock')
        ?.instructions.join(' '),
    ).not.toMatch(/T-shirt|shorts|socks|shoes/);
    expect(p.renderedPrompt).toContain('short brown hair');
    expect(p.renderedPrompt).toContain('clean-shaven appearance');
    expect(p.requiredExternalReferences[0]).toMatchObject({
      logicalId: 'cresum-male-master-reference',
      resolved: false,
    });
  });

  it('uses black only when explicitly selected and invents no black sock convention', () => {
    const p = build(selectBlack());
    for (const text of [
      'fitted black T-shirt',
      'black athletic shorts',
      'black athletic shoes',
    ])
      expect(p.renderedPrompt).toContain(text);
    expect(p.renderedPrompt).not.toMatch(
      /muted blue|dark gray athletic shorts|white athletic socks|light gray athletic shoes/,
    );
    expect(p.provenance).toMatchObject({
      outfitProfile: { id: black, revision: '1' },
    });
  });

  it.each(['missing', 'revision', 'blank-id', 'blank-revision'])(
    'fails closed for an invalid outfit reference: %s',
    (kind) => {
      const bundle = clone();
      bundle.productionProfile.outfitProfileRef =
        kind === 'missing'
          ? { id: 'missing', revision: '1' }
          : kind === 'revision'
            ? { id: blue, revision: '99' }
            : kind === 'blank-id'
              ? { id: ' ', revision: '1' }
              : { id: blue, revision: ' ' };
      const result = buildExercisePromptPackage(request, bundle);
      expect(result.ok).toBe(false);
      expect(result).not.toHaveProperty('package');
    },
  );

  it.each(['approvalStatus', 'model', 'top', 'bottoms', 'socks', 'footwear'])(
    'rejects invalid selected outfit field %s without fallback',
    (field) => {
      const bundle = withOutfits();
      const outfit = bundle.outfitProfiles[0] as unknown as Record<
        string,
        unknown
      >;
      outfit[field] =
        field === 'approvalStatus'
          ? 'draft'
          : field === 'model'
            ? 'female'
            : ' ';
      expect(buildExercisePromptPackage(request, bundle).ok).toBe(false);
    },
  );

  it.each([null, undefined])(
    'does not accept missing blue-gray sock requirements: %j',
    (socks) => {
      const bundle = withOutfits();
      (bundle.outfitProfiles[0] as unknown as Record<string, unknown>).socks =
        socks;
      expect(buildExercisePromptPackage(request, bundle).ok).toBe(false);
    },
  );

  it.each([null, [], [null]])(
    'fails closed for a malformed outfit registry: %j',
    (profiles) => {
      const bundle = clone();
      (bundle as unknown as Record<string, unknown>).outfitProfiles = profiles;
      expect(() => buildExercisePromptPackage(request, bundle)).not.toThrow();
      expect(buildExercisePromptPackage(request, bundle).ok).toBe(false);
    },
  );

  it('rejects ambiguous duplicate outfit IDs', () => {
    const bundle = withOutfits();
    bundle.outfitProfiles = [
      ...bundle.outfitProfiles,
      { ...bundle.outfitProfiles[0] },
    ];
    expect(buildExercisePromptPackage(request, bundle).ok).toBe(false);
  });

  it('captures outfit reference and revision in canonical hash and staleness', () => {
    const p = build();
    expect(p.provenance).toMatchObject({
      outfitProfile: { id: blue, revision: '1' },
    });
    expect(p.canonicalRepresentation).toContain(
      `spec.outfit-profile=${blue}@1`,
    );
    const alternate = build(selectBlack());
    expect(alternate.hash).not.toBe(p.hash);
    expect(isProvenanceStale(p.provenance, alternate.provenance)).toBe(true);
    const bundle = withOutfits();
    bundle.outfitProfiles[0].revision = '2';
    bundle.productionProfile.outfitProfileRef.revision = '2';
    const revised = build(bundle);
    expect(revised.hash).not.toBe(p.hash);
    expect(isProvenanceStale(p.provenance, revised.provenance)).toBe(true);
    expect(isProvenanceStale(p.provenance, p.provenance)).toBe(false);
  });

  it('hashes selected outfit content deterministically without runtime metadata', () => {
    const first = build();
    const second = build(clone());
    expect(Buffer.from(first.canonicalRepresentation, 'utf8')).toEqual(
      Buffer.from(second.canonicalRepresentation, 'utf8'),
    );
    expect(first.hash).toBe(second.hash);
    const bundle = withOutfits();
    bundle.outfitProfiles[0].top += '; reviewed content refinement';
    expect(build(bundle).hash).not.toBe(first.hash);
  });

  it('requires the same outfit reference and all clothing items for FINISH', () => {
    const p = build();
    const approvedStartReference = approveStart(p);
    const finishRequest = {
      ...request,
      phase: 'finish',
      approvedStartReference,
    } as const;
    const finish = buildExercisePromptPackage(finishRequest, baseline);
    expect(finish.ok).toBe(true);
    if (!finish.ok) throw new Error('Compatible FINISH rejected');
    expect(finish.package.provenance).toEqual(p.provenance);
    expect(
      finish.package.sections.find(({ id }) => id === 'rendering-style'),
    ).toEqual(p.sections.find(({ id }) => id === 'rendering-style'));
    expect(finish.package.renderedPrompt).toContain(`outfit profile ${blue}@1`);
    expect(finish.package.renderedPrompt).toContain(
      'same top, shorts, socks, and footwear',
    );
    expect(buildExercisePromptPackage(finishRequest, selectBlack()).ok).toBe(
      false,
    );
    const changed = withOutfits();
    changed.outfitProfiles[0].revision = '2';
    changed.productionProfile.outfitProfileRef.revision = '2';
    expect(buildExercisePromptPackage(finishRequest, changed).ok).toBe(false);
  });

  it('QA checks the selected outfit rather than forcing historical black clothing', () => {
    expect(requiredQaChecksFor('start')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'visual.selected-outfit',
          severity: 'critical',
        }),
      ]),
    );
    const pair = requiredQaChecksFor('finish').find(
      ({ id }) => id === 'pair.identity-and-clothing-lock',
    );
    expect(pair?.requirement).toContain('outfit profile ID and revision');
    expect(pair?.requirement).not.toContain('black');
  });
});
