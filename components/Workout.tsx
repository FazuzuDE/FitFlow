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
        <View style={s.header}>
          <View style={s.brandRow}>
            <Text style={s.brand}>CRESUM</Text>
            <Text style={s.tagline}>TRAIN. TRACK. GROW.</Text>
          </View>
          <View style={s.titleRow}>
            <Text style={s.title} accessibilityRole="header">
              {session.name}
            </Text>
            <View style={s.elapsed}>
              <Text
                style={s.elapsedText}
                accessibilityLabel={
                  duration(now - session.startedAt) + ' elapsed'
                }
              >
                {duration(now - session.startedAt)}
              </Text>
            </View>
          </View>
          <Text style={s.summary}>
            {completed}/{total} sets · {volume(session).toLocaleString()} kg
          </Text>
        </View>
        {inputError ? (
          <Text accessibilityRole="alert" style={s.error}>
            {inputError}
          </Text>
        ) : null}
        {exercise && (
          <GlassCard style={s.exerciseCard}>
            <WorkoutProgram
              key={`${session.id}:${exercise.id}`}
              session={session}
              busy={busy}
              update={update}
            />
            <Text style={s.heading} accessibilityRole="header">
              {exercise.name}
            </Text>
            <Text style={s.previous}>
              {previous?.length
                ? 'Last: ' +
                  previous
                    .map((set) => set.weight + ' kg × ' + set.reps)
                    .join(' · ')
                : 'First recorded session'}
            </Text>
            <View style={s.tableHeader}>
              <Text style={s.number}>SET</Text>
              <Text style={s.column}>KG</Text>
              <Text style={s.column}>REPS</Text>
              <Text style={s.number}>DONE</Text>
            </View>
            {exercise.sets.map((set, i) => {
              const done = isSetComplete(set);
              return (
                <View key={set.id} style={s.setRow}>
                  <Pressable
                    style={({ pressed }) => [s.target, pressed && s.dim]}
                    disabled={busy || exercise.sets.length === 1}
                    accessibilityLabel={'Remove set ' + (i + 1)}
                    accessibilityHint="Opens a confirmation"
                    onPress={() => remove(i)}
                  >
                    <Text style={s.setNumber}>{i + 1}</Text>
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
                    style={({ pressed }) => [
                      s.target,
                      s.check,
                      done && s.checked,
                      (pressed || busy) && s.dim,
                    ]}
                  >
                    <Text style={[s.checkText, done && s.checkedText]}>
                      {done ? '✓' : '○'}
                    </Text>
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
          <GlassCard style={s.restCard}>
            <View style={s.restHeading}>
              <Text style={s.heading} accessibilityRole="header">
                {rest > 0 ? 'Rest timer' : 'Rest complete'}
              </Text>
              <Text
                accessibilityLabel={rest + ' seconds remaining'}
                style={s.timer}
              >
                {duration(rest * 1000)}
              </Text>
            </View>
            <View style={s.actionRow}>
              <View style={s.action}>
                <AppButton
                  title="−15s"
                  secondary
                  disabled={busy}
                  onPress={() => update((current) => extendRest(current, -15))}
                />
              </View>
              <View style={s.action}>
                <AppButton
                  title="+15s"
                  secondary
                  disabled={busy}
                  onPress={() => update((current) => extendRest(current, 15))}
                />
              </View>
            </View>
            <View style={s.actionRow}>
              <View style={s.action}>
                <AppButton
                  title="Restart"
                  secondary
                  disabled={busy}
                  onPress={() => update(restartRest)}
                />
              </View>
              <View style={s.action}>
                <AppButton
                  title={rest ? 'Skip rest' : 'Continue'}
                  secondary
                  disabled={busy}
                  onPress={() => update(skipRest)}
                />
              </View>
            </View>
          </GlassCard>
        )}
        <View style={s.actionRow}>
          <View style={s.action}>
            <AppButton
              title="Add exercise"
              secondary
              disabled={busy}
              onPress={() => setPicker(true)}
            />
          </View>
          {index < session.exercises.length - 1 && (
            <View style={s.action}>
              <AppButton
                title="Next exercise"
                secondary
                disabled={busy}
                onPress={() =>
                  update((current) => setCurrentExercise(current, index + 1))
                }
              />
            </View>
          )}
        </View>
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

// Keyed by the current session/exercise so progression resets only the program
// presentation, leaving workout inputs, confirmations and the timer intact.
function WorkoutProgram({
  session,
  busy,
  update,
}: {
  session: WorkoutSession;
  busy: boolean;
  update: (transform: (session: WorkoutSession) => WorkoutSession) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const index = session.currentExerciseIndex;
  const exercise = session.exercises[index];
  return (
    <>
      <View style={s.exerciseTop}>
        <Text style={s.position}>
          {exercise.muscle} · Exercise {index + 1} of {session.exercises.length}
        </Text>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse exercises' : 'All exercises'}
          accessibilityState={{ expanded, disabled: busy }}
          onPress={() => setExpanded((value) => !value)}
          style={({ pressed }) => [s.programToggle, (pressed || busy) && s.dim]}
        >
          <Text style={s.programToggleText}>
            {expanded ? 'Collapse' : 'All exercises'}
          </Text>
        </Pressable>
      </View>
      {expanded && (
        <View style={s.program}>
          {session.exercises.map((item, i) => (
            <Pressable
              key={item.id}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Select exercise ${i + 1}: ${item.name}${
                item.sets.length > 0 && item.sets.every(isSetComplete)
                  ? ', completed'
                  : ''
              }`}
              accessibilityState={{ selected: index === i, disabled: busy }}
              onPress={() => {
                update((current) => setCurrentExercise(current, i));
                setExpanded(false);
              }}
              style={({ pressed }) => [
                s.programItem,
                i === index && s.selected,
                (pressed || busy) && s.dim,
              ]}
            >
              <Text style={s.programName}>
                {i + 1}. {item.name}
                {item.sets.length > 0 && item.sets.every(isSetComplete)
                  ? ' ✓'
                  : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: { gap: spacing.sm, paddingVertical: spacing.sm },
  brandRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  brand: { ...typography.caption, letterSpacing: 2, color: colors.textPrimary },
  tagline: {
    ...typography.caption,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.largeTitle, flexShrink: 1, color: colors.textPrimary },
  elapsed: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  elapsedText: {
    ...typography.headline,
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
  },
  summary: { ...typography.subheadline, color: colors.textSecondary },
  heading: { ...typography.title2, color: colors.textPrimary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  empty: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.md,
  },
  exerciseCard: {
    padding: spacing.lg,
    borderRadius: radius.xxl,
    gap: spacing.xs,
  },
  exerciseTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  position: {
    ...typography.footnote,
    flexShrink: 1,
    color: colors.textSecondary,
  },
  programToggle: {
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
  },
  programToggleText: { ...typography.footnote, color: colors.textPrimary },
  program: { gap: spacing.xs, marginVertical: spacing.xs },
  programItem: {
    padding: spacing.sm,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
  },
  programName: { ...typography.subheadline, color: colors.textPrimary },
  selected: { backgroundColor: colors.primaryTint },
  previous: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
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
    width: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: { ...typography.subheadline, color: colors.textSecondary },
  check: { borderRadius: radius.md, backgroundColor: colors.surfaceSubtle },
  checked: { backgroundColor: colors.success },
  checkText: { ...typography.title2, color: colors.primary },
  checkedText: { color: colors.textPrimary },
  input: {
    ...typography.headline,
    fontVariant: ['tabular-nums'],
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  completed: { borderColor: colors.success, borderWidth: 2 },
  restCard: {
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.primaryTint,
    gap: spacing.xs,
  },
  restHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timer: {
    ...typography.largeTitle,
    fontVariant: ['tabular-nums'],
    color: colors.primary,
  },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  action: { flexGrow: 1, flexBasis: 120, minWidth: 0 },
  dim: { opacity: 0.6 },
});
