import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';
const tabs = [
  ['home', 'Home', 'home-outline'],
  ['workout', 'Workout', 'barbell-outline'],
  ['progress', 'Progress', 'stats-chart-outline'],
  ['profile', 'Profile', 'person-outline'],
] as const;
export function Dock({
  active,
  onChange,
}: {
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <BlurView intensity={25} tint="light" style={s.dock}>
      {tabs.map(([id, label, icon]) => (
        <Pressable
          key={id}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === id }}
          onPress={() => onChange(id)}
          style={s.item}
        >
          <Ionicons
            name={icon}
            size={24}
            color={active === id ? colors.primary : colors.textSecondary}
          />
          <Text style={[s.label, active === id && s.selected]}>{label}</Text>
        </Pressable>
      ))}
    </BlurView>
  );
}
const s = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  item: {
    flex: 1,
    minHeight: 64,
    minWidth: 44,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.caption, color: colors.textSecondary },
  selected: { color: colors.primary },
});
