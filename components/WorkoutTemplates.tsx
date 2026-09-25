import { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  onStart?: (template: WorkoutTemplate) => void;
  onDuplicate?: (templateId: string) => Promise<TemplateMutationResult>;
  onHide?: (templateId: string) => Promise<boolean>;
  hasActiveWorkout?: boolean;
};

export function WorkoutTemplates({
  templates,
  busy,
  onCreate,
  onUpdate,
  onDelete,
  onStart,
  onDuplicate,
  onHide,
  hasActiveWorkout = false,
}: WorkoutTemplatesProps) {
  const [editor, setEditor] = useState<EditorState>(null);
  const [menuTemplateId, setMenuTemplateId] = useState<string>();
  const [menuError, setMenuError] = useState('');
  const [quickOpenId, setQuickOpenId] = useState<string>();
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipeRecognized = useRef(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>();
  const [deleteError, setDeleteError] = useState('');
  const editTemplate =
    editor?.mode === 'edit'
      ? templates.find((template) => template.id === editor.templateId)
      : undefined;
  const deleteTarget = templates.find(
    (template) => template.id === deleteTargetId,
  );
  const menuTemplate = templates.find(
    (template) => template.id === menuTemplateId,
  );
  const listActionsDisabled = busy || Boolean(editor);

  const openMenu = (templateId: string) => {
    if (listActionsDisabled) return;
    setQuickOpenId(undefined);
    setMenuError('');
    setMenuTemplateId(templateId);
  };
  const duplicate = async (templateId: string) => {
    if (!onDuplicate) return;
    const result = await onDuplicate(templateId);
    if (result.ok) {
      setMenuTemplateId(undefined);
      setQuickOpenId(undefined);
      setMenuError('');
      successHaptic();
    } else setMenuError(result.error);
  };
  const hide = async (templateId: string) => {
    if (!onHide) return;
    if (await onHide(templateId)) {
      setMenuTemplateId(undefined);
      setQuickOpenId(undefined);
      setMenuError('');
      successHaptic();
    } else setMenuError('Workout could not be hidden. Try again.');
  };

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
        title="Delete workout?"
        message={
          deleteTarget
            ? `Delete “${deleteTarget.name}”? Active and completed workouts will stay unchanged.`
            : ''
        }
        confirmLabel="Delete Workout"
        cancelLabel="Keep Workout"
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

      <Modal
        visible={Boolean(menuTemplate)}
        presentationStyle="pageSheet"
        onRequestClose={() => setMenuTemplateId(undefined)}
      >
        <SafeAreaView style={s.menuRoot}>
          <ScrollView contentContainerStyle={s.menuContent}>
            <Text style={s.menuTitle} accessibilityRole="header">
              {menuTemplate?.name}
            </Text>
            {menuError ? (
              <Text accessibilityRole="alert" style={s.menuError}>
                {menuError}
              </Text>
            ) : null}
            {menuTemplate ? (
              <>
                <AppButton
                  title={
                    hasActiveWorkout ? 'Resume active workout' : 'Start Workout'
                  }
                  disabled={busy}
                  onPress={() => {
                    setMenuTemplateId(undefined);
                    onStart?.(menuTemplate);
                  }}
                />
                {isBuiltInTemplate(menuTemplate.id) ? (
                  <>
                    <AppButton
                      title="Duplicate / Customize"
                      secondary
                      disabled={busy || !onDuplicate}
                      onPress={() => void duplicate(menuTemplate.id)}
                    />
                    <AppButton
                      title="Hide from My Workouts"
                      secondary
                      disabled={busy || !onHide}
                      onPress={() => void hide(menuTemplate.id)}
                    />
                  </>
                ) : (
                  <>
                    <AppButton
                      title="Edit"
                      secondary
                      disabled={busy}
                      onPress={() => {
                        setMenuTemplateId(undefined);
                        setEditor({
                          mode: 'edit',
                          templateId: menuTemplate.id,
                        });
                      }}
                    />
                    <AppButton
                      title="Duplicate"
                      secondary
                      disabled={busy || !onDuplicate}
                      onPress={() => void duplicate(menuTemplate.id)}
                    />
                    <AppButton
                      title="Delete"
                      destructive
                      disabled={busy}
                      onPress={() => {
                        setMenuTemplateId(undefined);
                        setDeleteError('');
                        setDeleteTargetId(menuTemplate.id);
                      }}
                    />
                  </>
                )}
              </>
            ) : null}
            <AppButton
              title="Close"
              secondary
              onPress={() => setMenuTemplateId(undefined)}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
          title="Create Workout"
          disabled={busy}
          onPress={() => setEditor({ mode: 'create' })}
        />
      )}

      <GlassCard style={s.card}>
        <Text style={s.title}>Saved workouts</Text>
        {templates.length ? (
          templates.map((template, index) => {
            const builtIn = isBuiltInTemplate(template.id);
            const available = template.exerciseIds.filter((id) =>
              findExercise(id),
            ).length;
            const unavailable = template.exerciseIds.length - available;
            return (
              <View
                key={`${template.id}-${index}`}
                testID={`template-swipe-${template.id}`}
                style={s.swipeContainer}
                onTouchStart={(event) => {
                  swipeStart.current = {
                    x: event.nativeEvent.pageX,
                    y: event.nativeEvent.pageY,
                  };
                  swipeRecognized.current = false;
                }}
                onTouchMove={(event) => {
                  const start = swipeStart.current;
                  if (!start) return;
                  const dx = event.nativeEvent.pageX - start.x;
                  const dy = event.nativeEvent.pageY - start.y;
                  if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5)
                    swipeRecognized.current = true;
                }}
                onTouchEnd={(event) => {
                  const start = swipeStart.current;
                  swipeStart.current = null;
                  if (!start) return;
                  const dx = event.nativeEvent.pageX - start.x;
                  const dy = event.nativeEvent.pageY - start.y;
                  if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy) * 1.5)
                    return;
                  swipeRecognized.current = true;
                  if (dx < 0) setQuickOpenId(template.id);
                  else if (quickOpenId === template.id)
                    setQuickOpenId(undefined);
                  setTimeout(() => {
                    swipeRecognized.current = false;
                  }, 0);
                }}
                onTouchCancel={() => {
                  swipeStart.current = null;
                  swipeRecognized.current = false;
                }}
              >
                {quickOpenId === template.id ? (
                  <View style={s.quickActions}>
                    {builtIn ? (
                      <>
                        <TemplateAction
                          label={`Duplicate ${template.name}`}
                          icon="copy-outline"
                          disabled={listActionsDisabled || !onDuplicate}
                          onPress={() => void duplicate(template.id)}
                        />
                        <TemplateAction
                          label={`Hide ${template.name}`}
                          icon="eye-off-outline"
                          disabled={listActionsDisabled || !onHide}
                          onPress={() => void hide(template.id)}
                        />
                      </>
                    ) : (
                      <>
                        <TemplateAction
                          label={`Edit ${template.name}`}
                          icon="create-outline"
                          disabled={listActionsDisabled}
                          onPress={() => {
                            setQuickOpenId(undefined);
                            setEditor({
                              mode: 'edit',
                              templateId: template.id,
                            });
                          }}
                        />
                        <TemplateAction
                          label={`Delete ${template.name}`}
                          icon="trash-outline"
                          danger
                          disabled={listActionsDisabled}
                          onPress={() => {
                            setQuickOpenId(undefined);
                            setDeleteError('');
                            setDeleteTargetId(template.id);
                          }}
                        />
                      </>
                    )}
                  </View>
                ) : null}
                <View style={[s.row, quickOpenId === template.id && s.rowOpen]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${hasActiveWorkout ? 'Resume active workout from' : 'Start'} ${template.name}`}
                    accessibilityHint="Long press for more workout actions"
                    disabled={listActionsDisabled || !onStart}
                    onPress={() => {
                      if (swipeRecognized.current) return;
                      onStart?.(template);
                    }}
                    onLongPress={() => openMenu(template.id)}
                    style={s.copy}
                  >
                    <Text style={s.name}>{template.name}</Text>
                    <Text style={s.metadata}>
                      {available} available exercise{available === 1 ? '' : 's'}
                      {unavailable ? ` · ${unavailable} unavailable` : ''}
                      {builtIn ? ' · Built-in' : ''}
                    </Text>
                  </Pressable>
                  <TemplateAction
                    label={`More actions for ${template.name}`}
                    icon="ellipsis-horizontal"
                    disabled={listActionsDisabled}
                    onPress={() => openMenu(template.id)}
                  />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={s.metadata}>No workouts available.</Text>
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
  icon:
    | 'create-outline'
    | 'trash-outline'
    | 'copy-outline'
    | 'eye-off-outline'
    | 'ellipsis-horizontal';
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
  swipeContainer: { overflow: 'hidden' },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    backgroundColor: colors.surface,
  },
  rowOpen: { transform: [{ translateX: -104 }] },
  copy: { flex: 1, minWidth: 0, paddingVertical: spacing.xs },
  name: { ...typography.headline, color: colors.textPrimary },
  metadata: { ...typography.footnote, color: colors.textSecondary },
  quickActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  action: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.5 },
  menuRoot: { flex: 1, backgroundColor: colors.background },
  menuContent: { padding: spacing.md, gap: spacing.sm },
  menuTitle: { ...typography.title2, color: colors.textPrimary },
  menuError: { ...typography.body, color: colors.danger },
});
