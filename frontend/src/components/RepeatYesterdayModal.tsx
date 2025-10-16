import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { repeatYesterdayService, YesterdayData } from '../services/repeatYesterdayService';
import { useUser } from '../context/UserContext';
import { useSync } from '../context/SyncContext';

interface RepeatYesterdayModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RepeatYesterdayModal: React.FC<RepeatYesterdayModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { state: userState } = useUser();
  const { forceSync } = useSync();
  const [isLoading, setIsLoading] = useState(false);
  const [yesterdayData, setYesterdayData] = useState<YesterdayData | null>(null);
  const [summary, setSummary] = useState({
    hasWorkouts: false,
    hasNutrition: false,
    hasBodyStats: false,
    workoutCount: 0,
    nutritionCount: 0,
    bodyStatCount: 0,
  });

  useEffect(() => {
    if (visible && userState.user?.id) {
      loadYesterdayData();
    }
  }, [visible, userState.user?.id]);

  const loadYesterdayData = async () => {
    if (!userState.user?.id) return;

    setIsLoading(true);
    try {
      const [data, summaryData] = await Promise.all([
        repeatYesterdayService.getYesterdayData(userState.user.id),
        repeatYesterdayService.getYesterdaySummary(userState.user.id),
      ]);
      
      setYesterdayData(data);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading yesterday data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepeatAll = async () => {
    if (!userState.user?.id) return;

    setIsLoading(true);
    try {
      await repeatYesterdayService.repeatAllYesterday(userState.user.id);
      await forceSync();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error repeating all yesterday data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepeatWorkouts = async () => {
    if (!userState.user?.id) return;

    setIsLoading(true);
    try {
      await repeatYesterdayService.repeatYesterdayWorkouts(userState.user.id);
      await forceSync();
      onSuccess?.();
    } catch (error) {
      console.error('Error repeating yesterday workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepeatNutrition = async () => {
    if (!userState.user?.id) return;

    setIsLoading(true);
    try {
      await repeatYesterdayService.repeatYesterdayNutrition(userState.user.id);
      await forceSync();
      onSuccess?.();
    } catch (error) {
      console.error('Error repeating yesterday nutrition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepeatBodyStats = async () => {
    if (!userState.user?.id) return;

    setIsLoading(true);
    try {
      await repeatYesterdayService.repeatYesterdayBodyStats(userState.user.id);
      await forceSync();
      onSuccess?.();
    } catch (error) {
      console.error('Error repeating yesterday body stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAnyData = summary.hasWorkouts || summary.hasNutrition || summary.hasBodyStats;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Repeat Yesterday</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading && !yesterdayData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading yesterday's data...</Text>
            </View>
          ) : !hasAnyData ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Data Found</Text>
              <Text style={styles.emptyText}>
                No workouts, meals, or body stats were logged yesterday.
              </Text>
            </View>
          ) : (
            <>
              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Yesterday's Summary</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Ionicons name="fitness" size={20} color="#E74C3C" />
                    <Text style={styles.summaryText}>
                      {summary.workoutCount} workout{summary.workoutCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="restaurant" size={20} color="#27AE60" />
                    <Text style={styles.summaryText}>
                      {summary.nutritionCount} meal{summary.nutritionCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="body" size={20} color="#E67E22" />
                    <Text style={styles.summaryText}>
                      {summary.bodyStatCount} measurement{summary.bodyStatCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.repeatAllButton]}
                  onPress={handleRepeatAll}
                  disabled={isLoading}
                >
                  <Ionicons name="refresh" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Repeat All</Text>
                </TouchableOpacity>

                <View style={styles.individualActions}>
                  {summary.hasWorkouts && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.workoutButton]}
                      onPress={handleRepeatWorkouts}
                      disabled={isLoading}
                    >
                      <Ionicons name="fitness" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>
                        Repeat Workouts ({summary.workoutCount})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {summary.hasNutrition && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.nutritionButton]}
                      onPress={handleRepeatNutrition}
                      disabled={isLoading}
                    >
                      <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>
                        Repeat Meals ({summary.nutritionCount})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {summary.hasBodyStats && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.bodyStatButton]}
                      onPress={handleRepeatBodyStats}
                      disabled={isLoading}
                    >
                      <Ionicons name="body" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>
                        Repeat Measurements ({summary.bodyStatCount})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Details */}
              {yesterdayData && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsTitle}>Details</Text>
                  
                  {yesterdayData.workouts.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>Workouts</Text>
                      {yesterdayData.workouts.map((workout, index) => (
                        <View key={index} style={styles.detailsItem}>
                          <Text style={styles.detailsItemText}>{workout.name}</Text>
                          {workout.duration_minutes && (
                            <Text style={styles.detailsItemSubtext}>
                              {workout.duration_minutes} minutes
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {yesterdayData.nutrition.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>Meals</Text>
                      {yesterdayData.nutrition.map((nutrition, index) => (
                        <View key={index} style={styles.detailsItem}>
                          <Text style={styles.detailsItemText}>
                            {nutrition.food_name} ({nutrition.meal_type})
                          </Text>
                          <Text style={styles.detailsItemSubtext}>
                            {nutrition.calories} calories
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {yesterdayData.bodyStats.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>Body Stats</Text>
                      {yesterdayData.bodyStats.map((bodyStat, index) => (
                        <View key={index} style={styles.detailsItem}>
                          <Text style={styles.detailsItemText}>
                            {bodyStat.weight_kg ? `${bodyStat.weight_kg} kg` : 'Body measurements'}
                          </Text>
                          {bodyStat.body_fat_percentage && (
                            <Text style={styles.detailsItemSubtext}>
                              {bodyStat.body_fat_percentage}% body fat
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  repeatAllButton: {
    backgroundColor: '#8E44AD',
  },
  individualActions: {
    gap: 8,
  },
  workoutButton: {
    backgroundColor: '#E74C3C',
  },
  nutritionButton: {
    backgroundColor: '#27AE60',
  },
  bodyStatButton: {
    backgroundColor: '#E67E22',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailsItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailsItemText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailsItemSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default RepeatYesterdayModal;

