import { createHash } from 'node:crypto';
import type { PromptPackage, PromptSection, PromptSectionId } from './types';

export const PROMPT_SECTION_ORDER = [
  'identity-lock',
  'exercise-variant',
  'equipment',
  'attachment',
  'grip',
  'body-setup',
  'phase-pose',
  'camera-framing',
  'rendering-style',
  'pair-consistency',
  'external-references',
  'negative-constraints',
] as const satisfies readonly PromptSectionId[];

const sectionTitles: Record<PromptSectionId, string> = {
  'identity-lock': 'IDENTITY LOCK',
  'exercise-variant': 'EXACT EXERCISE VARIANT',
  equipment: 'EQUIPMENT',
  attachment: 'ATTACHMENT',
  grip: 'GRIP AND HAND CONTACT',
  'body-setup': 'BODY SETUP',
  'phase-pose': 'PHASE POSE',
  'camera-framing': 'CAMERA AND FRAMING',
  'rendering-style': 'RENDERING STYLE',
  'pair-consistency': 'START AND FINISH CONSISTENCY',
  'external-references': 'REQUIRED EXTERNAL REFERENCES',
  'negative-constraints': 'REJECT',
};

export const renderPromptSections = (
  sections: readonly PromptSection[],
): string =>
  sections
    .map(
      ({ id, instructions }) =>
        `${sectionTitles[id]}\n${instructions.map((value) => `- ${value}`).join('\n')}`,
    )
    .join('\n\n');

export const CANONICAL_PROMPT_ENCODING = 'utf-8' as const;
export const normalizeCanonicalText = (value: string): string =>
  value.replace(/\r\n?/g, '\n').replace(/\n+$/g, '');
export const hashCanonicalPromptRepresentation = (value: string): string =>
  createHash('sha256')
    .update(normalizeCanonicalText(value), CANONICAL_PROMPT_ENCODING)
    .digest('hex');

// Format v2: fixed field ordering, normalized LF, UTF-8; no runtime metadata.
// Shared by the builder and tracker so canonical evidence has one definition.
export const canonicalMetadataLines = (
  value: Pick<PromptPackage, 'format' | 'builder' | 'identity' | 'provenance'>,
): string[] => {
  const { format, builder, identity, provenance: p } = value;
  return [
    'CRESUM_EXERCISE_PROMPT_PACKAGE',
    `package-format=${format.id}@${format.revision}`,
    `prompt-builder=${builder.id}@${builder.revision}`,
    `family=${identity.familyId}`,
    `variant=${identity.variantId}`,
    `phase=${identity.phase}`,
    `model=${identity.model}`,
    `visual-mode=${identity.visualMode}`,
    `spec.variant=${p.variant.id}@${p.variant.revision}`,
    `spec.production-profile=${p.productionProfile.id}@${p.productionProfile.revision}`,
    `spec.biomechanics-source=${p.biomechanicsSource.id}@${p.biomechanicsSource.revision}`,
    `spec.biomechanics=${p.biomechanics.id}@${p.biomechanics.revision}`,
    `spec.visual=${p.visual.id}@${p.visual.revision}`,
    `spec.machine=${p.machine.id}@${p.machine.revision}`,
    `spec.attachment=${p.attachment.id}@${p.attachment.revision}`,
    `spec.model-profile=${p.modelProfile.id}@${p.modelProfile.revision}`,
    `spec.muscle-mapping=${p.muscleMapping.id}@${p.muscleMapping.revision}`,
  ];
};

// Metadata, reference bindings, then ordered sections and ordered instructions.
// This deliberately small format is shared with integrity validation.
export const canonicalPromptRepresentation = (
  value: Omit<PromptPackage, 'canonicalRepresentation' | 'hash'>,
): string => {
  const start = value.approvedStartReference;
  const lines = [
    ...canonicalMetadataLines(value),
    `required-reference=${value.requiredExternalReferences[0].logicalId}|resolved=false`,
    start
      ? `approved-start=${start.assetId}@${start.assetRevision}|${start.contentHash}`
      : 'approved-start=none',
  ];
  for (const section of value.sections) {
    lines.push(`section=${section.id}`);
    for (const instruction of section.instructions) {
      lines.push(
        `instruction=${JSON.stringify(normalizeCanonicalText(instruction))}`,
      );
    }
  }
  return normalizeCanonicalText(lines.join('\n'));
};
