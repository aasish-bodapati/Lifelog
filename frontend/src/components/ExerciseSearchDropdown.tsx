import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exerciseLibraryService, Exercise } from '../services/exerciseLibraryService';
import { getWorkoutIcon, getWorkoutColor } from '../utils';
import { CommonStyles, Layout, Colors, Typography, Spacing } from '../styles/designSystem';

interface ExerciseSearchDropdownProps {
  value: string;
  onSelect: (exercise: Exercise) => void;
  placeholder?: string;
  style?: any;
}

const { width } = Dimensions.get('window');

const ExerciseSearchDropdown: React.FC<ExerciseSearchDropdownProps> = ({
  value,
  onSelect,
  placeholder = 'Search exercises...',
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial popular exercises
  useEffect(() => {
    if (isOpen && searchResults.length === 0) {
      setSearchResults(exerciseLibraryService.getPopularExercises());
    }
  }, [isOpen]);

  // Search exercises with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const results = exerciseLibraryService.searchExercises(searchQuery, 20);
      setSearchResults(results);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Set selected exercise when value changes
  useEffect(() => {
    if (value && !selectedExercise) {
      const exercise = exerciseLibraryService.getExerciseById(value);
      if (exercise) {
        setSelectedExercise(exercise);
      }
    }
  }, [value]);

  const handleSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setSearchQuery('');
    setIsOpen(false);
    onSelect(exercise);
  };

  const handleClear = () => {
    setSelectedExercise(null);
    setSearchQuery('');
    onSelect({} as Exercise); // Clear selection
  };

  const getCategoryColor = (category: Exercise['category']) => {
    switch (category) {
      case 'strength': return '#4ECDC4';
      case 'cardio': return '#FF6B6B';
      case 'flexibility': return '#A29BFE';
      case 'sports': return '#45B7D1';
      default: return '#8E8E93';
    }
  };

  const getDifficultyColor = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#8E8E93';
    }
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseIconContainer}>
          <Ionicons
            name={getWorkoutIcon(item.name) as any}
            size={20}
            color={getWorkoutColor(item.name)}
          />
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <View style={styles.exerciseMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
              <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                {item.category}
              </Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                {item.difficulty}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
      </View>
      
      {item.description && (
        <Text style={styles.exerciseDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.exerciseDetails}>
        <Text style={styles.equipmentText}>
          <Ionicons name="fitness" size={12} color={Colors.textSecondary} />
          {' '}{item.equipment}
        </Text>
        <Text style={styles.muscleGroupsText}>
          <Ionicons name="body" size={12} color={Colors.textSecondary} />
          {' '}{item.muscleGroups.join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.inputContent}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <Text style={[styles.inputText, !selectedExercise && styles.placeholder]}>
            {selectedExercise ? selectedExercise.name : placeholder}
          </Text>
        </View>
        {selectedExercise && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Exercise</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search exercises..."
                placeholderTextColor={Colors.textSecondary}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            style={styles.exercisesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>No exercises found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Try searching with different keywords
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    ...CommonStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  inputContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    ...Typography.body,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  clearButton: {
    marginRight: Spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalTitle: {
    ...Typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusMedium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  clearSearchButton: {
    marginLeft: Spacing.sm,
  },
  exercisesList: {
    flex: 1,
  },
  exerciseItem: {
    ...CommonStyles.card,
    marginHorizontal: Layout.screenPadding,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.label,
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radiusSmall,
  },
  categoryText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radiusSmall,
  },
  difficultyText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  exerciseDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  equipmentText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  muscleGroupsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.xxxl,
  },
  emptyStateTitle: {
    ...Typography.h3,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ExerciseSearchDropdown;
