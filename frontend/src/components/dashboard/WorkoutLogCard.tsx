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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginRight: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  compactIcon: {
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  exercisesScrollContainer: {
    height: 260, // Fixed height to show ~5 exercises
  },
  exercisesContentContainer: {
    gap: 8,
  },
  exerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exerciseName: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  exerciseDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 260, // Match the exercises container height
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default WorkoutLogCard;

