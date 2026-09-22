import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';
import { Confirmation } from './Confirmation';
import { GlassCard } from './GlassCard';
import { TemplateEditor } from './TemplateEditor';
import { successHaptic } from './Workout';
import { findExercise } from '@/lib/exercise-library';
import type { WorkoutTemplate } from '@/lib/workout-model';
import type { TemplateMutationResult } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { isBuiltInTemplate } from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

type EditorState =
  { mode: 'create' } | { mode: 'edit'; templateId: string } | null;

type WorkoutTemplatesProps = {
  templates: WorkoutTemplate[];
  busy: boolean;
  onCreate: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  onUpdate: (
    templateId: string,
    draft: TemplateDraft,
  ) => Promise<TemplateMutationResult>;
  onDelete: (templateId: string) => Promise<TemplateMutationResult>;
};

export function WorkoutTemplates({
  templates,
  busy,
  onCreate,
  onUpdate,
  onDelete,
}: WorkoutTemplatesProps) {
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string>();
  const [deleteError, setDeleteError] = useState('');
  const editTemplate =
    editor?.mode === 'edit'
      ? templates.find((template) => template.id === editor.templateId)
      : undefined;
  const deleteTarget = templates.find(
    (template) => template.id === deleteTargetId,
  );
  const listActionsDisabled = busy || Boolean(editor);

  const save = async (draft: TemplateDraft) => {
    let result: TemplateMutationResult;
    if (editor?.mode === 'edit') {
      result = editTemplate
        ? await onUpdate(editTemplate.id, draft)
        : { ok: false, error: 'Template is no longer available.' };
    } else {
      result = await onCreate(draft);
    }
    if (result.ok) {
      setEditor(null);
      successHaptic();
    }
    return result;
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await onDelete(deleteTarget.id);
    if (result.ok) {
      setDeleteTargetId(undefined);
      setDeleteError('');
      successHaptic();
    } else {
      setDeleteError(result.error);
    }
  };

  return (
    <>
      <Confirmation
        visible={Boolean(deleteTarget)}
        title="Delete template?"
        message={
          deleteTarget
            ? `Delete “${deleteTarget.name}”? Active and completed workouts will stay unchanged.`
            : ''
        }
        confirmLabel="Delete Template"
        cancelLabel="Keep Template"
        busy={busy}
        error={deleteError}
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => {
          if (busy) return;
          setDeleteTargetId(undefined);
          setDeleteError('');
        }}
      />

      {editor ? (
        <TemplateEditor
          key={
            editor.mode === 'edit'
              ? `edit-${editor.templateId}`
              : 'create-template'
          }
          mode={editor.mode}
          template={editTemplate}
          busy={busy}
          onSave={save}
          onCancel={() => setEditor(null)}
        />
      ) : (
        <AppButton
          title="Create Template"
          disabled={busy}
          onPress={() => setEditor({ mode: 'create' })}
        />
      )}

      <GlassCard style={s.card}>
        <Text style={s.title}>Saved templates</Text>
        {templates.length ? (
          templates.map((template, index) => {
            const builtIn = isBuiltInTemplate(template.id);
            const available = template.exerciseIds.filter((id) =>
              findExercise(id),
            ).length;
            const unavailable = template.exerciseIds.length - available;
            return (
              <View key={`${template.id}-${index}`} style={s.row}>
                <View style={s.copy}>
                  <Text style={s.name}>{template.name}</Text>
                  <Text style={s.metadata}>
                    {available} available exercise{available === 1 ? '' : 's'}
                    {unavailable ? ` · ${unavailable} unavailable` : ''}
                    {builtIn ? ' · Built-in' : ''}
                  </Text>
                </View>
                {builtIn ? null : (
                  <View style={s.actions}>
                    <TemplateAction
                      label={`Edit ${template.name}`}
                      icon="create-outline"
                      disabled={listActionsDisabled}
                      onPress={() =>
                        setEditor({ mode: 'edit', templateId: template.id })
                      }
                    />
                    <TemplateAction
                      label={`Delete ${template.name}`}
                      icon="trash-outline"
                      danger
                      disabled={listActionsDisabled}
                      onPress={() => {
                        setDeleteError('');
                        setDeleteTargetId(template.id);
                      }}
                    />
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={s.metadata}>No templates available.</Text>
        )}
      </GlassCard>
    </>
  );
}

function TemplateAction({
  label,
  icon,
  danger = false,
  disabled,
  onPress,
}: {
  label: string;
  icon: 'create-outline' | 'trash-outline';
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
      style={({ pressed }) => [s.action, (pressed || disabled) && s.dimmed]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? colors.danger : colors.primary}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { gap: spacing.xs },
  title: { ...typography.headline, color: colors.textPrimary },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  copy: { flex: 1, minWidth: 0 },
  name: { ...typography.headline, color: colors.textPrimary },
  metadata: { ...typography.footnote, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.xxs },
  action: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.5 },
});
