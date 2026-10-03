import type {
  AssetModel,
  AssetPhase,
  ExerciseAssetIdentity,
  ExerciseVariant,
} from '../exercise-variant-model';
import type { MuscleId } from '../exercise-taxonomy';

export type RevisionedReference = {
  id: string;
  revision: string;
};

export type ApprovedRevisionedEntity = RevisionedReference & {
  approvalStatus: 'approved';
};

export type ExerciseVisualMode = 'technique' | 'anatomy';

export type MachineSpecification = ApprovedRevisionedEntity & {
  name: string;
  functionalGeometry: {
    frame: string;
    pulley: string;
    cablePath: string;
    resistance: string;
    seat: string;
    thighRestraint: string;
    movementClearance: string;
  };
  canonicalVisualReference: null;
  visualReferenceStatus: 'requires-equipment-geometry-qa';
  prohibited: readonly string[];
};

export type AttachmentSpecification = ApprovedRevisionedEntity & {
  name: string;
  rigidity: 'rigid';
  symmetry: 'bilateral-symmetric';
  cableEyelet: 'single-central';
  gripSurfaces: 'two-parallel-or-near-parallel-neutral-grips';
  gripSpacing: 'close-attachment-defined';
  handClearance: 'complete-hand-and-thumb-clearance';
  dimensions: 'qualitative-realistic-proportions';
  prohibited: readonly string[];
};

export type ModelProfile = ApprovedRevisionedEntity & {
  model: AssetModel;
  name: string;
  identitySource: 'external-master-reference';
  externalReference: {
    logicalId: string;
    requiredForGeneration: true;
    asset: null;
  };
  identityLocks: readonly string[];
  clothing: {
    top: string;
    bottoms: string;
    footwear: string;
  };
};

export type BiomechanicsSpecification = ApprovedRevisionedEntity & {
  source: RevisionedReference;
  constraints: {
    endpoint: 'upper-chest-upper-sternum';
    chestContact: 'optional';
    elbowPath: 'close-no-material-posterior-travel';
    torsoMotion: 'controlled-no-excessive-recline';
    scapularMotion: 'natural-coordinated';
    attachmentOrientation: 'unchanged-between-phases';
  };
  variantId: string;
  machineRef: RevisionedReference;
  attachmentRef: RevisionedReference;
  equipment: {
    machineArchetype: string;
    pulleyPosition: string;
    cablePath: string;
    seat: string;
    thighRestraint: string;
  };
  grip: {
    orientation: 'neutral';
    width: 'close-attachment-defined';
    handPlacement: string;
    fingerContact: string;
    thumbPosition: string;
    wristAlignment: string;
    symmetry: string;
  };
  upperBody: {
    elbowPath: string;
    shoulderPosition: string;
    scapularBehavior: string;
    torsoInclination: string;
    spinePosition: string;
    headAndNeck: string;
  };
  lowerBody: {
    pelvis: string;
    knees: string;
    feet: string;
  };
  movement: {
    start: readonly string[];
    trajectory: readonly string[];
    finish: readonly string[];
    validRom: {
      start: string;
      finish: string;
    };
    prohibited: readonly string[];
  };
  muscles: {
    primary: readonly MuscleId[];
    secondary: readonly MuscleId[];
  };
};

export type VisualSpecification = ApprovedRevisionedEntity & {
  variantId: string;
  modelProfileRef: RevisionedReference;
  visualMode: 'technique';
  rendering: readonly string[];
  camera: readonly string[];
  framing: readonly string[];
  clothingLock: readonly string[];
  pairLocks: readonly string[];
  allowedPhaseChanges: readonly string[];
  canvasContract: 'unresolved';
};

export type MuscleMappingSpecification = ApprovedRevisionedEntity & {
  variantId: string;
  visualMode: 'technique';
  primary: readonly MuscleId[];
  secondary: readonly MuscleId[];
};

export type ExerciseAssetSpecificationBundle = {
  productionProfile: ApprovedRevisionedEntity & {
    scope: 'first-slice-production-only';
    variantId: string;
    machineRef: RevisionedReference;
    attachmentRef: RevisionedReference;
    modelProfileRef: RevisionedReference;
  };
  variantRef: ApprovedRevisionedEntity;
  variant: ExerciseVariant;
  machine: MachineSpecification;
  attachment: AttachmentSpecification;
  biomechanics: BiomechanicsSpecification;
  visual: VisualSpecification;
  modelProfiles: readonly ModelProfile[];
  muscleMapping: MuscleMappingSpecification;
};

