import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassCard } from '@/components/GlassCard';
import { Dock } from '@/components/Dock';
import { AppButton } from '@/components/AppButton';
import { Confirmation } from '@/components/Confirmation';
import { Workout, duration, successHaptic } from '@/components/Workout';
import { WorkoutHistory } from '@/components/WorkoutHistory';
import { ExercisePerformance } from '@/components/ExercisePerformance';
import { TrainingVolume } from '@/components/TrainingVolume';
import { WorkoutTemplates } from '@/components/WorkoutTemplates';
import { volume } from '@/lib/workout-metrics';
import {
  DEFAULT_PROGRESS_PERIOD,
  PROGRESS_PERIODS,
  type ProgressPeriodId,
  projectPeriodAnalytics,
} from '@/lib/progress-periods';
import { completedSetCount, workoutIsComplete } from '@/lib/workout-engine';
import {
  WorkoutSession as Session,
  WorkoutTemplate as Template,
} from '@/lib/workout-model';
import { findExercise } from '@/lib/exercise-library';
import { WorkoutRepository } from '@/lib/workout-repository';
import { TemplateMutationResult, WorkoutStore } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

const blue = colors.primary,
  white = colors.surface;
function Home({
  history,
  activeWorkout,
  onResume,
  startTemplate,
  templates,
}: {
  history: Session[];
  activeWorkout: Session | null;
  onResume: () => void;
  startTemplate: (t: Template) => void;
  templates: Template[];
}) {
  const total = history.reduce((a, x) => a + volume(x), 0);
  const last = history.reduce<Session | undefined>(
    (latest, session) =>
      !latest || (session.finishedAt ?? 0) > (latest.finishedAt ?? 0)
        ? session
        : latest,
    undefined,
  );
  const featuredIndex = templates.findIndex((template) =>
    template.exerciseIds.some((id) => findExercise(id)),
  );
  const featured = templates[featuredIndex];
  const remainingTemplates = templates.filter(
    (_, index) => activeWorkout || index !== featuredIndex,
  );
  const exerciseDetails = (template: Template) => {
    const available = template.exerciseIds.flatMap((id) => {
      const exercise = findExercise(id);
      return exercise ? [exercise] : [];
    });
    const unavailable = template.exerciseIds.length - available.length;
    return {
      availableCount: available.length,
      count: unavailable
        ? `${available.length} available · ${unavailable} unavailable`
        : `${available.length} exercise${available.length === 1 ? '' : 's'}`,
      preview: available
        .slice(0, 3)
        .map((exercise) => exercise.name)
        .join(' · '),
    };
  };
  const featuredDetails = featured ? exerciseDetails(featured) : undefined;
  const primaryTitle = activeWorkout
    ? `Resume ${activeWorkout.name}`
    : featured
      ? `Start ${featured.name}`
      : '';
  const primaryAction = () => {
    if (activeWorkout) onResume();
    else if (featured) startTemplate(featured);
  };
  return (
    <ScrollView contentContainerStyle={[s.content, s.homeContent]}>
      <View style={s.homeHeader}>
        <Text style={s.homeBrand}>CRESUM</Text>
        <Text style={s.homeGreeting}>
          {history.length ? 'Welcome back' : 'Welcome'}
        </Text>
        <Text style={s.homeTitle} accessibilityRole="header">
          Ready to train?
        </Text>
      </View>
      {activeWorkout || featured ? (
        <GlassCard style={s.homeHero}>
          <Text style={s.cardLabel}>
            {activeWorkout ? 'IN PROGRESS' : 'QUICK START'}
          </Text>
          <Text style={s.homeHeroTitle} accessibilityRole="header">
            {activeWorkout?.name ?? featured?.name}
          </Text>
          {activeWorkout ? (
            <Text style={s.sub}>Your workout is ready to continue.</Text>
          ) : (
            <>
              <Text style={s.homeMeta}>{featuredDetails?.count}</Text>
              {featuredDetails?.preview ? (
                <Text
                  style={s.sub}
                  accessibilityLabel={featuredDetails.preview}
                >
                  {featuredDetails.preview}
                </Text>
              ) : null}
            </>
          )}
          <AppButton
            title={primaryTitle}
            accessibilityLabel={primaryTitle}
            onPress={primaryAction}
          />
        </GlassCard>
      ) : (
        <GlassCard>
          <Text style={s.homeHeroTitle}>
            {templates.length
              ? 'No templates with available exercises'
              : 'No workout templates available'}
          </Text>
          <Text style={s.sub}>
            {templates.length
              ? 'Edit a template in Profile to choose available exercises.'
              : 'Create a template in Profile to get started.'}
          </Text>
        </GlassCard>
      )}
      <GlassCard style={s.homeSummary}>
        <Text style={s.cardLabel}>TOTAL VOLUME</Text>
        <Text style={s.homeMetric}>
          {Math.round(total).toLocaleString()} <Text style={s.unit}>kg</Text>
        </Text>
        <Text style={s.sub}>
          {history.length} completed workout{history.length === 1 ? '' : 's'}
          {' · saved locally'}
        </Text>
      </GlassCard>
      {last ? (
        <GlassCard style={s.homeRecent}>
          <Text style={s.cardLabel}>LAST WORKOUT</Text>
          <Text style={s.homeRecentName}>{last.name}</Text>
          <Text style={s.sub}>
            {Math.round(volume(last)).toLocaleString()} kg volume
          </Text>
        </GlassCard>
      ) : (
        <Text style={s.homeEmpty}>
          No completed workouts yet. Finish one to see your recent training.
        </Text>
      )}
      {remainingTemplates.length > 0 ? (
        <View style={s.homeTemplates}>
          <Text style={s.section} accessibilityRole="header">
            {activeWorkout ? 'Workout templates' : 'More templates'}
          </Text>
          {activeWorkout ? (
            <Text style={s.sub}>
              Finish your current workout to start another.
            </Text>
          ) : null}
          {remainingTemplates.map((t) => {
            const details = exerciseDetails(t);
            const canStart = !activeWorkout && details.availableCount > 0;
            return (
              <GlassCard key={t.id}>
                <View style={s.quick}>
                  <View style={s.homeTemplateCopy}>
                    <Text style={s.homeTemplateName}>{t.name}</Text>
                    <Text style={s.sub}>{details.count}</Text>
                    {details.preview ? (
                      <Text
                        style={s.sub}
                        numberOfLines={2}
                        accessibilityLabel={details.preview}
                      >
                        {details.preview}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={'Start ' + t.name}
                    accessibilityHint={
                      activeWorkout
                        ? 'Finish your current workout before starting another.'
                        : canStart
                          ? undefined
                          : 'Edit this template in Profile to choose available exercises.'
                    }
                    accessibilityState={{ disabled: !canStart }}
                    disabled={!canStart}
                    onPress={canStart ? () => startTemplate(t) : undefined}
                    style={({ pressed }) => [
                      s.homeTemplateAction,
                      (pressed || !canStart) && s.homePressed,
                    ]}
                  >
                    <Text style={s.homeTemplateActionText}>Start</Text>
                    <Ionicons name="arrow-forward" size={18} color={blue} />
                  </Pressable>
                </View>
              </GlassCard>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stats({ history }: { history: Session[] }) {
  const [period, setPeriod] = useState<ProgressPeriodId>(
    DEFAULT_PROGRESS_PERIOD,
  );
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
  const analytics = useMemo(
    () => projectPeriodAnalytics(history, period, now),
    [history, period, now],
  );
  const records = analytics.estimatedOneRepMaxRecords;
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>YOUR PROGRESS</Text>
      <Text style={s.title}>Progress</Text>
      <Text style={s.sub}>Volume and estimated strength records</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.periods}
        accessibilityLabel="Progress period"
      >
        {PROGRESS_PERIODS.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityLabel={`Progress period ${option.id}`}
            accessibilityHint={`Show Progress for ${option.accessibilityLabel}`}
            accessibilityState={{ selected: period === option.id }}
            onPress={() => setPeriod(option.id)}
            style={[s.periodChip, period === option.id && s.periodSelected]}
          >
            <Text
              style={[
                s.periodText,
                period === option.id && s.periodSelectedText,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <TrainingVolume
        totalVolume={analytics.totalVolume}
        workoutVolumes={analytics.workoutVolumes}
        period={period}
      />
      <GlassCard>
        <Text style={s.h3}>Estimated 1RM</Text>
        <Text style={s.sub}>Epley formula · based on completed sets</Text>
        {analytics.excludedSampleCount > 0 ? (
          <Text style={s.sub}>Some saved sets could not be included.</Text>
        ) : null}
        {records.length === 0 ? (
          <Text style={s.sub}>No estimated records in this period.</Text>
        ) : (
          records.slice(0, 6).map((r, i) => (
            <View key={r.identityKey} style={s.history}>
              <View>
                <Text style={s.h3}>{r.name}</Text>
                <Text style={s.sub}>
                  {r.weight} kg × {r.reps}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.value2}>
                  {r.estimatedOneRepMax.toFixed(1)} kg
                </Text>
                {i === 0 && <Text style={s.pr}>TOP PR</Text>}
              </View>
            </View>
          ))
        )}
      </GlassCard>
      <ExercisePerformance history={history} period={period} now={now} />
      <Text style={s.sub}>Complete saved History · all dates</Text>
      <WorkoutHistory history={history} />
    </ScrollView>
  );
}
function Profile({
  templates,
  busy,
  createTemplate,
  updateTemplate,
  deleteTemplate,
}: {
  templates: Template[];
  busy: boolean;
  createTemplate: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  updateTemplate: (
    templateId: string,
    draft: TemplateDraft,
  ) => Promise<TemplateMutationResult>;
  deleteTemplate: (templateId: string) => Promise<TemplateMutationResult>;
}) {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>YOUR TEMPLATES</Text>
      <View style={s.profile}>
        <View style={s.bigAvatar}>
          <Ionicons name="person" size={34} color={white} />
        </View>
        <Text style={s.title}>FitFlow</Text>
        <Text style={s.sub}>Local MVP · v0.3.0</Text>
      </View>
      <WorkoutTemplates
        templates={templates}
        busy={busy}
        onCreate={createTemplate}
        onUpdate={updateTemplate}
        onDelete={deleteTemplate}
      />
    </ScrollView>
  );
}

export default function App() {
  const [store] = useState(
    () => new WorkoutStore(new WorkoutRepository(AsyncStorage)),
  );
  const { data, ready, busy, error } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
  );
  const [tab, setTab] = useState('home');
  const [summary, setSummary] = useState<Session | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  useEffect(() => {
    void store.load();
  }, [store]);
  const startTemplate = (template: Template) => {
    if (data.activeWorkout) {
      setTab('workout');
      return;
    }
    try {
      store.start(template);
      setTab('workout');
    } catch (problem) {
      Alert.alert('Cannot start workout', (problem as Error).message);
    }
  };
  const finish = async () => {
    if (!data.activeWorkout || busy) return;
    const completed = await store.finish();
    if (!completed) return;
    successHaptic();
    setConfirmFinish(false);
    setSummary(completed);
    setTab('progress');
  };
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <Confirmation
        visible={confirmFinish}
        title="Finish workout?"
        message={
          data.activeWorkout && workoutIsComplete(data.activeWorkout)
            ? 'Save your completed workout to History and Progress?'
            : 'Some sets are incomplete. Only completed sets count toward your progress.'
        }
        confirmLabel="Finish and save"
        cancelLabel="Keep training"
        busy={busy}
        error={error}
        onConfirm={() => {
          void finish();
        }}
        onCancel={() => setConfirmFinish(false)}
      />
      {error ? (
        <View style={s.notice} accessibilityRole="alert">
          <Text style={s.sub}>{error}</Text>
          <AppButton
            title="Retry saving or loading"
            secondary
            disabled={busy}
            onPress={() => {
              void store.retry();
            }}
          />
        </View>
      ) : null}
      {!ready ? (
        <View style={s.empty}>
          {busy ? <ActivityIndicator color={blue} /> : null}
          <Text style={s.sub}>
            {busy
              ? 'Loading your workouts…'
              : 'Saved workouts are unavailable. Retry above.'}
          </Text>
        </View>
      ) : (
        <>
          {tab === 'home' ? (
            <Home
              history={data.history}
              activeWorkout={data.activeWorkout}
              onResume={() => setTab('workout')}
              templates={data.templates}
              startTemplate={startTemplate}
            />
          ) : tab === 'workout' ? (
            <Workout
              session={data.activeWorkout}
              history={data.history}
              update={(transform) => store.updateWorkout(transform)}
              finish={() => setConfirmFinish(true)}
              busy={busy}
            />
          ) : tab === 'progress' ? (
            <>
              {summary && (
                <View style={s.notice}>
                  <Text style={s.h3}>Workout saved</Text>
                  <Text style={s.sub}>
                    {completedSetCount(summary)} sets ·{' '}
                    {volume(summary).toLocaleString()} kg ·{' '}
                    {duration(
                      (summary.finishedAt ?? summary.startedAt) -
                        summary.startedAt,
                    )}
                  </Text>
                  <AppButton
                    title="Done"
                    secondary
                    onPress={() => setSummary(null)}
                  />
                </View>
              )}
              <Stats history={data.history} />
            </>
          ) : (
            <Profile
              templates={data.templates}
              busy={busy}
              createTemplate={(draft) => store.createTemplate(draft)}
              updateTemplate={(templateId, draft) =>
                store.updateTemplate(templateId, draft)
              }
              deleteTemplate={(templateId) => store.deleteTemplate(templateId)}
            />
          )}
          <Dock active={tab} onChange={setTab} />
        </>
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.lg },
  homeContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingBottom: spacing.lg,
  },
  homeHeader: { gap: spacing.xxs },
  homeBrand: { ...typography.caption, color: colors.primary },
  homeGreeting: { ...typography.subheadline, color: colors.textSecondary },
  homeTitle: { ...typography.title1, color: colors.textPrimary },
  homeHero: { gap: spacing.sm },
  homeHeroTitle: { ...typography.title2, color: colors.textPrimary },
  homeMeta: { ...typography.subheadline, color: colors.textSecondary },
  homeSummary: { gap: spacing.xxs },
  homeMetric: {
    ...typography.title1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  homeRecent: { gap: spacing.xxs },
  homeRecentName: { ...typography.headline, color: colors.textPrimary },
  homeEmpty: { ...typography.footnote, color: colors.textSecondary },
  homeTemplateCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  homeTemplates: { gap: spacing.sm },
  homeTemplateName: { ...typography.headline, color: colors.textPrimary },
  homeTemplateAction: {
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
  homeTemplateActionText: { ...typography.caption, color: colors.primary },
  homePressed: { opacity: 0.6 },
  notice: { padding: spacing.md, gap: spacing.xs },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  eyebrow: { ...typography.caption, color: colors.textSecondary },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  periods: { gap: spacing.xs, paddingRight: spacing.md },
  periodChip: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelected: { backgroundColor: colors.primary },
  periodText: { ...typography.caption, color: colors.textPrimary },
  periodSelectedText: { color: colors.surface },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  profile: { alignItems: 'center', paddingVertical: spacing.md },
  cardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  unit: { ...typography.footnote, color: colors.textSecondary },
  quick: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  h3: { ...typography.headline, color: colors.textPrimary },
  section: { ...typography.title3, color: colors.textPrimary },
  pr: { ...typography.caption, color: colors.textSecondary },
  history: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  value2: {
    ...typography.headline,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
