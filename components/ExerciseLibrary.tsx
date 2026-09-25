import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExerciseArtwork } from './ExerciseArtwork';
import { exerciseLibrary, filterExercises } from '@/lib/exercise-library';
import {
  equipmentLabel,
  equipmentTaxonomy,
  EquipmentId,
  muscleLabel,
  muscleTaxonomy,
  MuscleId,
} from '@/lib/exercise-taxonomy';
import { LibraryExercise } from '@/lib/workout-model';
import { colors, radius, spacing, typography } from '@/lib/theme';

type ExerciseLibraryProps = {
  visible: boolean;
  onClose: () => void;
  onAdd?: (exercise: LibraryExercise) => void;
  selectedIds?: readonly string[];
  onToggle?: (id: string) => void;
};

export function ExerciseLibrary({
  visible,
  onClose,
  onAdd,
  selectedIds = [],
  onToggle,
}: ExerciseLibraryProps) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleId>();
  const [equipment, setEquipment] = useState<EquipmentId>();

  const reset = () => {
    setQuery('');
    setMuscle(undefined);
    setEquipment(undefined);
  };
  const close = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setMuscle(undefined);
      setEquipment(undefined);
    }
  }, [visible]);

  const results = filterExercises(exerciseLibrary, {
    query,
    muscle,
    equipment,
  });
  const selectionMode = Boolean(onToggle);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={s.sheet}>
        <View style={s.header}>
          <View style={s.headerCopy}>
            <Text style={s.title}>Exercise Library</Text>
            <Text style={s.subtitle}>{results.length} exercises</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close exercise library"
            onPress={close}
            style={s.close}
          >
            <Text style={s.closeText}>Close</Text>
          </Pressable>
        </View>

        <TextInput
          accessibilityLabel="Search exercise library"
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          style={s.search}
        />

        <Text style={s.filterLabel}>Muscle</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroller}
          contentContainerStyle={s.filters}
        >
          <FilterChip
            label="All"
            group="muscle"
            selected={!muscle}
            onPress={() => setMuscle(undefined)}
          />
          {muscleTaxonomy.map((item) => (
            <FilterChip
              key={item.id}
              label={item.label}
              group="muscle"
              selected={muscle === item.id}
              onPress={() => setMuscle(item.id)}
            />
          ))}
        </ScrollView>

        <Text style={s.filterLabel}>Equipment</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroller}
          contentContainerStyle={s.filters}
        >
          <FilterChip
            label="All"
            group="equipment"
            selected={!equipment}
            onPress={() => setEquipment(undefined)}
          />
          {equipmentTaxonomy.map((item) => (
            <FilterChip
              key={item.id}
              label={item.label}
              group="equipment"
              selected={equipment === item.id}
              onPress={() => setEquipment(item.id)}
            />
          ))}
        </ScrollView>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={s.resultList}
          contentContainerStyle={s.results}
        >
          {results.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No exercises found</Text>
              <Text style={s.subtitle}>Try another search or filter.</Text>
            </View>
          ) : (
            results.map((exercise) => {
              const selected = selectedIds.includes(exercise.id);
              return (
                <View
                  key={exercise.id}
                  style={[s.row, selected && s.selectedRow]}
                >
                  <ExerciseArtwork imageKey={exercise.imageKey} />
                  <View style={s.copy}>
                    <Text style={s.name}>{exercise.name}</Text>
                    <Text style={s.metadata}>
                      {exercise.primaryMuscles.map(muscleLabel).join(' · ')}
                    </Text>
                    <Text style={s.metadata}>
                      {exercise.equipment.map(equipmentLabel).join(' · ')}
                    </Text>
                  </View>
                  {selectionMode ? (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel={`Select ${exercise.name}`}
                      accessibilityState={{ checked: selected }}
                      onPress={() => onToggle?.(exercise.id)}
                      style={[s.action, selected && s.selectedAction]}
                    >
                      <Text
                        style={[s.actionText, selected && s.selectedActionText]}
                      >
                        {selected ? 'Selected' : 'Select'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${selected ? 'Already added' : 'Add'} ${exercise.name}`}
                      accessibilityState={{ disabled: selected }}
                      disabled={selected}
                      onPress={() => onAdd?.(exercise)}
                      style={[s.addAction, selected && s.disabledAction]}
                    >
                      <Text
                        style={[
                          s.addActionText,
                          selected && s.disabledActionText,
                        ]}
                      >
                        {selected ? 'Added' : 'Add'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function FilterChip({
  label,
  group,
  selected,
  onPress,
}: {
  label: string;
  group: 'muscle' | 'equipment';
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filter ${group} ${label}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.filter, selected && s.selectedFilter]}
    >
      <Text style={[s.filterText, selected && s.selectedFilterText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...typography.title2, color: colors.textPrimary },
  subtitle: { ...typography.footnote, color: colors.textSecondary },
  close: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  closeText: { ...typography.headline, color: colors.primary },
  search: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  filterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterScroller: { flexGrow: 0, flexShrink: 0 },
  filters: { gap: spacing.xs, paddingVertical: spacing.xs },
  filter: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
  },
  selectedFilter: { backgroundColor: colors.primary },
  filterText: { ...typography.caption, color: colors.textSecondary },
  selectedFilterText: { color: colors.surface },
  results: { paddingVertical: spacing.sm, paddingBottom: spacing.xxl },
  resultList: { flex: 1 },
  row: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  selectedRow: { backgroundColor: colors.surfaceSubtle },
  copy: { flex: 1, minWidth: 0 },
  name: { ...typography.headline, color: colors.textPrimary, flexWrap: 'wrap' },
  metadata: { ...typography.footnote, color: colors.textSecondary },
  action: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  selectedAction: { backgroundColor: colors.primary },
  actionText: { ...typography.caption, color: colors.primary },
  selectedActionText: { color: colors.surface },
  addAction: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  addActionText: { ...typography.headline, color: colors.surface },
  disabledAction: { backgroundColor: colors.surfaceSubtle },
  disabledActionText: { color: colors.textSecondary },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary },
});
