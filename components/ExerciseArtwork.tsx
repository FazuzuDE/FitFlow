import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/lib/theme';

export function ExerciseArtwork({
  imageKey,
  size = 56,
}: {
  imageKey: string;
  size?: number;
}) {
  return (
    <View
      accessibilityLabel={`Artwork placeholder for ${imageKey}`}
      style={[s.placeholder, { width: size, height: size }]}
    >
      <Ionicons
        name="barbell-outline"
        size={Math.round(size * 0.42)}
        color={colors.primary}
      />
    </View>
  );
}

const s = StyleSheet.create({
  placeholder: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
});
