import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../../styles/designSystem';

interface WorkoutLogCardProps {
  onPress: () => void;
  todayWorkoutCount?: number;
  isLoading?: boolean;
}

const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({
  onPress,
  todayWorkoutCount = 0,
  isLoading = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
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
});

export default WorkoutLogCard;

