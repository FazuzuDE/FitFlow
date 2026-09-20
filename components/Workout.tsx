import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import { Confirmation } from './Confirmation';
import { ExerciseLibrary } from './ExerciseLibrary';
import {
  addSet,
  appendExercise,
  completedSetCount,
  exerciseIdsMatch,
  extendRest,
  remainingRestSeconds,
  removeSet,
  restartRest,
  setCurrentExercise,
  skipRest,
  toggleSet,
  totalSetCount,
  updateSet,
  workoutIsComplete,
} from '@/lib/workout-engine';
import { isSetComplete, WorkoutSession } from '@/lib/workout-model';
import { volume } from '@/lib/workout-metrics';
import { colors, radius, spacing, typography } from '@/lib/theme';

export const successHaptic = () => {
  void Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success,
  ).catch(() => {});
};
export const duration = (milliseconds: number) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return [Math.floor(seconds / 60), seconds % 60]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

export function Workout({
  session,
  history,
  update,
  finish,
  busy,
}: {
  session: WorkoutSession | null;
  history: WorkoutSession[];
  update: (transform: (session: WorkoutSession) => WorkoutSession) => void;
  finish: () => void;
  busy: boolean;
}) {
  const [now, setNow] = useState(Date.now());
  const [picker, setPicker] = useState(false);
  const [inputError, setInputError] = useState('');
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const notified = useRef<number | undefined>(undefined);
  const deadline = session?.restEndsAt;
  useEffect(() => {
    if (!session?.id) return;
    const refresh = () => setNow(Date.now());
    refresh();
    const timer = setInterval(refresh, 1000);
    const subscription = AppState.addEventListener('change', refresh);
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [session?.id]);
  useEffect(() => {
    if (deadline && now >= deadline && notified.current !== deadline) {
      notified.current = deadline;
      successHaptic();
    }
  }, [deadline, now]);
  if (!session)
    return (
      <View style={s.empty}>
        <Text style={s.title}>No active workout</Text>
        <Text style={s.sub}>Choose a template from Home.</Text>
      </View>
    );
  const index = session.currentExerciseIndex;
  const exercise = session.exercises[index];
  const rest = remainingRestSeconds(session, now);
  const completed = completedSetCount(session);
  const total = totalSetCount(session);
  const previous =
    exercise &&
    history
      .flatMap((item) => item.exercises)
      .find((item) => exerciseIdsMatch(item.libraryId, exercise.libraryId))
      ?.sets.filter(isSetComplete);
  const toggle = (setIndex: number) => {
    try {
      update((current) => toggleSet(current, index, setIndex).session);
      setNow(Date.now());
      setInputError('');
      if (!isSetComplete(exercise.sets[setIndex])) successHaptic();
    } catch (error) {
      setInputError((error as Error).message);
    }
  };
  const remove = (setIndex: number) => setRemoveIndex(setIndex);
  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Confirmation
        visible={removeIndex !== null}
        title="Remove set?"
        message="This removes its entered weight and reps."
        confirmLabel="Remove set"
        cancelLabel="Keep set"
        onCancel={() => setRemoveIndex(null)}
        onConfirm={() => {
          if (removeIndex !== null)
            update((current) => removeSet(current, index, removeIndex));
          setRemoveIndex(null);
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <Text style={s.title}>{session.name}</Text>
        {inputError ? (
          <Text accessibilityRole="alert" style={s.sub}>
            {inputError}
          </Text>
        ) : null}
        <Text style={s.sub}>
          {duration(now - session.startedAt)} elapsed · {completed}/{total} sets
          · {volume(session).toLocaleString()} kg
        </Text>
        <ScrollView horizontal contentContainerStyle={s.tabs}>
          {session.exercises.map((item, i) => (
            <Pressable
              key={item.id}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ selected: index === i }}
              onPress={() =>
                update((current) => setCurrentExercise(current, i))
              }
              style={[s.tab, i === index && s.selected]}
            >
              <Text style={[s.sub, i === index && s.white]}>
                {i + 1}. {item.name}
                {item.sets.length > 0 && item.sets.every(isSetComplete)
                  ? ' ✓'
                  : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {exercise && (
          <GlassCard>
            <Text style={s.heading}>{exercise.name}</Text>
            <Text style={s.sub}>
              {exercise.muscle} · Exercise {index + 1} of{' '}
              {session.exercises.length}
            </Text>
            <Text style={s.sub}>
              {previous?.length
                ? 'Last: ' +
                  previous
                    .map((set) => set.weight + ' kg × ' + set.reps)
                    .join(' · ')
                : 'First recorded session'}
            </Text>
            <View style={s.row}>
              <Text style={s.number}>SET</Text>
              <Text style={s.column}>KG</Text>
              <Text style={s.column}>REPS</Text>
              <Text style={s.number}>DONE</Text>
            </View>
            {exercise.sets.map((set, i) => {
              const done = isSetComplete(set);
              return (
                <View key={set.id} style={s.row}>
                  <Pressable
                    style={s.target}
                    disabled={busy || exercise.sets.length === 1}
                    accessibilityLabel={'Remove set ' + (i + 1)}
                    accessibilityHint="Opens a confirmation"
                    onPress={() => remove(i)}
                  >
                    <Text style={s.body}>{i + 1}</Text>
                  </Pressable>
                  <TextInput
                    accessibilityLabel={
                      'Set ' + (i + 1) + ' weight in kilograms'
                    }
                    keyboardType="decimal-pad"
                    value={set.weight}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    editable={!done && !busy}
                    style={[s.input, done && s.completed]}
                    onChangeText={(weight) =>
                      update((current) =>
                        updateSet(current, index, i, { weight }),
                      )
                    }
                  />
                  <TextInput
                    accessibilityLabel={'Set ' + (i + 1) + ' repetitions'}
                    keyboardType="number-pad"
                    value={set.reps}
                    editable={!done && !busy}
                    style={[s.input, done && s.completed]}
                    onChangeText={(reps) =>
                      update((current) =>
                        updateSet(current, index, i, { reps }),
                      )
                    }
                  />
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel={'Complete set ' + (i + 1)}
                    accessibilityState={{ checked: done, disabled: busy }}
                    disabled={busy}
                    onPress={() => toggle(i)}
                    style={[s.target, s.check, done && s.completed]}
                  >
                    <Text style={s.body}>{done ? '✓' : '○'}</Text>
                  </Pressable>
                </View>
              );
            })}
            <AppButton
              title="Add set"
              secondary
              disabled={busy}
              onPress={() => update((current) => addSet(current, index))}
            />
          </GlassCard>
        )}
        {deadline !== undefined && (
          <GlassCard>
            <Text style={s.heading}>
              {rest > 0 ? 'Rest timer' : 'Rest complete'}
            </Text>
            <Text
              accessibilityLabel={rest + ' seconds remaining'}
              style={s.timer}
            >
              {duration(rest * 1000)}
            </Text>
            <View style={s.row}>
              <AppButton
                title="−15s"
                secondary
                disabled={busy}
                onPress={() => update((current) => extendRest(current, -15))}
              />
              <AppButton
                title="+15s"
                secondary
                disabled={busy}
                onPress={() => update((current) => extendRest(current, 15))}
              />
            </View>
            <View style={s.actions}>
              <AppButton
                title="Restart"
                secondary
                disabled={busy}
                onPress={() => update(restartRest)}
              />
              <AppButton
                title={rest ? 'Skip rest' : 'Continue'}
                secondary
                disabled={busy}
                onPress={() => update(skipRest)}
              />
            </View>
          </GlassCard>
        )}
        <AppButton
          title="Add exercise"
          secondary
          disabled={busy}
          onPress={() => setPicker(true)}
        />
        {index < session.exercises.length - 1 && (
          <AppButton
            title="Next exercise"
            secondary
            disabled={busy}
            onPress={() =>
              update((current) => setCurrentExercise(current, index + 1))
            }
          />
        )}
        <AppButton
          title={
            busy
              ? 'Saving…'
              : workoutIsComplete(session)
                ? 'Finish and save'
                : 'Finish workout'
          }
          disabled={busy || completed === 0}
          onPress={finish}
        />
      </ScrollView>
      <ExerciseLibrary
        visible={picker}
        onClose={() => setPicker(false)}
        onAdd={(item) => {
          update((current) => appendExercise(current, item));
          setPicker(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.lg },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  heading: { ...typography.title2, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textPrimary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  empty: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.md,
  },
  tabs: { gap: spacing.xs },
  tab: {
    padding: spacing.sm,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary },
  white: { color: colors.surface },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  number: {
    ...typography.caption,
    width: 44,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  column: {
    ...typography.caption,
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  target: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { borderRadius: radius.md, backgroundColor: colors.surfaceSubtle },
  input: {
    ...typography.headline,
    fontVariant: ['tabular-nums'],
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  completed: { borderColor: colors.success, borderWidth: 2 },
  timer: {
    ...typography.largeTitle,
    fontVariant: ['tabular-nums'],
    color: colors.primary,
  },
  actions: { gap: spacing.xs },
});
