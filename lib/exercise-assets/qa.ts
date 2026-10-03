import { isProvenanceStale } from './provenance';
import type {
  ApprovalGateResult,
  AssetQaReview,
  AssetTrackerRecord,
  QaCheckDefinition,
  SpecificationProvenance,
} from './types';
import type { AssetPhase } from '../exercise-variant-model';

export const QA_CHECKLIST_REFERENCE = {
  id: 'cresum-exercise-asset-qa-checklist',
  revision: '1',
} as const;

export const EXERCISE_ASSET_QA_CHECKS = [
  {
    id: 'biomechanics.exact-variant',
    category: 'biomechanics',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'The asset depicts only Lat Pulldown — Close Neutral V-Handle on the approved seated high-pulley setup.',
  },
  {
    id: 'biomechanics.start-position',
    category: 'biomechanics',
    severity: 'critical',
    appliesTo: ['start'],
    requirement:
      'START has a taut cable, overhead narrow arm path, near-full non-hyperextended elbows, and stable support.',
  },
  {
    id: 'biomechanics.finish-endpoint',
    category: 'biomechanics',
    severity: 'critical',
    appliesTo: ['finish'],
    requirement:
      'FINISH places the handle near the upper-chest or sternal region; contact is optional and the handle is not pulled lower.',
  },
  {
    id: 'biomechanics.finish-elbow-path',
    category: 'biomechanics',
    severity: 'critical',
    appliesTo: ['finish'],
    requirement:
      'FINISH elbows are beside or slightly anterior to the torso and do not travel materially behind it.',
  },
  {
    id: 'biomechanics.natural-scapular-motion',
    category: 'biomechanics',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'Scapular position is naturally coordinated with the phase, without forced depression, maximal pinching, exaggerated shrug, or winging.',
  },
  {
    id: 'biomechanics.torso-spine-support',
    category: 'biomechanics',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'The slight rearward torso inclination, neutral controlled spine, supported pelvis, restrained thighs, symmetric knees, and supported feet match the specification.',
  },
  {
    id: 'grip.neutral-orientation',
    category: 'grip',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'The close bilateral grip is neutral with palms facing each other; it is not pronated, supinated, wide, open, or asymmetric.',
  },
  {
    id: 'grip.fingers-thumbs-wrists',
    category: 'grip',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'Each complete hand wraps one grip with all fingers in contact, thumb opposite the fingers, and wrist aligned neutrally with the forearm.',
  },
  {
    id: 'equipment.machine-geometry',
    category: 'equipment',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'The generic machine has a plausible stable frame, centered high pulley, selectorized resistance, centered seat, adjustable symmetric thigh restraint, and adequate movement clearance.',
  },
  {
    id: 'equipment.attachment-geometry',
    category: 'equipment',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'The rigid symmetric V-handle has one central eyelet, two parallel or near-parallel neutral grips, realistic qualitative proportions, and full hand and thumb clearance.',
  },
  {
    id: 'equipment.cable-path',
    category: 'equipment',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'The cable is taut, physically connected from the centered high pulley to the attachment eyelet, and does not intersect the body or frame.',
  },
  {
    id: 'visual.no-anatomy-overlay',
    category: 'visual',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'Technique View contains no anatomy overlay or muscle highlighting.',
  },
  {
    id: 'visual.camera-framing',
    category: 'visual',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'The front-left three-quarter instructional view shows the full subject, functional equipment, hands, wrists, and elbow paths without prohibited cropping or distortion.',
  },
  {
    id: 'visual.rendering-language',
    category: 'visual',
    severity: 'advisory',
    appliesTo: ['both'],
    requirement:
      'The image follows the approved premium semi-realistic 3D, white-background, neutral-lighting rendering language.',
  },
  {
    id: 'pair.identity-and-clothing-lock',
    category: 'pair',
    severity: 'critical',
    appliesTo: ['pair'],
    requirement:
      'FINISH preserves the approved START model identity, proportions, fitted black T-shirt, black shorts, and black athletic shoes.',
  },
  {
    id: 'pair.machine-camera-rendering-lock',
    category: 'pair',
    severity: 'critical',
    appliesTo: ['pair'],
    requirement:
      'FINISH preserves START machine, attachment, settings, grip, torso inclination, camera, framing, lighting, background, and rendering language.',
  },
  {
    id: 'pair.only-approved-phase-changes',
    category: 'pair',
    severity: 'critical',
    appliesTo: ['pair'],
    requirement:
      'Only the phase-dependent pose, scapular position, handle and cable geometry, top-plate position, clothing folds, and contact shadows allowed by the Visual Specification change.',
  },
  {
    id: 'provenance.matches-prompt-package',
    category: 'provenance',
    severity: 'critical',
    appliesTo: ['both'],
    requirement:
      'The reviewed asset is tied to the exact prompt-package hash and recorded specification revisions.',
  },
] as const satisfies readonly QaCheckDefinition[];

