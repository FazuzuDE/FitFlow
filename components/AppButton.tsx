import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';

export function AppButton({
  title,
  accessibilityLabel,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  accessibilityLabel?: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (pressed || disabled) && s.dim,
      ]}
    >
      <Text style={[s.text, secondary && s.secondaryText]}>{title}</Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  secondary: { backgroundColor: colors.surfaceSubtle },
  text: { ...typography.headline, color: colors.surface, textAlign: 'center' },
  secondaryText: { color: colors.textPrimary },
  dim: { opacity: 0.6 },
});
