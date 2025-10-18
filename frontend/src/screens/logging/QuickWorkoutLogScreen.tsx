import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, LocalWorkout } from '../../services/databaseService';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { toastService } from '../../services/toastService';
import ExerciseSearchDropdown from '../../components/ExerciseSearchDropdown';
import { Exercise } from '../../services/exerciseLibraryService';
import { getWorkoutIcon, getWorkoutColor } from '../../utils';
import { Colors, Layout, Spacing } from '../../styles/designSystem';

interface QuickWorkoutLogScreenProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const QuickWorkoutLogScreen: React.FC<QuickWorkoutLogScreenProps> = ({
  onClose,
  onSuccess,
}) => {
  const { state: userState } = useUser();
  const { forceSync } = useSync();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [selectedExercises, setSelectedExercises] = useState<Array<Exercise & { 
    sets?: number;
    reps?: number; // Keep for backward compatibility with routine exercises
    repsPerSet?: (number | string)[]; // Array of reps for each set (string during editing)
    weight?: number; // Keep for backward compatibility
    weightPerSet?: (number | string)[]; // Array of weights for each set (string during editing)
    duration?: number;
    distance?: number;
  }>>([]);

  // Recent workouts for autofill
  const [recentWorkouts, setRecentWorkouts] = useState<LocalWorkout[]>([]);

  useEffect(() => {
    loadRecentWorkouts();
  }, []);

  const loadRecentWorkouts = async () => {
    if (!userState.user?.id) return;

    try {
      const workouts = await databaseService.getWorkouts(userState.user.id, 10);
      setRecentWorkouts(workouts);
    } catch (error) {
      console.error('Error loading recent workouts:', error);
    }
  };

  const handleQuickFill = (workout: LocalWorkout) => {
    // For quick fill, we'll add the workout as a single exercise
    if (workout.name && workout.duration_minutes) {
      const quickExercise: Exercise & { duration: number } = {
        id: 'quick-' + Date.now(),
        name: workout.name,
        category: 'other',
        muscleGroups: [],
        equipment: 'other',
        difficulty: 'beginner',
        duration: workout.duration_minutes,
      };
      setSelectedExercises(prev => [...prev, quickExercise]);
    }
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    // Automatically add the exercise with default values based on category
    let defaultData: any = {};
    
    switch (exercise.category) {
      case 'strength':
        const defaultWeight = exercise.equipment === 'bodyweight' ? 0 : 20;
        defaultData = {
          sets: 3,
          repsPerSet: [10, 10, 10], // Default 10 reps for each of the 3 sets
          weightPerSet: exercise.equipment === 'bodyweight' ? [] : [defaultWeight, defaultWeight, defaultWeight],
        };
        break;
      case 'cardio':
        defaultData = {
          duration: 30, // minutes
          distance: 5, // km
        };
        break;
      case 'flexibility':
        defaultData = {
          duration: 15, // minutes
        };
        break;
      case 'sports':
        defaultData = {
          duration: 45, // minutes
          distance: 0, // varies by sport
        };
        break;
      default:
        defaultData = {
          duration: 30, // minutes
        };
    }
    
    const newExercise = {
      ...exercise,
      ...defaultData,
    };
    setSelectedExercises(prev => [...prev, newExercise]);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
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

  const handleSave = async () => {
    if (!userState.user?.id) {
      toastService.error('Error', 'User not logged in');
      return;
    }

    if (selectedExercises.length === 0) {
      toastService.error('Error', 'Please add at least one exercise');
      return;
    }

    setIsLoading(true);

    try {
      // Get current date in local timezone (not UTC)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDate = `${year}-${month}-${day}`;
      
      // Save each exercise as a separate workout entry
      for (const exercise of selectedExercises) {
        // Calculate duration for this exercise
        let duration: number;
        if (exercise.duration) {
          duration = exercise.duration;
        } else {
          // Default 10 minutes for strength exercises (just for backend requirement)
          duration = 10;
        }
        
        // Build detailed notes for this exercise
        let details = [];
        
        // For strength exercises with repsPerSet array
        if (exercise.sets && exercise.repsPerSet && exercise.repsPerSet.length > 0) {
          // Parse string values to numbers and apply defaults for any undefined/empty values
          const repsWithDefaults = exercise.repsPerSet.map(r => {
            if (r === undefined || r === '') return 10;
            return typeof r === 'string' ? (parseFloat(r) || 10) : r;
          });
          const repsDisplay = repsWithDefaults.join('-');
          details.push(`${exercise.sets} sets: ${repsDisplay} reps`);
          
          // Add weight per set if available (for weighted exercises)
          if (exercise.weightPerSet && exercise.weightPerSet.length > 0) {
            const weightsWithDefaults = exercise.weightPerSet.map(w => {
              if (w === undefined || w === '') return 20;
              return typeof w === 'string' ? (parseFloat(w) || 20) : w;
            });
            const weightDisplay = weightsWithDefaults.join('-');
            details.push(`${weightDisplay}kg`);
          }
        } else if (exercise.sets && exercise.reps) {
          // Fallback for backward compatibility
          details.push(`${exercise.sets} sets × ${exercise.reps} reps`);
          if (exercise.weight && exercise.weight > 0) details.push(`${exercise.weight}kg`);
        }
        
        if (exercise.duration) details.push(`${exercise.duration} minutes`);
        if (exercise.distance && exercise.distance > 0) details.push(`${exercise.distance}km`);
        
        const notes = details.length > 0 ? details.join(' • ') : undefined;

      const workoutData = {
        local_id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userState.user.id,
          name: exercise.name,
          date: currentDate,
          duration_minutes: duration,
          notes: notes,
      };

      await databaseService.saveWorkout(workoutData);
      }
      
      // Trigger sync after all exercises are saved
      await forceSync();
      
      const exerciseCount = selectedExercises.length;
      toastService.success(
        'Success', 
        `${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'} logged successfully!`
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving workout:', error);
      toastService.error('Error', 'Failed to log workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.popupContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Quick Log Workout</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
          >
        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentWorkouts.map((workout, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentWorkoutCard}
                  onPress={() => handleQuickFill(workout)}
                >
                  <Text style={styles.recentWorkoutName}>{workout.name}</Text>
                  <Text style={styles.recentWorkoutDuration}>
                    {workout.duration_minutes ? `${workout.duration_minutes} min` : 'No duration'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}


        {/* Add New Exercise */}
        <View style={styles.section} pointerEvents="box-none">
          <View style={styles.addExerciseSection} pointerEvents="box-none">
            <Text style={styles.addExerciseTitle}>Add Exercise</Text>
          
            <View style={styles.inputGroup} pointerEvents="box-none">
              <ExerciseSearchDropdown
                value=""
                onSelect={handleExerciseSelect}
                placeholder="Search and select an exercise..."
                style={styles.exerciseDropdown}
              />
            </View>
          </View>

          {/* Selected Exercises List - Below search */}
          {selectedExercises.length > 0 && (
            <View style={styles.selectedExercisesContainer}>
              <Text style={styles.selectedExercisesTitle}>Selected Exercises ({selectedExercises.length})</Text>
              {selectedExercises.map((exercise, index) => (
                <View key={index} style={styles.selectedExerciseCard}>
                  <View style={styles.exerciseCardHeader}>
                    <View style={styles.exerciseIconContainer}>
                      <Ionicons
                        name={getWorkoutIcon(exercise.name) as any}
                        size={20}
                        color={getWorkoutColor(exercise.name)}
                      />
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.exerciseMeta}>
                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(exercise.category) + '20' }]}>
                          <Text style={[styles.categoryText, { color: getCategoryColor(exercise.category) }]}>
                            {exercise.category}
                          </Text>
                        </View>
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
                          <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                            {exercise.difficulty}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveExercise(index)}
                      style={styles.removeExerciseButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Dynamic Inputs - Outside of header */}
                  <View style={styles.exerciseInputs}>
                      {exercise.category === 'strength' && (
                        <>
                          <View style={styles.inputRow}>
                            <View style={styles.inputField}>
                              <Text style={styles.inputLabel}>Sets</Text>
                              <TextInput
                                style={styles.numberInput}
                                value={exercise.sets?.toString() || ''}
                                onChangeText={(text) => {
                                  // If empty or invalid, set to 0 (which will hide reps inputs)
                                  if (!text || text.trim() === '') {
                                    const updatedExercises = [...selectedExercises];
                                    updatedExercises[index].sets = 0;
                                    updatedExercises[index].repsPerSet = [];
                                    updatedExercises[index].weightPerSet = [];
                                    setSelectedExercises(updatedExercises);
                                    return;
                                  }
                                  
                                  const newSets = parseInt(text);
                                  
                                  // If parsing failed, don't update
                                  if (isNaN(newSets) || newSets < 0) {
                                    return;
                                  }
                                  
                                  const updatedExercises = [...selectedExercises];
                                  const oldSets = updatedExercises[index].sets || 0;
                                  const oldRepsPerSet = updatedExercises[index].repsPerSet || [];
                                  const oldWeightPerSet = updatedExercises[index].weightPerSet || [];
                                  const isWeighted = updatedExercises[index].equipment !== 'bodyweight';
                                  
                                  // Adjust repsPerSet and weightPerSet arrays based on new sets count
                                  if (newSets > oldSets) {
                                    // Add new entries with default values
                                    const newRepsPerSet = [...oldRepsPerSet];
                                    const newWeightPerSet = [...oldWeightPerSet];
                                    for (let i = oldSets; i < newSets; i++) {
                                      newRepsPerSet.push(10);
                                      if (isWeighted) {
                                        newWeightPerSet.push(20);
                                      }
                                    }
                                    updatedExercises[index].repsPerSet = newRepsPerSet;
                                    updatedExercises[index].weightPerSet = newWeightPerSet;
                                  } else if (newSets < oldSets) {
                                    // Remove excess entries
                                    updatedExercises[index].repsPerSet = oldRepsPerSet.slice(0, newSets);
                                    updatedExercises[index].weightPerSet = oldWeightPerSet.slice(0, newSets);
                                  }
                                  
                                  updatedExercises[index].sets = newSets;
                                  setSelectedExercises(updatedExercises);
                                }}
                                keyboardType="numeric"
                                selectTextOnFocus
                                placeholder="3"
                              />
                            </View>
                          </View>
                          
                          {/* Reps and Weight inputs for each set */}
                          {exercise.sets && exercise.sets > 0 && (
                            <View style={styles.repsPerSetContainer}>
                              <Text style={styles.repsPerSetLabel}>
                                {exercise.equipment !== 'bodyweight' ? 'Reps & Weight per Set' : 'Reps per Set'}
                              </Text>
                              <View style={styles.repsPerSetRow}>
                                {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                                  <View key={setIndex} style={styles.setInputCard}>
                                    <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                                    <View style={styles.setInputRow}>
                                      <View style={styles.setInputField}>
                                        <Text style={styles.setInputLabel}>Reps</Text>
                                          <TextInput
                                            style={styles.setInput}
                                            value={exercise.repsPerSet?.[setIndex]?.toString() || ''}
                                            onChangeText={(text) => {
                                              const updatedExercises = [...selectedExercises];
                                              const repsPerSet = updatedExercises[index].repsPerSet || [];
                                              // Store as string to preserve partial inputs like "15."
                                              repsPerSet[setIndex] = text || undefined;
                                              updatedExercises[index].repsPerSet = repsPerSet;
                                              setSelectedExercises(updatedExercises);
                                            }}
                                            keyboardType="numeric"
                                            selectTextOnFocus
                                            placeholder="10"
                                          />
                                      </View>
                                      {exercise.equipment !== 'bodyweight' && (
                                        <View style={styles.setInputField}>
                                          <Text style={styles.setInputLabel}>kg</Text>
                                          <TextInput
                                            style={styles.setInput}
                                            value={exercise.weightPerSet?.[setIndex]?.toString() || ''}
                                            onChangeText={(text) => {
                                              const updatedExercises = [...selectedExercises];
                                              const weightPerSet = updatedExercises[index].weightPerSet || [];
                                              // Store as string to preserve partial inputs like "15."
                                              weightPerSet[setIndex] = text || undefined;
                                              updatedExercises[index].weightPerSet = weightPerSet;
                                              setSelectedExercises(updatedExercises);
                                            }}
                                            keyboardType="numeric"
                                            selectTextOnFocus
                                            placeholder="20"
                                          />
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </>
                      )}
                      
                      {exercise.category === 'cardio' && (
                        <View style={styles.inputRow}>
                          <View style={styles.inputField}>
                            <Text style={styles.inputLabel}>Duration (min)</Text>
                            <TextInput
                              style={styles.numberInput}
                              value={exercise.duration?.toString() || ''}
                              onChangeText={(text) => {
                                const updatedExercises = [...selectedExercises];
                                updatedExercises[index].duration = parseInt(text) || 0;
                                setSelectedExercises(updatedExercises);
                              }}
                              keyboardType="numeric"
                              selectTextOnFocus
                            />
                          </View>
                          <View style={styles.inputField}>
                            <Text style={styles.inputLabel}>Distance (km)</Text>
                            <TextInput
                              style={styles.numberInput}
                              value={exercise.distance?.toString() || ''}
                              onChangeText={(text) => {
                                const updatedExercises = [...selectedExercises];
                                updatedExercises[index].distance = parseInt(text) || 0;
                                setSelectedExercises(updatedExercises);
                              }}
                              keyboardType="numeric"
                              selectTextOnFocus
                            />
                          </View>
                        </View>
                      )}
                      
                      {(exercise.category === 'flexibility' || exercise.category === 'sports') && (
                        <View style={styles.inputRow}>
                          <View style={styles.inputField}>
                            <Text style={styles.inputLabel}>Duration (min)</Text>
                            <TextInput
                              style={styles.numberInput}
                              value={exercise.duration?.toString() || ''}
                              onChangeText={(text) => {
                                const updatedExercises = [...selectedExercises];
                                updatedExercises[index].duration = parseInt(text) || 0;
                                setSelectedExercises(updatedExercises);
                              }}
                              keyboardType="numeric"
                              selectTextOnFocus
                            />
                          </View>
                          {exercise.category === 'sports' && (
                            <View style={styles.inputField}>
                              <Text style={styles.inputLabel}>Distance (km)</Text>
            <TextInput
                                style={styles.numberInput}
                                value={exercise.distance?.toString() || ''}
                                onChangeText={(text) => {
                                  const updatedExercises = [...selectedExercises];
                                  updatedExercises[index].distance = parseInt(text) || 0;
                                  setSelectedExercises(updatedExercises);
                                }}
              keyboardType="numeric"
                                selectTextOnFocus
            />
          </View>
                          )}
                        </View>
                      )}
                      
                      {exercise.category === 'other' && (
                        <View style={styles.inputRow}>
                          <View style={styles.inputField}>
                            <Text style={styles.inputLabel}>Duration (min)</Text>
            <TextInput
                              style={styles.numberInput}
                              value={exercise.duration?.toString() || ''}
                              onChangeText={(text) => {
                                const updatedExercises = [...selectedExercises];
                                updatedExercises[index].duration = parseInt(text) || 0;
                                setSelectedExercises(updatedExercises);
                              }}
                              keyboardType="numeric"
                              selectTextOnFocus
            />
          </View>
                        </View>
                      )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Logging...' : 'Log Workout'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  keyboardAvoidingView: {
    width: '100%',
    maxWidth: 400,
  },
  popupContainer: {
    width: '100%',
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.6,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusLarge,
    ...Layout.shadowLarge,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Layout.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.textLight,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  recentWorkoutCard: {
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: Layout.radiusSmall,
    marginRight: Spacing.sm,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentWorkoutName: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  recentWorkoutDuration: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  exerciseDropdown: {
    marginBottom: 0,
  },
  inputLabel: {
    ...Typography.labelSmall,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSmall,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  selectedExerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Layout.shadowSmall,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  exerciseIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Layout.radiusSmall,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Layout.radiusSmall,
  },
  difficultyText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  removeExerciseButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  exerciseDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  durationInputContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  durationInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSmall,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  selectedExercisesContainer: {
    marginBottom: 20,
  },
  selectedExercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  exerciseDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  durationEditInput: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    minWidth: 40,
    maxWidth: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingVertical: 2,
  },
  durationUnit: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  addExerciseSection: {
    marginBottom: Spacing.xl,
  },
  addExerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  exerciseInputs: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inputField: {
    flex: 1,
    minWidth: 75,
    maxWidth: 120,
  },
  numberInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.text,
  },
  repsPerSetContainer: {
    marginTop: 12,
  },
  repsPerSetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  repsPerSetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setInputCard: {
    minWidth: 120,
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusSmall,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  setInputRow: {
    flexDirection: 'row',
    gap: 6,
  },
  setInputField: {
    flex: 1,
  },
  setInputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  setInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.text,
  },
});

export default QuickWorkoutLogScreen;