export const requiredQaChecksFor = (
  phase: AssetPhase,
): readonly QaCheckDefinition[] =>
  EXERCISE_ASSET_QA_CHECKS.filter(({ appliesTo }) =>
    appliesTo.some(
      (applicability) =>
        applicability === 'both' ||
        applicability === phase ||
        (phase === 'finish' && applicability === 'pair'),
    ),
  );

export const evaluateAssetApproval = ({
  record,
  review,
  currentProvenance,
}: {
  record: AssetTrackerRecord;
  review: AssetQaReview;
  currentProvenance: SpecificationProvenance;
}): ApprovalGateResult => {
  const reasons: string[] = [];
  const generatedCandidate = record.generationHistory.at(-1);
  if (review.qaChecklistRevision !== QA_CHECKLIST_REFERENCE.revision) {
    reasons.push(
      `QA checklist revision must be ${QA_CHECKLIST_REFERENCE.revision}.`,
    );
  }
  if (
    review.trackerId !== record.trackerId ||
    review.recordRevision !== record.recordRevision ||
    review.promptPackageHash !== record.promptPackage.hash
  ) {
    reasons.push('QA review does not match the tracked Prompt Package.');
  }
  if (
    !generatedCandidate ||
    review.candidate.providerId !== generatedCandidate.providerId ||
    review.candidate.modelId !== generatedCandidate.modelId ||
    review.candidate.providerAssetId !== generatedCandidate.providerAssetId ||
    review.candidate.contentHash !== generatedCandidate.contentHash
  ) {
    reasons.push('QA review does not match the current generated candidate.');
  }
  if (review.phase !== record.identity.phase) {
    reasons.push('QA review phase does not match the Prompt Package phase.');
  }
  if (record.identity.phase === 'finish' && !record.approvedStartReference) {
    reasons.push('FINISH approval requires an approved START reference.');
  }
  if (isProvenanceStale(record.provenance, currentProvenance)) {
    reasons.push('Prompt Package has stale provenance.');
  }

  const resultsById = new Map<string, AssetQaReview['results']>();
  for (const result of review.results) {
    const existing = resultsById.get(result.checkId) ?? [];
    resultsById.set(result.checkId, [...existing, result]);
  }

  for (const check of requiredQaChecksFor(record.identity.phase)) {
    const results = resultsById.get(check.id) ?? [];
    if (results.length === 0) {
      reasons.push(`Missing required QA result: ${check.id}.`);
      continue;
    }
    if (results.length > 1) {
      reasons.push(`Duplicate QA result: ${check.id}.`);
      continue;
    }
    const result = results[0];
    if (result.outcome === 'not-reviewed') {
      reasons.push(`Incomplete QA result: ${check.id}.`);
    } else if (result.outcome === 'fail' && check.severity === 'critical') {
      reasons.push(`Critical QA failure: ${check.id}.`);
    }
  }

  return { approved: reasons.length === 0, reasons };
};
