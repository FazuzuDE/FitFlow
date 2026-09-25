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
import { HomeDashboard } from '@/components/HomeDashboard';
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
import { WorkoutRepository } from '@/lib/workout-repository';
import { TemplateMutationResult, WorkoutStore } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

const blue = colors.primary,
  white = colors.surface;
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
            <HomeDashboard
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
  h3: { ...typography.headline, color: colors.textPrimary },
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
