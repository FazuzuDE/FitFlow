import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from './GlassCard';
import {
  listPerformanceExercises,
  projectExercisePerformance,
} from '@/lib/exercise-performance';
import type { ProgressPeriodId } from '@/lib/progress-periods';
import type { WorkoutSession } from '@/lib/workout-model';
import { colors, radius, spacing, typography } from '@/lib/theme';

type Props = {
  history: readonly WorkoutSession[];
  period: ProgressPeriodId;
  now: number;
};

export function ExercisePerformance({ history, period, now }: Props) {
  const [identityKey, setIdentityKey] = useState<string>();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [query, setQuery] = useState('');
  const choices = useMemo(
    () => listPerformanceExercises(history, now),
    [history, now],
  );
  const selected = choices.find((choice) => choice.identityKey === identityKey);
  const choiceLabel = (choice: (typeof choices)[number]) =>
    choices.some(
      (other) =>
        other.identityKey !== choice.identityKey &&
        other.name.toLocaleLowerCase() === choice.name.toLocaleLowerCase(),
    )
      ? `${choice.name} (${choice.sourceId})`
      : choice.name;
  const entries = useMemo(
    () =>
      identityKey
        ? projectExercisePerformance(history, period, now, identityKey)
        : [],
    [history, period, now, identityKey],
  );
  const matches = choices.filter((choice) =>
    choice.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const close = () => {
    setQuery('');
    setSelectorOpen(false);
  };

  return (
    <GlassCard>
      <Text style={s.title}>Logged exercise performance</Text>
      <Text style={s.subtitle}>Saved completed sets · weight × reps</Text>
      {choices.length === 0 ? (
        <Text style={s.empty}>
          {history.length === 0
            ? 'Finish a workout to see logged exercise performance.'
            : 'No valid completed exercise sets yet.'}
        </Text>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose exercise for logged performance"
            onPress={() => setSelectorOpen(true)}
            style={({ pressed }) => [s.choose, pressed && s.pressed]}
          >
            <Text style={s.chooseText}>
              {selected ? choiceLabel(selected) : 'Choose exercise'}
            </Text>
          </Pressable>
          {selected ? (
            entries.length === 0 ? (
              <Text style={s.empty}>
                No logged sets for this exercise in {period}.
              </Text>
            ) : (
              <View style={s.entries}>
                {entries.map((entry) => (
                  <View
                    key={`${entry.workoutId}:${entry.exerciseSnapshotId}`}
                    style={s.entry}
                  >
                    <Text style={s.date}>
                      {new Date(entry.finishedAt).toLocaleString()}
                    </Text>
                    <Text style={s.workout}>{entry.workoutName}</Text>
                    {entry.sets.map((set) => (
                      <Text key={set.id} style={s.set}>
                        {set.weight} kg × {set.reps}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )
          ) : null}
        </>
      )}
      <Modal
        visible={selectorOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={close}
      >
        <SafeAreaView style={s.sheet}>
          <View style={s.header}>
            <Text style={s.sheetTitle}>Trained exercises</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close trained exercises"
              onPress={close}
              style={s.close}
            >
              <Text style={s.closeText}>Close</Text>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Search trained exercises"
            value={query}
            onChangeText={setQuery}
            placeholder="Search trained exercises"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            style={s.search}
          />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.results}
          >
            {matches.length === 0 ? (
              <Text style={s.empty}>No trained exercises found.</Text>
            ) : (
              matches.map((choice) => (
                <Pressable
                  key={choice.identityKey}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${choiceLabel(choice)} performance`}
                  accessibilityState={{
                    selected: choice.identityKey === identityKey,
                  }}
                  onPress={() => {
                    setIdentityKey(choice.identityKey);
                    close();
                  }}
                  style={({ pressed }) => [s.result, pressed && s.pressed]}
                >
                  <Text style={s.resultText}>{choiceLabel(choice)}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  title: { ...typography.title3, color: colors.textPrimary },
  subtitle: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  empty: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  choose: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  chooseText: { ...typography.body, color: colors.primary },
  entries: { marginTop: spacing.sm },
  entry: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  date: { ...typography.footnote, color: colors.textSecondary },
  workout: {
    ...typography.headline,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  set: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xxs,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sheetTitle: { ...typography.title2, color: colors.textPrimary, flex: 1 },
  close: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { ...typography.headline, color: colors.primary },
  search: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  results: { paddingBottom: spacing.xxl },
  result: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  resultText: { ...typography.body, color: colors.textPrimary },
  pressed: { opacity: 0.6 },
});
