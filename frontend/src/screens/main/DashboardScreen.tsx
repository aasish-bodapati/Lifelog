import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { databaseService } from '../../services/databaseService';
import { calculationService } from '../../services/calculationService';
import { hapticService } from '../../services/hapticService';
import { advancedAnalyticsService, DailyInsights, WeeklyTrends, ConsistencyStreak } from '../../services/advancedAnalyticsService';
import { getProgressIcon, getMacroColor, getStreakIcon, getConsistencyColor } from '../../utils';
import { CommonStyles, Layout, Colors, Typography } from '../../styles/designSystem';
import SyncIndicator from '../../components/SyncIndicator';
import PersonalizedHeader from '../../components/dashboard/PersonalizedHeader';
import RecentAchievements from '../../components/dashboard/RecentAchievements';
import AnimatedCard from '../../components/AnimatedCard';
import MacrosCard from '../../components/dashboard/MacrosCard';
import HydrationCard from '../../components/dashboard/HydrationCard';
import BodyTrendCard from '../../components/dashboard/BodyTrendCard';
import ConsistencyCard from '../../components/dashboard/ConsistencyCard';
import AdvancedAnalyticsCard from '../../components/dashboard/AdvancedAnalyticsCard';
import ProgressInsights from '../../components/analytics/ProgressInsights';
import TrendChart from '../../components/analytics/TrendChart';

const { width } = Dimensions.get('window');

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hydration: number;
}

