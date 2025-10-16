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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, LocalWorkout } from '../../services/databaseService';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { toastService } from '../../services/toastService';
import ExerciseSearchDropdown from '../../components/ExerciseSearchDropdown';
import { Exercise } from '../../services/exerciseLibraryService';
import { getWorkoutIcon, getWorkoutColor } from '../../utils';

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
    reps?: number;
    weight?: number;
    duration?: number;
    distance?: number;
    intensity?: 'low' | 'moderate' | 'high';
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
        defaultData = {
          sets: 3,
          reps: 10,
          weight: exercise.equipment === 'bodyweight' ? 0 : 20, // 0 for bodyweight, 20kg for weights
        };
        break;
      case 'cardio':
        defaultData = {
          duration: 30, // minutes
          distance: 5, // km
          intensity: 'moderate' as const,
        };
        break;
      case 'flexibility':
        defaultData = {
          duration: 15, // minutes
          intensity: 'low' as const,
        };
        break;
      case 'sports':
        defaultData = {
          duration: 45, // minutes
          distance: 0, // varies by sport
          intensity: 'moderate' as const,
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
      // Calculate total duration
      const totalDuration = selectedExercises.reduce((sum, exercise) => sum + (exercise.duration || 0), 0);
      
      // Create workout name from exercises
      const workoutName = selectedExercises.length === 1 
        ? selectedExercises[0].name 
        : `${selectedExercises[0].name} + ${selectedExercises.length - 1} more`;

      const workoutData = {
        user_id: userState.user.id,
        name: workoutName,
        date: new Date().toISOString().split('T')[0],
        duration_minutes: totalDuration,
        notes: `Exercises: ${selectedExercises.map(ex => {
          let details = [];
          if (ex.sets && ex.reps) details.push(`${ex.sets}x${ex.reps}`);
          if (ex.weight && ex.weight > 0) details.push(`${ex.weight}kg`);
          if (ex.duration) details.push(`${ex.duration}min`);
          if (ex.distance && ex.distance > 0) details.push(`${ex.distance}km`);
          if (ex.intensity) details.push(ex.intensity);
          return `${ex.name}${details.length > 0 ? ` (${details.join(', ')})` : ''}`;
        }).join(', ')}`,
      };

      await databaseService.saveWorkout(workoutData);
      
      // Trigger sync
      await forceSync();
      
      toastService.success('Success', 'Workout logged successfully!');
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
      <View style={styles.popupContainer}>
      <View style={styles.header}>
          <Text style={styles.title}>Quick Log Workout</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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


        {/* Workout Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Details</Text>
          
          {/* Add New Exercise - Fixed at top */}
          <View style={styles.addExerciseSection}>
            <Text style={styles.addExerciseTitle}>Add Exercise</Text>
          
          <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Search and select exercises to add them automatically</Text>
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
                        size={24}
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
                    <View style={styles.exerciseInputs}>
                      {exercise.category === 'strength' && (
                        <View style={styles.inputRow}>
                          <View style={styles.inputField}>
                            <Text style={styles.inputLabel}>Sets</Text>
                            <TextInput
                              style={styles.numberInput}
                              value={exercise.sets?.toString() || ''}
                              onChangeText={(text) => {
                                const updatedExercises = [...selectedExercises];
                                updatedExercises[index].sets = parseInt(text) || 0;
                                setSelectedExercises(updatedExercises);
                              }}
                              keyboardType="numeric"
                              selectTextOnFocus
                            />
                          </View>
                          <View style={styles.inputField}>
                            <Text style={styles.inputLabel}>Reps</Text>
                            <TextInput
                              style={styles.numberInput}
                              value={exercise.reps?.toString() || ''}
                              onChangeText={(text) => {
                                const updatedExercises = [...selectedExercises];
                                updatedExercises[index].reps = parseInt(text) || 0;
                                setSelectedExercises(updatedExercises);
                              }}
                              keyboardType="numeric"
                              selectTextOnFocus
                            />
                          </View>
                          {exercise.equipment !== 'bodyweight' && (
                            <View style={styles.inputField}>
                              <Text style={styles.inputLabel}>Weight (kg)</Text>
                              <TextInput
                                style={styles.numberInput}
                                value={exercise.weight?.toString() || ''}
                                onChangeText={(text) => {
                                  const updatedExercises = [...selectedExercises];
                                  updatedExercises[index].weight = parseInt(text) || 0;
                                  setSelectedExercises(updatedExercises);
                                }}
                                keyboardType="numeric"
                                selectTextOnFocus
                              />
                            </View>
                          )}
                        </View>
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
                          <View style={styles.inputField}>
                            <Text style={styles.inputLabel}>Intensity</Text>
                            <View style={styles.intensityButtons}>
                              {(['low', 'moderate', 'high'] as const).map((level) => (
                                <TouchableOpacity
                                  key={level}
                                  style={[
                                    styles.intensityButton,
                                    exercise.intensity === level && styles.intensityButtonActive
                                  ]}
                                  onPress={() => {
                                    const updatedExercises = [...selectedExercises];
                                    updatedExercises[index].intensity = level;
                                    setSelectedExercises(updatedExercises);
                                  }}
                                >
                                  <Text style={[
                                    styles.intensityButtonText,
                                    exercise.intensity === level && styles.intensityButtonTextActive
                                  ]}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
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
                    <TouchableOpacity
                      onPress={() => handleRemoveExercise(index)}
                      style={styles.removeExerciseButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#DC3545" />
                    </TouchableOpacity>
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
    </View>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recentWorkoutCard: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  recentWorkoutName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  recentWorkoutDuration: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  exerciseDropdown: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  selectedExerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeExerciseButton: {
    padding: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
    color: '#666',
    marginLeft: 6,
  },
  durationInputContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  durationInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
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
    color: '#333',
    marginBottom: 12,
  },
  exerciseDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  durationEditInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    minWidth: 40,
    maxWidth: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    paddingVertical: 2,
  },
  durationUnit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  addExerciseSection: {
    marginBottom: 20,
  },
  addExerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  exerciseInputs: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inputField: {
    flex: 1,
    minWidth: 80,
  },
  numberInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  intensityButtons: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  intensityButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  intensityButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default QuickWorkoutLogScreen;

