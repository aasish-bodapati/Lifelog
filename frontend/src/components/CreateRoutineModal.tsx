import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout, Spacing } from '../styles/designSystem';
import { hapticService } from '../services/hapticService';
import { toastService } from '../services/toastService';
import {
  WorkoutRoutine,
  RoutineDay,
  RoutineExercise,
  workoutRoutineService,
} from '../services/workoutRoutineService';
import ExerciseSearchDropdown from './ExerciseSearchDropdown';
import { Exercise } from '../services/exerciseLibraryService';

interface CreateRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRoutine?: WorkoutRoutine | null;
}

const getDayName = (dayNumber: number): string => {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayNames[dayNumber - 1] || `Day ${dayNumber}`;
};

const CreateRoutineModal: React.FC<CreateRoutineModalProps> = ({
  visible,
  onClose,
  onSave,
  editingRoutine,
}) => {
  // Basic Info State
  const [routineName, setRoutineName] = useState(editingRoutine?.name || '');
  
  // Day/Exercise State
  const [days, setDays] = useState<RoutineDay[]>(editingRoutine?.days || []);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);
  
  // Day editing state
  const [dayExercises, setDayExercises] = useState<RoutineExercise[]>([]);

  const resetForm = () => {
    if (!editingRoutine) {
      setRoutineName('');
      setDays([]);
    }
    setCurrentDayNumber(1);
    setDayExercises([]);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      // Reset form after a short delay to avoid visual glitches
      setTimeout(() => {
        resetForm();
      }, 300);
    }
  }, [visible]);

  // Get current day data
  const getCurrentDay = () => {
    return days.find(d => d.dayNumber === currentDayNumber);
  };

  // Navigate days (circular, max 7 days)
  const handlePreviousDay = () => {
    if (currentDayNumber === 1) {
      setCurrentDayNumber(7);
    } else {
      setCurrentDayNumber(currentDayNumber - 1);
    }
    hapticService.light();
  };

  const handleNextDay = () => {
    if (currentDayNumber === 7) {
      setCurrentDayNumber(1);
    } else {
      setCurrentDayNumber(currentDayNumber + 1);
    }
    hapticService.light();
  };

  // Load current day data when day number changes
  React.useEffect(() => {
    const currentDay = getCurrentDay();
    if (currentDay) {
      setDayExercises(currentDay.exercises);
    } else {
      // New day - reset fields
      setDayExercises([]);
    }
  }, [currentDayNumber]);

  // Auto-save current day whenever exercises change (NOT when day changes)
  React.useEffect(() => {
    if (dayExercises.length === 0) return;

    // Apply defaults for any undefined values before saving
    const exercisesWithDefaults = dayExercises.map(ex => ({
      ...ex,
      sets: ex.sets ?? 3,
      reps: ex.reps ?? 10,
    }));

    const newDay: RoutineDay = {
      dayNumber: currentDayNumber,
      title: getDayName(currentDayNumber),
      focus: 'Workout',
      warmup: '',
      exercises: exercisesWithDefaults,
    };

    const existingDayIndex = days.findIndex(d => d.dayNumber === currentDayNumber);
    
    if (existingDayIndex >= 0) {
      // Update existing day
      const updatedDays = [...days];
      updatedDays[existingDayIndex] = newDay;
      setDays(updatedDays);
    } else {
      // Add new day
      setDays([...days, newDay]);
    }
  }, [dayExercises]); // Removed currentDayNumber from dependencies

  const handleExerciseSelect = (exercise: Exercise) => {
    const newExercise: RoutineExercise = {
      name: exercise.name,
      sets: 3,
      reps: 10,
      category: exercise.category,
      equipment: exercise.equipment,
    };

    setDayExercises([...dayExercises, newExercise]);
    hapticService.light();
  };

  const handleRemoveExercise = (index: number) => {
    setDayExercises(dayExercises.filter((_, i) => i !== index));
    hapticService.light();
  };

  const handleUpdateExercise = (index: number, field: 'sets' | 'reps', value: string) => {
    // Allow empty string, store actual number or default to prevent 0
    const numValue = value === '' ? undefined : (parseInt(value) || undefined);
    const updatedExercises = [...dayExercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: numValue,
    };
    setDayExercises(updatedExercises);
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      toastService.error('Error', 'Please enter a routine name');
      return;
    }
    
    if (days.length === 0) {
      toastService.error('Error', 'Please add at least one workout day');
      return;
    }

    try {
      const routine: WorkoutRoutine = {
        id: editingRoutine?.id || `custom-${Date.now()}`,
        name: routineName,
        description: `Custom routine with ${days.length} workout days`,
        goalType: 'custom',
        daysPerWeek: days.length,
        equipment: [],
        focusAreas: [],
        days,
        isCustom: true,
      };

      await workoutRoutineService.saveCustomRoutine(routine);
      hapticService.success();
      toastService.success('Success', 'Routine saved successfully!');
      resetForm();
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving routine:', error);
      toastService.error('Error', 'Failed to save routine');
    }
  };

  const renderContent = () => {
    const currentDay = getCurrentDay();
    const isDaySaved = !!currentDay;

    return (
      <ScrollView 
        style={styles.stepContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
        {/* Routine Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Routine Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., My Custom Workout"
            value={routineName}
            onChangeText={setRoutineName}
            autoFocus
          />
        </View>

        {/* Day Navigation */}
        <View style={styles.dayNavigationContainer}>
          <TouchableOpacity 
            onPress={handlePreviousDay}
            style={styles.dayNavButton}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={Colors.primary} 
            />
          </TouchableOpacity>
          
          <View style={styles.dayDisplay}>
            <Text style={styles.dayDisplayText}>{getDayName(currentDayNumber)}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleNextDay}
            style={styles.dayNavButton}
          >
            <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Day Form */}
        <>
          {/* Exercise Search */}
          <View style={styles.searchSection} pointerEvents="box-none">
            <Text style={styles.sectionTitle}>Add Exercise</Text>
            <ExerciseSearchDropdown
              value=""
              onSelect={handleExerciseSelect}
              placeholder="Search exercises..."
            />
          </View>

          {/* Exercise List */}
          {dayExercises.length > 0 && (
            <View style={styles.exerciseList}>
              <Text style={styles.sectionTitle}>Exercises ({dayExercises.length})</Text>
              {dayExercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseCardHeader}>
                    <View style={styles.exerciseIconContainer}>
                      <Ionicons
                        name="barbell"
                        size={20}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.exerciseCardInfo}>
                      <Text style={styles.exerciseCardName}>{exercise.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveExercise(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Sets and Reps Inputs */}
                  <View style={styles.exerciseInputsRow}>
                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.exerciseInputLabel}>Sets</Text>
                      <TextInput
                        style={styles.exerciseInput}
                        value={exercise.sets?.toString() || ''}
                        onChangeText={(value) => handleUpdateExercise(index, 'sets', value)}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="3"
                      />
                    </View>
                    
                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.exerciseInputLabel}>Reps</Text>
                      <TextInput
                        style={styles.exerciseInput}
                        value={exercise.reps?.toString() || ''}
                        onChangeText={(value) => handleUpdateExercise(index, 'reps', value)}
                        keyboardType="numeric"
                        maxLength={3}
                        placeholder="10"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

        </>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <View style={styles.popupContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {editingRoutine ? 'Edit Routine' : 'Create Routine'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {renderContent()}

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, days.length === 0 && styles.saveButtonDisabled]} 
                onPress={handleSaveRoutine}
                disabled={days.length === 0}
              >
                <Text style={styles.saveButtonText}>
                  Save Routine {days.length > 0 && `(${days.length} day${days.length > 1 ? 's' : ''})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 450,
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
    padding: 4,
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: 400, // Extra padding to allow comfortable scrolling
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
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusMedium,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  // Day Navigation Styles
  dayNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    marginBottom: 20,
    ...Layout.shadowSmall,
  },
  dayNavButton: {
    padding: 8,
    borderRadius: Layout.radiusMedium,
    backgroundColor: Colors.background,
  },
  dayDisplay: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  dayDisplayText: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: '700',
  },
  searchSection: {
    marginTop: 20,
    marginBottom: 12,
    zIndex: 1000, // Ensure dropdown appears above other elements
  },
  exerciseList: {
    marginTop: 20,
    zIndex: 1, // Lower z-index so it doesn't cover the dropdown
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Layout.shadowSmall,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseCardInfo: {
    flex: 1,
  },
  exerciseCardName: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  exerciseInputsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
    paddingLeft: 52, // Align with exercise name
  },
  exerciseInputGroup: {
    flex: 1,
  },
  exerciseInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  exerciseInput: {
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
});

export default CreateRoutineModal;

