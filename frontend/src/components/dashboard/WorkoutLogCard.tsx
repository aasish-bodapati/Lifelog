import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout, Spacing } from '../../styles/designSystem';
import { RoutineDay, RoutineExercise } from '../../services/workoutRoutineService';

interface WorkoutLogCardProps {
  onPress: () => void;
  todayWorkoutCount?: number;
  isLoading?: boolean;
  todayRoutineDay?: RoutineDay | null;
  hasActiveRoutine?: boolean;
  onExercisePress?: (exercise: RoutineExercise, index: number) => void;
}

const getDayName = (dayNumber: number): string => {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayNames[dayNumber - 1] || `Day ${dayNumber}`;
};

const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({
  onPress,
  todayWorkoutCount = 0,
  isLoading = false,
  todayRoutineDay = null,
  hasActiveRoutine = false,
  onExercisePress,
}) => {
  const hasExercises = todayRoutineDay && todayRoutineDay.exercises && todayRoutineDay.exercises.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      {hasActiveRoutine ? (
        <>
          {todayRoutineDay && (
            <View style={styles.compactHeader}>
              <Ionicons name="barbell" size={20} color={Colors.primary} style={styles.compactIcon} />
              <Text style={styles.compactTitle}>
                {getDayName(todayRoutineDay.dayNumber)} - {todayRoutineDay.focus}
              </Text>
            </View>
          )}

          {hasExercises ? (
            <ScrollView 
              style={styles.exercisesScrollContainer}
              contentContainerStyle={styles.exercisesContentContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {todayRoutineDay.exercises.map((exercise, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.exerciseButton}
                  onPress={() => onExercisePress?.(exercise, index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {exercise.name}
                  </Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets} × {exercise.reps ? `${exercise.reps}` : `${exercise.duration}s`}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={24} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No workout scheduled for today</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="barbell" size={40} color={Colors.primary} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Log Today's Workout</Text>
            {todayWorkoutCount > 0 ? (
              <Text style={styles.subtitle}>
                {todayWorkoutCount} workout{todayWorkoutCount > 1 ? 's' : ''} logged today
              </Text>
            ) : (
              <Text style={styles.subtitle}>
                Track your exercises and progress
              </Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusLarge,
    padding: Spacing.xxl,
    ...Layout.shadowMedium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs + 2,
  },
  subtitle: {
    ...Typography.bodySmall,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  compactIcon: {
    marginRight: Spacing.sm,
  },
  compactTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  exercisesScrollContainer: {
    height: 260, // Fixed height to show ~5 exercises
  },
  exercisesContentContainer: {
    gap: Spacing.sm,
  },
  exerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exerciseName: {
    flex: 1,
    ...Typography.bodySmall,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  exerciseDetails: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    height: 260, // Match the exercises container height
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusSmall,
  },
  emptyStateText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default WorkoutLogCard;

