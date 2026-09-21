import { defaultTemplates } from '../workout-catalog';
import type { WorkoutTemplate } from '../workout-model';
import {
  createTemplate,
  createTemplateDraft,
  deleteTemplate,
  isBuiltInTemplate,
  moveDraftExercise,
  removeDraftExercise,
  staleExerciseIds,
  toggleDraftExercise,
  updateTemplate,
  validateTemplateDraft,
} from '../workout-templates';

const custom: WorkoutTemplate = {
  id: 'custom-one',
  name: 'My Push',
  exerciseIds: ['barbell-bench-press', 'seated-cable-row'],
};

describe('workout template domain', () => {
  it('creates an isolated draft and canonicalizes known legacy ids in order', () => {
    const source: WorkoutTemplate = {
      id: 'legacy-template',
      name: ' Legacy day ',
      exerciseIds: ['row', 'barbell-back-squat', 'bench'],
    };

    const draft = createTemplateDraft(source);

    expect(draft).toEqual({
      name: ' Legacy day ',
      exerciseIds: [
        'seated-cable-row',
        'barbell-back-squat',
        'barbell-bench-press',
      ],
    });
    draft.exerciseIds.pop();
    expect(source.exerciseIds).toHaveLength(3);
  });

  it('keeps stale ids and duplicate aliases visible instead of silently repairing them', () => {
    const draft = createTemplateDraft({
      id: 'questionable',
      name: 'Questionable',
      exerciseIds: ['bench', 'missing-exercise', 'barbell-bench-press'],
    });

    expect(draft.exerciseIds).toEqual([
      'barbell-bench-press',
      'missing-exercise',
      'barbell-bench-press',
    ]);
    expect(staleExerciseIds(draft)).toEqual(['missing-exercise']);
    expect(validateTemplateDraft(draft)).toEqual({
      ok: false,
      error: 'Remove duplicate exercises before saving.',
    });
  });

  it.each([
    [
      { name: '   ', exerciseIds: ['barbell-bench-press'] },
      'Enter a template name.',
    ],
    [{ name: 'Empty', exerciseIds: [] }, 'Choose at least one exercise.'],
    [
      { name: 'Stale', exerciseIds: ['missing-exercise'] },
      'Remove or replace unavailable exercises before saving.',
    ],
  ])('rejects an invalid draft %#', (draft, error) => {
    expect(validateTemplateDraft(draft)).toEqual({ ok: false, error });
  });

  it('trims valid names and preserves ordered canonical exercise ids', () => {
    expect(
      validateTemplateDraft({
        name: '  Upper focus  ',
        exerciseIds: ['bench', 'seated-cable-row'],
      }),
    ).toEqual({
      ok: true,
      draft: {
        name: 'Upper focus',
        exerciseIds: ['barbell-bench-press', 'seated-cable-row'],
      },
    });
  });

  it('toggles without duplicates, reorders, and removes exercises immutably', () => {
    const original = createTemplateDraft(custom);
    const added = toggleDraftExercise(original, 'barbell-back-squat');
    const unchanged = toggleDraftExercise(added, 'squat');
    const moved = moveDraftExercise(unchanged, 1, -1);
    const removed = removeDraftExercise(moved, 1);

    expect(original.exerciseIds).toEqual([
      'barbell-bench-press',
      'seated-cable-row',
    ]);
    expect(added.exerciseIds).toEqual([
      'barbell-bench-press',
      'seated-cable-row',
      'barbell-back-squat',
    ]);
    expect(unchanged.exerciseIds).toEqual([
      'barbell-bench-press',
      'seated-cable-row',
    ]);
    expect(moved.exerciseIds).toEqual([
      'seated-cable-row',
      'barbell-bench-press',
    ]);
    expect(removed.exerciseIds).toEqual(['seated-cable-row']);
  });

  it('creates a template with a collision-safe id and leaves inputs unchanged', () => {
    const templates = [...defaultTemplates, custom];
    const idFactory = jest
      .fn<ReturnType<() => string>, Parameters<() => string>>()
      .mockReturnValueOnce('upper')
      .mockReturnValueOnce('custom-one')
      .mockReturnValueOnce('custom-two');

    const result = createTemplate(
      templates,
      {
        name: '  New day  ',
        exerciseIds: ['bench', 'row'],
      },
      idFactory,
    );

    expect(result.template).toEqual({
      id: 'custom-two',
      name: 'New day',
      exerciseIds: ['barbell-bench-press', 'seated-cable-row'],
    });
    expect(result.templates).toEqual([...templates, result.template]);
    expect(templates).toHaveLength(4);
  });

  it('updates and deletes custom templates without mutating neighboring templates', () => {
    const templates = [...defaultTemplates, custom];
    const updated = updateTemplate(templates, custom.id, {
      name: ' Pull first ',
      exerciseIds: ['row', 'bench'],
    });
    const deleted = deleteTemplate(updated, custom.id);

    expect(updated.at(-1)).toEqual({
      id: custom.id,
      name: 'Pull first',
      exerciseIds: ['seated-cable-row', 'barbell-bench-press'],
    });
    expect(deleted).toEqual(defaultTemplates);
    expect(templates.at(-1)).toEqual(custom);
  });

  it('centralizes built-in identity and rejects built-in mutation', () => {
    expect(isBuiltInTemplate('upper')).toBe(true);
    expect(isBuiltInTemplate(custom.id)).toBe(false);
    expect(() =>
      updateTemplate(defaultTemplates, 'upper', {
        name: 'Changed',
        exerciseIds: ['barbell-bench-press'],
      }),
    ).toThrow('Built-in templates cannot be changed.');
    expect(() => deleteTemplate(defaultTemplates, 'upper')).toThrow(
      'Built-in templates cannot be deleted.',
    );
  });
});