export type SpecificationProvenance = {
  productionProfile: RevisionedReference;
  biomechanicsSource: RevisionedReference;
  variant: RevisionedReference;
  biomechanics: RevisionedReference;
  visual: RevisionedReference;
  machine: RevisionedReference;
  attachment: RevisionedReference;
  modelProfile: RevisionedReference;
  muscleMapping: RevisionedReference;
  promptBuilder: RevisionedReference;
  promptPackageFormat: RevisionedReference;
};

export type ApprovedAssetReference = {
  assetId: string;
  assetRevision: string;
  contentHash: string;
  status: 'approved';
  identity: ExerciseAssetIdentity & { visualMode: ExerciseVisualMode };
  provenance: SpecificationProvenance;
};

export type PromptBuildRequest = {
  variantId: string;
  phase: AssetPhase;
  model: AssetModel;
  visualMode: ExerciseVisualMode;
  approvedStartReference?: ApprovedAssetReference;
};

export type PromptSectionId =
  | 'identity-lock'
  | 'exercise-variant'
  | 'equipment'
  | 'attachment'
  | 'grip'
  | 'body-setup'
  | 'phase-pose'
  | 'camera-framing'
  | 'rendering-style'
  | 'pair-consistency'
  | 'external-references'
  | 'negative-constraints';

export type PromptSection = {
  id: PromptSectionId;
  instructions: readonly string[];
};

export type RequiredExternalReference = {
  kind: 'model-master';
  logicalId: string;
  requiredForGeneration: true;
  resolved: false;
};

export type PromptPackage = {
  format: RevisionedReference;
  builder: RevisionedReference;
  identity: ExerciseAssetIdentity & { visualMode: ExerciseVisualMode };
  provenance: SpecificationProvenance;
  requiredExternalReferences: readonly RequiredExternalReference[];
  approvedStartReference?: ApprovedAssetReference;
  sections: readonly PromptSection[];
  negativeConstraints: readonly string[];
  renderedPrompt: string;
  canonicalRepresentation: string;
  hash: string;
};

export type PromptBuildResult =
  | { ok: true; package: PromptPackage }
  | { ok: false; issues: readonly ValidationIssue[] };

export type ValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export type ValidationResult =
  { ok: true } | { ok: false; issues: readonly ValidationIssue[] };

export type QaCategory =
  'biomechanics' | 'grip' | 'equipment' | 'visual' | 'pair' | 'provenance';

export type QaSeverity = 'critical' | 'advisory';

export type QaApplicability = 'both' | AssetPhase | 'pair';

export type QaCheckDefinition = {
  id: string;
  category: QaCategory;
  severity: QaSeverity;
  appliesTo: readonly QaApplicability[];
  requirement: string;
};

export type QaCheckResult = {
  checkId: string;
  outcome: 'pass' | 'fail' | 'not-reviewed';
  notes?: string;
};

export type AssetQaReview = {
  reviewId: string;
  qaChecklistRevision: string;
  trackerId: string;
  recordRevision: string;
  promptPackageHash: string;
  candidate: GenerationRecord;
  phase: AssetPhase;
  results: QaCheckResult[];
};

export type ApprovalGateResult = {
  approved: boolean;
  reasons: readonly string[];
};

export type AssetProductionStatus =
  'planned' | 'generated-draft' | 'needs-revision' | 'approved';

export type GenerationRecord = {
  providerId: string;
  modelId: string;
  providerAssetId: string;
  contentHash: string;
};

export type AssetTrackerRecord = {
  trackerId: string;
  recordRevision: string;
  identity: ExerciseAssetIdentity & { visualMode: ExerciseVisualMode };
  status: AssetProductionStatus;
  promptPackage: PromptPackage;
  provenance: SpecificationProvenance;
  approvedStartReference?: ApprovedAssetReference;
  generationHistory: readonly GenerationRecord[];
  usedRevisions: readonly string[];
  revisionReasons: readonly string[];
  approvalSnapshot?: {
    reference: ApprovedAssetReference;
    review: AssetQaReview;
    promptPackage: AssetTrackerRecord['promptPackage'];
  };
};

export type AssetTrackerTransition =
  | {
      type: 'record-generation';
      generation: GenerationRecord;
      recordRevision?: string;
    }
  | { type: 'request-revision'; reason: string }
  | {
      type: 'submit-qa';
      review: AssetQaReview;
      currentProvenance: SpecificationProvenance;
    };

export type AssetTrackerTransitionResult =
  { ok: true; record: AssetTrackerRecord } | { ok: false; reason: string };

export type ApprovedAssetReferenceResult =
  | { ok: true; reference: ApprovedAssetReference }
  | { ok: false; reason: string };
