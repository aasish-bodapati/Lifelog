import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyInsights, WeeklyTrends, ConsistencyStreak } from '../../services/advancedAnalyticsService';

interface ProgressInsightsProps {
  dailyInsights: DailyInsights;
  weeklyTrends: WeeklyTrends;
  consistencyStreak: ConsistencyStreak;
  onInsightPress?: (insight: string) => void;
}

const ProgressInsights: React.FC<ProgressInsightsProps> = ({
  dailyInsights,
  weeklyTrends,
  consistencyStreak,
  onInsightPress,
}) => {
  const insights = generateInsights(dailyInsights, weeklyTrends, consistencyStreak);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'calories': return 'flame';
      case 'protein': return 'fitness';
      case 'workout': return 'barbell';
      case 'consistency': return 'trending-up';
      case 'weight': return 'scale';
      case 'hydration': return 'water';
      default: return 'bulb';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'calories': return '#FF6B6B';
      case 'protein': return '#4ECDC4';
      case 'workout': return '#45B7D1';
      case 'consistency': return '#96CEB4';
      case 'weight': return '#FFEAA7';
      case 'hydration': return '#74B9FF';
      default: return '#A29BFE';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb" size={24} color="#007AFF" />
        <Text style={styles.title}>Smart Insights</Text>
      </View>
      
      <View style={styles.insightsList}>
        {insights.map((insight, index) => (
          <TouchableOpacity
            key={index}
            style={styles.insightItem}
            onPress={() => onInsightPress?.(insight.message)}
            activeOpacity={0.7}
          >
            <View style={styles.insightHeader}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: getInsightColor(insight.type) + '20' }
              ]}>
                <Ionicons
                  name={getInsightIcon(insight.type) as any}
                  size={20}
                  color={getInsightColor(insight.type)}
                />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            </View>
            
            {insight.metric && (
              <View style={styles.metricContainer}>
                <Text style={styles.metricLabel}>{insight.metric.label}</Text>
                <Text style={[
                  styles.metricValue,
                  { color: insight.metric.trend === 'up' ? '#4CAF50' : insight.metric.trend === 'down' ? '#F44336' : '#666666' }
                ]}>
                  {insight.metric.value} {insight.metric.trend === 'up' ? '↗' : insight.metric.trend === 'down' ? '↘' : '→'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const generateInsights = (
  daily: DailyInsights,
  weekly: WeeklyTrends,
  streak: ConsistencyStreak
): Array<{
  type: string;
  title: string;
  message: string;
  metric?: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  };
}> => {
  const insights = [];

  // Calorie insights
  if (daily.total_calories > 0) {
    const calorieGoal = 2000; // Default goal
    const caloriePercentage = Math.round((daily.total_calories / calorieGoal) * 100);
    
    if (caloriePercentage >= 90) {
      insights.push({
        type: 'calories',
        title: 'Calorie Goal Crushed!',
        message: `You've hit ${caloriePercentage}% of your daily calorie goal. Great job!`,
        metric: {
          label: 'Daily Calories',
          value: `${daily.total_calories}`,
          trend: 'up' as const,
        },
      });
    } else if (caloriePercentage < 70) {
      insights.push({
        type: 'calories',
        title: 'Low Calorie Intake',
        message: `You're at ${caloriePercentage}% of your goal. Try adding a healthy snack!`,
        metric: {
          label: 'Daily Calories',
          value: `${daily.total_calories}`,
          trend: 'down' as const,
        },
      });
    }
  }

  // Protein insights
  if (daily.total_protein > 0) {
    const proteinGoal = 100; // Default goal
    const proteinPercentage = Math.round((daily.total_protein / proteinGoal) * 100);
    
    if (proteinPercentage >= 100) {
      insights.push({
        type: 'protein',
        title: 'Protein Power!',
        message: `Excellent protein intake at ${daily.total_protein}g. Your muscles will thank you!`,
        metric: {
          label: 'Daily Protein',
          value: `${daily.total_protein}g`,
          trend: 'up' as const,
        },
      });
    } else if (proteinPercentage < 70) {
      insights.push({
        type: 'protein',
        title: 'Boost Your Protein',
        message: `You're at ${proteinPercentage}% of your protein goal. Consider adding lean protein!`,
        metric: {
          label: 'Daily Protein',
          value: `${daily.total_protein}g`,
          trend: 'down' as const,
        },
      });
    }
  }

  // Workout insights
  if (daily.workout_count > 0) {
    insights.push({
      type: 'workout',
      title: 'Workout Complete!',
      message: `Great job completing ${daily.workout_count} workout${daily.workout_count > 1 ? 's' : ''} today!`,
      metric: {
        label: 'Workouts Today',
        value: `${daily.workout_count}`,
        trend: 'up' as const,
      },
    });
  } else if (weekly.total_workouts >= 3) {
    insights.push({
      type: 'workout',
      title: 'Rest Day',
      message: `You've been consistent with ${weekly.total_workouts} workouts this week. A rest day is well-deserved!`,
      metric: {
        label: 'Weekly Workouts',
        value: `${weekly.total_workouts}`,
        trend: 'stable' as const,
      },
    });
  }

  // Consistency insights
  if (streak.current_streak > 0) {
    if (streak.current_streak >= 7) {
      insights.push({
        type: 'consistency',
        title: 'Consistency Champion!',
        message: `Amazing ${streak.current_streak}-day streak! You're building incredible habits!`,
        metric: {
          label: 'Current Streak',
          value: `${streak.current_streak} days`,
          trend: 'up' as const,
        },
      });
    } else if (streak.current_streak >= 3) {
      insights.push({
        type: 'consistency',
        title: 'Building Momentum',
        message: `Great ${streak.current_streak}-day streak! Keep up the excellent work!`,
        metric: {
          label: 'Current Streak',
          value: `${streak.current_streak} days`,
          trend: 'up' as const,
        },
      });
    }
  }

  // Weekly progress insights
  if (weekly.weekly_goals_achieved > 0) {
    const goalPercentage = Math.round((weekly.weekly_goals_achieved / weekly.weekly_goals_total) * 100);
    
    if (goalPercentage >= 80) {
      insights.push({
        type: 'consistency',
        title: 'Weekly Goals Crushed!',
        message: `You've achieved ${goalPercentage}% of your weekly goals. Outstanding!`,
        metric: {
          label: 'Weekly Goals',
          value: `${weekly.weekly_goals_achieved}/${weekly.weekly_goals_total}`,
          trend: 'up' as const,
        },
      });
    }
  }

  // Weight insights
  if (weekly.weight_change !== undefined) {
    if (weekly.weight_change > 0.5) {
      insights.push({
        type: 'weight',
        title: 'Weight Gain Detected',
        message: `You've gained ${weekly.weight_change.toFixed(1)}kg this week. Consider adjusting your calorie intake.`,
        metric: {
          label: 'Weekly Change',
          value: `+${weekly.weight_change.toFixed(1)}kg`,
          trend: 'up' as const,
        },
      });
    } else if (weekly.weight_change < -0.5) {
      insights.push({
        type: 'weight',
        title: 'Weight Loss Progress!',
        message: `Great progress! You've lost ${Math.abs(weekly.weight_change).toFixed(1)}kg this week.`,
        metric: {
          label: 'Weekly Change',
          value: `${weekly.weight_change.toFixed(1)}kg`,
          trend: 'down' as const,
        },
      });
    }
  }

  // Default insight if no specific insights
  if (insights.length === 0) {
    insights.push({
      type: 'consistency',
      title: 'Ready to Start!',
      message: 'Log your first meal or workout to get personalized insights!',
    });
  }

  return insights.slice(0, 5); // Limit to 5 insights
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  insightMessage: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProgressInsights;
