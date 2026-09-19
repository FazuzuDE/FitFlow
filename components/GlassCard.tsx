import { StyleSheet, View, ViewStyle } from 'react-native';
import { cardShadow, colors, radius, spacing } from '@/lib/theme';
export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}
const styles = StyleSheet.create({
  card: {
    ...cardShadow,
    borderRadius: radius.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
});
