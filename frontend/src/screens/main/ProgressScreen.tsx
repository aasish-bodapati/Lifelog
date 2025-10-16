import React, { useState, useEffect, useCallback } from 'react';
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
import { databaseService } from '../../services/databaseService';
import { apiService } from '../../services/api';
import { hapticService } from '../../services/hapticService';
import SyncIndicator from '../../components/SyncIndicator';
import WeeklySummaryCard from '../../components/progress/WeeklySummaryCard';
import TrendChart from '../../components/progress/TrendChart';
import AchievementCard from '../../components/progress/AchievementCard';
import ProgressMessage from '../../components/progress/ProgressMessage';

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

      // Load weekly data
      const weekStart = startDate.toISOString().split('T')[0];
      try {
        const weekly = await apiService.getWeeklyAnalytics(userState.user.id, weekStart);
        setWeeklyData(weekly);
      } catch (error) {
        console.log('Using local data for weekly analytics');
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
    <SafeAreaView style={styles.container}>
      <SyncIndicator />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
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

          {/* Weekly Summary */}
          {weeklyData && (
            <WeeklySummaryCard data={weeklyData} />
          )}

          {/* Trend Charts */}
          <View style={styles.chartsContainer}>
            <Text style={styles.sectionTitle}>Trends ({getPeriodText()})</Text>
            
            <TrendChart
              title="Calories"
              data={dailyData.map(d => ({ date: d.date, value: d.total_calories }))}
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
          </View>

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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  chartsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  achievementsContainer: {
    marginBottom: 24,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

export default ProgressScreen;