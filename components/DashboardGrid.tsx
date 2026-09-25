import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/lib/theme';

export type DashboardWidgetSize = 'small' | 'medium';

export type DashboardGridItem = {
  id: string;
  size: DashboardWidgetSize;
  content: ReactNode;
};

export function DashboardGrid({ items }: { items: DashboardGridItem[] }) {
  const rows: DashboardGridItem[][] = [];
  for (const item of items) {
    const last = rows[rows.length - 1];
    if (
      item.size === 'small' &&
      last?.length === 1 &&
      last[0].size === 'small'
    ) {
      last.push(item);
    } else {
      rows.push([item]);
    }
  }

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].id} testID="dashboard-grid-row" style={styles.row}>
          {row.map((item) => (
            <View key={item.id} testID="dashboard-widget" style={styles.cell}>
              {item.content}
            </View>
          ))}
          {row[0].size === 'small' && row.length === 1 ? (
            <View style={styles.cell} accessibilityElementsHidden />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.lg, alignItems: 'stretch' },
  cell: { flex: 1, minWidth: 0 },
});
