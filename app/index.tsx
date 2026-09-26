import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { GlassCard } from '@/components/GlassCard';
import { Dock } from '@/components/Dock';
import { AppButton } from '@/components/AppButton';
import { HomeDashboard } from '@/components/HomeDashboard';
import { ProfileSettings } from '@/components/ProfileSettings';
import { Onboarding } from '@/components/Onboarding';
import { Confirmation } from '@/components/Confirmation';
import { Workout, duration, successHaptic } from '@/components/Workout';
import { WorkoutHistory } from '@/components/WorkoutHistory';
import { ExercisePerformance } from '@/components/ExercisePerformance';
import { TrainingVolume } from '@/components/TrainingVolume';
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
import { WorkoutStore } from '@/lib/workout-store';
import {
  hasMeaningfulWorkoutData,
  initialOnboardingState,
  type OnboardingState,
} from '@/lib/onboarding';
import { OnboardingRepository } from '@/lib/onboarding-repository';
import { resetLocalData } from '@/lib/local-data-reset';
import { HiddenBuiltInsRepository } from '@/lib/hidden-builtins';
import type { TemplateDraft } from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

const blue = colors.primary;
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
export default function App() {
  const [store] = useState(
    () => new WorkoutStore(new WorkoutRepository(AsyncStorage)),
  );
  const { data, ready, busy, error } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
  );
  const [tab, setTab] = useState('home');
  const [onboardingRepository] = useState(
    () => new OnboardingRepository(AsyncStorage),
  );
  const [hiddenRepository] = useState(
    () => new HiddenBuiltInsRepository(AsyncStorage),
  );
  const [hiddenBuiltInIds, setHiddenBuiltInIds] = useState<string[]>([]);
  const [hiddenReady, setHiddenReady] = useState(false);
  const [hiddenBusy, setHiddenBusy] = useState(false);
  const [hiddenError, setHiddenError] = useState('');
  const hiddenWrites = useRef(Promise.resolve());
  const hiddenOperation = useRef(false);
  const hiddenEpoch = useRef(0);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    initialOnboardingState,
  );
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingLoadFailed, setOnboardingLoadFailed] = useState(false);
  const [onboardingBypass, setOnboardingBypass] = useState(false);
  const [editingPersonalization, setEditingPersonalization] = useState(false);
  const onboardingWrites = useRef(Promise.resolve());
  const onboardingEpoch = useRef(0);
  const resetInProgress = useRef(false);
  const [summary, setSummary] = useState<Session | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  useEffect(() => {
    void store.load();
    let mounted = true;
    const epoch = onboardingEpoch.current;
    const visibilityEpoch = hiddenEpoch.current;
    void hiddenRepository
      .load()
      .then(
        (ids) => {
          if (mounted && hiddenEpoch.current === visibilityEpoch)
            setHiddenBuiltInIds(ids);
        },
        () => {
          if (mounted && hiddenEpoch.current === visibilityEpoch)
            setHiddenError(
              'Hidden workout settings are unavailable. All built-ins remain visible.',
            );
        },
      )
      .finally(() => {
        if (mounted && hiddenEpoch.current === visibilityEpoch)
          setHiddenReady(true);
      });
    void onboardingRepository
      .load()
      .then(
        (state) => {
          if (mounted && onboardingEpoch.current === epoch) {
            setOnboardingState(state);
            setOnboardingLoadFailed(false);
          }
        },
        (problem: Error) => {
          if (mounted && onboardingEpoch.current === epoch) {
            setOnboardingError(problem.message);
            setOnboardingLoadFailed(true);
          }
        },
      )
      .finally(() => {
        if (mounted && onboardingEpoch.current === epoch)
          setOnboardingReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [store, onboardingRepository, hiddenRepository]);
  const queueOnboardingSave = (next: OnboardingState): Promise<void> => {
    if (resetInProgress.current)
      return Promise.reject(new Error('Reset in progress.'));
    const write = onboardingWrites.current
      .catch(() => undefined)
      .then(() => onboardingRepository.save(next));
    onboardingWrites.current = write.catch(() => undefined);
    return write;
  };
  const saveOnboardingProgress = (next: OnboardingState) => {
    if (resetInProgress.current) return;
    setOnboardingState(next);
    void queueOnboardingSave(next).catch(() => {
      setOnboardingLoadFailed(false);
      setOnboardingError(
        'Onboarding progress could not be saved. Retry before closing the app.',
      );
    });
  };
  const completeOnboarding = async (next: OnboardingState) => {
    await queueOnboardingSave(next);
    setOnboardingError('');
    setOnboardingState(next);
    setEditingPersonalization(false);
    setTab('home');
  };
  const createFirstWorkout = async (draft: TemplateDraft) => {
    const result = await store.createTemplate(draft);
    if (result.ok) {
      try {
        await completeOnboarding({
          ...onboardingState,
          status: 'completed',
          step: 'complete',
        });
      } catch {
        // The durable custom workout independently identifies a returning user.
        // Never retry creation to repair the separate onboarding record.
        setOnboardingError(
          'Your workout was saved. Onboarding status could not be saved.',
        );
      }
    }
    return result;
  };
  const showOnboarding =
    onboardingReady &&
    !onboardingBypass &&
    !hasMeaningfulWorkoutData(data) &&
    onboardingState.status !== 'completed';
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
  const updateHiddenBuiltIns = async (next: string[]): Promise<boolean> => {
    if (hiddenOperation.current || resetInProgress.current) return false;
    hiddenOperation.current = true;
    const epoch = hiddenEpoch.current;
    setHiddenBusy(true);
    setHiddenError('');
    const write = hiddenRepository.save(next);
    hiddenWrites.current = write.catch(() => undefined);
    try {
      await write;
      if (hiddenEpoch.current === epoch) setHiddenBuiltInIds(next);
      return true;
    } catch {
      if (hiddenEpoch.current === epoch)
        setHiddenError(
          'Hidden workout settings could not be saved. Try again.',
        );
      return false;
    } finally {
      hiddenOperation.current = false;
      setHiddenBusy(false);
    }
  };
  const visibleTemplates = data.templates.filter(
    (template) => !hiddenBuiltInIds.includes(template.id),
  );
  const finish = async () => {
    if (!data.activeWorkout || busy) return;
    const completed = await store.finish();
    if (!completed) return;
    successHaptic();
    setConfirmFinish(false);
    setSummary(completed);
    setTab('progress');
  };
  const reset = async () => {
    if (resetInProgress.current || busy) return;
    resetInProgress.current = true;
    ++onboardingEpoch.current;
    ++hiddenEpoch.current;
    setResetBusy(true);
    setResetError('');
    try {
      await resetLocalData(AsyncStorage, async () => {
        await onboardingWrites.current;
        await store.waitForPendingWrites();
        await hiddenWrites.current;
      });
      store.resetAfterLocalDataRemoval();
      setOnboardingState(initialOnboardingState);
      setHiddenBuiltInIds([]);
      setHiddenError('');
      setHiddenReady(true);
      setOnboardingError('');
      setOnboardingLoadFailed(false);
      setOnboardingBypass(false);
      setEditingPersonalization(false);
      setSummary(null);
      setConfirmFinish(false);
      setTab('home');
      setConfirmReset(false);
    } catch (problem) {
      setResetError(
        problem instanceof Error
          ? problem.message
          : 'Local data could not be reset. Try again.',
      );
    } finally {
      resetInProgress.current = false;
      setResetBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <Confirmation
        visible={confirmReset}
        title="Reset CRESUM?"
        message="All local CRESUM data on this device — workouts, history, templates, active workout, hidden-workout settings, personalization and onboarding data — will be permanently deleted. This cannot be undone."
        confirmLabel="Reset local data"
        cancelLabel="Keep data"
        destructive
        busy={resetBusy}
        busyLabel="Resetting…"
        error={resetError}
        onConfirm={() => void reset()}
        onCancel={() => {
          if (resetInProgress.current) return;
          setConfirmReset(false);
          setResetError('');
        }}
      />
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
      {!ready || !onboardingReady || !hiddenReady ? (
        <View style={s.empty}>
          {busy || !onboardingReady || !hiddenReady ? (
            <ActivityIndicator color={blue} />
          ) : null}
          <Text style={s.sub}>
            {busy || !onboardingReady || !hiddenReady
              ? 'Loading your workouts…'
              : 'Saved workouts are unavailable. Retry above.'}
          </Text>
        </View>
      ) : onboardingError && showOnboarding ? (
        <View style={s.empty}>
          <Text style={s.sub} accessibilityRole="alert">
            {onboardingError}
          </Text>
          <AppButton
            title="Retry onboarding"
            onPress={() => {
              if (onboardingLoadFailed) {
                const epoch = onboardingEpoch.current;
                void onboardingRepository.load().then(
                  (state) => {
                    if (onboardingEpoch.current !== epoch) return;
                    setOnboardingState(state);
                    setOnboardingError('');
                    setOnboardingLoadFailed(false);
                  },
                  (problem: Error) => {
                    if (onboardingEpoch.current === epoch)
                      setOnboardingError(problem.message);
                  },
                );
              } else {
                void queueOnboardingSave(onboardingState).then(
                  () => setOnboardingError(''),
                  () =>
                    setOnboardingError(
                      'Onboarding progress could not be saved. Retry before closing the app.',
                    ),
                );
              }
            }}
          />
          <AppButton
            title="Continue to app"
            secondary
            onPress={() => setOnboardingBypass(true)}
          />
        </View>
      ) : showOnboarding || editingPersonalization ? (
        <Onboarding
          key={editingPersonalization ? 'edit' : 'first-run'}
          state={
            editingPersonalization
              ? {
                  ...onboardingState,
                  step:
                    onboardingState.step === 'complete'
                      ? 'goal'
                      : onboardingState.step,
                }
              : onboardingState
          }
          editing={editingPersonalization}
          busy={busy}
          onChange={saveOnboardingProgress}
          onComplete={completeOnboarding}
          onCreateWorkout={createFirstWorkout}
          onExit={() => setEditingPersonalization(false)}
        />
      ) : (
        <>
          {onboardingError ? (
            <View style={s.notice} accessibilityRole="alert">
              <Text style={s.sub}>{onboardingError}</Text>
            </View>
          ) : null}
          {tab === 'home' ? (
            <HomeDashboard
              history={data.history}
              activeWorkout={data.activeWorkout}
              onResume={() => setTab('workout')}
              templates={visibleTemplates}
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
          ) : null}
          <View
            style={tab === 'profile' ? s.profileVisible : s.profileHidden}
            pointerEvents={tab === 'profile' ? 'auto' : 'none'}
            accessibilityElementsHidden={tab !== 'profile'}
            importantForAccessibility={
              tab === 'profile' ? 'auto' : 'no-hide-descendants'
            }
          >
            <ProfileSettings
              templates={visibleTemplates}
              busy={busy || hiddenBusy}
              version={Constants.expoConfig?.version}
              createTemplate={(draft) => store.createTemplate(draft)}
              updateTemplate={(templateId, draft) =>
                store.updateTemplate(templateId, draft)
              }
              deleteTemplate={(templateId) => store.deleteTemplate(templateId)}
              duplicateTemplate={(templateId) =>
                store.duplicateTemplate(templateId)
              }
              startTemplate={startTemplate}
              hideBuiltIn={(templateId) =>
                updateHiddenBuiltIns([...hiddenBuiltInIds, templateId])
              }
              restoreBuiltIn={(templateId) =>
                updateHiddenBuiltIns(
                  hiddenBuiltInIds.filter((id) => id !== templateId),
                )
              }
              hiddenBuiltInIds={hiddenBuiltInIds}
              hiddenError={hiddenError}
              hasActiveWorkout={Boolean(data.activeWorkout)}
              onPersonalize={() => setEditingPersonalization(true)}
              onResetLocalData={() => {
                setResetError('');
                setConfirmReset(true);
              }}
            />
          </View>
          <Dock active={tab} onChange={setTab} />
        </>
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  profileVisible: { flex: 1 },
  profileHidden: { display: 'none' },
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
