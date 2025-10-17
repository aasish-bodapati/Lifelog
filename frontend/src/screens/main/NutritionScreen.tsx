import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'logs'>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    food_name?: string;
    calories?: string;
    protein_g?: string;
    carbs_g?: string;
    fat_g?: string;
  }>({});

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

  const handleEditMeal = (meal: LocalNutritionLog) => {
    setEditingMealId(meal.local_id);
    setEditValues({
      food_name: meal.food_name,
      calories: meal.calories?.toString() || '0',
      protein_g: meal.protein_g?.toString() || '0',
      carbs_g: meal.carbs_g?.toString() || '0',
      fat_g: meal.fat_g?.toString() || '0',
    });
  };

  const handleCancelEdit = () => {
    setEditingMealId(null);
    setEditValues({});
  };

  const handleSaveEdit = async (mealId: string) => {
    try {
      const updates = {
        food_name: editValues.food_name || '',
        calories: parseInt(editValues.calories || '0'),
        protein_g: parseInt(editValues.protein_g || '0'),
        carbs_g: parseInt(editValues.carbs_g || '0'),
        fat_g: parseInt(editValues.fat_g || '0'),
      };

      await databaseService.updateNutritionLog(mealId, updates);
      await loadData();
      setEditingMealId(null);
      setEditValues({});
      hapticService.success();
      toastService.success('Meal updated successfully');
    } catch (error) {
      console.error('Error updating meal:', error);
      toastService.error('Failed to update meal');
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteNutritionLog(mealId);
              await loadData();
              hapticService.success();
              toastService.success('Meal deleted successfully');
            } catch (error) {
              console.error('Error deleting meal:', error);
              toastService.error('Failed to delete meal');
            }
          },
        },
      ]
    );
  };

  const formatSelectedDate = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (selectedDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleDateChange = (_event: any, date?: Date) => {
    setShowCalendar(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const getFilteredMealsByDate = () => {
    if (!nutritionLogs) return [];
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    return nutritionLogs.filter((meal) => {
      const mealDate = new Date(meal.created_at).toISOString().split('T')[0];
      return mealDate === selectedDateString;
    });
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nutrition</Text>
          <Text style={styles.subtitle}>Track your meals and macros</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => {
            hapticService.light();
            setActiveTab('overview');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meals' && styles.activeTab]}
          onPress={() => {
            hapticService.light();
            setActiveTab('meals');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}>
            Meals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => {
            hapticService.light();
            setActiveTab('logs');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
            Logs
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={CommonStyles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
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
            <Text style={styles.sectionTitle}>Recent Meals</Text>
            {nutritionLogs && nutritionLogs.length > 0 && (
              <Text style={styles.sectionSubtitle}>{nutritionLogs.length} total</Text>
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
                      <Text style={styles.mealName}>{log.food_name}</Text>
                      <Text style={styles.mealDate}>{formatTime(log.created_at)}</Text>
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
          </>
        )}

        {/* Meals Tab */}
        {activeTab === 'meals' && (
          <View>
            {/* Coming Soon Placeholder */}
            <View style={styles.section}>
              <View style={styles.comingSoonContainer}>
                <View style={styles.comingSoonIconContainer}>
                  <Ionicons name="calendar-outline" size={64} color={Colors.primary} />
                </View>
                <Text style={styles.comingSoonTitle}>Meal Planning</Text>
                <Text style={styles.comingSoonSubtitle}>
                  This feature is coming soon! You'll be able to:
                </Text>
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    <Text style={styles.featureText}>Create meal templates and favorites</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    <Text style={styles.featureText}>Plan meals for the week ahead</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    <Text style={styles.featureText}>Copy meals from previous days</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    <Text style={styles.featureText}>Get meal suggestions based on your goals</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <View>
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

            {/* Date Navigation */}
            <View style={styles.dateNavigationContainer}>
              <TouchableOpacity onPress={handlePreviousDay} style={styles.dateNavButton}>
                <Ionicons name="chevron-back" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.dateDisplay}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.dateText}>{formatSelectedDate()}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextDay} style={styles.dateNavButton}>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Calendar Picker */}
            {showCalendar && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {/* Meal Logs List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Meals</Text>
                {getFilteredMealsByDate().length > 0 && (
                  <Text style={styles.sectionSubtitle}>{getFilteredMealsByDate().length} total</Text>
                )}
              </View>

              {getFilteredMealsByDate().length > 0 ? (
                <View style={styles.mealsList}>
                  {getFilteredMealsByDate().map((log) => {
                    const isEditing = editingMealId === log.local_id;
                    
                    return (
                      <View key={log.local_id} style={styles.mealLogCard}>
                        <View style={styles.mealLogHeader}>
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
                          <View style={styles.mealLogInfo}>
                            {isEditing ? (
                              <TextInput
                                style={styles.editFoodNameInput}
                                value={editValues.food_name}
                                onChangeText={(text) => setEditValues({ ...editValues, food_name: text })}
                                placeholder="Food name"
                              />
                            ) : (
                              <Text style={styles.mealLogName}>{log.food_name}</Text>
                            )}
                            <View style={styles.mealLogMeta}>
                              <Text style={styles.mealLogType}>{log.meal_type}</Text>
                              <Text style={styles.mealLogDot}>•</Text>
                              <Text style={styles.mealLogTime}>{formatTime(log.created_at)}</Text>
                              <Text style={styles.mealLogDot}>•</Text>
                              <Text style={styles.mealLogDate}>
                                {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.mealLogActions}>
                            {isEditing ? (
                              <>
                                <TouchableOpacity
                                  onPress={() => {
                                    hapticService.light();
                                    handleCancelEdit();
                                  }}
                                  style={styles.actionButton}
                                >
                                  <Ionicons name="close" size={20} color="#666666" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => {
                                    hapticService.light();
                                    handleSaveEdit(log.local_id);
                                  }}
                                  style={styles.actionButton}
                                >
                                  <Ionicons name="checkmark" size={20} color={Colors.success} />
                                </TouchableOpacity>
                              </>
                            ) : (
                              <>
                                <TouchableOpacity
                                  onPress={() => {
                                    hapticService.light();
                                    handleEditMeal(log);
                                  }}
                                  style={styles.actionButton}
                                >
                                  <Ionicons name="create-outline" size={20} color={Colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => {
                                    hapticService.light();
                                    handleDeleteMeal(log.local_id);
                                  }}
                                  style={styles.actionButton}
                                >
                                  <Ionicons name="trash-outline" size={20} color="#DC3545" />
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>
                        
                        {/* Macro Details - Editable */}
                        {isEditing ? (
                          <View style={styles.editMacrosContainer}>
                            <View style={styles.editMacroItem}>
                              <Text style={styles.editMacroLabel}>Calories</Text>
                              <TextInput
                                style={styles.editMacroInput}
                                value={editValues.calories}
                                onChangeText={(text) => setEditValues({ ...editValues, calories: text })}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                            </View>
                            <View style={styles.editMacroItem}>
                              <Text style={styles.editMacroLabel}>Protein</Text>
                              <TextInput
                                style={styles.editMacroInput}
                                value={editValues.protein_g}
                                onChangeText={(text) => setEditValues({ ...editValues, protein_g: text })}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                              <Text style={styles.editMacroUnit}>g</Text>
                            </View>
                            <View style={styles.editMacroItem}>
                              <Text style={styles.editMacroLabel}>Carbs</Text>
                              <TextInput
                                style={styles.editMacroInput}
                                value={editValues.carbs_g}
                                onChangeText={(text) => setEditValues({ ...editValues, carbs_g: text })}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                              <Text style={styles.editMacroUnit}>g</Text>
                            </View>
                            <View style={styles.editMacroItem}>
                              <Text style={styles.editMacroLabel}>Fat</Text>
                              <TextInput
                                style={styles.editMacroInput}
                                value={editValues.fat_g}
                                onChangeText={(text) => setEditValues({ ...editValues, fat_g: text })}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                              <Text style={styles.editMacroUnit}>g</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.mealMacros}>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{log.calories}</Text>
                              <Text style={styles.macroLabel}>cal</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{log.protein_g}g</Text>
                              <Text style={styles.macroLabel}>protein</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{log.carbs_g}g</Text>
                              <Text style={styles.macroLabel}>carbs</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{log.fat_g}g</Text>
                              <Text style={styles.macroLabel}>fat</Text>
                            </View>
                          </View>
                        )}
                        
                        {log.notes && !isEditing && (
                          <Text style={styles.mealNotes} numberOfLines={2}>
                            {log.notes}
                          </Text>
                        )}
                      </View>
                    );
                  })}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    marginHorizontal: Layout.screenPadding,
    marginTop: Layout.sectionSpacing,
    marginBottom: Layout.sectionSpacing,
    borderRadius: Layout.radiusMedium,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Layout.radiusSmall,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.surface,
    ...Layout.shadowSmall,
  },
  tabText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
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
    paddingVertical: Layout.sectionSpacing,
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
  mealName: {
    ...Typography.label,
    fontSize: 16,
    marginBottom: 2,
  },
  mealDate: {
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
  mealLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealLogInfo: {
    flex: 1,
  },
  mealLogName: {
    ...Typography.label,
    fontSize: 16,
    marginBottom: 4,
  },
  mealLogMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  mealLogType: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  mealLogDot: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginHorizontal: 4,
  },
  mealLogTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  mealLogDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  mealLogActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  dateNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.md,
  },
  dateNavButton: {
    padding: Spacing.sm,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dateText: {
    ...Typography.label,
    fontSize: 16,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  comingSoonIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  featureList: {
    width: '100%',
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  featureText: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'capitalize',
  },
  editFoodNameInput: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    padding: 0,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
  },
  editMacrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  editMacroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    minWidth: '45%',
  },
  editMacroLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  editMacroInput: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    padding: 0,
    paddingVertical: 2,
    minWidth: 40,
    textAlign: 'center',
  },
  editMacroUnit: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 2,
  },
});

export default NutritionScreen;