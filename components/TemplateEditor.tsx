import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';
import { Confirmation } from './Confirmation';
import { ExerciseLibrary } from './ExerciseLibrary';
import { GlassCard } from './GlassCard';
import { canonicalExerciseId, findExercise } from '@/lib/exercise-library';
import {
  normalizePlannedWeight,
  validPlannedSets,
} from '@/lib/planned-exercise';
import type { WorkoutTemplate } from '@/lib/workout-model';
import type { TemplateMutationResult } from '@/lib/workout-store';
import {
  createTemplateDraft,
  moveDraftExercise,
  removeDraftExercise,
  TemplateDraft,
  validateTemplateDraft,
} from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

type Props = {
  mode: 'create' | 'edit';
  template?: WorkoutTemplate;
  busy: boolean;
  onSave: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  onCancel: () => void;
};
type Step = 'name' | 'library' | 'configure' | 'composition';
type Configuration = {
  exerciseId: string;
  sets: string;
  weight: string;
  editing: boolean;
};

export function TemplateEditor({
  mode,
  template,
  busy,
  onSave,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState(() => createTemplateDraft(template));
  const [step, setStep] = useState<Step>(
    mode === 'create' ? 'name' : 'composition',
  );
  const [configuration, setConfiguration] = useState<Configuration>();
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');
  const disabled = busy || saving;
  const changed =
    JSON.stringify(draft) !== JSON.stringify(createTemplateDraft(template)) ||
    (configuration !== undefined &&
      (configuration.sets !== '3' || configuration.weight.trim() !== ''));

  const nextFromName = () => {
    if (!draft.name.trim()) {
      setError('Enter a workout name.');
      return;
    }
    setError('');
    setStep(draft.exerciseIds.length ? 'composition' : 'library');
  };
  const selectExercise = (exerciseId: string) => {
    const id = canonicalExerciseId(exerciseId) ?? exerciseId;
    if (draft.exerciseIds.includes(id)) {
      setError('This exercise is already in this workout.');
      return;
    }
    setConfiguration((current) =>
      current?.exerciseId === id && !current.editing
        ? current
        : { exerciseId: id, sets: '3', weight: '', editing: false },
    );
    setError('');
    setStep('configure');
  };
  const editExercise = (exerciseId: string) => {
    const planned = draft.plannedExercises?.find(
      (item) => item.exerciseId === exerciseId,
    );
    setConfiguration((current) =>
      current?.exerciseId === exerciseId && current.editing
        ? current
        : {
            exerciseId,
            sets: String(planned?.sets ?? 3),
            weight: planned?.weight ?? '',
            editing: true,
          },
    );
    setError('');
    setStep('configure');
  };
  const applyConfiguration = () => {
    if (!configuration) return;
    const sets = Number(configuration.sets.trim());
    if (!/^\d+$/.test(configuration.sets.trim()) || !validPlannedSets(sets)) {
      setError('Enter 1–20 planned sets.');
      return;
    }
    const weight = configuration.weight.trim();
    const normalizedWeight = weight
      ? normalizePlannedWeight(weight)
      : undefined;
    if (weight && normalizedWeight === null) {
      setError('Enter a valid non-negative weight.');
      return;
    }
    setDraft((current) => ({
      ...current,
      exerciseIds: configuration.editing
        ? current.exerciseIds
        : [...current.exerciseIds, configuration.exerciseId],
      plannedExercises: [
        ...(current.plannedExercises ?? []).filter(
          (item) => item.exerciseId !== configuration.exerciseId,
        ),
        {
          exerciseId: configuration.exerciseId,
          sets,
          ...(normalizedWeight ? { weight: normalizedWeight } : {}),
        },
      ],
    }));
    setConfiguration(undefined);
    setError('');
    setStep('composition');
  };
  const goBack = () => {
    setError('');
    if (step === 'configure')
      setStep(configuration?.editing ? 'composition' : 'library');
    else if (step === 'library')
      setStep(draft.exerciseIds.length ? 'composition' : 'name');
    else if (step === 'composition') setStep('name');
  };
  const save = async () => {
    const validation = validateTemplateDraft(draft);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await onSave(validation.draft);
      if (!result.ok) setError(result.error);
    } catch {
      setError('Workout could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Confirmation
        visible={confirmCancel}
        title="Discard workout changes?"
        message="Your unsaved workout changes will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        onConfirm={onCancel}
        onCancel={() => setConfirmCancel(false)}
      />
      <ExerciseLibrary
        visible={step === 'library'}
        onClose={goBack}
        onAdd={(exercise) => selectExercise(exercise.id)}
        selectedIds={draft.exerciseIds}
      />
      <GlassCard style={s.card}>
        <Text style={s.title} accessibilityRole="header">
          {mode === 'create' ? 'Create Workout' : 'Edit Workout'}
        </Text>
        {step === 'name' ? (
          <>
            <Text style={s.heading}>Workout Name</Text>
            <TextInput
              accessibilityLabel="Workout Name"
              value={draft.name}
              onChangeText={(name) => {
                setDraft((current) => ({ ...current, name }));
                setError('');
              }}
              editable={!disabled}
              placeholder="Workout Name"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
              onSubmitEditing={nextFromName}
              style={s.input}
            />
            {error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            ) : null}
            <AppButton
              title="Next"
              disabled={disabled}
              onPress={nextFromName}
            />
          </>
        ) : null}
        {step === 'configure' && configuration ? (
          <>
            <Text style={s.heading}>
              {findExercise(configuration.exerciseId)?.name ??
                'Unavailable exercise'}
            </Text>
            <Text style={s.label}>Planned sets</Text>
            <TextInput
              accessibilityLabel="Planned sets"
              value={configuration.sets}
              onChangeText={(sets) => {
                setConfiguration({ ...configuration, sets });
                setError('');
              }}
              editable={!disabled}
              keyboardType="number-pad"
              style={s.input}
            />
            <Text style={s.label}>Starting weight (kg) · optional</Text>
            <TextInput
              accessibilityLabel="Starting weight in kilograms"
              value={configuration.weight}
              onChangeText={(weight) => {
                setConfiguration({ ...configuration, weight });
                setError('');
              }}
              editable={!disabled}
              keyboardType="decimal-pad"
              placeholder="Unset"
              placeholderTextColor={colors.textTertiary}
              style={s.input}
            />
            <Text style={s.secondary}>
              Planned values can be changed during your workout.
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            ) : null}
            <AppButton
              title={configuration.editing ? 'Update Exercise' : 'Add Exercise'}
              disabled={disabled}
              onPress={applyConfiguration}
            />
          </>
        ) : null}
        {step === 'composition' ? (
          <>
            <Text style={s.heading}>{draft.name.trim()}</Text>
            <Text style={s.secondary}>
              {draft.exerciseIds.length} exercise
              {draft.exerciseIds.length === 1 ? '' : 's'}
            </Text>
            {draft.exerciseIds.map((id, index) => {
              const exercise = findExercise(id);
              const label = exercise?.name ?? `Unavailable exercise ${id}`;
              const planned = draft.plannedExercises?.find(
                (item) => item.exerciseId === id,
              );
              return (
                <View key={`${id}-${index}`} style={s.exerciseRow}>
                  <View style={s.exerciseCopy}>
                    <Text style={s.exerciseName}>
                      {exercise?.name ?? 'Unavailable exercise'}
                    </Text>
                    {exercise ? (
                      <Text style={s.secondary}>
                        {planned?.sets ?? 3} sets ·{' '}
                        {planned?.weight
                          ? `${planned.weight} kg`
                          : 'weight unset'}
                      </Text>
                    ) : (
                      <Text style={s.error}>{id}</Text>
                    )}
                  </View>
                  <View style={s.actions}>
                    {exercise ? (
                      <IconAction
                        label={`Edit ${label}`}
                        icon="create-outline"
                        disabled={disabled}
                        onPress={() => editExercise(id)}
                      />
                    ) : null}
                    <IconAction
                      label={`Move ${label} up`}
                      icon="arrow-up"
                      disabled={disabled || index === 0}
                      onPress={() =>
                        setDraft((current) =>
                          moveDraftExercise(current, index, -1),
                        )
                      }
                    />
                    <IconAction
                      label={`Move ${label} down`}
                      icon="arrow-down"
                      disabled={
                        disabled || index === draft.exerciseIds.length - 1
                      }
                      onPress={() =>
                        setDraft((current) =>
                          moveDraftExercise(current, index, 1),
                        )
                      }
                    />
                    <IconAction
                      label={`Remove ${exercise ? label : label.toLowerCase()}`}
                      icon="close"
                      danger
                      disabled={disabled}
                      onPress={() => {
                        setDraft((current) =>
                          removeDraftExercise(current, index),
                        );
                        setError('');
                      }}
                    />
                  </View>
                </View>
              );
            })}
            {error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            ) : null}
            <AppButton
              title="Add Exercise"
              secondary
              disabled={disabled}
              onPress={() => {
                setError('');
                setStep('library');
              }}
            />
            <AppButton
              title={saving ? 'Saving…' : 'Save Workout'}
              disabled={disabled}
              onPress={() => {
                void save();
              }}
            />
          </>
        ) : null}
        {step === 'configure' || step === 'composition' ? (
          <AppButton
            title="Back"
            secondary
            disabled={disabled}
            onPress={goBack}
          />
        ) : null}
        {step !== 'library' ? (
          <AppButton
            title="Cancel"
            secondary
            disabled={disabled}
            onPress={() => (changed ? setConfirmCancel(true) : onCancel())}
          />
        ) : null}
      </GlassCard>
    </>
  );
}

function IconAction({
  label,
  icon,
  danger = false,
  disabled,
  onPress,
}: {
  label: string;
  icon: 'create-outline' | 'arrow-up' | 'arrow-down' | 'close';
  danger?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.iconAction, (pressed || disabled) && s.dimmed]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={danger ? colors.danger : colors.textSecondary}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { gap: spacing.md },
  title: { ...typography.title3, color: colors.textPrimary },
  heading: {
    ...typography.headline,
    color: colors.textPrimary,
    flexWrap: 'wrap',
  },
  label: { ...typography.subheadline, color: colors.textPrimary },
  secondary: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  input: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
  },
  exerciseRow: {
    minHeight: 60,
    alignItems: 'stretch',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseName: {
    ...typography.subheadline,
    color: colors.textPrimary,
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xxs,
  },
  iconAction: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.5 },
});
