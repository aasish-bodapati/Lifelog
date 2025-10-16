import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { useOnboarding } from '../../context/OnboardingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from '../../services/databaseService';
import { apiService } from '../../services/api';
import { hapticService } from '../../services/hapticService';
import { calculationService } from '../../services/calculationService';
import { advancedAnalyticsService, DailyInsights, WeeklyTrends, ConsistencyStreak, ProgressMetrics } from '../../services/advancedAnalyticsService';
import { useScreenData } from '../../hooks';
import { getProgressIcon, getTrendIcon, getTrendColor, getConsistencyColor } from '../../utils';
import { CommonStyles, Layout, Colors, Typography } from '../../styles/designSystem';
import SyncIndicator from '../../components/SyncIndicator';
import WeeklySummaryCard from '../../components/progress/WeeklySummaryCard';
import TrendChart from '../../components/analytics/TrendChart';
import AchievementCard from '../../components/progress/AchievementCard';
import ProgressMessage from '../../components/progress/ProgressMessage';
import ProgressInsights from '../../components/analytics/ProgressInsights';
import AdvancedAnalyticsCard from '../../components/dashboard/AdvancedAnalyticsCard';

const { width } = Dimensions.get('window');

interface WeeklyData {
  week_start: string;
  week_end: string;
  avg_daily_calories: number;
  avg_daily_protein: number;
  total_workouts: number;
  total_workout_duration: number;
  weight_change?: number;
}

interface DailyData {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  workout_count: number;
  total_workout_duration: number;
  weight?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  category: 'consistency' | 'nutrition' | 'fitness' | 'progress';
}

