import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../styles/designSystem';
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
  };

  // Get current day data
  const getCurrentDay = () => {
    return days.find(d => d.dayNumber === currentDayNumber);
  };

  // Navigate days
  const handlePreviousDay = () => {
    if (currentDayNumber > 1) {
      setCurrentDayNumber(currentDayNumber - 1);
      hapticService.light();
    }
  };

  const handleNextDay = () => {
    setCurrentDayNumber(currentDayNumber + 1);
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

  // Auto-save current day whenever exercises change
  React.useEffect(() => {
    if (dayExercises.length === 0) return;

    const newDay: RoutineDay = {
      dayNumber: currentDayNumber,
      title: `Day ${currentDayNumber}`,
      focus: 'Workout',
      warmup: '',
      exercises: dayExercises,
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
  }, [dayExercises, currentDayNumber]);

  const handleDeleteCurrentDay = () => {
    Alert.alert('Delete Day', 'Are you sure you want to delete this workout day?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setDays(days.filter(d => d.dayNumber !== currentDayNumber));
          hapticService.medium();
          toastService.success('Success', 'Day deleted');
        },
      },
    ]);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    const newExercise: RoutineExercise = {
      name: exercise.name,
      sets: 3,
      reps: 10,
    };

    setDayExercises([...dayExercises, newExercise]);
    hapticService.light();
  };

  const handleRemoveExercise = (index: number) => {
    setDayExercises(dayExercises.filter((_, i) => i !== index));
    hapticService.light();
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
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
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
            style={[styles.dayNavButton, currentDayNumber === 1 && styles.dayNavButtonDisabled]}
            disabled={currentDayNumber === 1}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={currentDayNumber === 1 ? Colors.border : Colors.primary} 
            />
          </TouchableOpacity>
          
          <View style={styles.dayDisplay}>
            <Text style={styles.dayDisplayText}>Day {currentDayNumber}</Text>
            {isDaySaved && (
              <View style={styles.savedIndicator}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.savedText}>Saved</Text>
              </View>
            )}
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
          <Text style={styles.stepTitle}>
            {isDaySaved ? 'Edit' : 'Add'} Exercises for Day {currentDayNumber}
          </Text>

          {/* Exercise Search */}
          <View style={styles.searchSection}>
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
                </View>
              ))}
            </View>
          )}

          {/* Day Actions */}
          {isDaySaved && dayExercises.length > 0 && (
            <TouchableOpacity style={styles.deleteDayButton} onPress={handleDeleteCurrentDay}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={styles.deleteDayButtonText}>Delete All Exercises</Text>
            </TouchableOpacity>
          )}

          {/* Save Routine Button */}
          {days.length > 0 && (
            <TouchableOpacity style={styles.saveRoutineButton} onPress={handleSaveRoutine}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.textLight} />
              <Text style={styles.saveRoutineButtonText}>
                Save Routine ({days.length} day{days.length > 1 ? 's' : ''})
              </Text>
            </TouchableOpacity>
          )}
        </>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editingRoutine ? 'Edit Routine' : 'Create Routine'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        {renderContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  goalTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTypeButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Layout.radiusMedium,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  goalTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  goalTypeText: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  goalTypeTextActive: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: Colors.textLight,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    padding: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chipText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '500',
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
  dayNavButtonDisabled: {
    opacity: 0.3,
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
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedText: {
    ...Typography.caption,
    color: Colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  saveRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: Layout.radiusMedium,
    marginTop: 20,
  },
  saveRoutineButtonText: {
    ...Typography.label,
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  searchSection: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  exerciseList: {
    marginTop: 20,
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
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  deleteDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Layout.radiusMedium,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.error,
    marginTop: 24,
  },
  deleteDayButtonText: {
    ...Typography.label,
    color: Colors.error,
    fontWeight: '600',
  },
});

export default CreateRoutineModal;

