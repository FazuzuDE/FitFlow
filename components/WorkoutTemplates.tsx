import { useEffect, useRef, useState } from 'react';
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
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
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

const quickActionSize = 44;
const quickActionGap = spacing.xs;
const quickActionInset = spacing.xs;
const quickActionsWidth =
  quickActionSize * 2 + quickActionGap + quickActionInset * 2;

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
  const [openSwipeId, setOpenSwipeId] = useState<string>();
  const swipeableRefs = useRef(new Map<string, SwipeableMethods>());
  const openSwipeRef = useRef<string | undefined>(undefined);
  const gestureRowRef = useRef<string | undefined>(undefined);
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

  useEffect(() => {
    const openId = openSwipeRef.current;
    if (openId && !templates.some((template) => template.id === openId)) {
      openSwipeRef.current = undefined;
      setOpenSwipeId(undefined);
      if (gestureRowRef.current === openId) gestureRowRef.current = undefined;
    }
  }, [templates]);

  const closeOpenSwipe = () => {
    if (openSwipeRef.current)
      swipeableRefs.current.get(openSwipeRef.current)?.close();
  };

  const openMenu = (templateId: string) => {
    if (listActionsDisabled) return;
    closeOpenSwipe();
    setMenuError('');
    setMenuTemplateId(templateId);
  };
  const duplicate = async (templateId: string) => {
    if (!onDuplicate) return;
    const result = await onDuplicate(templateId);
    if (result.ok) {
      setMenuTemplateId(undefined);
      closeOpenSwipe();
      setMenuError('');
      successHaptic();
    } else setMenuError(result.error);
  };
  const hide = async (templateId: string) => {
    if (!onHide) return;
    if (await onHide(templateId)) {
      setMenuTemplateId(undefined);
      closeOpenSwipe();
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
              <Swipeable
                key={`${template.id}-${index}`}
                testID={`template-swipe-${template.id}`}
                ref={(methods) => {
                  if (methods) swipeableRefs.current.set(template.id, methods);
                  else swipeableRefs.current.delete(template.id);
                }}
                containerStyle={s.swipeContainer}
                childrenContainerStyle={s.movingRow}
                enabled={!listActionsDisabled}
                friction={1}
                rightThreshold={52}
                overshootLeft={false}
                overshootFriction={8}
                onSwipeableOpenStartDrag={() => {
                  gestureRowRef.current = template.id;
                }}
                onSwipeableCloseStartDrag={() => {
                  gestureRowRef.current = template.id;
                }}
                onSwipeableWillOpen={() => {
                  if (openSwipeRef.current !== template.id) closeOpenSwipe();
                  openSwipeRef.current = template.id;
                  setOpenSwipeId(template.id);
                }}
                onSwipeableClose={() => {
                  if (openSwipeRef.current === template.id) {
                    openSwipeRef.current = undefined;
                    setOpenSwipeId(undefined);
                  }
                  if (gestureRowRef.current === template.id)
                    gestureRowRef.current = undefined;
                }}
                renderRightActions={() => (
                  <>
                    <View
                      testID={`quick-background-${template.id}`}
                      pointerEvents="none"
                      accessible={false}
                      style={s.quickActionBackground}
                    />
                    <View
                      testID={`quick-actions-${template.id}`}
                      style={s.quickActions}
                      accessibilityElementsHidden={openSwipeId !== template.id}
                      importantForAccessibility={
                        openSwipeId === template.id
                          ? 'auto'
                          : 'no-hide-descendants'
                      }
                    >
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
                              closeOpenSwipe();
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
                              closeOpenSwipe();
                              setDeleteError('');
                              setDeleteTargetId(template.id);
                            }}
                          />
                        </>
                      )}
                    </View>
                  </>
                )}
              >
                <View style={s.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${hasActiveWorkout ? 'Resume active workout from' : 'Start'} ${template.name}`}
                    accessibilityHint="Long press for more workout actions"
                    disabled={listActionsDisabled || !onStart}
                    onTouchStart={() => {
                      if (gestureRowRef.current === template.id)
                        gestureRowRef.current = undefined;
                    }}
                    onPress={() => {
                      if (gestureRowRef.current === template.id) return;
                      if (openSwipeRef.current) {
                        closeOpenSwipe();
                        return;
                      }
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
              </Swipeable>
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
  swipeContainer: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  movingRow: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  copy: { flex: 1, minWidth: 0, paddingVertical: spacing.xs },
  name: { ...typography.headline, color: colors.textPrimary },
  metadata: { ...typography.footnote, color: colors.textSecondary },
  quickActionBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },
  quickActions: {
    width: quickActionsWidth,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: quickActionGap,
    paddingHorizontal: quickActionInset,
  },
  action: {
    width: quickActionSize,
    height: quickActionSize,
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
