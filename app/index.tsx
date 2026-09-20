import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { ExerciseLibrary } from '@/components/ExerciseLibrary';
import { Workout, duration, successHaptic } from '@/components/Workout';
import { volume, epley } from '@/lib/workout-metrics';
import { completedSetCount, workoutIsComplete } from '@/lib/workout-engine';
import {
  WorkoutSession as Session,
  WorkoutTemplate as Template,
  isSetComplete,
} from '@/lib/workout-model';
import {
  defaultTemplates,
  exerciseLibrary as library,
} from '@/lib/workout-catalog';
import { WorkoutRepository } from '@/lib/workout-repository';
import { WorkoutStore } from '@/lib/workout-store';
import { colors, radius, spacing, typography } from '@/lib/theme';

const blue = colors.primary,
  white = colors.surface;
function Home({
  history,
  startTemplate,
  templates,
}: {
  history: Session[];
  startTemplate: (t: Template) => void;
  templates: Template[];
}) {
  const total = history.reduce((a, x) => a + volume(x), 0);
  const last = history[0];
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>FITFLOW CORE</Text>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Good afternoon</Text>
          <Text style={s.sub}>Ready to get stronger?</Text>
        </View>
        <View style={s.avatar}>
          <Ionicons name="person" size={20} color={white} />
        </View>
      </View>
      <GlassCard>
        <Text style={s.cardLabel}>TOTAL TRAINING VOLUME</Text>
        <Text style={s.big}>
          {Math.round(total).toLocaleString()} <Text style={s.unit}>kg</Text>
        </Text>
        <Text style={s.green}>
          {history.length} completed workouts · saved locally
        </Text>
      </GlassCard>
      <View style={s.row}>
        <GlassCard style={{ flex: 1 }}>
          <Text style={s.cardLabel}>WORKOUTS</Text>
          <Text style={s.metric}>{history.length}</Text>
          <Ionicons name="flame" size={22} color={colors.warning} />
        </GlassCard>
        <GlassCard style={{ flex: 1 }}>
          <Text style={s.cardLabel}>LAST VOLUME</Text>
          <Text style={s.metric}>
            {last ? Math.round(volume(last)).toLocaleString() : '—'}{' '}
            <Text style={s.unit}>kg</Text>
          </Text>
          <Ionicons name="trophy" size={22} color={colors.warning} />
        </GlassCard>
      </View>
      <Text style={s.section}>Quick start</Text>
      {templates.map((t) => (
        <GlassCard key={t.id}>
          <View style={s.quick}>
            <View style={{ flex: 1 }}>
              <Text style={s.blueText}>{t.name.toUpperCase()}</Text>
              <Text style={s.h3}>{t.exerciseIds.length} exercises</Text>
              <Text style={s.sub}>
                {t.exerciseIds
                  .slice(0, 3)
                  .map((id) => library.find((x) => x.id === id)?.name)
                  .join(' · ')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Start ' + t.name}
              onPress={() => startTemplate(t)}
              style={s.play}
            >
              <Ionicons name="play" size={22} color={white} />
            </Pressable>
          </View>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

function Stats({ history }: { history: Session[] }) {
  const records = useMemo(() => {
    const m: Record<
      string,
      { name: string; oneRM: number; weight: number; reps: number }
    > = {};
    history.forEach((h) =>
      h.exercises.forEach((e) =>
        e.sets.filter(isSetComplete).forEach((x) => {
          const w = Number(x.weight) || 0,
            r = Number(x.reps) || 0,
            v = epley(w, r);
          if (!m[e.name] || v > m[e.name].oneRM)
            m[e.name] = { name: e.name, oneRM: v, weight: w, reps: r };
        }),
      ),
    );
    return Object.values(m).sort((a, b) => b.oneRM - a.oneRM);
  }, [history]);
  const vols = history.slice(0, 7).reverse().map(volume),
    max = Math.max(1, ...vols);
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>YOUR PROGRESS</Text>
      <Text style={s.title}>Progress</Text>
      <Text style={s.sub}>Volume and estimated strength records</Text>
      <GlassCard>
        <Text style={s.cardLabel}>TRAINING VOLUME</Text>
        <Text style={s.big}>
          {Math.round(
            history.reduce((a, x) => a + volume(x), 0),
          ).toLocaleString()}{' '}
          <Text style={s.unit}>kg</Text>
        </Text>
        <View
          accessibilityLabel={
            'Recent workout volumes in kilograms: ' + vols.join(', ')
          }
          style={s.bars}
        >
          {(vols.length ? vols : [0]).map((v, i) => (
            <View key={i} style={s.barCol}>
              <View
                style={[
                  s.bar,
                  {
                    height: Math.max(4, (60 * v) / max),
                    backgroundColor:
                      i === vols.length - 1 ? blue : colors.secondary,
                  },
                ]}
              />
              <Text style={s.day}>{i + 1}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
      <GlassCard>
        <Text style={s.h3}>Estimated 1RM</Text>
        <Text style={s.sub}>Epley formula · based on completed sets</Text>
        {records.length === 0 ? (
          <Text style={s.sub}>Complete sets to unlock records.</Text>
        ) : (
          records.slice(0, 6).map((r, i) => (
            <View key={r.name} style={s.history}>
              <View>
                <Text style={s.h3}>{r.name}</Text>
                <Text style={s.sub}>
                  {r.weight} kg × {r.reps}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.value2}>{r.oneRM.toFixed(1)} kg</Text>
                {i === 0 && <Text style={s.pr}>TOP PR</Text>}
              </View>
            </View>
          ))
        )}
      </GlassCard>
      <Text style={s.section}>History</Text>
      {history.length === 0 ? (
        <GlassCard>
          <Text style={s.sub}>Finish your first workout to see it here.</Text>
        </GlassCard>
      ) : (
        history.map((workout) => (
          <GlassCard key={workout.id}>
            <Text style={s.h3}>{workout.name}</Text>
            <Text style={s.sub}>
              {new Date(
                workout.finishedAt ?? workout.startedAt,
              ).toLocaleString()}
            </Text>
            <Text style={s.sub}>
              {duration(
                (workout.finishedAt ?? workout.startedAt) - workout.startedAt,
              )}{' '}
              elapsed · {completedSetCount(workout)} sets ·{' '}
              {volume(workout).toLocaleString()} kg
            </Text>
            {workout.exercises.map((exercise) => (
              <View key={exercise.id} style={s.historyDetail}>
                <Text style={s.h3}>{exercise.name}</Text>
                <Text style={s.sub}>
                  {exercise.sets
                    .filter(isSetComplete)
                    .map((set) => set.weight + ' kg × ' + set.reps)
                    .join(' · ') || 'No completed sets'}
                </Text>
              </View>
            ))}
          </GlassCard>
        ))
      )}
    </ScrollView>
  );
}
function Profile({
  templates,
  setTemplates,
}: {
  templates: Template[];
  setTemplates: (x: Template[]) => void;
}) {
  const [name, setName] = useState('My Workout');
  const [selected, setSelected] = useState<string[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const save = () => {
    if (!selected.length)
      return Alert.alert('Choose exercises', 'Select at least one exercise.');
    const n = [
      ...templates,
      {
        id: String(Date.now()),
        name: name.trim() || 'My Workout',
        exerciseIds: selected,
      },
    ];
    setTemplates(n);
    setSelected([]);
    setName('My Workout');
    successHaptic();
  };
  return (
    <>
      <ExerciseLibrary
        visible={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        selectedIds={selected}
        onToggle={(id) =>
          setSelected((current) =>
            current.includes(id)
              ? current.filter((item) => item !== id)
              : [...current, id],
          )
        }
      />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>YOUR TEMPLATES</Text>
        <View style={s.profile}>
          <View style={s.bigAvatar}>
            <Ionicons name="person" size={34} color={white} />
          </View>
          <Text style={s.title}>FitFlow</Text>
          <Text style={s.sub}>Local MVP · v0.3.0</Text>
        </View>
        <GlassCard>
          <Text style={s.h3}>Create workout template</Text>
          <TextInput value={name} onChangeText={setName} style={s.search} />
          {selected.length ? (
            <View style={s.selectedExercises}>
              {selected.map((id) => (
                <Text key={id} style={s.sub}>
                  {library.find((item) => item.id === id)?.name ?? id}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={s.sub}>No exercises selected.</Text>
          )}
          <AppButton
            title="Choose exercises"
            secondary
            onPress={() => setLibraryOpen(true)}
          />
          <AppButton title="Save Template" onPress={save} />
        </GlassCard>
        <GlassCard>
          <Text style={s.h3}>Saved templates</Text>
          {templates.map((t) => (
            <View key={t.id} style={s.history}>
              <View>
                <Text style={s.h3}>{t.name}</Text>
                <Text style={s.sub}>{t.exerciseIds.length} exercises</Text>
              </View>
              {!defaultTemplates.some((d) => d.id === t.id) && (
                <Pressable
                  onPress={() =>
                    setTemplates(templates.filter((x) => x.id !== t.id))
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.danger}
                  />
                </Pressable>
              )}
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </>
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
            <>
              {data.activeWorkout && (
                <View style={s.notice}>
                  <AppButton
                    title={'Resume ' + data.activeWorkout.name}
                    onPress={() => setTab('workout')}
                  />
                </View>
              )}
              <Home
                history={data.history}
                templates={data.templates}
                startTemplate={startTemplate}
              />
            </>
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
              setTemplates={(templates) => store.setTemplates(templates)}
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
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  avatar: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  row: { flexDirection: 'row', gap: spacing.sm },
  cardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  big: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  metric: {
    ...typography.title1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.xs,
  },
  unit: { ...typography.footnote, color: colors.textSecondary },
  green: { ...typography.caption, color: colors.textSecondary },
  quick: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  blueText: { ...typography.caption, color: colors.primary },
  blueButtonText: { ...typography.headline, color: colors.primary },
  h3: { ...typography.headline, color: colors.textPrimary },
  play: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { ...typography.title3, color: colors.textPrimary },
  pr: { ...typography.caption, color: colors.textSecondary },
  bars: {
    height: 88,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  barCol: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xxs,
  },
  bar: { width: 24, borderRadius: radius.sm },
  day: { ...typography.caption, color: colors.textSecondary },
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
  historyDetail: { marginTop: spacing.sm },
  value2: {
    ...typography.headline,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  search: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  selectedExercises: { gap: spacing.xxs, marginVertical: spacing.sm },
});
