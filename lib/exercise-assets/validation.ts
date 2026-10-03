import { muscleTaxonomy } from '../exercise-taxonomy';
import { isValidExerciseVariantCatalog } from '../exercise-variant-model';
import { getCatalogVariant } from '../exercise-catalog-adapter';
import type {
  ExerciseAssetSpecificationBundle,
  ValidationIssue,
  ValidationResult,
} from './types';

const issue = (
  code: string,
  path: string,
  message: string,
): ValidationIssue => ({ code, path, message });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasItems = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value) && value.length > 0;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const nonEmptyStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => nonEmptyString(item));

const valueAt = (root: unknown, path: readonly string[]): unknown =>
  path.reduce<unknown>(
    (current, key) => (isRecord(current) ? current[key] : undefined),
    root,
  );

const requiredStringPaths = [
  'productionProfile.id',
  'productionProfile.revision',
  'productionProfile.approvalStatus',
  'productionProfile.scope',
  'productionProfile.variantId',
  'productionProfile.machineRef.id',
  'productionProfile.machineRef.revision',
  'productionProfile.attachmentRef.id',
  'productionProfile.attachmentRef.revision',
  'productionProfile.modelProfileRef.id',
  'productionProfile.modelProfileRef.revision',
  'biomechanics.source.id',
  'biomechanics.source.revision',
  'variantRef.id',
  'variantRef.revision',
  'variantRef.approvalStatus',
  'variant.id',
  'variant.familyId',
  'variant.name',
  'variant.equipmentType',
  'variant.configuration',
  'variant.attachmentType.id',
  'variant.grip.id',
  'variant.gripWidth',
  'machine.id',
  'machine.revision',
  'machine.approvalStatus',
  'machine.name',
  'machine.functionalGeometry.frame',
  'machine.functionalGeometry.pulley',
  'machine.functionalGeometry.cablePath',
  'machine.functionalGeometry.resistance',
  'machine.functionalGeometry.seat',
  'machine.functionalGeometry.thighRestraint',
  'machine.functionalGeometry.movementClearance',
  'machine.visualReferenceStatus',
  'attachment.id',
  'attachment.revision',
  'attachment.approvalStatus',
  'attachment.name',
  'attachment.rigidity',
  'attachment.symmetry',
  'attachment.cableEyelet',
  'attachment.gripSurfaces',
  'attachment.gripSpacing',
  'attachment.handClearance',
  'attachment.dimensions',
  'biomechanics.id',
  'biomechanics.revision',
  'biomechanics.approvalStatus',
  'biomechanics.variantId',
  'biomechanics.machineRef.id',
  'biomechanics.machineRef.revision',
  'biomechanics.attachmentRef.id',
  'biomechanics.attachmentRef.revision',
  'biomechanics.equipment.machineArchetype',
  'biomechanics.equipment.pulleyPosition',
  'biomechanics.equipment.cablePath',
  'biomechanics.equipment.seat',
  'biomechanics.equipment.thighRestraint',
  'biomechanics.grip.orientation',
  'biomechanics.grip.width',
  'biomechanics.grip.handPlacement',
  'biomechanics.grip.fingerContact',
  'biomechanics.grip.thumbPosition',
  'biomechanics.grip.wristAlignment',
  'biomechanics.grip.symmetry',
  'biomechanics.upperBody.elbowPath',
  'biomechanics.upperBody.shoulderPosition',
  'biomechanics.upperBody.scapularBehavior',
  'biomechanics.upperBody.torsoInclination',
  'biomechanics.upperBody.spinePosition',
  'biomechanics.upperBody.headAndNeck',
  'biomechanics.lowerBody.pelvis',
  'biomechanics.lowerBody.knees',
  'biomechanics.lowerBody.feet',
  'biomechanics.movement.validRom.start',
  'biomechanics.movement.validRom.finish',
  'visual.id',
  'visual.revision',
  'visual.approvalStatus',
  'visual.variantId',
  'visual.modelProfileRef.id',
  'visual.modelProfileRef.revision',
  'visual.visualMode',
  'visual.canvasContract',
  'muscleMapping.id',
  'muscleMapping.revision',
  'muscleMapping.approvalStatus',
  'muscleMapping.variantId',
  'muscleMapping.visualMode',
] as const;

