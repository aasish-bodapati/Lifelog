import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyInsights, WeeklyTrends, ConsistencyStreak } from '../../services/advancedAnalyticsService';

interface AdvancedAnalyticsCardProps {
  dailyInsights: DailyInsights;
  weeklyTrends: WeeklyTrends;
  consistencyStreak: ConsistencyStreak;
  onViewDetails?: () => void;
}

const AdvancedAnalyticsCard: React.FC<AdvancedAnalyticsCardProps> = ({
  dailyInsights,
  weeklyTrends,
  consistencyStreak,
  onViewDetails,
}) => {
  const getConsistencyColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getConsistencyText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      default: return '#666666';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="analytics" size={24} color="#007AFF" />
          <Text style={styles.title}>Advanced Analytics</Text>
        </View>
        <TouchableOpacity onPress={onViewDetails} style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Consistency Score */}
        <View style={styles.metricRow}>
          <View style={styles.metricInfo}>
            <Text style={styles.metricLabel}>Consistency Score</Text>
            <Text style={styles.metricValue}>
              {dailyInsights.consistency_score || 0}%
            </Text>
          </View>
          <View style={styles.metricStatus}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: getConsistencyColor(dailyInsights.consistency_score || 0) }
            ]} />
            <Text style={[
              styles.statusText,
              { color: getConsistencyColor(dailyInsights.consistency_score || 0) }
            ]}>
              {getConsistencyText(dailyInsights.consistency_score || 0)}
            </Text>
          </View>
        </View>

        {/* Current Streak */}
        <View style={styles.metricRow}>
          <View style={styles.metricInfo}>
            <Text style={styles.metricLabel}>Current Streak</Text>
            <Text style={styles.metricValue}>
              {consistencyStreak.current_streak} days
            </Text>
          </View>
          <View style={styles.metricStatus}>
            <Ionicons name="flame" size={16} color="#FF6B6B" />
            <Text style={styles.statusText}>
              {consistencyStreak.current_streak >= 7 ? 'On Fire!' : 'Keep Going!'}
            </Text>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.metricRow}>
          <View style={styles.metricInfo}>
            <Text style={styles.metricLabel}>Weekly Goals</Text>
            <Text style={styles.metricValue}>
              {weeklyTrends.weekly_goals_achieved}/{weeklyTrends.weekly_goals_total}
            </Text>
          </View>
          <View style={styles.metricStatus}>
            <Ionicons
              name={getTrendIcon(weeklyTrends.trend_direction)}
              size={16}
              color={getTrendColor(weeklyTrends.trend_direction)}
            />
            <Text style={[
              styles.statusText,
              { color: getTrendColor(weeklyTrends.trend_direction) }
            ]}>
              {weeklyTrends.trend_direction === 'up' ? 'Improving' : 
               weeklyTrends.trend_direction === 'down' ? 'Declining' : 'Stable'}
            </Text>
          </View>
        </View>

        {/* Net Calories */}
        {dailyInsights.net_calories !== undefined && (
          <View style={styles.metricRow}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Net Calories</Text>
              <Text style={[
                styles.metricValue,
                { color: dailyInsights.net_calories > 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {dailyInsights.net_calories > 0 ? '+' : ''}{Math.round(dailyInsights.net_calories)}
              </Text>
            </View>
            <View style={styles.metricStatus}>
              <Ionicons
                name={dailyInsights.net_calories > 0 ? 'trending-up' : 'trending-down'}
                size={16}
                color={dailyInsights.net_calories > 0 ? '#4CAF50' : '#F44336'}
              />
              <Text style={[
                styles.statusText,
                { color: dailyInsights.net_calories > 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {dailyInsights.net_calories > 0 ? 'Surplus' : 'Deficit'}
              </Text>
            </View>
          </View>
        )}

        {/* Protein Goal Achievement */}
        {dailyInsights.protein_goal_achieved !== undefined && (
          <View style={styles.metricRow}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Protein Goal</Text>
              <Text style={styles.metricValue}>
                {dailyInsights.total_protein}g
              </Text>
            </View>
            <View style={styles.metricStatus}>
              <Ionicons
                name={dailyInsights.protein_goal_achieved ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={dailyInsights.protein_goal_achieved ? '#4CAF50' : '#F44336'}
              />
              <Text style={[
                styles.statusText,
                { color: dailyInsights.protein_goal_achieved ? '#4CAF50' : '#F44336' }
              ]}>
                {dailyInsights.protein_goal_achieved ? 'Achieved' : 'Not Met'}
              </Text>
            </View>
          </View>
        )}

        {/* Workout Frequency */}
        <View style={styles.metricRow}>
          <View style={styles.metricInfo}>
            <Text style={styles.metricLabel}>Workout Frequency</Text>
            <Text style={styles.metricValue}>
              {weeklyTrends.total_workouts}/week
            </Text>
          </View>
          <View style={styles.metricStatus}>
            <Ionicons name="barbell" size={16} color="#45B7D1" />
            <Text style={styles.statusText}>
              {weeklyTrends.total_workouts >= 5 ? 'Excellent' : 
               weeklyTrends.total_workouts >= 3 ? 'Good' : 'Could Improve'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{dailyInsights.total_calories}</Text>
          <Text style={styles.summaryLabel}>Calories</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{dailyInsights.total_protein}g</Text>
          <Text style={styles.summaryLabel}>Protein</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{dailyInsights.workout_count}</Text>
          <Text style={styles.summaryLabel}>Workouts</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{dailyInsights.total_workout_duration}m</Text>
          <Text style={styles.summaryLabel}>Duration</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
  content: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  metricStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
  },
});

export default AdvancedAnalyticsCard;
