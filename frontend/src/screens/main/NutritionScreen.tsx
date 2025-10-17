import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { databaseService, LocalNutritionLog } from '../../services/databaseService';
import { apiService } from '../../services/api';
import { hapticService } from '../../services/hapticService';
import { toastService } from '../../services/toastService';
import { useScreenData, useWeeklyNutritionStats } from '../../hooks';
import { getMealTypeIcon, getMealTypeColor } from '../../utils';
import { CommonStyles, Layout, Colors, Typography, Spacing } from '../../styles/designSystem';
import QuickMealLogScreen from '../logging/QuickMealLogScreen';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const NutritionScreen: React.FC = () => {
  const { state: userState } = useUser();
  const [showMealLog, setShowMealLog] = useState(false);

  // Use the new useScreenData hook for data loading
  const { data: nutritionLogs, isLoading, isRefreshing, refresh, loadData } = useScreenData<LocalNutritionLog[]>({
    fetchData: async () => {
      const userId = userState.user?.id || 0;
      const today = new Date().toISOString().split('T')[0];
      
      // Load recent nutrition logs (last 30 days)
      const recentLogs = await databaseService.getNutritionLogs(userId, today, 100);
      
      // Try to fetch from backend for sync (silent failure)
      try {
        const backendLogs = await apiService.getNutritionLogs(userId, today, 100);
        if (backendLogs && backendLogs.length > 0) {
          console.log('Backend nutrition logs loaded:', backendLogs.length);
        }
      } catch (error) {
        console.log('Backend nutrition logs unavailable, using local data');
      }
      
      return recentLogs;
    },
    dependencies: [userState.user?.id],
    errorMessage: 'Failed to load nutrition data',
  });

  // Use the new useWeeklyNutritionStats hook for weekly calculations
  const weeklyStats = useWeeklyNutritionStats(nutritionLogs || []);

  // Convert to match existing interface
  const weeklyStatsFormatted = {
    totalMeals: weeklyStats.totalItems,
    totalCalories: weeklyStats.totalValue,
    avgCalories: weeklyStats.avgValue,
  };

  const handleMealLogSuccess = () => {
    setShowMealLog(false);
    loadData();
    hapticService.success();
    toastService.success('Meal logged successfully!');
  };


  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  if (isLoading) {
    return (
      <SafeAreaView style={CommonStyles.screenContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition</Text>
        </View>
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.screenContainer}>
      <ScrollView
        style={CommonStyles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Nutrition</Text>
            <Text style={styles.subtitle}>Track your meals and macros</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              hapticService.light();
              setShowMealLog(true);
            }}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Log Meal</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FF6B6B20' }]}>
                <Ionicons name="restaurant" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.statNumber}>{weeklyStatsFormatted.totalMeals}</Text>
              <Text style={styles.statLabel}>Meals</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#4ECDC420' }]}>
                <Ionicons name="flame" size={24} color="#4ECDC4" />
              </View>
              <Text style={styles.statNumber}>{weeklyStatsFormatted.totalCalories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#45B7D120' }]}>
                <Ionicons name="stats-chart" size={24} color="#45B7D1" />
              </View>
              <Text style={styles.statNumber}>{weeklyStatsFormatted.avgCalories}</Text>
              <Text style={styles.statLabel}>Avg Calories</Text>
            </View>
          </View>
        </View>

        {/* Recent Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            {nutritionLogs && nutritionLogs.length > 0 && (
              <Text style={styles.sectionSubtitle}>{nutritionLogs.length} logged</Text>
            )}
          </View>
          
          {nutritionLogs && nutritionLogs.length > 0 ? (
            <View style={styles.mealsList}>
              {nutritionLogs.map((log) => (
                <TouchableOpacity
                  key={log.local_id}
                  style={styles.mealCard}
                  onPress={() => {
                    hapticService.light();
                    // TODO: Navigate to meal details
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.mealHeader}>
                    <View style={[
                      styles.mealIconContainer,
                      { backgroundColor: getMealTypeColor(log.meal_type) + '20' }
                    ]}>
                      <Ionicons
                        name={getMealTypeIcon(log.meal_type) as any}
                        size={20}
                        color={getMealTypeColor(log.meal_type)}
                      />
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealTypeName}>{log.meal_type}</Text>
                      <Text style={styles.mealTime}>{formatTime(log.created_at)}</Text>
                    </View>
                    <View style={styles.mealMeta}>
                      <Text style={styles.mealCalories}>{log.calories || 0} kcal</Text>
                      <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                    </View>
                  </View>
                  
                  {log.notes && (
                    <Text style={styles.mealNotes} numberOfLines={2}>
                      {log.notes}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="restaurant-outline" size={64} color="#CCCCCC" />
              </View>
              <Text style={styles.emptyStateTitle}>No meals logged yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Start tracking your nutrition by logging your first meal
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => {
                  hapticService.light();
                  setShowMealLog(true);
                }}
              >
                <Text style={styles.emptyStateButtonText}>Log First Meal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tips Section */}
        {nutritionLogs && nutritionLogs.length > 0 && (
          <View style={styles.tipsSection}>
            <View style={styles.tipCard}>
              <Ionicons name="bulb" size={20} color="#FFA500" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Pro Tip</Text>
                <Text style={styles.tipText}>
                  {weeklyStatsFormatted.avgCalories >= 2000
                    ? "You're maintaining a good calorie balance this week!"
                    : "Try to include more nutrient-dense foods in your meals."}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Meal Log Modal */}
      <Modal
        visible={showMealLog}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => setShowMealLog(false)}
      >
        <QuickMealLogScreen
          onClose={() => setShowMealLog(false)}
          onSuccess={handleMealLogSuccess}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.headerPadding,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Layout.sectionSpacing,
  },
  primaryButton: {
    ...CommonStyles.buttonPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  primaryButtonText: {
    ...Typography.label,
    color: Colors.textLight,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  statsSection: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Layout.sectionSpacingLarge,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statCard: {
    ...CommonStyles.card,
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statNumber: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Layout.sectionSpacingLarge,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Layout.cardSpacing,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealTypeName: {
    ...Typography.label,
    fontSize: 16,
    marginBottom: 2,
  },
  mealTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  mealCalories: {
    ...Typography.label,
    color: Colors.primary,
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  mealMacroItem: {
    alignItems: 'center',
  },
  mealMacroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  mealMacroLabel: {
    fontSize: 12,
    color: '#666666',
  },
  mealNotes: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});

export default NutritionScreen;