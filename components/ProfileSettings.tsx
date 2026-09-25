import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { WorkoutTemplates } from './WorkoutTemplates';
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
};

export function ProfileSettings({
  templates,
  busy,
  version,
  createTemplate,
  updateTemplate,
  deleteTemplate,
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
          Workout templates
        </Text>
        <WorkoutTemplates
          templates={templates}
          busy={busy}
          onCreate={createTemplate}
          onUpdate={updateTemplate}
          onDelete={deleteTemplate}
        />
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
