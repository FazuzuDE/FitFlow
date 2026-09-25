import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import { WorkoutTemplates } from './WorkoutTemplates';
import { defaultTemplates } from '@/lib/workout-catalog';
import type { WorkoutTemplate } from '@/lib/workout-model';
import type { TemplateMutationResult } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { colors, spacing, typography } from '@/lib/theme';

export type ProfileSettingsProps = {
  templates: WorkoutTemplate[];
  busy: boolean;
  version?: string;
  createTemplate: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  updateTemplate: (
    templateId: string,
    draft: TemplateDraft,
  ) => Promise<TemplateMutationResult>;
  deleteTemplate: (templateId: string) => Promise<TemplateMutationResult>;
  duplicateTemplate?: (templateId: string) => Promise<TemplateMutationResult>;
  startTemplate?: (template: WorkoutTemplate) => void;
  hideBuiltIn?: (templateId: string) => Promise<boolean>;
  restoreBuiltIn?: (templateId: string) => Promise<boolean>;
  hiddenBuiltInIds?: string[];
  hiddenError?: string;
  hasActiveWorkout?: boolean;
  onPersonalize?: () => void;
  onResetLocalData?: () => void;
};

export function ProfileSettings({
  templates,
  busy,
  version,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  startTemplate,
  hideBuiltIn,
  restoreBuiltIn,
  hiddenBuiltInIds = [],
  hiddenError,
  hasActiveWorkout = false,
  onPersonalize,
  onResetLocalData,
}: ProfileSettingsProps) {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={s.brand}>CRESUM</Text>
        <Text style={s.title} accessibilityRole="header">
          Profile
        </Text>
        <Text style={s.sub}>Your workouts and app details</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>WORKOUT</Text>
        <Text style={s.sectionTitle} accessibilityRole="header">
          Your workouts
        </Text>
        <WorkoutTemplates
          templates={templates}
          busy={busy}
          onCreate={createTemplate}
          onUpdate={updateTemplate}
          onDelete={deleteTemplate}
          onDuplicate={duplicateTemplate}
          onStart={startTemplate}
          onHide={hideBuiltIn}
          hasActiveWorkout={hasActiveWorkout}
        />
      </View>

      {hiddenBuiltInIds.length ? (
        <View style={s.section}>
          <Text style={s.sectionLabel}>WORKOUT SETTINGS</Text>
          <GlassCard style={s.about}>
            <Text style={s.sectionTitle} accessibilityRole="header">
              Hidden built-in workouts
            </Text>
            <Text style={s.sub}>
              Restore a built-in workout to My Workouts.
            </Text>
            {defaultTemplates
              .filter((template) => hiddenBuiltInIds.includes(template.id))
              .map((template) => (
                <AppButton
                  key={template.id}
                  title={`Restore ${template.name}`}
                  secondary
                  disabled={busy || !restoreBuiltIn}
                  onPress={() => void restoreBuiltIn?.(template.id)}
                />
              ))}
          </GlassCard>
        </View>
      ) : null}
      {hiddenError ? (
        <Text accessibilityRole="alert" style={s.sub}>
          {hiddenError}
        </Text>
      ) : null}

      <View style={s.section}>
        <Text style={s.sectionLabel}>PERSONALIZATION</Text>
        <GlassCard style={s.about}>
          <Text style={s.sectionTitle} accessibilityRole="header">
            Training preferences
          </Text>
          <Text style={s.sub}>
            You can add or change your preferences at any time.
          </Text>
          {onPersonalize ? (
            <AppButton
              title="Personalization"
              secondary
              onPress={onPersonalize}
            />
          ) : null}
        </GlassCard>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>DATA</Text>
        <GlassCard style={s.about}>
          <Text style={s.sectionTitle} accessibilityRole="header">
            Local data
          </Text>
          <Text style={s.sub}>
            Remove all CRESUM data saved on this device.
          </Text>
          {onResetLocalData ? (
            <AppButton
              title="Reset local data"
              destructive
              disabled={busy}
              onPress={onResetLocalData}
            />
          ) : null}
        </GlassCard>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>ABOUT</Text>
        <GlassCard style={s.about}>
          <Text style={s.aboutTitle}>CRESUM</Text>
          {version ? <Text style={s.sub}>Version {version}</Text> : null}
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  header: { gap: spacing.xxs },
  brand: { ...typography.caption, color: colors.primary },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.caption, color: colors.textSecondary },
  sectionTitle: { ...typography.title3, color: colors.textPrimary },
  about: { gap: spacing.xxs },
  aboutTitle: { ...typography.headline, color: colors.textPrimary },
});
