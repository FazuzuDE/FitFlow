import { defaultTemplates } from './workout-catalog';
import { canonicalExerciseId, findExercise } from './exercise-library';
import type { WorkoutTemplate } from './workout-model';

export type TemplateDraft = Pick<WorkoutTemplate, 'name' | 'exerciseIds'>;

export type TemplateValidation =
  { ok: true; draft: TemplateDraft } | { ok: false; error: string };

export type CreatedTemplate = {
  template: WorkoutTemplate;
  templates: WorkoutTemplate[];
};

export type TemplateIdFactory = () => string;

const builtInIds = new Set(defaultTemplates.map((template) => template.id));

const defaultTemplateIdFactory: TemplateIdFactory = () =>
  `template-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeExerciseId = (id: string): string =>
  canonicalExerciseId(id) ?? id;

export const isBuiltInTemplate = (id: string): boolean => builtInIds.has(id);

export const createTemplateDraft = (
  template?: WorkoutTemplate,
): TemplateDraft => ({
  name: template?.name ?? 'My Workout',
  exerciseIds: (template?.exerciseIds ?? []).map(normalizeExerciseId),
});

export const staleExerciseIds = (draft: TemplateDraft): string[] =>
  draft.exerciseIds.filter((id) => !findExercise(id));

export const validateTemplateDraft = (
  draft: TemplateDraft,
): TemplateValidation => {
  const name = draft.name.trim();
  if (!name) return { ok: false, error: 'Enter a template name.' };
  if (!draft.exerciseIds.length)
    return { ok: false, error: 'Choose at least one exercise.' };

  const exerciseIds = draft.exerciseIds.map(normalizeExerciseId);
  if (new Set(exerciseIds).size !== exerciseIds.length)
    return {
      ok: false,
      error: 'Remove duplicate exercises before saving.',
    };
  if (exerciseIds.some((id) => !findExercise(id)))
    return {
      ok: false,
      error: 'Remove or replace unavailable exercises before saving.',
    };

  return { ok: true, draft: { name, exerciseIds } };
};

export const toggleDraftExercise = (
  draft: TemplateDraft,
  exerciseId: string,
): TemplateDraft => {
  const canonicalId = normalizeExerciseId(exerciseId);
  const selected = draft.exerciseIds.some(
    (id) => normalizeExerciseId(id) === canonicalId,
  );
  return {
    ...draft,
    exerciseIds: selected
      ? draft.exerciseIds.filter(
          (id) => normalizeExerciseId(id) !== canonicalId,
        )
      : [...draft.exerciseIds, canonicalId],
  };
};

export const moveDraftExercise = (
  draft: TemplateDraft,
  index: number,
  offset: -1 | 1,
): TemplateDraft => {
  const target = index + offset;
  if (index < 0 || index >= draft.exerciseIds.length) return draft;
  if (target < 0 || target >= draft.exerciseIds.length) return draft;
  const exerciseIds = [...draft.exerciseIds];
  [exerciseIds[index], exerciseIds[target]] = [
    exerciseIds[target],
    exerciseIds[index],
  ];
  return { ...draft, exerciseIds };
};

export const removeDraftExercise = (
  draft: TemplateDraft,
  index: number,
): TemplateDraft => {
  if (index < 0 || index >= draft.exerciseIds.length) return draft;
  return {
    ...draft,
    exerciseIds: draft.exerciseIds.filter(
      (_exerciseId, exerciseIndex) => exerciseIndex !== index,
    ),
  };
};

const validDraft = (draft: TemplateDraft): TemplateDraft => {
  const validation = validateTemplateDraft(draft);
  if (!validation.ok) throw new Error(validation.error);
  return validation.draft;
};

const uniqueTemplateId = (
  templates: readonly WorkoutTemplate[],
  idFactory: TemplateIdFactory,
): string => {
  const existingIds = new Set(templates.map((template) => template.id));
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = idFactory().trim();
    if (id && !existingIds.has(id)) return id;
  }
  throw new Error('Could not create a unique template ID.');
};

export const createTemplate = (
  templates: readonly WorkoutTemplate[],
  draft: TemplateDraft,
  idFactory: TemplateIdFactory = defaultTemplateIdFactory,
): CreatedTemplate => {
  const normalized = validDraft(draft);
  const template = {
    id: uniqueTemplateId(templates, idFactory),
    ...normalized,
  };
  return { template, templates: [...templates, template] };
};

export const updateTemplate = (
  templates: readonly WorkoutTemplate[],
  templateId: string,
  draft: TemplateDraft,
): WorkoutTemplate[] => {
  if (isBuiltInTemplate(templateId))
    throw new Error('Built-in templates cannot be changed.');
  if (!templates.some((template) => template.id === templateId))
    throw new Error('Template not found.');
  const normalized = validDraft(draft);
  return templates.map((template) =>
    template.id === templateId ? { id: template.id, ...normalized } : template,
  );
};

export const deleteTemplate = (
  templates: readonly WorkoutTemplate[],
  templateId: string,
): WorkoutTemplate[] => {
  if (isBuiltInTemplate(templateId))
    throw new Error('Built-in templates cannot be deleted.');
  if (!templates.some((template) => template.id === templateId))
    throw new Error('Template not found.');
  return templates.filter((template) => template.id !== templateId);
};
