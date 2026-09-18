import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
const tabs = [
  ['home', 'Home', 'home-outline'],
  ['workout', 'Workout', 'barbell-outline'],
  ['stats', 'Stats', 'stats-chart-outline'],
  ['profile', 'Profile', 'person-outline'],
] as const;
export function Dock({
  active,
  onChange,
}: {
  active: string;
  onChange: (x: string) => void;
}) {
  return (
    <BlurView intensity={45} tint="dark" style={s.dock}>
      {tabs.map(([id, label, icon]) => (
        <Pressable
          key={id}
          onPress={() => onChange(id)}
          style={[s.item, active === id && s.active]}
        >
          <Ionicons
            name={icon as any}
            size={22}
            color={active === id ? '#0A84FF' : '#8E8E93'}
          />
          <Text style={[s.label, active === id && s.blue]}>{label}</Text>
        </Pressable>
      ))}
    </BlurView>
  );
}
const s = StyleSheet.create({
  dock: {
    position: 'absolute',
    bottom: 22,
    left: 61,
    right: 61,
    height: 64,
    borderRadius: 28,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.12)',
  },
  item: {
    width: 58,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: 'rgba(10,132,255,.12)' },
  label: { fontSize: 10, color: '#8E8E93', marginTop: 3, fontWeight: '600' },
  blue: { color: '#0A84FF' },
});
