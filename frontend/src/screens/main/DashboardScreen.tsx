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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { databaseService } from '../../services/databaseService';
import { calculationService } from '../../services/calculationService';
import { hapticService } from '../../services/hapticService';
import { toastService } from '../../services/toastService';
import { bodyStatsService } from '../../services/bodyStatsService';
import { advancedAnalyticsService } from '../../services/advancedAnalyticsService';
import { WorkoutRoutine, RoutineDay, RoutineExercise } from '../../services/workoutRoutineService';
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
import QuickExerciseLogModal from '../../components/QuickExerciseLogModal';

const { width } = Dimensions.get('window');
const ACTIVE_ROUTINE_KEY = 'activeWorkoutRoutine';

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

// Get today's day number (1 = Monday, 7 = Sunday)
const getTodayDayNumber = (): number => {
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  // Convert to Monday=1, Sunday=7
  return today === 0 ? 7 : today;
};

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
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(null);
  const [todayRoutineDay, setTodayRoutineDay] = useState<RoutineDay | null>(null);
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);

  // Load active routine and find today's workout
  const loadActiveRoutine = useCallback(async () => {
    try {
      const savedRoutine = await AsyncStorage.getItem(ACTIVE_ROUTINE_KEY);
      console.log('📋 Saved routine from storage:', savedRoutine ? 'found' : 'not found');
      
      if (savedRoutine) {
        const routine: WorkoutRoutine = JSON.parse(savedRoutine);
        setActiveRoutine(routine);
        
        console.log('📋 Routine loaded:', routine.name);
        console.log('📋 Routine days:', routine.days.map(d => ({ dayNumber: d.dayNumber, title: d.title })));
        
        // Find today's workout
        const todayDayNum = getTodayDayNumber();
        console.log('📅 Today\'s day number:', todayDayNum);
        
        const routineDay = routine.days.find(d => d.dayNumber === todayDayNum);
        console.log('📋 Found routine for today:', routineDay ? routineDay.title : 'none');
        
        setTodayRoutineDay(routineDay || null);
      } else {
        console.log('📋 No active routine in storage');
        setActiveRoutine(null);
        setTodayRoutineDay(null);
      }
    } catch (error) {
      console.error('Error loading active routine:', error);
    }
  }, []);

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
      // Get today's date in local timezone (not UTC)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      
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
        // Format in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
      loadActiveRoutine(); // Load active routine on mount
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
        loadActiveRoutine();
      }
    }, [userState.user?.id, loadTodayData, loadActiveRoutine])
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
      
      // Get today's date in local timezone (not UTC)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      
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

  const handleExercisePress = (exercise: RoutineExercise, index: number) => {
    hapticService.light();
    setSelectedExercise(exercise);
    setShowQuickLogModal(true);
  };

  const handleSaveQuickLog = async (
    exercise: RoutineExercise,
    repsPerSet: (number | string)[],
    weightPerSet?: (number | string)[]
  ) => {
    if (!userState.user?.id) {
      toastService.error('Error', 'User not logged in');
      return;
    }

    try {
      // Get current date in local timezone
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDate = `${year}-${month}-${day}`;

      // Parse string values to numbers and apply defaults
      const repsWithDefaults = repsPerSet.map(r => {
        if (r === undefined || r === '') return 10;
        return typeof r === 'string' ? (parseFloat(r) || 10) : r;
      });

      // Build notes string
      const details = [];
      const repsDisplay = repsWithDefaults.join('-');
      details.push(`${exercise.sets} sets: ${repsDisplay} reps`);

      // Add weight if available (only for weighted exercises)
      if (weightPerSet && weightPerSet.length > 0) {
        // Check if there are any actual weight values (not all undefined/empty)
        const hasWeightValues = weightPerSet.some(w => w !== undefined && w !== '');
        
        if (hasWeightValues) {
          const weightsWithDefaults = weightPerSet.map(w => {
            if (w === undefined || w === '') return 20;
            return typeof w === 'string' ? (parseFloat(w) || 20) : w;
          });
          const weightDisplay = weightsWithDefaults.join('-');
          details.push(`${weightDisplay}kg`);
        }
      }

      const notes = details.join(' • ');

      // Create workout data
      const workoutData = {
        local_id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userState.user.id,
        name: exercise.name,
        duration_minutes: 10, // Default duration for strength exercises
        date: currentDate,
        notes: notes,
      };

      // Save to local database
      await databaseService.saveWorkout(workoutData);

      toastService.success('Success', `${exercise.name} logged!`);
      
      // Reload data to update the dashboard
      loadTodayData();
    } catch (error) {
      console.error('Error logging workout:', error);
      toastService.error('Error', 'Failed to log workout');
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
        <View style={[CommonStyles.content, styles.content]}>
          {/* Dashboard Cards */}
          <View style={styles.cardsContainer}>
            {/* Welcome Card */}
            <AnimatedCard delay={50}>
              <WelcomeCard
                userName={userState.user?.full_name || userState.user?.username || 'there'}
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

            {/* Hydration Card */}
            <AnimatedCard delay={150}>
              <HydrationCard
                current={dailyTotals.water}
                target={dailyTargets?.hydration || 0}
                isLoading={isLoading}
                onAddWater={handleAddWater}
              />
            </AnimatedCard>

            {/* Workout Log Card */}
            <AnimatedCard delay={200}>
              <WorkoutLogCard
                onPress={handleWorkoutPress}
                todayWorkoutCount={todayWorkoutCount}
                isLoading={isLoading}
                todayRoutineDay={todayRoutineDay}
                hasActiveRoutine={activeRoutine !== null}
                onExercisePress={handleExercisePress}
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

      {/* Quick Exercise Log Modal */}
      <QuickExerciseLogModal
        visible={showQuickLogModal}
        exercise={selectedExercise}
        onClose={() => setShowQuickLogModal(false)}
        onSave={handleSaveQuickLog}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: 16, // Extra padding to prevent SyncIndicator overlap
  },
  cardsContainer: {
    gap: Layout.cardSpacing,
  },
});

export default DashboardScreen;

