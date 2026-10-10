import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from './GlassCard';
import { Ionicons } from '@expo/vector-icons';
import type { VolumeComparison } from '@/lib/progress-volume-comparison';
import type { WorkoutVolume } from '@/lib/progress-analytics';
import type { ProgressPeriodId } from '@/lib/progress-periods';
import {
  colors,
  progressTypography,
  radius,
  spacing,
  typography,
} from '@/lib/theme';
import { volumeChartScale, volumeChartTick } from '@/lib/training-volume-chart';

type Props = {
  totalVolume: number;
  workoutVolumes: readonly WorkoutVolume[];
  period: ProgressPeriodId;
  comparison?: VolumeComparison;
};

const shortMonth = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
  });
const fullDate = (timestamp: number) => new Date(timestamp).toLocaleString();
const volumeNumber = (volume: number) =>
  volume < 1e12 && Number.isInteger(volume)
    ? volume.toLocaleString()
    : volume.toString();
const volumeLabel = (volume: number) => `${volumeNumber(volume)} kg`;
const pointLabel = (point: WorkoutVolume) =>
  `${point.workoutName}, ${fullDate(point.finishedAt)}, ${volumeLabel(point.volume)}`;

export function TrainingVolume({
  totalVolume,
  workoutVolumes,
  period,
  comparison,
}: Props) {
  const [allOpen, setAllOpen] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number>();
  const recent = workoutVolumes.slice(0, 7).reverse();
  const scale = volumeChartScale(recent.map((point) => point.volume));
  const textScale = Math.max(1, fontScale);
  const plotHeight = spacing.xxxl * 2 * textScale;
  const axisWidth = Math.max(
    spacing.xxl,
    ...scale.ticks.map(
      (tick) =>
        volumeChartTick(tick).length *
        progressTypography.chart.fontSize *
        0.5 *
        textScale,
    ),
  );
  const chartWidth =
    measuredWidth ?? Math.max(0, Math.min(width, 600) - spacing.md * 4);
  const columnsPerRow = Math.max(
    1,
    Math.min(
      7,
      Math.floor(
        (chartWidth - axisWidth - spacing.xs + spacing.xxs) /
          (spacing.lg * textScale + spacing.xxs),
      ),
    ),
  );
  const columnCount = Math.max(1, Math.min(columnsPerRow, recent.length));
  const columnWidth = Math.max(
    1,
    Math.min(
      spacing.xxxl * textScale,
      (chartWidth - axisWidth - spacing.xs - (columnCount - 1) * spacing.xxs) /
        columnCount,
    ),
  );
  const valueLines = Math.max(
    1,
    ...recent.map((point) =>
      Math.ceil(
        (volumeNumber(point.volume).length *
          progressTypography.chartValue.fontSize *
          0.6 *
          textScale) /
          columnWidth,
      ),
    ),
  );
  const largest = Math.max(0, ...recent.map((point) => point.volume));
  const labelRoom = Math.max(
    0,
    valueLines * progressTypography.chartValue.lineHeight * textScale +
      spacing.xxs -
      plotHeight * (1 - largest / scale.upper),
  );
  const rows = Array.from(
    { length: Math.ceil(recent.length / columnsPerRow) },
    (_, index) =>
      recent.slice(index * columnsPerRow, (index + 1) * columnsPerRow),
  );
  const changeColor =
    comparison?.kind === 'increase'
      ? colors.volumeIncrease
      : comparison?.kind === 'decrease'
        ? colors.volumeDecrease
        : colors.textSecondary;
  const changeAmount =
    comparison && comparison.kind !== 'unavailable'
      ? volumeNumber(Number(Math.abs(comparison.delta).toPrecision(12)))
      : undefined;
  const changeText =
    !comparison || comparison.kind === 'unavailable'
      ? 'No comparison data'
      : comparison.kind === 'unchanged'
        ? 'No change'
        : `${comparison.delta > 0 ? '+' : '−'}${changeAmount} kg`;
  const changeLabel =
    !comparison || comparison.kind === 'unavailable'
      ? 'No comparison data for training volume'
      : comparison.kind === 'unchanged'
        ? 'Training volume unchanged vs previous period'
        : `Training volume ${comparison.kind === 'increase' ? 'increased' : 'decreased'} by ${changeAmount} kg vs previous period`;

  return (
    <GlassCard style={s.card}>
      <Text style={s.cardLabel}>TRAINING VOLUME</Text>
      <View style={s.totalRow}>
        <Text style={[s.big, { flexBasis: spacing.xxxl * 4 * textScale }]}>
          {volumeNumber(totalVolume)} <Text style={s.unit}>kg</Text>
        </Text>
        {comparison ? (
          <View
            accessible
            accessibilityLabel={changeLabel}
            style={s.comparison}
          >
            <View style={s.changeRow}>
              {(comparison.kind === 'increase' ||
                comparison.kind === 'decrease') && (
                <Ionicons
                  name={
                    comparison.kind === 'increase' ? 'arrow-up' : 'arrow-down'
                  }
                  size={16 * textScale}
                  color={changeColor}
                  accessible={false}
                />
              )}
              <Text style={[s.change, { color: changeColor }]}>
                {changeText}
              </Text>
            </View>
            <Text style={s.subtitle}>vs previous period</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.subtitle}>
        {workoutVolumes.length} completed workouts in {period}
      </Text>
      {recent.length === 0 ? (
        <Text style={s.empty}>No workouts in this period yet.</Text>
      ) : (
        <>
          <View style={s.chartHeader}>
            <Text style={s.context}>
              Recent workouts · {recent.length} of {workoutVolumes.length}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View all ${workoutVolumes.length} workout volumes in ${period}`}
              onPress={() => setAllOpen(true)}
              style={({ pressed }) => [s.viewAll, pressed && s.pressed]}
            >
              <Text style={s.viewAllText}>View all workouts in {period}</Text>
            </Pressable>
          </View>
          <View
            accessibilityLabel={
              'Recent workout volumes in kilograms: ' +
              recent.map(pointLabel).join('; ')
            }
          >
            <View
              accessibilityLabel="Workout volume chart"
              onLayout={(event) =>
                setMeasuredWidth(event.nativeEvent.layout.width)
              }
              style={s.chartRows}
            >
              {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={s.plotRow}>
                  <View
                    accessibilityLabel="Workout volume scale in kilograms"
                    style={{ width: axisWidth }}
                  >
                    {scale.ticks.map((tick, index) => (
                      <Text
                        key={index}
                        style={[
                          s.axisLabel,
                          {
                            top:
                              labelRoom +
                              (index * plotHeight) / 4 -
                              (progressTypography.chart.lineHeight *
                                textScale) /
                                2,
                          },
                        ]}
                      >
                        {volumeChartTick(tick)}
                      </Text>
                    ))}
                  </View>
                  <View style={s.plot}>
                    <View
                      pointerEvents="none"
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      style={[s.grid, { top: labelRoom, height: plotHeight }]}
                    >
                      {scale.ticks.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            s.gridLine,
                            { top: (index * plotHeight) / 4 },
                          ]}
                        />
                      ))}
                    </View>
                    <View style={s.columns}>
                      {row.map((point) => (
                        <View
                          key={point.workoutId}
                          accessible
                          accessibilityLabel={`Workout volume: ${pointLabel(point)}`}
                          style={[
                            s.column,
                            { maxWidth: spacing.xxxl * textScale },
                          ]}
                        >
                          <View
                            style={[
                              s.barSlot,
                              { height: plotHeight + labelRoom },
                            ]}
                          >
                            <Text style={s.pointValue}>
                              {volumeNumber(point.volume)}
                            </Text>
                            <View
                              style={[
                                s.bar,
                                {
                                  height: Math.max(
                                    0,
                                    Math.min(
                                      plotHeight,
                                      (point.volume / scale.upper) * plotHeight,
                                    ),
                                  ),
                                  backgroundColor:
                                    point.workoutId === recent.at(-1)?.workoutId
                                      ? colors.primary
                                      : colors.secondary,
                                },
                              ]}
                            />
                          </View>
                          <View style={s.date}>
                            <Text style={s.day}>
                              {new Date(point.finishedAt).toLocaleDateString(
                                undefined,
                                { day: 'numeric' },
                              )}
                            </Text>
                            <Text style={s.month}>
                              {shortMonth(point.finishedAt)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
                <View style={s.rowCopy}>
                  <Text style={s.rowDate}>{fullDate(item.finishedAt)}</Text>
                  <Text style={s.rowName}>{item.workoutName}</Text>
                </View>
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
  card: { padding: spacing.md, borderRadius: radius.xxl },
  cardLabel: {
    ...progressTypography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
    letterSpacing: 1,
  },
  big: {
    ...progressTypography.statistic,
    color: colors.textEmphasis,
    fontVariant: ['tabular-nums'],
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: '100%',
  },
  totalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  comparison: { alignItems: 'flex-end', marginLeft: 'auto', maxWidth: '100%' },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    maxWidth: '100%',
  },
  change: {
    ...progressTypography.comparison,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    textAlign: 'right',
  },
  unit: { ...progressTypography.unit, color: colors.textSecondary },
  subtitle: { ...typography.footnote, color: colors.textSecondary },
  empty: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  context: {
    ...typography.footnote,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pointValue: {
    ...progressTypography.chartValue,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    zIndex: 1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    alignSelf: 'stretch',
    marginBottom: spacing.xxs,
  },
  chartRows: { gap: spacing.lg },
  plotRow: { flexDirection: 'row', gap: spacing.xs },
  plot: { flex: 1, minWidth: 0 },
  grid: { position: 'absolute', left: 0, right: 0 },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderColor: colors.separator,
    borderStyle: 'dashed',
  },
  axisLabel: {
    ...progressTypography.chart,
    fontVariant: ['tabular-nums'],
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'right',
    color: colors.textSecondary,
  },
  columns: { flexDirection: 'row', gap: spacing.xxs },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barSlot: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    maxWidth: spacing.xl,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  date: { alignItems: 'center' },
  day: {
    ...progressTypography.chartDay,
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
    textAlign: 'center',
  },
  month: {
    ...progressTypography.chart,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
    textAlign: 'center',
  },
  viewAll: { minHeight: 44, justifyContent: 'center' },
  viewAllText: { ...typography.footnote, color: colors.primary },
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    gap: spacing.sm,
  },
  rowCopy: { flex: 1, minWidth: 120, gap: spacing.xxs },
  rowDate: { ...typography.footnote, color: colors.textSecondary },
  rowName: { ...typography.headline, color: colors.textPrimary },
  rowVolume: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    textAlign: 'right',
  },
});
