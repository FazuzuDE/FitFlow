import { defaultTemplates } from './workout-catalog';

export const HIDDEN_BUILT_INS_KEY = 'cresum_hidden_builtins_v1';
const builtInIds = new Set(defaultTemplates.map((template) => template.id));

type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};

export class HiddenBuiltInsRepository {
  constructor(private readonly storage: Storage) {}
  async load(): Promise<string[]> {
    const raw = await this.storage.getItem(HIDDEN_BUILT_INS_KEY);
    if (!raw) return [];
    try {
      const value: unknown = JSON.parse(raw);
      if (
        !value ||
        typeof value !== 'object' ||
        !('version' in value) ||
        value.version !== 1 ||
        !('ids' in value) ||
        !Array.isArray(value.ids)
      )
        return [];
      return [
        ...new Set(
          value.ids.filter(
            (id): id is string => typeof id === 'string' && builtInIds.has(id),
          ),
        ),
      ];
    } catch {
      return [];
    }
  }
  async save(ids: string[]): Promise<void> {
    const unique = [...new Set(ids.filter((id) => builtInIds.has(id)))];
    await this.storage.setItem(
      HIDDEN_BUILT_INS_KEY,
      JSON.stringify({ version: 1, ids: unique }),
    );
  }
}
