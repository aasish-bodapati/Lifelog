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
import PersonalizedHeader from '../../components/dashboard/PersonalizedHeader';
import AnimatedCard from '../../components/AnimatedCard';
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

  const handleRefresh = async () => {
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
          {/* Personalized Header */}
          <PersonalizedHeader onRefresh={handleRefresh} />

          {/* Dashboard Cards */}
          <View style={styles.cardsContainer}>
            {/* Energy Card */}
            <AnimatedCard delay={100}>
              <EnergyCard
                current={dailyTotals.calories}
                target={dailyTargets?.calories || 0}
                isLoading={isLoading}
              />
            </AnimatedCard>

            {/* Macros Card */}
            <AnimatedCard delay={200}>
              <MacrosCard
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
            <AnimatedCard delay={300}>
              <HydrationCard
                current={dailyTotals.water}
                target={dailyTargets?.hydration || 0}
                isLoading={isLoading}
              />
            </AnimatedCard>

            {/* Body Trend Card */}
            <AnimatedCard delay={400}>
              <BodyTrendCard
                userId={userState.user?.id || 0}
                isLoading={isLoading}
              />
            </AnimatedCard>

            {/* Consistency Card */}
            <AnimatedCard delay={500}>
              <ConsistencyCard
                streak={streak}
                lastSyncTime={lastSyncTime}
                syncStatus={syncStatus}
                isLoading={isLoading}
              />
            </AnimatedCard>
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
  cardsContainer: {
    gap: 16,
  },
});

export default DashboardScreen;

