import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { duration } from './Workout';
import { newestFirstHistory } from '@/lib/workout-history';
import { completedSetCount } from '@/lib/workout-engine';
import { volume } from '@/lib/workout-metrics';
import { isSetComplete, type WorkoutSession } from '@/lib/workout-model';
import { colors, spacing, typography } from '@/lib/theme';

const completedAt = (workout: WorkoutSession): number =>
  workout.finishedAt ?? workout.startedAt;

const workoutMetadata = (workout: WorkoutSession): string => {
  const completed = completedSetCount(workout);
  return `${duration(completedAt(workout) - workout.startedAt)} elapsed · ${completed} completed ${completed === 1 ? 'set' : 'sets'} · ${volume(workout).toLocaleString()} kg`;
};

export function WorkoutHistory({
  history,
}: {
  history: readonly WorkoutSession[];
}) {
  const [selectedId, setSelectedId] = useState<string>();
  const ordered = useMemo(() => newestFirstHistory(history), [history]);
  const selected = ordered.find((workout) => workout.id === selectedId);

  if (selected) {
    return (
      <View style={s.section}>
        <View style={s.detailHeader}>
          <Text style={s.sectionTitle}>Workout details</Text>
          <AppButton
            title="Back to History"
            secondary
            onPress={() => setSelectedId(undefined)}
          />
        </View>
        <GlassCard style={s.detailCard}>
          <Text style={s.detailTitle}>{selected.name}</Text>
          <Text style={s.metadata}>
            {new Date(completedAt(selected)).toLocaleString()}
          </Text>
          <Text style={s.metadata}>{workoutMetadata(selected)}</Text>
          {selected.exercises.map((exercise) => {
            const completedSets = exercise.sets.filter(isSetComplete);
            return (
              <View key={exercise.id} style={s.exercise}>
                <Text style={s.exerciseName}>{exercise.name}</Text>
                {completedSets.length ? (
                  completedSets.map((set, index) => (
                    <Text key={set.id} style={s.setValue}>
                      {`Set ${index + 1} · ${set.weight} kg × ${set.reps}`}
                    </Text>
                  ))
                ) : (
                  <Text style={s.metadata}>No completed sets</Text>
                )}
              </View>
            );
          })}
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>History</Text>
      {ordered.length ? (
        ordered.map((workout) => (
          <Pressable
            key={workout.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${workout.name} workout details`}
            accessibilityHint="Shows the saved exercises, weights, and repetitions"
            onPress={() => setSelectedId(workout.id)}
            style={({ pressed }) => [s.summaryButton, pressed && s.pressed]}
          >
            <GlassCard style={s.summaryCard}>
              <Text style={s.summaryTitle} numberOfLines={2}>
                {workout.name}
              </Text>
              <Text style={s.metadata}>
                {new Date(completedAt(workout)).toLocaleString()}
              </Text>
              <Text style={s.metadata}>{workoutMetadata(workout)}</Text>
            </GlassCard>
          </Pressable>
        ))
      ) : (
        <GlassCard>
          <Text style={s.metadata}>
            Finish your first workout to see it here.
          </Text>
        </GlassCard>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.title3, color: colors.textPrimary },
  detailHeader: { gap: spacing.sm },
  summaryButton: { minHeight: 44 },
  pressed: { opacity: 0.65 },
  summaryCard: { width: '100%', gap: spacing.xxs },
  summaryTitle: { ...typography.headline, color: colors.textPrimary },
  metadata: { ...typography.footnote, color: colors.textSecondary },
  detailCard: { gap: spacing.md },
  detailTitle: { ...typography.title2, color: colors.textPrimary },
  exercise: {
    gap: spacing.xxs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  exerciseName: { ...typography.headline, color: colors.textPrimary },
  setValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
