import {
  canonicalPromptRepresentation,
  PROMPT_SECTION_ORDER,
  renderPromptSections,
  hashCanonicalPromptRepresentation,
  normalizeCanonicalText,
} from './canonical';
import type { AssetPhase } from '../exercise-variant-model';
import {
  isProvenanceStale,
  PROMPT_BUILDER_REFERENCE,
  PROMPT_PACKAGE_FORMAT_REFERENCE,
  specificationProvenance,
} from './provenance';
import type {
  ExerciseAssetSpecificationBundle,
  ModelProfile,
  MaleOutfitProfile,
  PromptBuildRequest,
  PromptBuildResult,
  PromptPackage,
  PromptSection,
  PromptSectionId,
  ValidationIssue,
} from './types';
import { validateExerciseAssetSpecificationBundle } from './validation';
import { validApprovedReference } from './integrity';
import { selectedMaleOutfit } from './outfits';

export {
  CANONICAL_PROMPT_ENCODING,
  PROMPT_SECTION_ORDER,
  hashCanonicalPromptRepresentation,
} from './canonical';

const validationIssue = (
  code: string,
  path: string,
  message: string,
): ValidationIssue => ({ code, path, message });

const modelProfileFor = (
  request: PromptBuildRequest,
  bundle: ExerciseAssetSpecificationBundle,
): ModelProfile | undefined =>
  bundle.modelProfiles.find(
    ({ id, revision, model, approvalStatus }) =>
      model === request.model &&
      approvalStatus === 'approved' &&
      id === bundle.visual.modelProfileRef.id &&
      revision === bundle.visual.modelProfileRef.revision,
  );

const phaseInstructions = (
  phase: AssetPhase,
  bundle: ExerciseAssetSpecificationBundle,
): readonly string[] =>
  phase === 'start'
    ? bundle.biomechanics.movement.start
    : bundle.biomechanics.movement.finish;

const negativeConstraints = (
  bundle: ExerciseAssetSpecificationBundle,
): readonly string[] => [
  ...bundle.biomechanics.movement.prohibited,
  ...bundle.machine.prohibited,
  ...bundle.attachment.prohibited,
];

const buildSections = (
  request: PromptBuildRequest,
  bundle: ExerciseAssetSpecificationBundle,
  modelProfile: ModelProfile,
  outfit: MaleOutfitProfile,
): readonly PromptSection[] => {
  const geometry = bundle.machine.functionalGeometry;
  const grip = bundle.biomechanics.grip;
  const upper = bundle.biomechanics.upperBody;
  const lower = bundle.biomechanics.lowerBody;
  const startReference = request.approvedStartReference;
  const instructions: Record<PromptSectionId, readonly string[]> = {
    'identity-lock': [
      `Use the approved ${modelProfile.name} supplied as an external reference at generation time.`,
      `Do not invent or alter ${modelProfile.identityLocks.join(', ')}.`,
      'The Male Master reference grounds character identity only; use the selected outfit profile for clothing.',
    ],
    'exercise-variant': [
      bundle.variant.name,
      `Family: ${bundle.variant.familyId}.`,
      `Visual mode: ${request.visualMode}.`,
      `Primary muscle metadata: ${bundle.muscleMapping.primary.join(', ')}.`,
      `Secondary muscle metadata: ${bundle.muscleMapping.secondary.join(', ')}.`,
      'Do not add grip-superiority or regional-lat activation claims.',
    ],
    equipment: [
      `Concrete equipment belongs only to production profile ${bundle.productionProfile.id}@${bundle.productionProfile.revision}; it is not canonical catalog identity.`,
      bundle.machine.name,
      geometry.frame,
      geometry.pulley,
      geometry.cablePath,
      geometry.resistance,
      geometry.seat,
      geometry.thighRestraint,
      geometry.movementClearance,
      'This functional specification is not an approved canonical visual reference until Equipment Geometry QA passes.',
    ],
    attachment: [
      bundle.attachment.name,
      `${bundle.attachment.rigidity}; ${bundle.attachment.symmetry}.`,
      `${bundle.attachment.cableEyelet} cable eyelet.`,
      bundle.attachment.gripSurfaces,
      bundle.attachment.gripSpacing,
      bundle.attachment.handClearance,
      bundle.attachment.dimensions,
    ],
    grip: [
      'palms face each other',
      grip.handPlacement,
      grip.fingerContact,
      grip.thumbPosition,
      grip.wristAlignment,
      grip.symmetry,
    ],
    'body-setup': [
      upper.torsoInclination,
      upper.spinePosition,
      upper.headAndNeck,
      lower.pelvis,
      lower.knees,
      lower.feet,
      bundle.biomechanics.equipment.thighRestraint,
    ],
    'phase-pose': [
      `Phase: ${request.phase.toUpperCase()}.`,
      `Structured biomechanics: endpoint ${bundle.biomechanics.constraints.endpoint}; chest contact ${bundle.biomechanics.constraints.chestContact}; elbow path ${bundle.biomechanics.constraints.elbowPath}; torso ${bundle.biomechanics.constraints.torsoMotion}; scapulae ${bundle.biomechanics.constraints.scapularMotion}; attachment orientation ${bundle.biomechanics.constraints.attachmentOrientation}.`,
      ...phaseInstructions(request.phase, bundle),
      ...bundle.biomechanics.movement.trajectory,
      `Valid ${request.phase.toUpperCase()} ROM: ${bundle.biomechanics.movement.validRom[request.phase]}.`,
      upper.elbowPath,
      upper.shoulderPosition,
      upper.scapularBehavior,
    ],
    'camera-framing': [...bundle.visual.camera, ...bundle.visual.framing],
    'rendering-style': [
      ...bundle.visual.rendering,
      `Use approved outfit profile ${outfit.id}@${outfit.revision}.`,
      outfit.top,
      outfit.bottoms,
      ...(outfit.socks === null ? [] : [outfit.socks]),
      outfit.footwear,
      'The final canvas and export contract remains unresolved and must not be invented here.',
    ],
    'pair-consistency': [
      ...(request.phase === 'finish' && startReference
        ? [
            `Use approved START asset ${startReference.assetId}@${startReference.assetRevision} with content hash ${startReference.contentHash} as the visual consistency reference.`,
          ]
        : [
            'START must be approved before a production FINISH package is built.',
          ]),
      ...bundle.visual.pairLocks,
      `Keep outfit profile ${outfit.id}@${outfit.revision} identical in START and FINISH: same top, shorts, socks, and footwear; only natural pose-caused clothing folds may change.`,
      `Only these phase changes are allowed: ${bundle.visual.allowedPhaseChanges.join('; ')}.`,
    ],
    'external-references': [
      `Required unresolved model reference: ${modelProfile.externalReference.logicalId}.`,
      'Prompt construction does not imply that the external binary reference exists or that image generation is ready.',
    ],
    'negative-constraints': negativeConstraints(bundle),
  };

  return PROMPT_SECTION_ORDER.map((id) => ({
    id,
    instructions: instructions[id].map(normalizeCanonicalText),
  }));
};

