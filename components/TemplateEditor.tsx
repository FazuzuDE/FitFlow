import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';
import { ExerciseLibrary } from './ExerciseLibrary';
import { GlassCard } from './GlassCard';
import { findExercise } from '@/lib/exercise-library';
import type { WorkoutTemplate } from '@/lib/workout-model';
import type { TemplateMutationResult } from '@/lib/workout-store';
import {
  createTemplateDraft,
  moveDraftExercise,
  removeDraftExercise,
  TemplateDraft,
  toggleDraftExercise,
  validateTemplateDraft,
} from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

type TemplateEditorProps = {
  mode: 'create' | 'edit';
  template?: WorkoutTemplate;
  busy: boolean;
  onSave: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  onCancel: () => void;
};

export function TemplateEditor({
  mode,
  template,
  busy,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const [draft, setDraft] = useState(() => createTemplateDraft(template));
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const unavailable = useMemo(
    () => new Set(draft.exerciseIds.filter((id) => !findExercise(id))),
    [draft.exerciseIds],
  );
  const disabled = busy || saving;

  const save = async () => {
    const validation = validateTemplateDraft(draft);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setSaving(true);
    setError('');
    const result = await onSave(validation.draft);
    if (!result.ok) setError(result.error);
    setSaving(false);
  };

  return (
    <>
      <ExerciseLibrary
        visible={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        selectedIds={draft.exerciseIds.filter((id) => !unavailable.has(id))}
        onToggle={(id) => {
          setDraft((current) => toggleDraftExercise(current, id));
          setError('');
        }}
      />
      <GlassCard style={s.card}>
        <Text style={s.title}>
          {mode === 'create'
            ? 'Create workout template'
            : 'Edit workout template'}
        </Text>
        <TextInput
          accessibilityLabel="Template name"
          value={draft.name}
          onChangeText={(name) => {
            setDraft((current) => ({ ...current, name }));
            setError('');
          }}
          editable={!disabled}
          placeholder="Template name"
          placeholderTextColor={colors.textTertiary}
          style={s.input}
        />

        <View style={s.sectionHeader}>
          <View style={s.sectionCopy}>
            <Text style={s.heading}>Exercises</Text>
            <Text style={s.secondary}>
              {draft.exerciseIds.length
                ? `${draft.exerciseIds.length} selected`
                : 'No exercises selected.'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose exercises"
            disabled={disabled}
            onPress={() => setLibraryOpen(true)}
            style={({ pressed }) => [
              s.choose,
              (pressed || disabled) && s.dimmed,
            ]}
          >
            <Text style={s.chooseText}>Choose</Text>
          </Pressable>
        </View>

        {draft.exerciseIds.map((id, index) => {
          const exercise = findExercise(id);
          const label = exercise?.name ?? `Unavailable exercise ${id}`;
          return (
            <View key={`${id}-${index}`} style={s.exerciseRow}>
              <View style={s.exerciseCopy}>
                <Text style={s.exerciseName} numberOfLines={2}>
                  {exercise?.name ?? 'Unavailable exercise'}
                </Text>
                {exercise ? null : <Text style={s.warning}>{id}</Text>}
              </View>
              <View style={s.actions}>
                <IconAction
                  label={`Move ${label} up`}
                  icon="arrow-up"
                  disabled={disabled || index === 0}
                  onPress={() =>
                    setDraft((current) => moveDraftExercise(current, index, -1))
                  }
                />
                <IconAction
                  label={`Move ${label} down`}
                  icon="arrow-down"
                  disabled={disabled || index === draft.exerciseIds.length - 1}
                  onPress={() =>
                    setDraft((current) => moveDraftExercise(current, index, 1))
                  }
                />
                <IconAction
                  label={`Remove ${label.toLocaleLowerCase().startsWith('unavailable') ? label.toLocaleLowerCase() : label}`}
                  icon="close"
                  danger
                  disabled={disabled}
                  onPress={() => {
                    setDraft((current) => removeDraftExercise(current, index));
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
          title={saving ? 'Saving…' : 'Save Template'}
          disabled={disabled}
          onPress={() => {
            void save();
          }}
        />
        <AppButton
          title="Cancel"
          secondary
          disabled={disabled}
          onPress={onCancel}
        />
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
  icon: 'arrow-up' | 'arrow-down' | 'close';
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
  heading: { ...typography.headline, color: colors.textPrimary },
  secondary: { ...typography.footnote, color: colors.textSecondary },
  warning: { ...typography.caption, color: colors.danger },
  error: { ...typography.footnote, color: colors.danger },
  input: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionCopy: { flex: 1 },
  choose: {
    minWidth: 72,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  chooseText: { ...typography.subheadline, color: colors.primary },
  exerciseRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseName: { ...typography.subheadline, color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: spacing.xxs },
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
