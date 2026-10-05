import { approvedExerciseAssetSpecifications } from '../exercise-assets/specifications';
import {
  CANONICAL_PROMPT_ENCODING,
  PROMPT_SECTION_ORDER,
  buildExercisePromptPackage,
  hashCanonicalPromptRepresentation,
} from '../exercise-assets/prompt-builder';
import type {
  ApprovedAssetReference,
  ExerciseAssetSpecificationBundle,
  PromptBuildRequest,
} from '../exercise-assets/types';

const startRequest = {
  variantId: 'lat-pulldown-close-neutral-v-handle',
  phase: 'start',
  model: 'male',
  visualMode: 'technique',
} as const satisfies PromptBuildRequest;

const buildStart = () =>
  buildExercisePromptPackage(startRequest, approvedExerciseAssetSpecifications);

const approvedStartReference = (): ApprovedAssetReference => {
  const result = buildStart();
  if (!result.ok) throw new Error('START fixture failed to build.');
  return {
    assetId: 'fixture-approved-start',
    assetRevision: '1',
    contentHash: result.package.hash,
    status: 'approved',
    identity: result.package.identity,
    provenance: result.package.provenance,
  };
};

describe('exercise asset prompt builder', () => {
  it('builds a byte-identical START package and hash for identical inputs', () => {
    const first = buildStart();
    const second = buildStart();

    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(first.package.canonicalRepresentation).not.toContain('\r');
    expect(first.package.canonicalRepresentation).not.toMatch(
      /(?:[A-Za-z]:\\|\/Users\/|\/home\/)/,
    );
    expect(first.package.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.package.sections.map(({ id }) => id)).toEqual(
      PROMPT_SECTION_ORDER,
    );
    expect(CANONICAL_PROMPT_ENCODING).toBe('utf-8');
  });

  it('hashes only normalized canonical UTF-8 content', () => {
    expect(hashCanonicalPromptRepresentation('hello\r\n')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
    expect(hashCanonicalPromptRepresentation('hello\n')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('normalizes line endings inside specification values before canonicalization', () => {
    const crlf = structuredClone(
      approvedExerciseAssetSpecifications,
    ) as unknown as ExerciseAssetSpecificationBundle;
    const lf = structuredClone(
      approvedExerciseAssetSpecifications,
    ) as unknown as ExerciseAssetSpecificationBundle;
    crlf.visual.rendering = [...crlf.visual.rendering, 'line one\r\nline two'];
    lf.visual.rendering = [...lf.visual.rendering, 'line one\nline two'];

    const crlfResult = buildExercisePromptPackage(startRequest, crlf);
    const lfResult = buildExercisePromptPackage(startRequest, lf);
    expect(crlfResult.ok).toBe(true);
    expect(lfResult.ok).toBe(true);
    if (!crlfResult.ok || !lfResult.ok) return;
    expect(crlfResult.package.canonicalRepresentation).toBe(
      lfResult.package.canonicalRepresentation,
    );
    expect(crlfResult.package.hash).toBe(lfResult.package.hash);
  });

  it('preserves the approved grip, clothing, phase, and negative constraints', () => {
    const result = buildStart();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.package.renderedPrompt).toContain('palms face each other');
    expect(result.package.renderedPrompt).toContain(
      'all fingers anatomically wrap and contact each grip',
    );
    expect(result.package.renderedPrompt).toContain(
      'each thumb wraps opposite the fingers',
    );
    expect(result.package.renderedPrompt).toContain(
      'neutral flexion-extension and radial-ulnar alignment',
    );
    expect(result.package.renderedPrompt).toContain(
      'fitted muted blue / blue-gray T-shirt',
    );
    expect(result.package.renderedPrompt).toContain(
      'dark gray athletic shorts',
    );
    expect(result.package.renderedPrompt).toContain('white athletic socks');
    expect(result.package.renderedPrompt).toContain(
      'light gray athletic shoes',
    );
    expect(result.package.renderedPrompt).toContain(
      'arms elevated overhead in a narrow symmetric path',
    );
    expect(result.package.renderedPrompt).toContain(
      'controlled shoulder adduction and extension appropriate to the narrow neutral path',
    );
    expect(result.package.renderedPrompt).toContain(
      'Valid START ROM: highest controlled position compatible with a taut cable',
    );
    expect(result.package.negativeConstraints).toContain(
      'behind-the-neck attachment or cable path',
    );
    expect(result.package.requiredExternalReferences).toEqual([
      {
        kind: 'model-master',
        logicalId: 'cresum-male-master-reference',
        requiredForGeneration: true,
        resolved: false,
      },
    ]);
  });

  it('rejects a generic exercise ID and unsupported phase without producing a package', () => {
    expect(
      buildExercisePromptPackage(
        { ...startRequest, variantId: 'lat-pulldown' },
        approvedExerciseAssetSpecifications,
      ),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'unsupported-variant' }),
        ]),
      }),
    );
    expect(
      buildExercisePromptPackage(
        { ...startRequest, phase: 'middle' } as unknown as PromptBuildRequest,
        approvedExerciseAssetSpecifications,
      ),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'unsupported-phase' }),
        ]),
      }),
    );
  });

  it('rejects missing or conflicting biomechanics instead of inventing defaults', () => {
    const missing = structuredClone(approvedExerciseAssetSpecifications);
    delete (missing.biomechanics as { grip?: unknown }).grip;
    const missingAttachment = structuredClone(
      approvedExerciseAssetSpecifications,
    );
    delete (missingAttachment as { attachment?: unknown }).attachment;
    const missingVisual = structuredClone(approvedExerciseAssetSpecifications);
    delete (missingVisual as { visual?: unknown }).visual;
    const conflicting = structuredClone(approvedExerciseAssetSpecifications);
    (conflicting.biomechanics.grip as { orientation: string }).orientation =
      'pronated';

    for (const candidate of [
      missing,
      missingAttachment,
      missingVisual,
      conflicting,
    ]) {
      const result = buildExercisePromptPackage(
        startRequest,
        candidate as unknown as ExerciseAssetSpecificationBundle,
      );
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result).not.toHaveProperty('package');
    }
  });

  it('fails closed for missing nested specification fields instead of throwing', () => {
    const missingCamera = structuredClone(approvedExerciseAssetSpecifications);
    delete (missingCamera.visual as { camera?: unknown }).camera;
    const missingScapularBehavior = structuredClone(
      approvedExerciseAssetSpecifications,
    );
    delete (
      missingScapularBehavior.biomechanics.upperBody as {
        scapularBehavior?: unknown;
      }
    ).scapularBehavior;
    const missingTrajectory = structuredClone(
      approvedExerciseAssetSpecifications,
    );
    delete (missingTrajectory.biomechanics.movement as { trajectory?: unknown })
      .trajectory;
    const missingValidRom = structuredClone(
      approvedExerciseAssetSpecifications,
    );
    delete (missingValidRom.biomechanics.movement as { validRom?: unknown })
      .validRom;
    const missingMachineGeometry = structuredClone(
      approvedExerciseAssetSpecifications,
    );
    delete (
      missingMachineGeometry.machine.functionalGeometry as { pulley?: unknown }
    ).pulley;

    for (const candidate of [
      missingCamera,
      missingScapularBehavior,
      missingTrajectory,
      missingValidRom,
      missingMachineGeometry,
    ]) {
      expect(() =>
        buildExercisePromptPackage(
          startRequest,
          candidate as unknown as ExerciseAssetSpecificationBundle,
        ),
      ).not.toThrow();
      const result = buildExercisePromptPackage(
        startRequest,
        candidate as unknown as ExerciseAssetSpecificationBundle,
      );
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'missing-required-specification' }),
        ]),
      );
    }
  });

  it('includes approved trajectory and phase ROM in deterministic prompt content', () => {
    const baseline = buildStart();
    const changed = structuredClone(
      approvedExerciseAssetSpecifications,
    ) as unknown as ExerciseAssetSpecificationBundle;
    changed.biomechanics.movement.trajectory = [
      'changed reviewed trajectory constraint',
      ...changed.biomechanics.movement.trajectory.slice(1),
    ];
    const changedResult = buildExercisePromptPackage(startRequest, changed);

    expect(baseline.ok).toBe(true);
    expect(changedResult.ok).toBe(true);
    if (!baseline.ok || !changedResult.ok) return;
    expect(baseline.package.hash).not.toBe(changedResult.package.hash);
    expect(changedResult.package.renderedPrompt).toContain(
      'changed reviewed trajectory constraint',
    );
  });

  it('rejects Female and Anatomy production requests without approved specifications', () => {
    expect(
      buildExercisePromptPackage(
        { ...startRequest, model: 'female' },
        approvedExerciseAssetSpecifications,
      ),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'missing-model-profile' }),
        ]),
      }),
    );
    expect(
      buildExercisePromptPackage(
        { ...startRequest, visualMode: 'anatomy' },
        approvedExerciseAssetSpecifications,
      ),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'unsupported-visual-mode' }),
        ]),
      }),
    );
  });

  it('rejects FINISH without a compatible approved START reference', () => {
    const finishRequest = { ...startRequest, phase: 'finish' } as const;
    const missing = buildExercisePromptPackage(
      finishRequest,
      approvedExerciseAssetSpecifications,
    );
    const mismatched = approvedStartReference();
    mismatched.identity.variantId = 'another-variant';
    const incompatible = buildExercisePromptPackage(
      { ...finishRequest, approvedStartReference: mismatched },
      approvedExerciseAssetSpecifications,
    );

    expect(missing).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'approved-start-required' }),
        ]),
      }),
    );
    expect(incompatible).toEqual(
      expect.objectContaining({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'incompatible-start-reference' }),
        ]),
      }),
    );
  });

  it('builds deterministic FINISH from an approved compatible START reference', () => {
    const request = {
      ...startRequest,
      phase: 'finish',
      approvedStartReference: approvedStartReference(),
    } as const;
    const first = buildExercisePromptPackage(
      request,
      approvedExerciseAssetSpecifications,
    );
    const second = buildExercisePromptPackage(
      request,
      approvedExerciseAssetSpecifications,
    );

    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.package.approvedStartReference?.assetId).toBe(
      'fixture-approved-start',
    );
    expect(first.package.renderedPrompt).toContain(
      'handle is in front of the body near the upper-chest and upper-sternum region; contact is optional',
    );
    expect(first.package.renderedPrompt).toContain(
      'stop before elbows travel materially behind the torso',
    );
    expect(first.package.renderedPrompt).toContain(
      'same clothing, colors, and model identity in START and FINISH',
    );
  });
});
