import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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

      {isOpen && (
        <View style={styles.dropdownContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={16} color={Colors.textSecondary} />
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
                <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.exercisesList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.exerciseItem}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseIconContainer}>
                      <Ionicons
                        name={getWorkoutIcon(item.name) as any}
                        size={16}
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
                    <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
                  </View>

                  {item.description && (
                    <Text style={styles.exerciseDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={32} color={Colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>No exercises found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
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
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Layout.shadowMedium,
    zIndex: 1000,
    maxHeight: 300,
    marginTop: Spacing.xs,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusSmall,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    margin: Spacing.sm,
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
    maxHeight: 200,
  },
  exerciseItem: {
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.sm,
    marginVertical: 2,
    padding: Spacing.sm,
    borderRadius: Layout.radiusSmall,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.label,
    fontSize: 14,
    marginBottom: 2,
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
    fontSize: 10,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radiusSmall,
  },
  difficultyText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  exerciseDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 16,
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
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  emptyStateTitle: {
    ...Typography.label,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ExerciseSearchDropdown;