const requiredStringArrayPaths = [
  'variant.muscles.primary',
  'variant.muscles.secondary',
  'machine.prohibited',
  'attachment.prohibited',
  'biomechanics.movement.start',
  'biomechanics.movement.trajectory',
  'biomechanics.movement.finish',
  'biomechanics.movement.prohibited',
  'biomechanics.muscles.primary',
  'biomechanics.muscles.secondary',
  'visual.rendering',
  'visual.camera',
  'visual.framing',
  'visual.clothingLock',
  'visual.pairLocks',
  'visual.allowedPhaseChanges',
  'muscleMapping.primary',
  'muscleMapping.secondary',
] as const;

const sameItems = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const sameRef = (
  left: { id: string; revision: string },
  right: { id: string; revision: string },
): boolean => left.id === right.id && left.revision === right.revision;

const canonicalVariantMatches = (
  variant: ExerciseAssetSpecificationBundle['variant'],
): boolean => {
  const canonical = getCatalogVariant(variant.id);
  if (!canonical) return false;
  const fields = [
    'id',
    'familyId',
    'name',
    'configuration',
    'equipmentType',
    'movementPattern',
    'gripWidth',
    'machineArchetype',
    'laterality',
  ] as const;
  const qualifiers = [
    'attachmentType',
    'grip',
    'bodyPosition',
    'support',
  ] as const;
  return (
    fields.every((key) => variant[key] === canonical[key]) &&
    qualifiers.every(
      (key) =>
        variant[key]?.id === canonical[key]?.id &&
        variant[key]?.kind === canonical[key]?.kind,
    ) &&
    sameItems(
      variant.muscles?.primary ?? [],
      canonical.muscles?.primary ?? [],
    ) &&
    sameItems(
      variant.muscles?.secondary ?? [],
      canonical.muscles?.secondary ?? [],
    )
  );
};

