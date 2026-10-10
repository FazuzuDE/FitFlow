import { useEffect, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  onOpenProfile?: () => void;
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
      <View style={s.heroTop}>
        <View style={s.badge}>
          <Ionicons name="barbell-outline" size={18} color={colors.primary} />
          <Text style={s.badgeText}>
            {activeWorkout ? 'In progress' : 'Quick start'}
          </Text>
        </View>
        <Text style={s.sub}>
          {activeWorkout ? 'Active workout' : 'Saved workout'}
        </Text>
      </View>
      <Text style={s.heroTitle} accessibilityRole="header">
        {activeWorkout?.name ?? featured?.template.name}
      </Text>
      {activeWorkout ? (
        <Text style={s.sub}>Your workout is ready to continue.</Text>
      ) : (
        <>
          <Text style={s.meta}>
            {featured?.count} · {featured?.plannedSetCount} planned sets
          </Text>
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
    <View style={s.statPair}>
      <GlassCard style={s.statCard}>
        <Text style={s.sub}>Last 4 weeks</Text>
        <Text style={s.metric}>
          {completedCount}{' '}
          <Text style={s.unit}>
            completed workout{completedCount === 1 ? '' : 's'}
          </Text>
        </Text>
        <Text style={s.sub}> · saved locally</Text>
      </GlassCard>
      <GlassCard style={s.statCard}>
        <Text style={s.sub}>Total volume</Text>
        <Text style={s.metric}>
          {(totalVolume >= 1000
            ? totalVolume / 1000
            : totalVolume
          ).toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
          <Text style={s.unit}>{totalVolume >= 1000 ? 't' : 'kg'}</Text>
        </Text>
        <Text style={s.sub}>Last 4 weeks</Text>
      </GlassCard>
    </View>
  );
}

function TrainingWeekWidget({
  week,
}: {
  week: ReturnType<typeof projectHomeDashboard>['week'];
}) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <GlassCard style={s.weekCard}>
      <View style={s.heroTop}>
        <Text style={s.section} accessibilityRole="header">
          Your week
        </Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>
            {week.completedCount} workout{week.completedCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
      <View style={s.weekDays}>
        {week.days.map((day, index) => (
          <View
            key={day.timestamp}
            style={s.weekDay}
            accessible
            accessibilityLabel={`${new Date(day.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}: ${day.completedCount} completed workouts${day.isToday ? ', today' : ''}`}
          >
            <Text style={s.dayLabel}>{labels[index]}</Text>
            <View style={[s.dayMarker, day.isToday && s.todayCircle]}>
              <View
                style={[
                  s.dayCircle,
                  day.completedCount > 0 && s.completedCircle,
                ]}
              >
                {day.completedCount > 0 ? (
                  <Ionicons name="checkmark" size={20} color={colors.surface} />
                ) : (
                  <Text style={[s.dayNumber, day.isToday && s.todayNumber]}>
                    {day.dayOfMonth}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
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
      <Text style={s.sub}>{latest.volume.toLocaleString()} kg volume</Text>
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
                  <Text style={s.sub} accessibilityLabel={preview}>
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
  onOpenProfile,
}: HomeProps) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  const data = projectHomeDashboard(history, activeWorkout, templates, now);
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
        totalVolume={data.fourWeeks.totalVolume}
        completedCount={data.fourWeeks.completedCount}
      />
    ),
    week: <TrainingWeekWidget week={data.week} />,
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
        <View style={s.brandRow}>
          <Text style={s.brand}>CRESUM</Text>
          <Text style={s.tagline}>TRAIN. TRACK. GROW.</Text>
        </View>
        <View style={s.greetingRow}>
          <View style={s.greetingCopy}>
            <Text style={s.title} accessibilityRole="header">
              {history.length ? 'Welcome back' : 'Welcome'}
            </Text>
            <Text style={s.greeting}>A good day for progress.</Text>
          </View>
          {onOpenProfile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Profile"
              onPress={onOpenProfile}
              style={({ pressed }) => [s.avatar, pressed && s.pressed]}
            >
              <Ionicons
                name="person-outline"
                size={22}
                color={colors.primary}
              />
            </Pressable>
          ) : null}
        </View>
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
  header: { gap: spacing.xl, paddingVertical: spacing.sm },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  brand: { ...typography.caption, letterSpacing: 2, color: colors.textPrimary },
  tagline: {
    ...typography.caption,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  greetingCopy: { flex: 1, gap: spacing.xs },
  avatar: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  hero: { gap: spacing.lg, padding: spacing.lg, borderRadius: radius.xxl },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeText: { ...typography.footnote, color: colors.textPrimary },
  heroTitle: { ...typography.title1, color: colors.textPrimary },
  meta: { ...typography.subheadline, color: colors.textSecondary },
  statPair: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    flex: 1,
    minWidth: 140,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.xxl,
  },
  weekCard: { gap: spacing.lg, padding: spacing.md, borderRadius: radius.xxl },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xxs,
  },
  weekDay: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.sm },
  dayLabel: { ...typography.caption, color: colors.textSecondary },
  dayMarker: {
    width: '100%',
    maxWidth: 44,
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: '100%',
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.xxs,
  },
  completedCircle: { backgroundColor: colors.primary },
  dayNumber: { ...typography.footnote, color: colors.textSecondary },
  todayNumber: { color: colors.primary },
  metric: {
    ...typography.largeTitle,
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
