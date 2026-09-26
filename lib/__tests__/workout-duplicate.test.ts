import { defaultTemplates } from '../workout-catalog';
import { duplicateTemplate } from '../workout-templates';
import { WorkoutRepository } from '../workout-repository';
import { WorkoutStore } from '../workout-store';

it('duplicates a built-in into an independent editable custom template', () => {
  const original = defaultTemplates[0];
  const duplicated = duplicateTemplate(
    defaultTemplates,
    original.id,
    () => 'copy-1',
  );
  expect(duplicated.template.id).toBe('copy-1');
  expect(duplicated.template.name).toBe(`${original.name} Copy`);
  expect(duplicated.template.exerciseIds).toEqual(original.exerciseIds);
  expect(duplicated.template.exerciseIds).not.toBe(original.exerciseIds);
  expect(defaultTemplates[0]).toEqual(original);
});

it('duplicates an existing custom template with stale references without rewriting them', () => {
  const stale = {
    id: 'old-custom',
    name: 'Old day',
    exerciseIds: ['removed-exercise'],
  };
  const duplicated = duplicateTemplate(
    [...defaultTemplates, stale],
    stale.id,
    () => 'copy-2',
  );
  expect(duplicated.template).toEqual({
    id: 'copy-2',
    name: 'Old day Copy',
    exerciseIds: ['removed-exercise'],
  });
  expect(stale.exerciseIds).toEqual(['removed-exercise']);
});

it('commits a duplicated built-in without changing the canonical template', async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const store = new WorkoutStore(new WorkoutRepository(storage));
  await store.load();
  const result = await store.duplicateTemplate(
    defaultTemplates[0].id,
    () => 'new-copy',
  );
  expect(result).toMatchObject({ ok: true, template: { id: 'new-copy' } });
  expect(store.getSnapshot().data.templates[0]).toEqual(defaultTemplates[0]);
  const reopened = new WorkoutStore(new WorkoutRepository(storage));
  await reopened.load();
  expect(
    reopened
      .getSnapshot()
      .data.templates.some((item) => item.id === 'new-copy'),
  ).toBe(true);
});
