import { BlurView } from 'expo-blur';
import { StyleSheet, View, ViewStyle } from 'react-native';
export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <BlurView intensity={24} tint="dark" style={[styles.card, style]}>
      <View style={styles.inner}>{children}</View>
    </BlurView>
  );
}
const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.10)',
    backgroundColor: 'rgba(28,28,30,.55)',
  },
  inner: { padding: 16 },
});