const ProgressScreen: React.FC = () => {
  const { state: userState } = useUser();
  const { syncStatus, forceSync } = useSync();
  const { data: onboardingData } = useOnboarding();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  
  // Advanced analytics state
  const [dailyInsights, setDailyInsights] = useState<DailyInsights | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrends | null>(null);
  const [consistencyStreak, setConsistencyStreak] = useState<ConsistencyStreak | null>(null);
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics | null>(null);
  const [caloriesTrend, setCaloriesTrend] = useState<Array<{ date: string; value: number }>>([]);
  const [weightTrend, setWeightTrend] = useState<Array<{ date: string; value: number }>>([]);

  // Load progress data
  const loadProgressData = useCallback(async () => {
    if (!userState.user?.id) return;

    try {
      setIsLoading(true);

      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'year':
          startDate.setDate(endDate.getDate() - 365);
          break;
      }

      // Load advanced analytics
      const today = new Date().toISOString().split('T')[0];
      const weekStart = startDate.toISOString().split('T')[0];
      
      try {
        // Load daily insights
        const dailyData = await advancedAnalyticsService.getDailyInsights(userState.user.id, today);
        setDailyInsights(dailyData);

        // Load weekly trends
        const weeklyData = await advancedAnalyticsService.getWeeklyTrends(userState.user.id, weekStart);
        setWeeklyTrends(weeklyData);
        setWeeklyData(weeklyData); // Also set for backward compatibility

        // Load consistency streak
        const streakData = await advancedAnalyticsService.getConsistencyStreak(userState.user.id);
        setConsistencyStreak(streakData);

        // Load progress metrics
        const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;
        const progressData = await advancedAnalyticsService.getProgressMetrics(userState.user.id, days);
        setProgressMetrics(progressData);

        // Set trend data
        setCaloriesTrend(progressData.calories_trend.map((value, index) => ({
          date: new Date(Date.now() - (days - 1 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: value
        })));
        
        setWeightTrend(progressData.weight_trend.map((value, index) => ({
          date: new Date(Date.now() - (days - 1 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: value
        })));

      } catch (error) {
        console.log('Advanced analytics unavailable, using local data');
        // Fallback to local data
        setWeeklyData(null);
      }

      // Load daily data for charts
      const dailyDataArray: DailyData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const daily = await apiService.getDailyAnalytics(userState.user.id, dateStr);
          dailyDataArray.push(daily);
        } catch (error) {
          // Fallback to local data
          const nutritionLogs = await databaseService.getNutritionLogs(userState.user.id, dateStr, 100);
          const workouts = await databaseService.getWorkouts(userState.user.id, 50);
          const dayWorkouts = workouts.filter(w => w.date === dateStr);
          
          dailyDataArray.push({
            date: dateStr,
            total_calories: nutritionLogs.reduce((sum, log) => sum + log.calories, 0),
            total_protein: nutritionLogs.reduce((sum, log) => sum + log.protein_g, 0),
            total_carbs: nutritionLogs.reduce((sum, log) => sum + log.carbs_g, 0),
            total_fat: nutritionLogs.reduce((sum, log) => sum + log.fat_g, 0),
            workout_count: dayWorkouts.length,
            total_workout_duration: dayWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
          });
        }
      }
      
      setDailyData(dailyDataArray);

      // Load achievements
      await loadAchievements();

      // Generate progress message
      generateProgressMessage(dailyDataArray, weeklyData);

    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userState.user?.id, selectedPeriod]);

  // Load achievements
  const loadAchievements = async () => {
    if (!userState.user?.id) return;

    try {
      // Get user's data for achievement calculation
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const achievements: Achievement[] = [
        {
          id: 'streak_3',
          title: '3-Day Streak',
          description: 'Log data for 3 consecutive days',
          icon: 'flame',
          unlocked: false,
          progress: 0,
          maxProgress: 3,
          category: 'consistency',
        },
        {
          id: 'streak_7',
          title: 'Week Warrior',
          description: 'Log data for 7 consecutive days',
          icon: 'trophy',
          unlocked: false,
          progress: 0,
          maxProgress: 7,
          category: 'consistency',
        },
        {
          id: 'protein_week',
          title: 'Protein Power',
          description: 'Hit protein goal 5 days this week',
          icon: 'fitness',
          unlocked: false,
          progress: 0,
          maxProgress: 5,
          category: 'nutrition',
        },
        {
          id: 'workout_week',
          title: 'Fitness Fanatic',
          description: 'Complete 5 workouts this week',
          icon: 'barbell',
          unlocked: false,
          progress: 0,
          maxProgress: 5,
          category: 'fitness',
        },
        {
          id: 'weight_loss',
          title: 'Progress Maker',
          description: 'Lose 1kg in a week',
          icon: 'trending-down',
          unlocked: false,
          progress: 0,
          maxProgress: 1,
          category: 'progress',
        },
      ];

      // Calculate achievement progress
      let currentStreak = 0;
      let proteinDays = 0;
      let workoutDays = 0;
      let weightLoss = 0;

      for (const date of last7Days) {
        const dayData = dailyData.find(d => d.date === date);
        if (dayData) {
          if (dayData.total_calories > 0) {
            currentStreak++;
          }
          if (dayData.total_protein >= (onboardingData.profile ? onboardingData.profile.weight * 1.6 : 100)) {
            proteinDays++;
          }
          if (dayData.workout_count > 0) {
            workoutDays++;
          }
        }
      }

      // Update achievements
      achievements.forEach(achievement => {
        switch (achievement.id) {
          case 'streak_3':
            achievement.progress = Math.min(currentStreak, 3);
            achievement.unlocked = currentStreak >= 3;
            break;
          case 'streak_7':
            achievement.progress = Math.min(currentStreak, 7);
            achievement.unlocked = currentStreak >= 7;
            break;
          case 'protein_week':
            achievement.progress = Math.min(proteinDays, 5);
            achievement.unlocked = proteinDays >= 5;
            break;
          case 'workout_week':
            achievement.progress = Math.min(workoutDays, 5);
            achievement.unlocked = workoutDays >= 5;
            break;
          case 'weight_loss':
            // This would need weight data
            achievement.progress = 0;
            achievement.unlocked = false;
            break;
        }
      });

      setAchievements(achievements);

      // Check for newly unlocked achievements
      for (const achievement of achievements) {
        if (achievement.unlocked) {
          // Check if this achievement was just unlocked (you might want to track this in AsyncStorage)
          const wasUnlockedKey = `achievement_${achievement.id}_unlocked`;
          const wasUnlocked = await AsyncStorage.getItem(wasUnlockedKey);
          
          if (!wasUnlocked) {
            // Newly unlocked achievement - just mark as unlocked
            await AsyncStorage.setItem(wasUnlockedKey, 'true');
          }
        }
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  // Generate progress message
  const generateProgressMessage = (dailyData: DailyData[], weeklyData: WeeklyData | null) => {
    const avgCalories = dailyData.reduce((sum, d) => sum + d.total_calories, 0) / dailyData.length;
    const avgProtein = dailyData.reduce((sum, d) => sum + d.total_protein, 0) / dailyData.length;
    const totalWorkouts = dailyData.reduce((sum, d) => sum + d.workout_count, 0);
    
    const targetCalories = onboardingData.profile ? 
      calculationService.calculateDailyTargets(
        onboardingData.profile as any,
        onboardingData.goal,
        onboardingData.activity
      ).calories : 2000;

    if (avgCalories >= targetCalories * 0.9) {
      setProgressMessage("🎉 You're crushing your calorie goals this week!");
    } else if (avgProtein >= (onboardingData.profile?.weight || 70) * 1.6) {
      setProgressMessage("💪 Great protein intake! Keep fueling your muscles!");
    } else if (totalWorkouts >= 5) {
      setProgressMessage("🔥 5 workouts this week! You're on fire!");
    } else if (avgCalories < targetCalories * 0.7) {
      setProgressMessage("📈 Try to increase your calorie intake a bit this week.");
    } else {
      setProgressMessage("Keep up the great work! Every day counts! 💪");
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    hapticService.light();
    await loadProgressData();
    await forceSync();
  }, [loadProgressData, forceSync]);

  // Load data on mount and when period changes
  useEffect(() => {
    if (userState.user) {
      loadProgressData();
    }
  }, [userState.user, selectedPeriod, loadProgressData]);

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'week': return '7 Days';
      case 'month': return '30 Days';
      case 'year': return '1 Year';
    }
  };

  return (
    <SafeAreaView style={CommonStyles.screenContainer}>
      <SyncIndicator />
      
      <ScrollView
        style={CommonStyles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={CommonStyles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Track your journey</Text>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['week', 'month', 'year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => {
                  hapticService.light();
                  setSelectedPeriod(period);
                }}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period === 'week' ? '7D' : period === 'month' ? '30D' : '1Y'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Progress Message */}
          {progressMessage && (
            <ProgressMessage message={progressMessage} />
          )}

          {/* Advanced Analytics Card */}
          {dailyInsights && weeklyTrends && consistencyStreak && (
            <AdvancedAnalyticsCard
              dailyInsights={dailyInsights}
              weeklyTrends={weeklyTrends}
              consistencyStreak={consistencyStreak}
              onViewDetails={() => console.log('View detailed analytics')}
            />
          )}

          {/* Progress Insights */}
          {dailyInsights && weeklyTrends && consistencyStreak && (
            <ProgressInsights
              dailyInsights={dailyInsights}
              weeklyTrends={weeklyTrends}
              consistencyStreak={consistencyStreak}
              onInsightPress={(insight) => console.log('Insight pressed:', insight)}
            />
          )}

          {/* Weekly Summary */}
          {weeklyData && (
            <WeeklySummaryCard data={weeklyData} />
          )}

          {/* Trend Charts */}
          <View style={styles.chartsContainer}>
            <Text style={styles.sectionTitle}>Trends ({getPeriodText()})</Text>
            
            {/* Use advanced analytics data if available, otherwise fallback to local data */}
            <TrendChart
              title="Calories"
              data={caloriesTrend.length > 0 ? caloriesTrend : dailyData.map(d => ({ date: d.date, value: d.total_calories }))}
              color="#FF6B6B"
              unit="kcal"
            />
            
            <TrendChart
              title="Protein"
              data={dailyData.map(d => ({ date: d.date, value: d.total_protein }))}
              color="#4ECDC4"
              unit="g"
            />
            
            <TrendChart
              title="Workouts"
              data={dailyData.map(d => ({ date: d.date, value: d.workout_count }))}
              color="#45B7D1"
              unit=""
            />

            {/* Weight trend chart if data is available */}
            {weightTrend.length > 0 && weightTrend.some(w => w.value > 0) && (
              <TrendChart
                title="Weight"
                data={weightTrend.filter(w => w.value > 0)}
                color="#9B59B6"
                unit="kg"
              />
            )}
          </View>

          {/* Progress Summary */}
          {progressMetrics && (
            <View style={styles.progressSummaryContainer}>
              <Text style={styles.sectionTitle}>Progress Summary</Text>
              <View style={styles.progressSummaryCard}>
                <View style={styles.progressRow}>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressValue}>{progressMetrics.avg_daily_calories.toFixed(0)}</Text>
                    <Text style={styles.progressLabel}>Avg Daily Calories</Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Text style={[styles.progressValue, progressMetrics.weight_change < 0 ? styles.weightLoss : styles.weightGain]}>
                      {progressMetrics.weight_change > 0 ? '+' : ''}{progressMetrics.weight_change.toFixed(1)}kg
                    </Text>
                    <Text style={styles.progressLabel}>Weight Change</Text>
                  </View>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressValue}>{progressMetrics.daily_summaries.length}</Text>
                    <Text style={styles.progressLabel}>Days Tracked</Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressValue}>
                      {progressMetrics.daily_summaries.reduce((sum, d) => sum + d.workout_count, 0)}
                    </Text>
                    <Text style={styles.progressLabel}>Total Workouts</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Achievements */}
          <View style={styles.achievementsContainer}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: Layout.sectionSpacingLarge,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  periodSelector: {
    ...CommonStyles.card,
    flexDirection: 'row',
    padding: 4,
    marginBottom: Layout.sectionSpacingLarge,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Layout.cardSpacing,
    paddingHorizontal: Layout.cardPadding,
    borderRadius: Layout.radiusSmall,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: Colors.surface,
  },
  chartsContainer: {
    marginBottom: Layout.sectionSpacingLarge,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Layout.cardSpacing,
  },
  progressSummaryContainer: {
    marginBottom: Layout.sectionSpacingLarge,
  },
  progressSummaryCard: {
    ...CommonStyles.cardLarge,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.cardSpacing,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressValue: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  weightLoss: {
    color: Colors.success,
  },
  weightGain: {
    color: Colors.error,
  },
  achievementsContainer: {
    marginBottom: Layout.sectionSpacingLarge,
  },
  achievementsGrid: {
    ...CommonStyles.grid,
  },
});

export default ProgressScreen;