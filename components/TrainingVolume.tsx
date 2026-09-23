import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from './GlassCard';
import type { WorkoutVolume } from '@/lib/progress-analytics';
import type { ProgressPeriodId } from '@/lib/progress-periods';
import { colors, radius, spacing, typography } from '@/lib/theme';

type Props = {
  totalVolume: number;
  workoutVolumes: readonly WorkoutVolume[];
  period: ProgressPeriodId;
};

const shortDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
  });
const fullDate = (timestamp: number) => new Date(timestamp).toLocaleString();
const volumeNumber = (volume: number) =>
  volume < 1e12 && Number.isInteger(volume)
    ? volume.toLocaleString()
    : volume.toString();
const volumeLabel = (volume: number) => `${volumeNumber(volume)} kg`;
const pointLabel = (point: WorkoutVolume) =>
  `${point.workoutName}, ${fullDate(point.finishedAt)}, ${volumeLabel(point.volume)}`;

export function TrainingVolume({ totalVolume, workoutVolumes, period }: Props) {
  const [allOpen, setAllOpen] = useState(false);
  const recent = workoutVolumes.slice(0, 7).reverse();
  const max = Math.max(1, ...recent.map((point) => point.volume));

  return (
    <GlassCard>
      <Text style={s.cardLabel}>TRAINING VOLUME</Text>
      <Text style={s.big}>
        {volumeNumber(totalVolume)} <Text style={s.unit}>kg</Text>
      </Text>
      <Text style={s.subtitle}>
        {workoutVolumes.length} completed workouts in {period}
      </Text>
      {recent.length === 0 ? (
        <Text style={s.empty}>No workouts in this period yet.</Text>
      ) : (
        <>
          <Text style={s.context}>
            Recent workouts · {recent.length} of {workoutVolumes.length} in{' '}
            {period}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityLabel={
              'Recent workout volumes in kilograms: ' +
              recent.map(pointLabel).join('; ')
            }
            contentContainerStyle={s.chart}
          >
            {recent.map((point, index) => (
              <View
                key={point.workoutId}
                accessible
                accessibilityLabel={`Workout volume: ${pointLabel(point)}`}
                style={s.column}
              >
                <View style={s.barSlot}>
                  <View
                    style={[
                      s.bar,
                      {
                        height:
                          point.volume === 0
                            ? 0
                            : Math.max(
                                0,
                                Math.min(60, (point.volume / max) * 60),
                              ),
                        backgroundColor:
                          index === recent.length - 1
                            ? colors.primary
                            : colors.secondary,
                      },
                    ]}
                  />
                </View>
                <Text style={s.date}>{shortDate(point.finishedAt)}</Text>
              </View>
            ))}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View all ${workoutVolumes.length} workout volumes in ${period}`}
            onPress={() => setAllOpen(true)}
            style={({ pressed }) => [s.viewAll, pressed && s.pressed]}
          >
            <Text style={s.viewAllText}>View all workouts in {period}</Text>
          </Pressable>
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
            <View style={s.headerCopy}>
              <Text style={s.title}>Workout volumes</Text>
              <Text style={s.subtitle}>
                All {workoutVolumes.length} workouts in {period}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close workout volumes"
              onPress={() => setAllOpen(false)}
              style={({ pressed }) => [s.close, pressed && s.pressed]}
            >
              <Text style={s.closeText}>Close</Text>
            </Pressable>
          </View>
          <FlatList
            data={workoutVolumes}
            keyExtractor={(item) => item.workoutId}
            contentContainerStyle={s.list}
            renderItem={({ item }) => (
              <View
                accessible
                accessibilityLabel={pointLabel(item)}
                style={s.row}
              >
                <Text style={s.rowDate}>{fullDate(item.finishedAt)}</Text>
                <Text style={s.rowName}>{item.workoutName}</Text>
                <Text style={s.rowVolume}>{volumeLabel(item.volume)}</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </GlassCard>
  );
}

const s = StyleSheet.create({
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
  unit: { ...typography.footnote, color: colors.textSecondary },
  subtitle: { ...typography.footnote, color: colors.textSecondary },
  empty: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  context: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  chart: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  column: { minWidth: 52, alignItems: 'center', gap: spacing.xxs },
  barSlot: { height: 60, justifyContent: 'flex-end' },
  bar: { width: 24, borderRadius: radius.sm },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  viewAll: { minHeight: 44, justifyContent: 'center', marginTop: spacing.xs },
  viewAllText: { ...typography.headline, color: colors.primary },
  pressed: { opacity: 0.6 },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...typography.title2, color: colors.textPrimary },
  close: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { ...typography.headline, color: colors.primary },
  list: { paddingBottom: spacing.xxl },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    gap: spacing.xxs,
  },
  rowDate: { ...typography.footnote, color: colors.textSecondary },
  rowName: { ...typography.headline, color: colors.textPrimary },
  rowVolume: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