const DashboardScreen: React.FC = () => {
  const { state: userState } = useUser();
  const { syncStatus, forceSync } = useSync();
  const { data: onboardingData } = useOnboarding();
  
  const [isLoading, setIsLoading] = useState(false);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0,
  });
  const [dailyTargets, setDailyTargets] = useState<DailyTargets | null>(null);
  const [streak, setStreak] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  // Advanced analytics state
  const [dailyInsights, setDailyInsights] = useState<DailyInsights | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrends | null>(null);
  const [consistencyStreak, setConsistencyStreak] = useState<ConsistencyStreak | null>(null);
  const [caloriesTrend, setCaloriesTrend] = useState<Array<{ date: string; value: number }>>([]);

  // Calculate daily targets from onboarding data
  const calculateTargets = useCallback(() => {
    if (onboardingData.profile && onboardingData.goal && onboardingData.activity) {
      const targets = calculationService.calculateDailyTargets(
        onboardingData.profile as any,
        onboardingData.goal,
        onboardingData.activity
      );
      setDailyTargets({
        calories: targets.calories,
        protein: targets.protein,
        carbs: targets.carbs,
        fat: targets.fat,
        hydration: targets.hydration,
      });
    }
  }, [onboardingData]);

  // Load today's data from local database
  const loadTodayData = useCallback(async () => {
    if (!userState.user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's nutrition logs
      const nutritionLogs = await databaseService.getNutritionLogs(
        userState.user.id,
        today,
        100
      );

      // Get today's body stats (for hydration if we track it)
      const bodyStats = await databaseService.getBodyStats(
        userState.user.id,
        7
      );

      // Calculate totals
      const totals: DailyTotals = {
        calories: nutritionLogs.reduce((sum, log) => sum + log.calories, 0),
        protein: nutritionLogs.reduce((sum, log) => sum + log.protein_g, 0),
        carbs: nutritionLogs.reduce((sum, log) => sum + log.carbs_g, 0),
        fat: nutritionLogs.reduce((sum, log) => sum + log.fat_g, 0),
        water: 0, // TODO: Implement hydration tracking
      };

      setDailyTotals(totals);

      // Calculate streak (simplified - check last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });

      let currentStreak = 0;
      for (const date of last7Days) {
        const dayNutrition = await databaseService.getNutritionLogs(
          userState.user.id,
          date,
          1
        );
        if (dayNutrition.length > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
      setStreak(currentStreak);

    } catch (error) {
      console.error('Error loading today data:', error);
    }
  }, [userState.user?.id]);

  // Load advanced analytics data
  const loadAdvancedAnalytics = useCallback(async () => {
    if (!userState.user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Load daily insights
      const dailyData = await advancedAnalyticsService.getDailyInsights(userState.user.id, today);
      setDailyInsights(dailyData);

      // Load weekly trends
      const weeklyData = await advancedAnalyticsService.getWeeklyTrends(userState.user.id, weekStartStr);
      setWeeklyTrends(weeklyData);

      // Load consistency streak
      const streakData = await advancedAnalyticsService.getConsistencyStreak(userState.user.id);
      setConsistencyStreak(streakData);
      setStreak(streakData.current_streak);

      // Load calories trend using progress metrics (more efficient than 7 daily calls)
      try {
        const progressData = await advancedAnalyticsService.getProgressMetrics(userState.user.id, 7);
        const trendData = progressData.calories_trend.map((value, index) => ({
          date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: value
        }));
        setCaloriesTrend(trendData);
      } catch (error) {
        console.log('Progress metrics unavailable for trend, using empty data');
        setCaloriesTrend([]);
      }

    } catch (error) {
      console.error('Error loading advanced analytics:', error);
    }
  }, [userState.user?.id]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (userState.user) {
      calculateTargets();
      loadTodayData();
      loadAdvancedAnalytics();
    }
  }, [userState.user, calculateTargets, loadTodayData, loadAdvancedAnalytics]);

  // Update last sync time when sync completes
  useEffect(() => {
    if (syncStatus.lastSyncTime) {
      setLastSyncTime(syncStatus.lastSyncTime);
    }
  }, [syncStatus.lastSyncTime]);

  const handleRefresh = async () => {
    hapticService.light();
    setIsLoading(true);
    
    try {
      await loadTodayData();
      await loadAdvancedAnalytics();
      await forceSync();
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsLoading(false);
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
          
          {/* Personalized Header (Greeting & Tips) */}
          <PersonalizedHeader onRefresh={handleRefresh} />

          {/* Dashboard Cards */}
          <View style={styles.cardsContainer}>
            {/* Nutrition Card (Calories + Macros) */}
            <AnimatedCard delay={100}>
              <MacrosCard
                calories={dailyTotals.calories}
                caloriesTarget={dailyTargets?.calories || 0}
                protein={dailyTotals.protein}
                carbs={dailyTotals.carbs}
                fat={dailyTotals.fat}
                proteinTarget={dailyTargets?.protein || 0}
                carbsTarget={dailyTargets?.carbs || 0}
                fatTarget={dailyTargets?.fat || 0}
                isLoading={isLoading}
              />
            </AnimatedCard>

            {/* Hydration Card */}
            <AnimatedCard delay={200}>
              <HydrationCard
                current={dailyTotals.water}
                target={dailyTargets?.hydration || 0}
                isLoading={isLoading}
              />
            </AnimatedCard>

            {/* Body Trend Card */}
            <AnimatedCard delay={300}>
              <BodyTrendCard
                userId={userState.user?.id || 0}
                isLoading={isLoading}
              />
            </AnimatedCard>

            {/* Consistency Card */}
            <AnimatedCard delay={400}>
              <ConsistencyCard
                streak={streak}
                lastSyncTime={lastSyncTime}
                syncStatus={syncStatus}
                isLoading={isLoading}
              />
            </AnimatedCard>
          
          {/* Recent Achievements */}
          <RecentAchievements />

            {/* Advanced Analytics Card */}
            {dailyInsights && weeklyTrends && consistencyStreak && (
              <AnimatedCard delay={500}>
                <AdvancedAnalyticsCard
                  dailyInsights={dailyInsights}
                  weeklyTrends={weeklyTrends}
                  consistencyStreak={consistencyStreak}
                  onViewDetails={() => console.log('View analytics details')}
                />
              </AnimatedCard>
            )}

            {/* Calories Trend Chart */}
            {caloriesTrend.length > 0 && (
              <AnimatedCard delay={600}>
                <TrendChart
                  title="Calories Trend"
                  data={caloriesTrend}
                  color="#FF6B6B"
                  unit="kcal"
                />
              </AnimatedCard>
            )}

            {/* Progress Insights */}
            {dailyInsights && weeklyTrends && consistencyStreak && (
              <AnimatedCard delay={700}>
                <ProgressInsights
                  dailyInsights={dailyInsights}
                  weeklyTrends={weeklyTrends}
                  consistencyStreak={consistencyStreak}
                  onInsightPress={(insight) => console.log('Insight pressed:', insight)}
                />
              </AnimatedCard>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cardsContainer: {
    gap: Layout.cardSpacing,
  },
});

export default DashboardScreen;

