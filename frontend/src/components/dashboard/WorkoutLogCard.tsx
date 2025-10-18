import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout, Spacing } from '../../styles/designSystem';
import { RoutineDay } from '../../services/workoutRoutineService';

interface WorkoutLogCardProps {
  onPress: () => void;
  todayWorkoutCount?: number;
  isLoading?: boolean;
  todayRoutineDay?: RoutineDay | null;
  hasActiveRoutine?: boolean;
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
            <View style={styles.exercisesContainer}>
              {todayRoutineDay.exercises.slice(0, 3).map((exercise, index) => (
                <View key={index} style={styles.exerciseRow}>
                  <View style={styles.exerciseDot} />
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {exercise.name}
                  </Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets} × {exercise.reps ? `${exercise.reps}` : `${exercise.duration}s`}
                  </Text>
                </View>
              ))}
              {todayRoutineDay.exercises.length > 3 && (
                <Text style={styles.moreExercises}>
                  +{todayRoutineDay.exercises.length - 3} more
                </Text>
              )}
            </View>
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
  exercisesContainer: {
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  exerciseDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  moreExercises: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 18,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
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