export const validateExerciseAssetSpecificationBundle = (
  value: unknown,
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) {
    return {
      ok: false,
      issues: [
        issue('invalid-bundle', '$', 'Specification bundle is required.'),
      ],
    };
  }

  if (!isRecord(valueAt(value, ['attachment']))) {
    issues.push(
      issue('missing-attachment', 'attachment', 'Attachment is required.'),
    );
  }
  if (!isRecord(valueAt(value, ['machine']))) {
    issues.push(issue('missing-machine', 'machine', 'Machine is required.'));
  }
  if (!isRecord(valueAt(value, ['biomechanics', 'grip']))) {
    issues.push(
      issue('missing-grip', 'biomechanics.grip', 'Grip is required.'),
    );
  }
  for (const phase of ['start', 'finish']) {
    if (
      !nonEmptyStringArray(valueAt(value, ['biomechanics', 'movement', phase]))
    ) {
      issues.push(
        issue(
          'missing-phase',
          `biomechanics.movement.${phase}`,
          `${phase.toUpperCase()} is required.`,
        ),
      );
    }
  }

  for (const path of requiredStringPaths) {
    if (!nonEmptyString(valueAt(value, path.split('.')))) {
      issues.push(
        issue(
          'missing-required-specification',
          path,
          'A non-empty specification value is required.',
        ),
      );
    }
  }
  for (const path of requiredStringArrayPaths) {
    if (!nonEmptyStringArray(valueAt(value, path.split('.')))) {
      issues.push(
        issue(
          'missing-required-specification',
          path,
          'A non-empty specification list is required.',
        ),
      );
    }
  }
  const modelProfiles = valueAt(value, ['modelProfiles']);
  if (!Array.isArray(modelProfiles) || modelProfiles.length === 0) {
    issues.push(
      issue(
        'missing-required-specification',
        'modelProfiles',
        'At least one model profile is required.',
      ),
    );
  } else {
    for (const [index, profile] of modelProfiles.entries()) {
      for (const path of [
        'id',
        'revision',
        'approvalStatus',
        'model',
        'name',
        'identitySource',
        'externalReference.logicalId',
        'clothing.top',
        'clothing.bottoms',
        'clothing.footwear',
      ]) {
        if (!nonEmptyString(valueAt(profile, path.split('.')))) {
          issues.push(
            issue(
              'missing-required-specification',
              `modelProfiles.${index}.${path}`,
              'A non-empty model-profile value is required.',
            ),
          );
        }
      }
      if (!nonEmptyStringArray(valueAt(profile, ['identityLocks']))) {
        issues.push(
          issue(
            'missing-required-specification',
            `modelProfiles.${index}.identityLocks`,
            'Model identity locks are required.',
          ),
        );
      }
    }
  }
  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const bundle = value as unknown as ExerciseAssetSpecificationBundle;
  if (!bundle.attachment) {
    issues.push(
      issue('missing-attachment', 'attachment', 'Attachment is required.'),
    );
  }
  if (!bundle.machine) {
    issues.push(issue('missing-machine', 'machine', 'Machine is required.'));
  }
  if (!bundle.biomechanics?.grip) {
    issues.push(
      issue('missing-grip', 'biomechanics.grip', 'Grip is required.'),
    );
  }
  if (
    bundle.biomechanics?.grip &&
    (bundle.biomechanics.grip.orientation !== 'neutral' ||
      bundle.biomechanics.grip.width !== 'close-attachment-defined')
  ) {
    issues.push(
      issue(
        'conflicting-biomechanics',
        'biomechanics.grip',
        'The approved exact variant requires a close neutral grip.',
      ),
    );
  }
  if (!hasItems(bundle.biomechanics?.movement?.start)) {
    issues.push(
      issue(
        'missing-phase',
        'biomechanics.movement.start',
        'START is required.',
      ),
    );
  }
  if (!hasItems(bundle.biomechanics?.movement?.finish)) {
    issues.push(
      issue(
        'missing-phase',
        'biomechanics.movement.finish',
        'FINISH is required.',
      ),
    );
  }
  const constraints = bundle.biomechanics.constraints;
  if (
    !constraints ||
    constraints.endpoint !== 'upper-chest-upper-sternum' ||
    constraints.chestContact !== 'optional' ||
    constraints.elbowPath !== 'close-no-material-posterior-travel' ||
    constraints.torsoMotion !== 'controlled-no-excessive-recline' ||
    constraints.scapularMotion !== 'natural-coordinated' ||
    constraints.attachmentOrientation !== 'unchanged-between-phases'
  ) {
    issues.push(
      issue(
        'conflicting-biomechanics',
        'biomechanics.constraints',
        'Structured constraints must preserve canonical close-neutral biomechanics.',
      ),
    );
  }

  if (
    bundle.variant &&
    !isValidExerciseVariantCatalog(
      [{ id: 'lat-pulldown', name: 'Lat Pulldown' }],
      [bundle.variant],
    )
  ) {
    issues.push(
      issue('invalid-variant', 'variant', 'Exact exercise variant is invalid.'),
    );
  }

  if (
    bundle.variant?.id !== 'lat-pulldown-close-neutral-v-handle' ||
    bundle.variant?.configuration !== 'specific'
  ) {
    issues.push(
      issue(
        'unsupported-variant',
        'variant.id',
        'Only the approved exact vertical slice is supported.',
      ),
    );
  }

  if (
    bundle.variantRef?.id !== 'lat-pulldown-close-neutral-v-handle' ||
    bundle.variant?.familyId !== 'lat-pulldown' ||
    bundle.variant?.equipmentType !== 'cable' ||
    !canonicalVariantMatches(bundle.variant) ||
    bundle.productionProfile.scope !== 'first-slice-production-only' ||
    bundle.productionProfile.variantId !== bundle.variant.id ||
    !sameRef(bundle.productionProfile.machineRef, bundle.machine) ||
    !sameRef(bundle.productionProfile.attachmentRef, bundle.attachment) ||
    !sameRef(
      bundle.productionProfile.modelProfileRef,
      bundle.visual.modelProfileRef,
    ) ||
    bundle.biomechanics.source.id !== 'cresum-lat-pulldown-biomechanics' ||
    bundle.machine?.id !== 'cresum-seated-high-pulley-lat-pulldown-machine' ||
    bundle.machine?.canonicalVisualReference !== null ||
    bundle.machine?.visualReferenceStatus !==
      'requires-equipment-geometry-qa' ||
    bundle.attachment?.id !== 'cresum-close-neutral-v-handle' ||
    bundle.biomechanics?.variantId !== 'lat-pulldown-close-neutral-v-handle' ||
    bundle.visual?.variantId !== 'lat-pulldown-close-neutral-v-handle' ||
    bundle.visual?.visualMode !== 'technique' ||
    bundle.visual?.canvasContract !== 'unresolved' ||
    bundle.muscleMapping?.variantId !== 'lat-pulldown-close-neutral-v-handle' ||
    bundle.muscleMapping?.visualMode !== 'technique'
  ) {
    issues.push(
      issue(
        'exact-variant-specification-mismatch',
        'variant',
        'All specifications must reference the approved exact vertical slice.',
      ),
    );
  }

  const primary = bundle.biomechanics?.muscles?.primary ?? [];
  const secondary = bundle.biomechanics?.muscles?.secondary ?? [];
  const mappedPrimary = bundle.muscleMapping?.primary ?? [];
  const mappedSecondary = bundle.muscleMapping?.secondary ?? [];
  const variantMuscles = bundle.variant?.muscles;
  const knownMuscles = new Set<string>(muscleTaxonomy.map(({ id }) => id));
  const validMapping = (
    candidatePrimary: readonly string[],
    candidateSecondary: readonly string[],
  ) =>
    candidatePrimary.length > 0 &&
    new Set(candidatePrimary).size === candidatePrimary.length &&
    new Set(candidateSecondary).size === candidateSecondary.length &&
    [...candidatePrimary, ...candidateSecondary].every((muscle) =>
      knownMuscles.has(muscle),
    ) &&
    !candidatePrimary.some((muscle) => candidateSecondary.includes(muscle));
  if (
    !validMapping(primary, secondary) ||
    !validMapping(mappedPrimary, mappedSecondary) ||
    !sameItems(primary, mappedPrimary) ||
    !sameItems(secondary, mappedSecondary) ||
    !variantMuscles ||
    !sameItems(primary, variantMuscles.primary) ||
    !sameItems(secondary, variantMuscles.secondary)
  ) {
    issues.push(
      issue(
        'invalid-muscle-mapping',
        'biomechanics.muscles',
        'Muscle mapping must use unique existing taxonomy IDs without overlap.',
      ),
    );
  }

  if (
    bundle.biomechanics &&
    bundle.machine &&
    (!bundle.biomechanics.machineRef ||
      !sameRef(bundle.biomechanics.machineRef, bundle.machine))
  ) {
    issues.push(
      issue(
        'machine-reference-mismatch',
        'biomechanics.machineRef',
        'Biomechanics must reference the supplied machine revision.',
      ),
    );
  }
  if (
    bundle.biomechanics &&
    bundle.attachment &&
    (!bundle.biomechanics.attachmentRef ||
      !sameRef(bundle.biomechanics.attachmentRef, bundle.attachment))
  ) {
    issues.push(
      issue(
        'attachment-reference-mismatch',
        'biomechanics.attachmentRef',
        'Biomechanics must reference the supplied attachment revision.',
      ),
    );
  }

  const modelProfileRef = bundle.visual?.modelProfileRef;
  const modelProfile = modelProfileRef
    ? bundle.modelProfiles?.find(({ id }) => id === modelProfileRef.id)
    : undefined;
  if (
    !modelProfileRef ||
    !modelProfile ||
    !sameRef(modelProfileRef, modelProfile)
  ) {
    issues.push(
      issue(
        'missing-model-profile',
        'visual.modelProfileRef',
        'Visual specification requires an approved model profile.',
      ),
    );
  }
  for (const [index, profile] of bundle.modelProfiles.entries()) {
    if (
      profile.approvalStatus !== 'approved' ||
      profile.identitySource !== 'external-master-reference' ||
      profile.externalReference.requiredForGeneration !== true ||
      profile.externalReference.asset !== null
    ) {
      issues.push(
        issue(
          'unapproved-specification',
          `modelProfiles.${index}`,
          'Every model profile must be approved and keep its logical external reference unresolved.',
        ),
      );
    }
  }

  for (const [path, entity] of [
    ['productionProfile', bundle.productionProfile],
    ['variantRef', bundle.variantRef],
    ['machine', bundle.machine],
    ['attachment', bundle.attachment],
    ['biomechanics', bundle.biomechanics],
    ['visual', bundle.visual],
    ['muscleMapping', bundle.muscleMapping],
  ] as const) {
    if (!entity || entity.approvalStatus !== 'approved') {
      issues.push(
        issue(
          'unapproved-specification',
          path,
          'Every production specification must be approved.',
        ),
      );
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
};
