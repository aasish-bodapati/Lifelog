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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { databaseService } from '../../services/databaseService';
import { calculationService } from '../../services/calculationService';
import { hapticService } from '../../services/hapticService';
import { toastService } from '../../services/toastService';
import { bodyStatsService } from '../../services/bodyStatsService';
import { advancedAnalyticsService } from '../../services/advancedAnalyticsService';
import { getProgressIcon, getMacroColor, getStreakIcon, getConsistencyColor } from '../../utils';
import { CommonStyles, Layout, Colors, Typography } from '../../styles/designSystem';
import SyncIndicator from '../../components/SyncIndicator';
import RecentAchievements from '../../components/dashboard/RecentAchievements';
import AnimatedCard from '../../components/AnimatedCard';
import MacrosCard from '../../components/dashboard/MacrosCard';
import WorkoutLogCard from '../../components/dashboard/WorkoutLogCard';
import WelcomeCard from '../../components/dashboard/WelcomeCard';
import HydrationCard from '../../components/dashboard/HydrationCard';
import BodyTrendCard from '../../components/dashboard/BodyTrendCard';
import ConsistencyCard from '../../components/dashboard/ConsistencyCard';

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
  const navigation = useNavigation<any>();
  
  const [isLoading, setIsLoading] = useState(false);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0,
  });
  const [dailyTargets, setDailyTargets] = useState<DailyTargets | null>(null);
  const [todayWorkoutCount, setTodayWorkoutCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

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

      // Get today's workouts
      const todayWorkouts = await databaseService.getWorkouts(
        userState.user.id,
        50
      );
      const todayWorkoutsList = todayWorkouts.filter(workout => {
        const workoutDate = workout.date.split('T')[0];
        return workoutDate === today;
      });
      setTodayWorkoutCount(todayWorkoutsList.length);

      // Get today's body stats (for hydration)
      const bodyStats = await databaseService.getBodyStats(
        userState.user.id,
        7
      );

      // Find today's water intake from body stats (normalize date formats for comparison)
      const todayBodyStat = bodyStats.find(stat => {
        const statDate = stat.date.split('T')[0]; // Get YYYY-MM-DD part
        return statDate === today;
      });
      const waterIntake = todayBodyStat?.water_intake || 0;
      
      console.log('Water intake debug:', {
        today,
        bodyStatsCount: bodyStats.length,
        bodyStatsDates: bodyStats.map(s => s.date),
        foundStat: !!todayBodyStat,
        waterIntake
      });

      // Calculate totals
      const totals: DailyTotals = {
        calories: nutritionLogs.reduce((sum, log) => sum + log.calories, 0),
        protein: nutritionLogs.reduce((sum, log) => sum + log.protein_g, 0),
        carbs: nutritionLogs.reduce((sum, log) => sum + log.carbs_g, 0),
        fat: nutritionLogs.reduce((sum, log) => sum + log.fat_g, 0),
        water: waterIntake,
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

  // Load streak data
  const loadStreak = useCallback(async () => {
    if (!userState.user?.id) return;

    try {
      // Load consistency streak
      const streakData = await advancedAnalyticsService.getConsistencyStreak(userState.user.id);
      setStreak(streakData.current_streak);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  }, [userState.user?.id]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (userState.user) {
      calculateTargets();
      loadTodayData();
      loadStreak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userState.user?.id]); // Only depend on user ID to prevent duplicate calls

  // Update last sync time when sync completes
  useEffect(() => {
    if (syncStatus.lastSyncTime) {
      setLastSyncTime(syncStatus.lastSyncTime);
    }
  }, [syncStatus.lastSyncTime]);

  // Refresh data when screen comes into focus (e.g., after logging a meal)
  // Skip initial mount to avoid duplicate with the useEffect above
  const isInitialMount = React.useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      if (userState.user?.id) {
        loadTodayData();
      }
    }, [userState.user?.id, loadTodayData])
  );

  const handleRefresh = async () => {
    hapticService.light();
    setIsLoading(true);
    
    try {
      await loadTodayData();
      await loadStreak();
      await forceSync();
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWater = async (amount: number) => {
    if (!userState.user?.id) return;

    try {
      hapticService.light();
      
      // Calculate new total based on current UI state
      const newWaterTotal = dailyTotals.water + amount;
      
      // Update UI immediately for instant feedback
      setDailyTotals(prev => ({
        ...prev,
        water: newWaterTotal,
      }));
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Check local database first to see if we already have an entry for today
      const localBodyStats = await databaseService.getBodyStats(userState.user.id, 10);
      const existingLocalStat = localBodyStats.find(stat => {
        const statDate = stat.date.split('T')[0]; // Normalize date format
        return statDate === today;
      });
      
      console.log('Adding water:', {
        amount,
        currentWater: dailyTotals.water,
        newWaterTotal,
        today,
        localBodyStatsCount: localBodyStats.length,
        localBodyStatsDates: localBodyStats.map(s => s.date),
        foundExisting: !!existingLocalStat,
        existingWater: existingLocalStat?.water_intake
      });
      
      if (existingLocalStat) {
        // Update existing local entry
        console.log('Updating existing body stat:', existingLocalStat.local_id);
        await databaseService.updateBodyStat(existingLocalStat.local_id, {
          water_intake: newWaterTotal,
        });
      } else {
        // Create new local entry only if one doesn't exist
        console.log('Creating new body stat for today');
        await databaseService.saveBodyStat({
          local_id: `bodystat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: userState.user.id,
          date: today,
          water_intake: newWaterTotal,
        });
      }

      toastService.success(`Added ${amount}L of water! 💧`);
      
      // Reload data to reflect changes
      loadTodayData();
    } catch (error) {
      console.error('Error adding water:', error);
      toastService.error('Failed to log water intake');
      // Reload to get correct state on error
      loadTodayData();
    }
  };

  const handleWorkoutPress = () => {
    hapticService.light();
    navigation.navigate('WorkoutLog');
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
          {/* Dashboard Cards */}
          <View style={styles.cardsContainer}>
            {/* Welcome Card */}
            <AnimatedCard delay={50}>
              <WelcomeCard
                userName={userState.user?.full_name || userState.user?.username || 'there'}
                streak={streak}
              />
            </AnimatedCard>

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

            {/* Workout Log Card */}
            <AnimatedCard delay={150}>
              <WorkoutLogCard
                onPress={handleWorkoutPress}
                todayWorkoutCount={todayWorkoutCount}
                isLoading={isLoading}
              />
            </AnimatedCard>

            {/* Hydration Card */}
            <AnimatedCard delay={200}>
              <HydrationCard
                current={dailyTotals.water}
                target={dailyTargets?.hydration || 0}
                isLoading={isLoading}
                onAddWater={handleAddWater}
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