export const buildExercisePromptPackage = (
  request: PromptBuildRequest,
  bundle: ExerciseAssetSpecificationBundle,
): PromptBuildResult => {
  const issues: ValidationIssue[] = [];
  if (
    request.phase === 'start' &&
    request.approvedStartReference !== undefined
  ) {
    issues.push(
      validationIssue(
        'start-dependency-forbidden',
        'request.approvedStartReference',
        'An approved START dependency is valid only for FINISH.',
      ),
    );
  }
  const specificationValidation =
    validateExerciseAssetSpecificationBundle(bundle);
  if (!specificationValidation.ok) {
    issues.push(...specificationValidation.issues);
  }

  if (request.variantId !== 'lat-pulldown-close-neutral-v-handle') {
    issues.push(
      validationIssue(
        'unsupported-variant',
        'request.variantId',
        'An exact approved production variant is required.',
      ),
    );
  }
  if (!['start', 'finish'].includes(request.phase)) {
    issues.push(
      validationIssue(
        'unsupported-phase',
        'request.phase',
        'Only START and FINISH are supported.',
      ),
    );
  }
  if (request.visualMode !== 'technique') {
    issues.push(
      validationIssue(
        'unsupported-visual-mode',
        'request.visualMode',
        'Only the approved Technique View is implemented.',
      ),
    );
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const modelProfile = modelProfileFor(request, bundle);
  const outfit = selectedMaleOutfit(bundle);
  if (
    !outfit ||
    outfit.approvalStatus !== 'approved' ||
    outfit.model !== request.model
  ) {
    issues.push(
      validationIssue(
        'invalid-outfit-profile',
        'productionProfile.outfitProfileRef',
        'The selected approved outfit must match the requested model.',
      ),
    );
  }
  if (!modelProfile) {
    issues.push(
      validationIssue(
        'missing-model-profile',
        'request.model',
        'An approved model profile is required.',
      ),
    );
  }

  const expectedProvenance =
    modelProfile && outfit && outfit.model === request.model
      ? specificationProvenance(bundle, modelProfile)
      : undefined;
  if (request.phase === 'finish') {
    const start = request.approvedStartReference;
    if (!start) {
      issues.push(
        validationIssue(
          'approved-start-required',
          'request.approvedStartReference',
          'FINISH requires an approved START reference.',
        ),
      );
    } else if (
      !validApprovedReference(start) ||
      start.identity.familyId !== bundle.variant.familyId ||
      start.identity.variantId !== request.variantId ||
      start.identity.phase !== 'start' ||
      start.identity.model !== request.model ||
      start.identity.visualMode !== request.visualMode ||
      !expectedProvenance ||
      isProvenanceStale(start.provenance, expectedProvenance)
    ) {
      issues.push(
        validationIssue(
          'incompatible-start-reference',
          'request.approvedStartReference',
          'FINISH requires a compatible approved START with current provenance.',
        ),
      );
    }
  }

  if (issues.length > 0 || !modelProfile || !outfit || !expectedProvenance) {
    return { ok: false, issues };
  }

  const sections = buildSections(request, bundle, modelProfile, outfit);
  const basePackage: Omit<PromptPackage, 'canonicalRepresentation' | 'hash'> = {
    format: { ...PROMPT_PACKAGE_FORMAT_REFERENCE },
    builder: { ...PROMPT_BUILDER_REFERENCE },
    identity: {
      familyId: bundle.variant.familyId,
      variantId: bundle.variant.id,
      phase: request.phase,
      model: request.model,
      visualMode: request.visualMode,
    },
    provenance: expectedProvenance,
    requiredExternalReferences: [
      {
        kind: 'model-master',
        logicalId: modelProfile.externalReference.logicalId,
        requiredForGeneration: true,
        resolved: false,
      },
    ],
    ...(request.approvedStartReference
      ? {
          approvedStartReference: structuredClone(
            request.approvedStartReference,
          ),
        }
      : {}),
    sections,
    negativeConstraints: negativeConstraints(bundle).map(
      normalizeCanonicalText,
    ),
    renderedPrompt: renderPromptSections(sections),
  };
  const canonical = canonicalPromptRepresentation(basePackage);
  return {
    ok: true,
    package: {
      ...basePackage,
      canonicalRepresentation: canonical,
      hash: hashCanonicalPromptRepresentation(canonical),
    },
  };
};
