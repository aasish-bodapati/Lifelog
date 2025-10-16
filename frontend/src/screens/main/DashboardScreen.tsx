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
import SyncIndicator from '../../components/SyncIndicator';
import EnergyCard from '../../components/dashboard/EnergyCard';
import MacrosCard from '../../components/dashboard/MacrosCard';
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

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    hapticService.light();
    setIsLoading(true);
    
    try {
      await loadTodayData();
      await forceSync();
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadTodayData, forceSync]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (userState.user) {
      calculateTargets();
      loadTodayData();
    }
  }, [userState.user, calculateTargets, loadTodayData]);

  // Update last sync time when sync completes
  useEffect(() => {
    if (syncStatus.lastSyncTime) {
      setLastSyncTime(syncStatus.lastSyncTime);
    }
  }, [syncStatus.lastSyncTime]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getMotivationalMessage = () => {
    if (streak === 0) return "Start your journey today!";
    if (streak === 1) return "Great start! Keep it up!";
    if (streak < 7) return `You're on a ${streak}-day streak!`;
    if (streak < 30) return `Amazing ${streak}-day streak!`;
    return `Incredible ${streak}-day streak! You're unstoppable!`;
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
            <Text style={styles.greeting}>
              {getGreeting()}, {userState.user?.username || 'User'}!
            </Text>
            <Text style={styles.motivationalMessage}>
              {getMotivationalMessage()}
            </Text>
          </View>

          {/* Dashboard Cards */}
          <View style={styles.cardsContainer}>
            {/* Energy Card */}
            <EnergyCard
              current={dailyTotals.calories}
              target={dailyTargets?.calories || 0}
              isLoading={isLoading}
            />

            {/* Macros Card */}
            <MacrosCard
              protein={dailyTotals.protein}
              carbs={dailyTotals.carbs}
              fat={dailyTotals.fat}
              proteinTarget={dailyTargets?.protein || 0}
              carbsTarget={dailyTargets?.carbs || 0}
              fatTarget={dailyTargets?.fat || 0}
              isLoading={isLoading}
            />

            {/* Hydration Card */}
            <HydrationCard
              current={dailyTotals.water}
              target={dailyTargets?.hydration || 0}
              isLoading={isLoading}
            />

            {/* Body Trend Card */}
            <BodyTrendCard
              userId={userState.user?.id || 0}
              isLoading={isLoading}
            />

            {/* Consistency Card */}
            <ConsistencyCard
              streak={streak}
              lastSyncTime={lastSyncTime}
              syncStatus={syncStatus}
              isLoading={isLoading}
            />
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
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  motivationalMessage: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  cardsContainer: {
    gap: 16,
  },
});

export default DashboardScreen;

