import { defaultTemplates } from '../workout-catalog';
import type { WorkoutTemplate } from '../workout-model';
import { startWorkout } from '../workout-engine';
import {
  KeyValueStorage,
  STATE_KEY,
  WorkoutRepository,
} from '../workout-repository';
import { WorkoutStore } from '../workout-store';
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

function memoryStorage(): KeyValueStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
  };
}

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

  it('reserves built-in ids even when a persisted template list omits them', () => {
    const idFactory = jest
      .fn<ReturnType<() => string>, Parameters<() => string>>()
      .mockReturnValueOnce('upper')
      .mockReturnValueOnce('custom-safe');

    expect(
      createTemplate([], { name: 'Safe', exerciseIds: ['bench'] }, idFactory)
        .template.id,
    ).toBe('custom-safe');
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

  it('rejects ambiguous mutations when persisted template ids are duplicated', () => {
    const duplicates = [
      custom,
      { ...custom, name: 'Second record with the same ID' },
    ];

    expect(() =>
      updateTemplate(duplicates, custom.id, {
        name: 'Changed',
        exerciseIds: ['barbell-back-squat'],
      }),
    ).toThrow('Duplicate template IDs cannot be changed safely.');
    expect(() => deleteTemplate(duplicates, custom.id)).toThrow(
      'Duplicate template IDs cannot be deleted safely.',
    );
    expect(duplicates).toEqual([
      custom,
      { ...custom, name: 'Second record with the same ID' },
    ]);
  });
});

describe('workout template store mutations', () => {
  it('creates, updates, deletes, and reloads a custom template durably', async () => {
    const storage = memoryStorage();
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();

    const created = await store.createTemplate(
      { name: ' New day ', exerciseIds: ['bench', 'row'] },
      () => 'custom-new',
    );
    expect(created).toEqual({
      ok: true,
      template: {
        id: 'custom-new',
        name: 'New day',
        exerciseIds: ['barbell-bench-press', 'seated-cable-row'],
      },
    });

    const updated = await store.updateTemplate('custom-new', {
      name: 'Pull first',
      exerciseIds: ['row', 'bench'],
    });
    expect(updated).toEqual({ ok: true });

    let restored = await new WorkoutRepository(storage).load();
    expect(restored.templates.at(-1)).toEqual({
      id: 'custom-new',
      name: 'Pull first',
      exerciseIds: ['seated-cable-row', 'barbell-bench-press'],
    });

    expect(await store.deleteTemplate('custom-new')).toEqual({ ok: true });
    restored = await new WorkoutRepository(storage).load();
    expect(restored.templates).toEqual(defaultTemplates);
  });

  it('rejects built-in mutations without writing', async () => {
    const storage = memoryStorage();
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    jest.mocked(storage.setItem).mockClear();

    expect(
      await store.updateTemplate('upper', {
        name: 'Changed',
        exerciseIds: ['barbell-bench-press'],
      }),
    ).toEqual({ ok: false, error: 'Built-in templates cannot be changed.' });
    expect(await store.deleteTemplate('upper')).toEqual({
      ok: false,
      error: 'Built-in templates cannot be deleted.',
    });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rejects a second mutation while busy and preserves its draft opportunity', async () => {
    const storage = memoryStorage();
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    let release!: () => void;
    jest.mocked(storage.setItem).mockImplementationOnce(async (key, value) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      storage.values.set(key, value);
    });

    const first = store.createTemplate(
      { name: 'First', exerciseIds: ['bench'] },
      () => 'first',
    );
    await Promise.resolve();

    expect(
      await store.createTemplate(
        { name: 'Second', exerciseIds: ['row'] },
        () => 'second',
      ),
    ).toEqual({
      ok: false,
      error: 'Template changes are already being saved. Try again shortly.',
    });
    release();
    expect(await first).toEqual({
      ok: true,
      template: expect.objectContaining({ id: 'first' }),
    });
    expect(
      store.getSnapshot().data.templates.map((item) => item.id),
    ).not.toContain('second');
  });

  it('keeps the previous state and returns failure when persistence fails', async () => {
    const storage = memoryStorage();
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    const before = store.getSnapshot().data;
    jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('disk full'));

    const result = await store.createTemplate(
      { name: 'Unsaved', exerciseIds: ['bench'] },
      () => 'unsaved',
    );

    expect(result).toEqual({
      ok: false,
      error: 'Template changes could not be saved. Try again.',
    });
    expect(store.getSnapshot().data).toBe(before);
    expect(store.getSnapshot().error).toContain('could not be saved');
    expect(JSON.parse(storage.values.get(STATE_KEY)!).templates).toEqual(
      defaultTemplates,
    );
  });

  it('does not change active or historical workout snapshots during edit and delete', async () => {
    const storage = memoryStorage();
    const repository = new WorkoutRepository(storage);
    const activeWorkout = startWorkout(custom, [], 1000, () => 'active-id');
    const historicalWorkout = {
      ...activeWorkout,
      id: 'history-id',
      finishedAt: 2000,
    };
    await repository.save({
      schemaVersion: 1,
      activeWorkout,
      history: [historicalWorkout],
      templates: [...defaultTemplates, custom],
    });
    const store = new WorkoutStore(repository);
    await store.load();

    expect(
      await store.updateTemplate(custom.id, {
        name: 'Changed',
        exerciseIds: ['barbell-back-squat'],
      }),
    ).toEqual({ ok: true });
    expect(await store.deleteTemplate(custom.id)).toEqual({ ok: true });

    expect(store.getSnapshot().data.activeWorkout).toEqual(activeWorkout);
    expect(store.getSnapshot().data.history).toEqual([historicalWorkout]);
  });
});
