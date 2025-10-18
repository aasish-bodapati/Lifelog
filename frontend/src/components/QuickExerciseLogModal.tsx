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
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    ...Layout.shadowLarge,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  exerciseInfo: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.radiusMedium,
  },
  infoText: {
    ...Typography.label,
    color: Colors.text,
    textTransform: 'capitalize',
  },
  setsContainer: {
    maxHeight: 400,
    paddingHorizontal: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  setCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusMedium,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setLabel: {
    ...Typography.label,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  setInputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputField: {
    flex: 1,
  },
  inputLabel: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs + 2,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSmall,
    padding: Spacing.md,
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginTop: Spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.lg,
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
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.textLight,
  },
});

export default QuickExerciseLogModal;

