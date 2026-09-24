import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { EstimatedOneRepMaxPoint } from '@/lib/exercise-performance';
import type { ProgressPeriodId } from '@/lib/progress-periods';
import { colors, spacing, typography } from '@/lib/theme';

type Props = {
  points: readonly EstimatedOneRepMaxPoint[];
  period: ProgressPeriodId;
};

const estimate = (value: number) =>
  (value > 0 && value < 0.05) || value >= 1e12
    ? value.toString()
    : value.toFixed(1);
const pointLabel = (point: EstimatedOneRepMaxPoint) =>
  `Estimated 1RM: ${point.workoutName}, ${new Date(point.finishedAt).toLocaleString()}, ` +
  `${estimate(point.estimatedOneRepMax)} kg estimated from ${point.weight} kg × ${point.reps}`;

function PointRow({ point }: { point: EstimatedOneRepMaxPoint }) {
  return (
    <View accessible accessibilityLabel={pointLabel(point)} style={s.row}>
      <Text style={s.date}>{new Date(point.finishedAt).toLocaleString()}</Text>
      <Text style={s.workout}>{point.workoutName}</Text>
      <Text style={s.value}>
        {estimate(point.estimatedOneRepMax)} kg estimated
      </Text>
      <Text style={s.source}>
        From {point.weight} kg × {point.reps}
      </Text>
    </View>
  );
}

export function EstimatedOneRepMaxSeries({ points, period }: Props) {
  const [allOpen, setAllOpen] = useState(false);
  const recent = points.slice(-3);
  return (
    <View style={s.section}>
      <Text style={s.title}>Estimated 1RM · per workout</Text>
      {points.length === 0 ? (
        <Text style={s.note}>
          No estimated 1RM data for this exercise in {period}.
        </Text>
      ) : (
        <>
          <Text style={s.note}>
            {points.length === 1
              ? 'One saved estimate; no trend yet.'
              : `Recent ${recent.length} of ${points.length} workouts in ${period} · oldest to newest`}
          </Text>
          {recent.map((point) => (
            <PointRow key={point.workoutId} point={point} />
          ))}
          {points.length > recent.length ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View all ${points.length} estimated 1RM points in ${period}`}
              onPress={() => setAllOpen(true)}
              style={({ pressed }) => [s.viewAll, pressed && s.pressed]}
            >
              <Text style={s.action}>View all estimates in {period}</Text>
            </Pressable>
          ) : null}
        </>
      )}
      <Modal
        visible={allOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAllOpen(false)}
      >
        <SafeAreaView style={s.sheet}>
          <View style={s.header}>
            <Text style={s.sheetTitle}>Estimated 1RM · {period}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close estimated 1RM points"
              onPress={() => setAllOpen(false)}
              style={s.close}
            >
              <Text style={s.action}>Close</Text>
            </Pressable>
          </View>
          <FlatList
            data={points}
            keyExtractor={(point) => point.workoutId}
            contentContainerStyle={s.list}
            renderItem={({ item }) => <PointRow point={item} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginTop: spacing.lg },
  title: { ...typography.headline, color: colors.textPrimary },
  note: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  date: { ...typography.footnote, color: colors.textSecondary },
  workout: { ...typography.headline, color: colors.textPrimary },
  value: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  source: { ...typography.footnote, color: colors.textSecondary },
  viewAll: { minHeight: 44, justifyContent: 'center' },
  action: { ...typography.headline, color: colors.primary },
  pressed: { opacity: 0.6 },
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
  close: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  list: { paddingBottom: spacing.xxl },
});
