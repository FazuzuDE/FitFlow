import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from '../onboarding-repository';

// Existing screen tests exercise post-onboarding tabs, so seed that state explicitly.
export const completeOnboardingForTest = () =>
  AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: {},
    }),
  );
