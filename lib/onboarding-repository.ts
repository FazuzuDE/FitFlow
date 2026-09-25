import {
  initialOnboardingState,
  type OnboardingState,
  parseOnboardingState,
} from './onboarding';

export const ONBOARDING_KEY = 'cresum_onboarding_v1';

type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};

export class OnboardingRepository {
  constructor(private readonly storage: Storage) {}

  async load(): Promise<OnboardingState> {
    const raw = await this.storage.getItem(ONBOARDING_KEY);
    if (raw === null) return initialOnboardingState;
    try {
      return parseOnboardingState(JSON.parse(raw));
    } catch {
      throw new Error(
        'Saved onboarding is unavailable. Your workouts are safe.',
      );
    }
  }

  async save(state: OnboardingState): Promise<void> {
    const validated = parseOnboardingState(state);
    await this.storage.setItem(ONBOARDING_KEY, JSON.stringify(validated));
  }
}
