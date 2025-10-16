import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WeeklyData {
  week_start: string;
  week_end: string;
  avg_daily_calories: number;
  avg_daily_protein: number;
  total_workouts: number;
  total_workout_duration: number;
  weight_change?: number;
}

interface WeeklySummaryCardProps {
  data: WeeklyData;
}

const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  const getWorkoutIntensity = () => {
    if (data.total_workouts === 0) return { text: 'No workouts', color: '#CCCCCC' };
    if (data.total_workouts < 3) return { text: 'Light week', color: '#FFE66D' };
    if (data.total_workouts < 5) return { text: 'Active week', color: '#4ECDC4' };
    return { text: 'Intense week', color: '#45B7D1' };
  };

  const getCalorieStatus = () => {
    if (data.avg_daily_calories < 1200) return { text: 'Low intake', color: '#FF6B6B' };
    if (data.avg_daily_calories < 1800) return { text: 'Moderate', color: '#FFE66D' };
    if (data.avg_daily_calories < 2500) return { text: 'Good intake', color: '#4ECDC4' };
    return { text: 'High intake', color: '#45B7D1' };
  };

  const getWeightChangeText = () => {
    if (!data.weight_change) return null;
    if (data.weight_change > 0) return `+${data.weight_change.toFixed(1)}kg`;
    if (data.weight_change < 0) return `${data.weight_change.toFixed(1)}kg`;
    return 'No change';
  };

  const getWeightChangeColor = () => {
    if (!data.weight_change) return '#666666';
    if (data.weight_change > 0) return '#FF6B6B';
    if (data.weight_change < 0) return '#4ECDC4';
    return '#666666';
  };

  const workoutIntensity = getWorkoutIntensity();
  const calorieStatus = getCalorieStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="calendar" size={24} color="#8E44AD" />
          <Text style={styles.title}>Weekly Summary</Text>
        </View>
        <Text style={styles.dateRange}>
          {formatDate(data.week_start)} - {formatDate(data.week_end)}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Main Stats */}
        <View style={styles.mainStats}>
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Ionicons name="flame" size={16} color="#FF6B6B" />
              <Text style={styles.statLabel}>Avg Calories</Text>
            </View>
            <Text style={styles.statValue}>
              {Math.round(data.avg_daily_calories).toLocaleString()}
            </Text>
            <Text style={[styles.statStatus, { color: calorieStatus.color }]}>
              {calorieStatus.text}
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Ionicons name="fitness" size={16} color="#4ECDC4" />
              <Text style={styles.statLabel}>Avg Protein</Text>
            </View>
            <Text style={styles.statValue}>
              {Math.round(data.avg_daily_protein)}g
            </Text>
            <Text style={styles.statSubtext}>per day</Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Ionicons name="barbell" size={16} color="#45B7D1" />
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <Text style={styles.statValue}>
              {data.total_workouts}
            </Text>
            <Text style={[styles.statStatus, { color: workoutIntensity.color }]}>
              {workoutIntensity.text}
            </Text>
          </View>
        </View>

        {/* Secondary Stats */}
        <View style={styles.secondaryStats}>
          <View style={styles.secondaryItem}>
            <Ionicons name="time" size={16} color="#666666" />
            <Text style={styles.secondaryLabel}>Total Duration</Text>
            <Text style={styles.secondaryValue}>
              {Math.round(data.total_workout_duration)} min
            </Text>
          </View>

          {data.weight_change !== undefined && (
            <View style={styles.secondaryItem}>
              <Ionicons 
                name={data.weight_change > 0 ? "trending-up" : data.weight_change < 0 ? "trending-down" : "remove"} 
                size={16} 
                color={getWeightChangeColor()} 
              />
              <Text style={styles.secondaryLabel}>Weight Change</Text>
              <Text style={[styles.secondaryValue, { color: getWeightChangeColor() }]}>
                {getWeightChangeText()}
              </Text>
            </View>
          )}
        </View>

        {/* Weekly Insights */}
        <View style={styles.insights}>
          <Text style={styles.insightsTitle}>This Week's Insights</Text>
          <View style={styles.insightItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
            <Text style={styles.insightText}>
              {data.total_workouts > 0 
                ? `Completed ${data.total_workouts} workout${data.total_workouts !== 1 ? 's' : ''}`
                : 'No workouts completed this week'
              }
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="restaurant" size={16} color="#FF6B6B" />
            <Text style={styles.insightText}>
              Averaged {Math.round(data.avg_daily_calories)} calories per day
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="fitness" size={16} color="#4ECDC4" />
            <Text style={styles.insightText}>
              Consumed {Math.round(data.avg_daily_protein)}g protein daily
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  dateRange: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 32,
  },
  content: {
    gap: 20,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statSubtext: {
    fontSize: 10,
    color: '#666666',
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  secondaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  secondaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginBottom: 2,
  },
  secondaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  insights: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
});

export default WeeklySummaryCard;
