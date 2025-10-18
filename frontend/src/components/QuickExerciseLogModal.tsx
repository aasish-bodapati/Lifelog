import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout, Spacing } from '../styles/designSystem';
import { RoutineExercise } from '../services/workoutRoutineService';
import { hapticService } from '../services/hapticService';

interface QuickExerciseLogModalProps {
  visible: boolean;
  exercise: RoutineExercise | null;
  onClose: () => void;
  onSave: (exercise: RoutineExercise, repsPerSet: (number | string)[], weightPerSet?: (number | string)[]) => void;
}

// Helper function to detect if exercise is bodyweight
const isExerciseBodyweight = (exercise: RoutineExercise): boolean => {
  const exerciseName = exercise.name.toLowerCase();
  
  if (exercise.equipment) {
    // If equipment is set, trust it
    return exercise.equipment === 'bodyweight';
  } else {
    // If equipment is not set (old routines), detect from name
    const weightedKeywords = ['dumbbell', 'barbell', 'kettlebell', 'cable', 'machine', 
                               'weighted', 'smith machine', 'ez bar'];
    const bodyweightKeywords = ['push-up', 'pushup', 'pull-up', 'pullup', 'chin-up', 
                                 'sit-up', 'situp', 'crunch', 'plank', 'burpee', 
                                 'jumping', 'mountain climber', 'leg raise', 'bicycle'];
    
    // First check if it explicitly mentions weighted equipment
    if (weightedKeywords.some(keyword => exerciseName.includes(keyword))) {
      return false;
    }
    // Then check if it's a known bodyweight exercise
    else if (bodyweightKeywords.some(keyword => exerciseName.includes(keyword))) {
      return true;
    }
    // For ambiguous cases like "squats" or "lunges", assume bodyweight
    else if (exerciseName.includes('squat') || exerciseName.includes('lunge')) {
      return true;
    }
    // Default to weighted if unsure
    else {
      return false;
    }
  }
};

const QuickExerciseLogModal: React.FC<QuickExerciseLogModalProps> = ({
  visible,
  exercise,
  onClose,
  onSave,
}) => {
  const [repsPerSet, setRepsPerSet] = useState<(number | string)[]>([]);
  const [weightPerSet, setWeightPerSet] = useState<(number | string)[]>([]);

  // Initialize arrays when exercise changes
  useEffect(() => {
    if (exercise && exercise.sets) {
      const sets = exercise.sets;
      const defaultReps = exercise.reps || 10;
      
      // Initialize reps array with default values
      const initialReps = Array(sets).fill(defaultReps);
      setRepsPerSet(initialReps);
      
      // Initialize weight array if it's a weighted exercise
      const isBodyweight = isExerciseBodyweight(exercise);
      if (!isBodyweight) {
        const initialWeights = Array(sets).fill(20);
        setWeightPerSet(initialWeights);
      } else {
        setWeightPerSet([]);
      }
    }
  }, [exercise]);

  const handleUpdateReps = (setIndex: number, value: string) => {
    const updated = [...repsPerSet];
    updated[setIndex] = value || undefined;
    setRepsPerSet(updated);
  };

  const handleUpdateWeight = (setIndex: number, value: string) => {
    const updated = [...weightPerSet];
    updated[setIndex] = value || undefined;
    setWeightPerSet(updated);
  };

  const handleSave = () => {
    if (!exercise) return;
    
    hapticService.medium();
    onSave(exercise, repsPerSet, weightPerSet.length > 0 ? weightPerSet : undefined);
    onClose();
  };

  const handleClose = () => {
    hapticService.light();
    onClose();
  };

  if (!exercise) return null;

  // Check if exercise is weighted
  const isBodyweight = isExerciseBodyweight(exercise);
  const isWeighted = !isBodyweight;
  
  console.log('🏋️ Exercise:', exercise.name, '| Equipment:', exercise.equipment, '| Is Bodyweight:', isBodyweight);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="barbell" size={24} color={Colors.primary} />
              <Text style={styles.headerTitle} numberOfLines={1}>
                {exercise.name}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Exercise Details */}
          <View style={styles.exerciseInfo}>
            <View style={styles.infoBadge}>
              <Ionicons name="fitness" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>{exercise.sets} sets</Text>
            </View>
            {exercise.equipment && (
              <View style={styles.infoBadge}>
                <Ionicons 
                  name={isWeighted ? "barbell" : "body"} 
                  size={16} 
                  color={Colors.success} 
                />
                <Text style={styles.infoText}>{exercise.equipment}</Text>
              </View>
            )}
          </View>

          {/* Sets Inputs */}
          <ScrollView 
            style={styles.setsContainer}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.sectionTitle}>Log Your Sets</Text>
            
            {Array.from({ length: exercise.sets || 0 }).map((_, setIndex) => (
              <View key={setIndex} style={styles.setCard}>
                <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                <View style={styles.setInputRow}>
                  {/* Reps Input */}
                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={styles.input}
                      value={repsPerSet[setIndex]?.toString() || ''}
                      onChangeText={(text) => handleUpdateReps(setIndex, text)}
                      keyboardType="numeric"
                      selectTextOnFocus
                      placeholder={exercise.reps?.toString() || '10'}
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>

                  {/* Weight Input (if weighted exercise) */}
                  {isWeighted && (
                    <View style={styles.inputField}>
                      <Text style={styles.inputLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.input}
                        value={weightPerSet[setIndex]?.toString() || ''}
                        onChangeText={(text) => handleUpdateWeight(setIndex, text)}
                        keyboardType="numeric"
                        selectTextOnFocus
                        placeholder="20"
                        placeholderTextColor={Colors.textSecondary}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Log Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 20,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  exerciseInfo: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Layout.radiusMedium,
  },
  infoText: {
    ...Typography.label,
    fontSize: 14,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  setsContainer: {
    maxHeight: 400,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 16,
    marginBottom: 16,
  },
  setCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusMedium,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setLabel: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  setInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputField: {
    flex: 1,
  },
  inputLabel: {
    ...Typography.label,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    ...Typography.body,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSmall,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: Layout.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
});

export default QuickExerciseLogModal;

