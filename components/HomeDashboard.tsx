import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';
import { DashboardGrid, type DashboardGridItem } from './DashboardGrid';
import { GlassCard } from './GlassCard';
import {
  HOME_WIDGET_LAYOUT,
  projectHomeDashboard,
  type HomeTemplateDetails,
} from '@/lib/home-dashboard';
import type { WorkoutSession, WorkoutTemplate } from '@/lib/workout-model';
import { colors, radius, spacing, typography } from '@/lib/theme';

type HomeProps = {
  history: WorkoutSession[];
  activeWorkout: WorkoutSession | null;
  onResume: () => void;
  startTemplate: (template: WorkoutTemplate) => void;
  templates: WorkoutTemplate[];
};

function PrimaryWorkoutWidget({
  activeWorkout,
  featured,
  hasTemplates,
  onResume,
  startTemplate,
}: {
  activeWorkout: WorkoutSession | null;
  featured?: HomeTemplateDetails;
  hasTemplates: boolean;
  onResume: () => void;
  startTemplate: HomeProps['startTemplate'];
}) {
  if (!activeWorkout && !featured) {
    return (
      <GlassCard>
        <Text style={s.heroTitle}>
          {hasTemplates
            ? 'No templates with available exercises'
            : 'No workout templates available'}
        </Text>
        <Text style={s.sub}>
          {hasTemplates
            ? 'Edit a template in Profile to choose available exercises.'
            : 'Create a template in Profile to get started.'}
        </Text>
      </GlassCard>
    );
  }
  const title = activeWorkout
    ? `Resume ${activeWorkout.name}`
    : `Start ${featured!.template.name}`;
  return (
    <GlassCard style={s.hero}>
      <Text style={s.cardLabel}>
        {activeWorkout ? 'IN PROGRESS' : 'QUICK START'}
      </Text>
      <Text style={s.heroTitle} accessibilityRole="header">
        {activeWorkout?.name ?? featured?.template.name}
      </Text>
      {activeWorkout ? (
        <Text style={s.sub}>Your workout is ready to continue.</Text>
      ) : (
        <>
          <Text style={s.meta}>{featured?.count}</Text>
          {featured?.preview ? (
            <Text style={s.sub} accessibilityLabel={featured.preview}>
              {featured.preview}
            </Text>
          ) : null}
        </>
      )}
      <AppButton
        title={title}
        accessibilityLabel={title}
        onPress={
          activeWorkout ? onResume : () => startTemplate(featured!.template)
        }
      />
    </GlassCard>
  );
}

function TrainingSummaryWidget({
  totalVolume,
  completedCount,
}: {
  totalVolume: number;
  completedCount: number;
}) {
  return (
    <GlassCard style={s.summary}>
      <Text style={s.cardLabel}>TOTAL VOLUME</Text>
      <Text style={s.metric}>
        {Math.round(totalVolume).toLocaleString()}{' '}
        <Text style={s.unit}>kg</Text>
      </Text>
      <Text style={s.sub}>
        {completedCount} completed workout{completedCount === 1 ? '' : 's'}
        {' · saved locally'}
      </Text>
    </GlassCard>
  );
}

function LatestWorkoutWidget({
  latest,
}: {
  latest: ReturnType<typeof projectHomeDashboard>['latestWorkout'];
}) {
  return latest ? (
    <GlassCard style={s.recent}>
      <Text style={s.cardLabel}>LAST WORKOUT</Text>
      <Text style={s.recentName}>{latest.session.name}</Text>
      <Text style={s.sub}>
        {Math.round(latest.volume).toLocaleString()} kg volume
      </Text>
    </GlassCard>
  ) : (
    <Text style={s.empty}>
      No completed workouts yet. Finish one to see your recent training.
    </Text>
  );
}

