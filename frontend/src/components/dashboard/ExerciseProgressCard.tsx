import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseProgress, PersonalRecord } from '../../services/exerciseProgressService';

interface ExerciseProgressCardProps {
  exerciseProgress: ExerciseProgress[];
  onViewAll: () => void;
  onExercisePress: (exerciseName: string) => void;
}

const ExerciseProgressCard: React.FC<ExerciseProgressCardProps> = ({
  exerciseProgress,
  onViewAll,
  onExercisePress,
}) => {
  const getExerciseIcon = (exerciseType: string) => {
    switch (exerciseType) {
      case 'strength':
        return 'barbell';
      case 'cardio':
        return 'bicycle';
      case 'flexibility':
        return 'body';
      default:
        return 'fitness';
    }
  };

  const getExerciseColor = (exerciseType: string) => {
    switch (exerciseType) {
      case 'strength':
        return '#4ECDC4';
      case 'cardio':
        return '#FF6B6B';
      case 'flexibility':
        return '#A29BFE';
      default:
        return '#45B7D1';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'trending-up';
      case 'declining':
        return 'trending-down';
      case 'stable':
        return 'remove';
      default:
        return 'add';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '#28A745';
      case 'declining':
        return '#DC3545';
      case 'stable':
        return '#6C757D';
      default:
        return '#007AFF';
    }
  };

  const formatPersonalRecord = (record: PersonalRecord) => {
    return `${record.record_value}${record.record_unit}`;
  };

  const getPersonalRecordText = (records: PersonalRecord[]) => {
    if (records.length === 0) return 'No records yet';
    
    const maxWeight = records.find(r => r.record_type === 'max_weight');
    const maxReps = records.find(r => r.record_type === 'max_reps');
    
    if (maxWeight && maxReps) {
      return `${formatPersonalRecord(maxWeight)} × ${formatPersonalRecord(maxReps)}`;
    } else if (maxWeight) {
      return formatPersonalRecord(maxWeight);
    } else if (maxReps) {
      return formatPersonalRecord(maxReps);
    }
    
    return 'No records yet';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="trophy" size={20} color="#FFD700" />
          <Text style={styles.title}>Exercise Progress</Text>
        </View>
        <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {exerciseProgress.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.exercisesContainer}
        >
          {exerciseProgress.slice(0, 5).map((exercise, index) => (
            <TouchableOpacity
              key={`${exercise.exercise_name}_${index}`}
              style={styles.exerciseCard}
              onPress={() => onExercisePress(exercise.exercise_name)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseHeader}>
                <View style={[
                  styles.exerciseIconContainer,
                  { backgroundColor: getExerciseColor(exercise.exercise_type) + '20' }
                ]}>
                  <Ionicons
                    name={getExerciseIcon(exercise.exercise_type) as any}
                    size={20}
                    color={getExerciseColor(exercise.exercise_type)}
                  />
                </View>
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={getTrendIcon(exercise.progression_trend) as any}
                    size={14}
                    color={getTrendColor(exercise.progression_trend)}
                  />
                </View>
              </View>

              <Text style={styles.exerciseName} numberOfLines={2}>
                {exercise.exercise_name}
              </Text>

              <View style={styles.exerciseStats}>
                <Text style={styles.workoutCount}>{exercise.total_workouts} workouts</Text>
                <Text style={styles.lastPerformed}>
                  {new Date(exercise.last_performed).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>

              <View style={styles.recordContainer}>
                <Text style={styles.recordLabel}>Best:</Text>
                <Text style={styles.recordValue}>
                  {getPersonalRecordText(exercise.personal_records)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyStateTitle}>No exercises yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Start logging workouts to see your progress
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginRight: 4,
  },
  exercisesContainer: {
    marginHorizontal: -4,
  },
  exerciseCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    width: 160,
    minHeight: 140,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 18,
  },
  exerciseStats: {
    marginBottom: 8,
  },
  workoutCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 2,
  },
  lastPerformed: {
    fontSize: 11,
    color: '#666666',
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  recordLabel: {
    fontSize: 11,
    color: '#666666',
    marginRight: 4,
  },
  recordValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ExerciseProgressCard;
