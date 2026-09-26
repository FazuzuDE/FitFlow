import type { WorkoutState } from './workout-model';
import { isBuiltInTemplate } from './workout-templates';

export type OnboardingStep =
  | 'welcome'
  | 'goal'
  | 'experience'
  | 'environment'
  | 'profile'
  | 'complete'
  | 'self_setup';
export type TrainingGoal = 'build_muscle' | 'get_stronger' | 'general_fitness';
export type TrainingExperience = 'beginner' | 'some' | 'experienced';
export type TrainingEnvironment = 'gym' | 'home' | 'both';
export type OnboardingAnswers = {
  goal?: TrainingGoal;
  experience?: TrainingExperience;
  environment?: TrainingEnvironment;
  age?: string;
  heightCm?: string;
  bodyWeightKg?: string;
};
export type OnboardingState = {
  version: 1;
  status: 'in_progress' | 'completed';
  step: OnboardingStep;
  answers: OnboardingAnswers;
};

export const initialOnboardingState: OnboardingState = {
  version: 1,
  status: 'in_progress',
  step: 'welcome',
  answers: {},
};

export const hasMeaningfulWorkoutData = (state: WorkoutState): boolean =>
  state.activeWorkout !== null ||
  state.history.length > 0 ||
  state.templates.some((template) => !isBuiltInTemplate(template.id));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const oneOf = <T extends string>(
  value: unknown,
  options: readonly T[],
): value is T => options.includes(value as T);

export function parseOnboardingState(value: unknown): OnboardingState {
  const invalid = () =>
    new Error('Saved onboarding is unavailable. Your workouts are safe.');
  if (!isObject(value) || value.version !== 1 || !isObject(value.answers))
    throw invalid();
  if (!oneOf(value.status, ['in_progress', 'completed'])) throw invalid();
  if (
    !oneOf(value.step, [
      'welcome',
      'goal',
      'experience',
      'environment',
      'profile',
      'complete',
      'self_setup',
    ])
  )
    throw invalid();
  const answers = value.answers;
  if (
    (answers.goal !== undefined &&
      !oneOf(answers.goal, [
        'build_muscle',
        'get_stronger',
        'general_fitness',
      ])) ||
    (answers.experience !== undefined &&
      !oneOf(answers.experience, ['beginner', 'some', 'experienced'])) ||
    (answers.environment !== undefined &&
      !oneOf(answers.environment, ['gym', 'home', 'both'])) ||
    ['age', 'heightCm', 'bodyWeightKg'].some(
      (field) =>
        answers[field] !== undefined &&
        (typeof answers[field] !== 'string' ||
          (answers[field] as string).length > 32),
    )
  )
    throw invalid();
  return {
    version: 1,
    status: value.status,
    step: value.step,
    answers: {
      ...(answers.goal === undefined ? {} : { goal: answers.goal }),
      ...(answers.experience === undefined
        ? {}
        : { experience: answers.experience }),
      ...(answers.environment === undefined
        ? {}
        : { environment: answers.environment }),
      ...(answers.age === undefined ? {} : { age: answers.age as string }),
      ...(answers.heightCm === undefined
        ? {}
        : { heightCm: answers.heightCm as string }),
      ...(answers.bodyWeightKg === undefined
        ? {}
        : { bodyWeightKg: answers.bodyWeightKg as string }),
    },
  };
}
