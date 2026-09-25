import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { TemplateEditor } from './TemplateEditor';
import type { OnboardingState, OnboardingStep } from '@/lib/onboarding';
import type { TemplateMutationResult } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

type Props = {
  state: OnboardingState;
  editing?: boolean;
  busy: boolean;
  onChange: (next: OnboardingState) => void;
  onComplete: (next: OnboardingState) => Promise<void>;
  onCreateWorkout: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  onExit?: () => void;
};

export function Onboarding({
  state: initial,
  editing = false,
  busy,
  onChange,
  onComplete,
  onCreateWorkout,
  onExit,
}: Props) {
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const change = (next: OnboardingState) => {
    setState(next);
    onChange(next);
  };
  const go = (step: OnboardingStep) => change({ ...state, step });
  const complete = async () => {
    setSaving(true);
    setError('');
    try {
      await onComplete({ ...state, status: 'completed', step: 'complete' });
    } catch {
      setError('Could not save onboarding. Try again. Your workouts are safe.');
    } finally {
      setSaving(false);
    }
  };
  const option = (
    title: string,
    field: 'goal' | 'experience' | 'environment',
    value: NonNullable<OnboardingState['answers'][typeof field]>,
    next: OnboardingStep,
  ) => (
    <AppButton
      key={value}
      title={title}
      accessibilityLabel={title}
      selected={state.answers[field] === value}
      secondary={state.answers[field] !== value}
      onPress={() =>
        change({
          ...state,
          step: next,
          answers: { ...state.answers, [field]: value },
        })
      }
    />
  );
  const field = (label: string, name: 'age' | 'heightCm' | 'bodyWeightKg') => (
    <View style={s.field} key={name}>
      <Text style={s.label}>{label} · optional</Text>
      <TextInput
        accessibilityLabel={label}
        value={state.answers[name] ?? ''}
        onChangeText={(value) => {
          setError('');
          change({
            ...state,
            answers: { ...state.answers, [name]: value },
          });
        }}
        keyboardType="decimal-pad"
        placeholder="Not provided"
        placeholderTextColor={colors.textTertiary}
        style={s.input}
        maxLength={32}
      />
    </View>
  );
  const back: Partial<Record<OnboardingStep, OnboardingStep>> = {
    goal: 'welcome',
    experience: 'goal',
    environment: 'experience',
    profile: 'environment',
    complete: 'profile',
    self_setup: 'welcome',
  };
  const continueFromProfile = () => {
    const { age, heightCm, bodyWeightKg } = state.answers;
    if (
      age?.trim() &&
      (!/^\d+$/.test(age.trim()) || Number(age) < 1 || Number(age) > 120)
    ) {
      setError('Enter a valid age, or leave it empty.');
      return;
    }
    for (const [value, label, max] of [
      [heightCm, 'height', 300],
      [bodyWeightKg, 'body weight', 1000],
    ] as const) {
      if (!value?.trim()) continue;
      const normalized = value.trim().replace(',', '.');
      const number = Number(normalized);
      if (
        !/^\d+(?:\.\d+)?$/.test(normalized) ||
        !Number.isFinite(number) ||
        number <= 0 ||
        number > max
      ) {
        setError(`Enter a valid ${label}, or leave it empty.`);
        return;
      }
    }
    setError('');
    go('complete');
  };
  const step = state.step;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.root}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <Text style={s.brand}>CRESUM</Text>
        {step === 'self_setup' ? (
          <>
            <Text style={s.title} accessibilityRole="header">
              Your first workout
            </Text>
            <Text style={s.sub}>
              Create a workout you can start and edit later. Planned values are
              not completed sets.
            </Text>
            <TemplateEditor
              mode="create"
              busy={busy}
              onSave={onCreateWorkout}
              onCancel={() => go('welcome')}
            />
          </>
        ) : (
          <GlassCard style={s.card}>
            {step === 'welcome' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  Welcome to CRESUM
                </Text>
                <Text style={s.sub}>Choose how you want to begin.</Text>
                <View style={s.choice}>
                  <AppButton
                    title="Personalize my training"
                    accessibilityLabel="Personalize my training"
                    onPress={() => go('goal')}
                  />
                  <Text style={s.support}>CRESUM will help me get started</Text>
                </View>
                <View style={s.choice}>
                  <AppButton
                    title="Set up workouts myself"
                    accessibilityLabel="Set up workouts myself"
                    secondary
                    onPress={() => go('self_setup')}
                  />
                  <Text style={s.support}>Skip personalization for now</Text>
                </View>
              </>
            ) : null}
            {step === 'goal' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  Training goal
                </Text>
                <Text style={s.sub}>What would you like to focus on?</Text>
                {option('Build muscle', 'goal', 'build_muscle', 'experience')}
                {option('Get stronger', 'goal', 'get_stronger', 'experience')}
                {option(
                  'General fitness',
                  'goal',
                  'general_fitness',
                  'experience',
                )}
                {state.answers.goal ? (
                  <AppButton title="Next" onPress={() => go('experience')} />
                ) : null}
              </>
            ) : null}
            {step === 'experience' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  Training experience
                </Text>
                <Text style={s.sub}>Choose the closest fit.</Text>
                {option('Beginner', 'experience', 'beginner', 'environment')}
                {option('Some experience', 'experience', 'some', 'environment')}
                {option(
                  'Experienced',
                  'experience',
                  'experienced',
                  'environment',
                )}
                {state.answers.experience ? (
                  <AppButton title="Next" onPress={() => go('environment')} />
                ) : null}
              </>
            ) : null}
            {step === 'environment' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  Training environment
                </Text>
                <Text style={s.sub}>Where do you usually train?</Text>
                {option('Gym', 'environment', 'gym', 'profile')}
                {option('Home', 'environment', 'home', 'profile')}
                {option('Both', 'environment', 'both', 'profile')}
                {state.answers.environment ? (
                  <AppButton title="Next" onPress={() => go('profile')} />
                ) : null}
              </>
            ) : null}
            {step === 'profile' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  Body details
                </Text>
                <Text style={s.sub}>
                  Optional details for your profile. They do not determine a
                  working weight.
                </Text>
                {field('Age', 'age')}
                {field('Height (cm)', 'heightCm')}
                {field('Body weight (kg)', 'bodyWeightKg')}
                <AppButton
                  title={
                    state.answers.age ||
                    state.answers.heightCm ||
                    state.answers.bodyWeightKg
                      ? 'Continue'
                      : 'Continue without body details'
                  }
                  onPress={continueFromProfile}
                />
              </>
            ) : null}
            {step === 'complete' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  You’re ready to start
                </Text>
                <Text style={s.sub}>
                  Continue to save your preferences and open CRESUM. No workout
                  has been generated for you.
                </Text>
                <AppButton
                  title="Go to Home"
                  disabled={saving || busy}
                  onPress={() => void complete()}
                />
              </>
            ) : null}
            {error ? (
              <Text style={s.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            {back[step] ? (
              <AppButton
                title="Back"
                secondary
                onPress={() => go(back[step]!)}
              />
            ) : null}
            {editing && onExit ? (
              <AppButton title="Back to Profile" secondary onPress={onExit} />
            ) : null}
          </GlassCard>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  brand: { ...typography.caption, color: colors.primary },
  card: { gap: spacing.md },
  title: { ...typography.title1, color: colors.textPrimary },
  sub: { ...typography.body, color: colors.textSecondary },
  support: { ...typography.footnote, color: colors.textSecondary },
  choice: { gap: spacing.xs },
  field: { gap: spacing.xs },
  label: { ...typography.subheadline, color: colors.textPrimary },
  input: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
  },
  error: { ...typography.footnote, color: colors.danger },
});
