import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/GlassCard';
import { Dock } from '@/components/Dock';
import { volume, epley } from '@/lib/workout-metrics';

const blue = '#0A84FF',
  white = '#FFF',
  secondary = '#A1A1A6',
  green = '#30D158';
type SetRow = { id: string; weight: string; reps: string; done: boolean };
type Exercise = { id: string; name: string; muscle: string; sets: SetRow[] };
type Session = {
  id: string;
  name: string;
  startedAt: number;
  finishedAt?: number;
  exercises: Exercise[];
};
type Template = { id: string; name: string; exerciseIds: string[] };
type LibraryItem = { id: string; name: string; muscle: string };
const library: LibraryItem[] = [
  { id: 'bench', name: 'Barbell Bench Press', muscle: 'Chest' },
  { id: 'incline', name: 'Incline Dumbbell Press', muscle: 'Chest' },
  { id: 'row', name: 'Seated Cable Row', muscle: 'Back' },
  { id: 'pulldown', name: 'Lat Pulldown', muscle: 'Back' },
  { id: 'press', name: 'Shoulder Press', muscle: 'Shoulders' },
  { id: 'lateral', name: 'Lateral Raise', muscle: 'Shoulders' },
  { id: 'squat', name: 'Barbell Squat', muscle: 'Legs' },
  { id: 'legpress', name: 'Leg Press', muscle: 'Legs' },
  { id: 'deadlift', name: 'Deadlift', muscle: 'Back' },
  { id: 'curl', name: 'Biceps Curl', muscle: 'Arms' },
  { id: 'triceps', name: 'Triceps Pushdown', muscle: 'Arms' },
  { id: 'calf', name: 'Standing Calf Raise', muscle: 'Legs' },
];
const defaultTemplates: Template[] = [
  {
    id: 'upper',
    name: 'Upper Body',
    exerciseIds: ['bench', 'row', 'press', 'pulldown'],
  },
  {
    id: 'push',
    name: 'Push Day',
    exerciseIds: ['bench', 'incline', 'press', 'lateral', 'triceps'],
  },
  { id: 'legs', name: 'Leg Day', exerciseIds: ['squat', 'legpress', 'calf'] },
];
const newExercise = (x: LibraryItem): Exercise => ({
  id: x.id + '-' + Date.now() + '-' + Math.random(),
  name: x.name,
  muscle: x.muscle,
  sets: [1, 2, 3].map((i) => ({
    id: String(Date.now() + i + Math.random()),
    weight: '',
    reps: '10',
    done: false,
  })),
});

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
      <Text style={s.eyebrow}>FITFLOW · V0.3</Text>
      <View style={s.head}>
        <View>
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
          <Ionicons name="flame" size={22} color="#FF9F0A" />
        </GlassCard>
        <GlassCard style={{ flex: 1 }}>
          <Text style={s.cardLabel}>LAST VOLUME</Text>
          <Text style={s.metric}>
            {last ? Math.round(volume(last)).toLocaleString() : '—'}{' '}
            <Text style={s.unit}>kg</Text>
          </Text>
          <Ionicons name="trophy" size={22} color="#FF9F0A" />
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
            <Pressable onPress={() => startTemplate(t)} style={s.play}>
              <Ionicons name="play" size={22} color={white} />
            </Pressable>
          </View>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