function WorkoutTemplatesWidget({
  templates,
  activeWorkout,
  startTemplate,
}: {
  templates: HomeTemplateDetails[];
  activeWorkout: WorkoutSession | null;
  startTemplate: HomeProps['startTemplate'];
}) {
  return (
    <View style={s.templates}>
      <Text style={s.section} accessibilityRole="header">
        {activeWorkout ? 'Workout templates' : 'More templates'}
      </Text>
      {activeWorkout ? (
        <Text style={s.sub}>Finish your current workout to start another.</Text>
      ) : null}
      {templates.map(({ template, availableCount, count, preview }) => {
        const canStart = !activeWorkout && availableCount > 0;
        return (
          <GlassCard key={template.id}>
            <View style={s.quick}>
              <View style={s.templateCopy}>
                <Text style={s.templateName}>{template.name}</Text>
                <Text style={s.sub}>{count}</Text>
                {preview ? (
                  <Text
                    style={s.sub}
                    numberOfLines={2}
                    accessibilityLabel={preview}
                  >
                    {preview}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={'Start ' + template.name}
                accessibilityHint={
                  activeWorkout
                    ? 'Finish your current workout before starting another.'
                    : canStart
                      ? undefined
                      : 'Edit this template in Profile to choose available exercises.'
                }
                accessibilityState={{ disabled: !canStart }}
                disabled={!canStart}
                onPress={canStart ? () => startTemplate(template) : undefined}
                style={({ pressed }) => [
                  s.templateAction,
                  (pressed || !canStart) && s.pressed,
                ]}
              >
                <Text style={s.templateActionText}>Start</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          </GlassCard>
        );
      })}
    </View>
  );
}

export function HomeDashboard({
  history,
  activeWorkout,
  onResume,
  startTemplate,
  templates,
}: HomeProps) {
  const data = projectHomeDashboard(history, activeWorkout, templates);
  const content = {
    primary: (
      <PrimaryWorkoutWidget
        activeWorkout={activeWorkout}
        featured={data.primaryTemplate}
        hasTemplates={templates.length > 0}
        onResume={onResume}
        startTemplate={startTemplate}
      />
    ),
    summary: (
      <TrainingSummaryWidget
        totalVolume={data.totalVolume}
        completedCount={data.completedCount}
      />
    ),
    latest: <LatestWorkoutWidget latest={data.latestWorkout} />,
    templates: data.otherTemplates.length ? (
      <WorkoutTemplatesWidget
        templates={data.otherTemplates}
        activeWorkout={activeWorkout}
        startTemplate={startTemplate}
      />
    ) : null,
  };
  const items: DashboardGridItem[] = HOME_WIDGET_LAYOUT.flatMap((layout) => {
    const widget = content[layout.id];
    return widget
      ? [{ id: layout.id, size: layout.defaultSize, content: widget }]
      : [];
  });

  return (
    <ScrollView contentContainerStyle={[s.content, s.homeContent]}>
      <View style={s.header}>
        <Text style={s.brand}>CRESUM</Text>
        <Text style={s.greeting}>
          {history.length ? 'Welcome back' : 'Welcome'}
        </Text>
        <Text style={s.title} accessibilityRole="header">
          Ready to train?
        </Text>
      </View>
      <DashboardGrid items={items} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg },
  homeContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingBottom: spacing.lg,
  },
  header: { gap: spacing.xxs },
  brand: { ...typography.caption, color: colors.primary },
  greeting: { ...typography.subheadline, color: colors.textSecondary },
  title: { ...typography.title1, color: colors.textPrimary },
  hero: { gap: spacing.sm },
  heroTitle: { ...typography.title2, color: colors.textPrimary },
  meta: { ...typography.subheadline, color: colors.textSecondary },
  summary: { gap: spacing.xxs },
  metric: {
    ...typography.title1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  recent: { gap: spacing.xxs },
  recentName: { ...typography.headline, color: colors.textPrimary },
  empty: { ...typography.footnote, color: colors.textSecondary },
  templateCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  templates: { gap: spacing.sm },
  templateName: { ...typography.headline, color: colors.textPrimary },
  templateAction: {
    minWidth: 80,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  templateActionText: { ...typography.caption, color: colors.primary },
  pressed: { opacity: 0.6 },
  cardLabel: { ...typography.caption, color: colors.textSecondary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  unit: { ...typography.footnote, color: colors.textSecondary },
  quick: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  section: { ...typography.title3, color: colors.textPrimary },
});
