import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { databaseService, LocalNutritionLog } from '../../services/databaseService';
import { apiService } from '../../services/api';
import { hapticService } from '../../services/hapticService';
import { toastService } from '../../services/toastService';
import QuickMealLogScreen from '../logging/QuickMealLogScreen';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const NutritionScreen: React.FC = () => {
  const { state: userState } = useUser();
  const [nutritionLogs, setNutritionLogs] = useState<LocalNutritionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMealLog, setShowMealLog] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [todaysMacros, setTodaysMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  useEffect(() => {
    loadData();
  }, [userState.user?.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const userId = userState.user?.id || 0;
      const today = new Date().toISOString().split('T')[0];
      
      // Load today's nutrition logs
      const todayLogs = await databaseService.getNutritionLogs(userId, today, 100);
      setNutritionLogs(todayLogs);
      
      // Calculate today's macros
      const macros = todayLogs.reduce(
        (totals, log) => ({
          calories: totals.calories + (log.calories || 0),
          protein: totals.protein + (log.protein_g || 0),
          carbs: totals.carbs + (log.carbs_g || 0),
          fat: totals.fat + (log.fat_g || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setTodaysMacros(macros);

      // Try to fetch from backend for sync
      try {
        const backendLogs = await apiService.getNutritionLogs(userId, today, 100);
        if (backendLogs && backendLogs.length > 0) {
          console.log('Backend nutrition logs loaded:', backendLogs.length);
        }
      } catch (error) {
        console.log('Backend nutrition logs unavailable, using local data');
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      toastService.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMealLogSuccess = () => {
    setShowMealLog(false);
    setSelectedMealType('');
    loadData();
    hapticService.success();
    toastService.success('Meal logged successfully!');
  };

  const handleMealTypePress = (mealType: string) => {
    hapticService.light();
    setSelectedMealType(mealType);
    setShowMealLog(true);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'sunny';
      case 'lunch':
        return 'partly-sunny';
      case 'dinner':
        return 'moon';
      case 'snack':
        return 'cafe';
      default:
        return 'restaurant';
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return '#FF9500';
      case 'lunch':
        return '#34C759';
      case 'dinner':
        return '#5856D6';
      case 'snack':
        return '#FF2D92';
      default:
        return '#8E8E93';
    }
  };

  const getMealTypeStats = () => {
    const stats = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    nutritionLogs.forEach(log => {
      const mealType = log.meal_type.toLowerCase();
      if (mealType in stats) {
        stats[mealType as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const calculateMacroPercentages = () => {
    const totalMacroCalories = (todaysMacros.protein * 4) + (todaysMacros.carbs * 4) + (todaysMacros.fat * 9);
    
    if (totalMacroCalories === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
      protein: Math.round((todaysMacros.protein * 4 / totalMacroCalories) * 100),
      carbs: Math.round((todaysMacros.carbs * 4 / totalMacroCalories) * 100),
      fat: Math.round((todaysMacros.fat * 9 / totalMacroCalories) * 100),
    };
  };

  const mealTypeStats = getMealTypeStats();
  const macroPercentages = calculateMacroPercentages();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition</Text>
        </View>
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Nutrition</Text>
            <Text style={styles.subtitle}>Track your meals and macros</Text>
          </View>
          <TouchableOpacity
            style={styles.quickLogButton}
            onPress={() => {
              hapticService.light();
              setShowMealLog(true);
            }}
          >
            <Ionicons name="add-circle" size={20} color="#007AFF" />
            <Text style={styles.quickLogButtonText}>Quick Log</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Macros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Nutrition</Text>
          <View style={styles.macroCard}>
            <View style={styles.macroHeader}>
              <Text style={styles.macroTitle}>Macros Breakdown</Text>
              <Text style={styles.totalCalories}>{Math.round(todaysMacros.calories)} kcal</Text>
            </View>
            
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <View style={[styles.macroIndicator, { backgroundColor: '#4ECDC4' }]} />
                <View style={styles.macroDetails}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>{Math.round(todaysMacros.protein)}g</Text>
                </View>
                <Text style={styles.macroPercentage}>{macroPercentages.protein}%</Text>
              </View>

              <View style={styles.macroItem}>
                <View style={[styles.macroIndicator, { backgroundColor: '#FFD93D' }]} />
                <View style={styles.macroDetails}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>{Math.round(todaysMacros.carbs)}g</Text>
                </View>
                <Text style={styles.macroPercentage}>{macroPercentages.carbs}%</Text>
              </View>

              <View style={styles.macroItem}>
                <View style={[styles.macroIndicator, { backgroundColor: '#FF6B6B' }]} />
                <View style={styles.macroDetails}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroValue}>{Math.round(todaysMacros.fat)}g</Text>
                </View>
                <Text style={styles.macroPercentage}>{macroPercentages.fat}%</Text>
              </View>
            </View>

            {/* Macro Distribution Bar */}
            {todaysMacros.calories > 0 && (
              <View style={styles.macroBar}>
                <View style={[styles.macroBarSegment, { 
                  flex: macroPercentages.protein, 
                  backgroundColor: '#4ECDC4' 
                }]} />
                <View style={[styles.macroBarSegment, { 
                  flex: macroPercentages.carbs, 
                  backgroundColor: '#FFD93D' 
                }]} />
                <View style={[styles.macroBarSegment, { 
                  flex: macroPercentages.fat, 
                  backgroundColor: '#FF6B6B' 
                }]} />
              </View>
            )}
          </View>
        </View>

        {/* Quick Meal Logging */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Meal</Text>
          <View style={styles.mealTypeGrid}>
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((mealType) => (
              <TouchableOpacity
                key={mealType}
                style={[
                  styles.mealTypeButton,
                  { backgroundColor: getMealTypeColor(mealType) + '20' }
                ]}
                onPress={() => handleMealTypePress(mealType)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.mealTypeIconContainer,
                  { backgroundColor: getMealTypeColor(mealType) + '40' }
                ]}>
                  <Ionicons
                    name={getMealTypeIcon(mealType) as any}
                    size={24}
                    color={getMealTypeColor(mealType)}
                  />
                </View>
                <Text style={[styles.mealTypeText, { color: getMealTypeColor(mealType) }]}>
                  {mealType}
                </Text>
                {mealTypeStats[mealType.toLowerCase() as keyof typeof mealTypeStats] > 0 && (
                  <View style={[styles.mealCountBadge, { backgroundColor: getMealTypeColor(mealType) }]}>
                    <Text style={styles.mealCountText}>
                      {mealTypeStats[mealType.toLowerCase() as keyof typeof mealTypeStats]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            {nutritionLogs.length > 0 && (
              <Text style={styles.sectionSubtitle}>{nutritionLogs.length} logged</Text>
            )}
          </View>
          
          {nutritionLogs.length > 0 ? (
            <View style={styles.mealsList}>
              {nutritionLogs.map((log) => (
                <View key={log.local_id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTypeInfo}>
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
                      <View>
                        <Text style={styles.mealTypeName}>{log.meal_type}</Text>
                        <Text style={styles.mealTime}>{formatTime(log.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={styles.mealCalories}>{log.calories || 0} kcal</Text>
                  </View>
                  
                  <View style={styles.mealMacros}>
                    <View style={styles.mealMacroItem}>
                      <Text style={styles.mealMacroValue}>{log.protein_g || 0}g</Text>
                      <Text style={styles.mealMacroLabel}>Protein</Text>
                    </View>
                    <View style={styles.mealMacroItem}>
                      <Text style={styles.mealMacroValue}>{log.carbs_g || 0}g</Text>
                      <Text style={styles.mealMacroLabel}>Carbs</Text>
                    </View>
                    <View style={styles.mealMacroItem}>
                      <Text style={styles.mealMacroValue}>{log.fat_g || 0}g</Text>
                      <Text style={styles.mealMacroLabel}>Fat</Text>
                    </View>
                  </View>

                  {log.notes && (
                    <Text style={styles.mealNotes} numberOfLines={2}>
                      {log.notes}
                    </Text>
                  )}
                </View>
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

        {/* Nutrition Tips */}
        {nutritionLogs.length > 0 && (
          <View style={styles.tipsSection}>
            <View style={styles.tipCard}>
              <Ionicons name="bulb" size={20} color="#4CAF50" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Nutrition Tip</Text>
                <Text style={styles.tipText}>
                  {todaysMacros.protein >= 100
                    ? "Excellent protein intake! You're fueling your muscles well."
                    : "Try to include more protein-rich foods to hit your daily goal."}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Meal Log Modal */}
      <QuickMealLogScreen
        visible={showMealLog}
        onClose={() => {
          setShowMealLog(false);
          setSelectedMealType('');
        }}
        onSuccess={handleMealLogSuccess}
        initialMealType={selectedMealType}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
  },
  quickLogButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
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
  macroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalCalories: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  macroRow: {
    gap: 12,
    marginBottom: 16,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  macroIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  macroDetails: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  macroPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  macroBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  macroBarSegment: {
    height: '100%',
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeButton: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  mealTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeInfo: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  mealTime: {
    fontSize: 14,
    color: '#666666',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
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
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    fontStyle: 'italic',
    lineHeight: 20,
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