function Workout({
  session,
  setSession,
  finish,
}: {
  session: Session | null;
  setSession: (x: Session) => void;
  finish: () => void;
}) {
  const [rest, setRest] = useState(90);
  const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => setRest((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, [session]);
  if (!session)
    return (
      <View style={s.empty}>
        <Ionicons name="barbell-outline" size={46} color={secondary} />
        <Text style={s.h3}>No active workout</Text>
        <Text style={s.sub}>Start a template from Home.</Text>
      </View>
    );
  const mutate = (fn: (n: Session) => void) => {
    const n = JSON.parse(JSON.stringify(session)) as Session;
    fn(n);
    setSession(n);
  };
  const toggle = (ei: number, si: number) => {
    mutate(
      (n) => (n.exercises[ei].sets[si].done = !n.exercises[ei].sets[si].done),
    );
    setRest(90);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const filtered = library.filter((x) =>
    (x.name + ' ' + x.muscle).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>ACTIVE WORKOUT</Text>
        <View style={s.head}>
          <View>
            <Text style={s.title}>{session.name}</Text>
            <Text style={s.sub}>
              {session.exercises.length} exercises ·{' '}
              {Math.round(volume(session)).toLocaleString()} kg
            </Text>
          </View>
          <Pressable onPress={() => setRest(90)} style={s.timer}>
            <Text style={s.timerText}>
              {String(Math.floor(rest / 60)).padStart(2, '0')}:
              {String(rest % 60).padStart(2, '0')}
            </Text>
          </Pressable>
        </View>
        {session.exercises.map((e, ei) => (
          <GlassCard key={e.id}>
            <View style={s.exerciseHead}>
              <View>
                <Text style={s.h3}>{e.name}</Text>
                <Text style={s.sub}>{e.muscle}</Text>
              </View>
              <Text style={s.pr}>
                {e.sets.filter((x) => x.done).length}/{e.sets.length} DONE
              </Text>
            </View>
            <View style={s.labels}>
              <Text style={s.mini}>SET</Text>
              <Text style={[s.mini, { flex: 1 }]}>WEIGHT KG</Text>
              <Text style={[s.mini, { flex: 1 }]}>REPS</Text>
              <Text style={s.mini}>DONE</Text>
            </View>
            {e.sets.map((x, si) => (
              <Pressable
                key={x.id}
                onLongPress={() =>
                  mutate((n) => n.exercises[ei].sets.splice(si, 1))
                }
                style={[s.setRow, x.done && s.done]}
              >
                <Text style={s.setNum}>{si + 1}</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={x.weight}
                  onChangeText={(v) =>
                    mutate((n) => (n.exercises[ei].sets[si].weight = v))
                  }
                  style={s.input}
                />
                <TextInput
                  keyboardType="number-pad"
                  value={x.reps}
                  onChangeText={(v) =>
                    mutate((n) => (n.exercises[ei].sets[si].reps = v))
                  }
                  style={s.input}
                />
                <Pressable
                  onPress={() => toggle(ei, si)}
                  style={[s.check, x.done && s.checked]}
                >
                  <Ionicons
                    name={x.done ? 'checkmark' : 'ellipse-outline'}
                    size={18}
                    color={x.done ? white : blue}
                  />
                </Pressable>
              </Pressable>
            ))}
            <Pressable
              onPress={() =>
                mutate((n) => {
                  const p = n.exercises[ei].sets.at(-1);
                  n.exercises[ei].sets.push({
                    id: String(Date.now()),
                    weight: p?.weight || '',
                    reps: p?.reps || '10',
                    done: false,
                  });
                })
              }
              style={s.add}
            >
              <Ionicons name="add" size={18} color={blue} />
              <Text style={s.blueText}>ADD SET</Text>
            </Pressable>
          </GlassCard>
        ))}
        <Pressable onPress={() => setPicker(true)} style={s.secondaryButton}>
          <Ionicons name="add-circle-outline" size={20} color={blue} />
          <Text style={s.blueButtonText}>Add Exercise</Text>
        </Pressable>
        <Pressable onPress={finish} style={s.finish}>
          <Ionicons name="checkmark-circle" size={21} color={white} />
          <Text style={s.primaryText}>Finish Workout</Text>
        </Pressable>
        <Text style={s.hint}>Long-press a set to delete it.</Text>
      </ScrollView>
      <Modal
        visible={picker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={s.modal}>
          <View style={s.modalHead}>
            <Text style={s.title}>Exercise Library</Text>
            <Pressable onPress={() => setPicker(false)}>
              <Text style={s.blueButtonText}>Done</Text>
            </Pressable>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises or muscle"
            placeholderTextColor="#636366"
            style={s.search}
          />
          <ScrollView>
            {filtered.map((x) => (
              <Pressable
                key={x.id}
                style={s.libraryRow}
                onPress={() => {
                  mutate((n) => n.exercises.push(newExercise(x)));
                  setPicker(false);
                  setSearch('');
                }}
              >
                <View>
                  <Text style={s.h3}>{x.name}</Text>
                  <Text style={s.sub}>{x.muscle}</Text>
                </View>
                <Ionicons name="add-circle" size={28} color={blue} />
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
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
        e.sets
          .filter((x) => x.done)
          .forEach((x) => {
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
      <Text style={s.title}>Analytics</Text>
      <Text style={s.sub}>Volume and estimated strength records</Text>
      <GlassCard>
        <Text style={s.cardLabel}>TRAINING VOLUME</Text>
        <Text style={s.big}>
          {Math.round(
            history.reduce((a, x) => a + volume(x), 0),
          ).toLocaleString()}{' '}
          <Text style={s.unit}>kg</Text>
        </Text>
        <View style={s.bars}>
          {(vols.length ? vols : [0]).map((v, i) => (
            <View key={i} style={s.barCol}>
              <View
                style={[
                  s.bar,
                  {
                    height: Math.max(4, (60 * v) / max),
                    backgroundColor: i === vols.length - 1 ? blue : '#48484A',
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
      <GlassCard>
        <Text style={s.h3}>Recent workouts</Text>
        {history.length === 0 ? (
          <Text style={s.sub}>
            Finish your first workout to unlock analytics.
          </Text>
        ) : (
          history.slice(0, 6).map((x) => (
            <View key={x.id} style={s.history}>
              <View>
                <Text style={s.h3}>{x.name}</Text>
                <Text style={s.sub}>
                  {new Date(x.finishedAt || x.startedAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={s.value2}>
                {Math.round(volume(x)).toLocaleString()} kg
              </Text>
            </View>
          ))
        )}
      </GlassCard>
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>ACCOUNT & TEMPLATES</Text>
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
        <View style={s.chips}>
          {library.map((x) => {
            const on = selected.includes(x.id);
            return (
              <Pressable
                key={x.id}
                onPress={() =>
                  setSelected(
                    on
                      ? selected.filter((i) => i !== x.id)
                      : [...selected, x.id],
                  )
                }
                style={[s.chip, on && s.chipOn]}
              >
                <Text style={[s.chipText, on && { color: white }]}>
                  {x.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={save} style={s.finish}>
          <Text style={s.primaryText}>Save Template</Text>
        </Pressable>
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
                <Ionicons name="trash-outline" size={20} color="#FF453A" />
              </Pressable>
            )}
          </View>
        ))}
      </GlassCard>
    </ScrollView>
  );
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [session, setSessionState] = useState<Session | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [templates, setTemplatesState] = useState<Template[]>(defaultTemplates);
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('fitflow_history'),
      AsyncStorage.getItem('fitflow_active'),
      AsyncStorage.getItem('fitflow_templates'),
    ])
      .then(([h, a, t]) => {
        if (h) setHistory(JSON.parse(h));
        if (a) setSessionState(JSON.parse(a));
        if (t) setTemplatesState(JSON.parse(t));
      })
      .catch(() => {});
  }, []);
  const setSession = (x: Session) => {
    setSessionState(x);
    AsyncStorage.setItem('fitflow_active', JSON.stringify(x));
  };
  const setTemplates = (x: Template[]) => {
    setTemplatesState(x);
    AsyncStorage.setItem('fitflow_templates', JSON.stringify(x));
  };
  const startTemplate = (t: Template) => {
    const ex = t.exerciseIds
      .map((id) => library.find((x) => x.id === id))
      .filter(Boolean)
      .map((x) => newExercise(x!));
    const n = {
      id: String(Date.now()),
      name: t.name,
      startedAt: Date.now(),
      exercises: ex,
    };
    setSession(n);
    setTab('workout');
  };
  const finish = () => {
    if (!session) return;
    const completed = { ...session, finishedAt: Date.now() };
    const next = [completed, ...history];
    setHistory(next);
    AsyncStorage.setItem('fitflow_history', JSON.stringify(next));
    AsyncStorage.removeItem('fitflow_active');
    setSessionState(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Workout complete',
      `${Math.round(volume(completed)).toLocaleString()} kg total volume saved.`,
    );
    setTab('stats');
  };
  const render =
    tab === 'home' ? (
      <Home
        history={history}
        startTemplate={startTemplate}
        templates={templates}
      />
    ) : tab === 'workout' ? (
      <Workout session={session} setSession={setSession} finish={finish} />
    ) : tab === 'stats' ? (
      <Stats history={history} />
    ) : (
      <Profile templates={templates} setTemplates={setTemplates} />
    );
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      {render}
      <Dock active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingBottom: 120, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  eyebrow: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 30, fontWeight: '700', color: white, letterSpacing: -0.6 },
  sub: { fontSize: 14, color: secondary, marginTop: 3, lineHeight: 21 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profile: { alignItems: 'center', paddingVertical: 16 },
  row: { flexDirection: 'row', gap: 12 },
  cardLabel: {
    fontSize: 11,
    color: secondary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  big: { fontSize: 34, color: white, fontWeight: '700', letterSpacing: -1 },
  metric: { fontSize: 26, color: white, fontWeight: '700', marginBottom: 6 },
  unit: { fontSize: 14, color: secondary, fontWeight: '500' },
  green: { fontSize: 12, color: green, fontWeight: '600' },
  quick: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  blueText: {
    color: blue,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  blueButtonText: { color: blue, fontSize: 16, fontWeight: '700' },
  h3: { fontSize: 17, color: white, fontWeight: '600' },
  play: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { fontSize: 20, color: white, fontWeight: '700', marginTop: 12 },
  timer: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,149,0,.14)',
  },
  timerText: {
    color: '#FF9F0A',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  exerciseHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pr: { color: '#FF9F0A', fontSize: 11, fontWeight: '700' },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  mini: { width: 36, fontSize: 9, color: '#636366', fontWeight: '700' },
  setRow: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,.04)',
    gap: 8,
  },
  done: { backgroundColor: 'rgba(48,209,88,.08)' },
  setNum: { width: 28, color: white, fontWeight: '700' },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,.06)',
    color: white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  check: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: green, borderColor: green },
  add: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  finish: {
    height: 58,
    borderRadius: 29,
    backgroundColor: blue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  secondaryButton: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: { color: white, fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 11, color: '#636366', textAlign: 'center' },
  bars: {
    height: 85,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  barCol: {
    height: 85,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  bar: { width: 24, borderRadius: 6 },
  day: { fontSize: 10, color: '#636366' },
  history: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,.06)',
  },
  value2: { color: white, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: '#000', padding: 20 },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  search: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    color: white,
    paddingHorizontal: 16,
    fontSize: 16,
    marginVertical: 12,
  },
  libraryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  chipOn: { backgroundColor: blue, borderColor: blue },
  chipText: { fontSize: 12, color: secondary, fontWeight: '600' },
});
