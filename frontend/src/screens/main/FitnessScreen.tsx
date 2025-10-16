import React, { useState, useEffect, useCallback } from 'react';
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
import { databaseService, LocalWorkout } from '../../services/databaseService';
import { apiService } from '../../services/api';
import { hapticService } from '../../services/hapticService';
import { toastService } from '../../services/toastService';
import QuickWorkoutLogScreen from '../logging/QuickWorkoutLogScreen';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const FitnessScreen: React.FC = () => {
  const { state: userState } = useUser();
  const [workouts, setWorkouts] = useState<LocalWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWorkoutLog, setShowWorkoutLog] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    avgDuration: 0,
  });

  useEffect(() => {
    loadData();
  }, [userState.user?.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const userId = userState.user?.id || 0;
      
      // Load recent workouts from local database
      const recentWorkouts = await databaseService.getWorkouts(userId, 30);
      setWorkouts(recentWorkouts);
      
      // Calculate weekly stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      
      const weekWorkouts = recentWorkouts.filter(w => w.date >= weekAgoStr);
      const totalDuration = weekWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
      
      setWeeklyStats({
        totalWorkouts: weekWorkouts.length,
        totalDuration,
        avgDuration: weekWorkouts.length > 0 ? Math.round(totalDuration / weekWorkouts.length) : 0,
      });

      // Try to fetch from backend for sync
      try {
        const backendWorkouts = await apiService.getWorkouts(userId, 30);
        if (backendWorkouts && backendWorkouts.length > 0) {
          console.log('Backend workouts loaded:', backendWorkouts.length);
        }
      } catch (error) {
        console.log('Backend workouts unavailable, using local data');
      }
    } catch (error) {
      console.error('Error loading fitness data:', error);
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

  const handleWorkoutLogSuccess = () => {
    setShowWorkoutLog(false);
    loadData();
    hapticService.success();
    toastService.success('Workout logged successfully!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getWorkoutDuration = (workout: LocalWorkout) => {
    if (workout.duration_minutes) {
      return `${workout.duration_minutes} min`;
    }
    return 'No duration';
  };

  const getWorkoutIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('cardio') || nameLower.includes('run') || nameLower.includes('bike')) {
      return 'bicycle';
    } else if (nameLower.includes('strength') || nameLower.includes('weights') || nameLower.includes('lift')) {
      return 'barbell';
    } else if (nameLower.includes('yoga') || nameLower.includes('stretch')) {
      return 'body';
    } else {
      return 'fitness';
    }
  };

  const getWorkoutColor = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('cardio') || nameLower.includes('run') || nameLower.includes('bike')) {
      return '#FF6B6B';
    } else if (nameLower.includes('strength') || nameLower.includes('weights') || nameLower.includes('lift')) {
      return '#4ECDC4';
    } else if (nameLower.includes('yoga') || nameLower.includes('stretch')) {
      return '#A29BFE';
    } else {
      return '#45B7D1';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Fitness</Text>
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
            <Text style={styles.title}>Fitness</Text>
            <Text style={styles.subtitle}>Track your fitness journey</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              hapticService.light();
              setShowWorkoutLog(true);
            }}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Log Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FF6B6B20' }]}>
                <Ionicons name="barbell" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.statNumber}>{weeklyStats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#4ECDC420' }]}>
                <Ionicons name="time" size={24} color="#4ECDC4" />
              </View>
              <Text style={styles.statNumber}>{weeklyStats.totalDuration}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#45B7D120' }]}>
                <Ionicons name="stats-chart" size={24} color="#45B7D1" />
              </View>
              <Text style={styles.statNumber}>{weeklyStats.avgDuration}</Text>
              <Text style={styles.statLabel}>Avg Duration</Text>
            </View>
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {workouts.length > 0 && (
              <Text style={styles.sectionSubtitle}>{workouts.length} total</Text>
            )}
          </View>
          
          {workouts.length > 0 ? (
            <View style={styles.workoutsList}>
              {workouts.map((workout) => (
                <TouchableOpacity
                  key={workout.local_id}
                  style={styles.workoutCard}
                  onPress={() => {
                    hapticService.light();
                    // TODO: Navigate to workout details
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.workoutHeader}>
                    <View style={[
                      styles.workoutIconContainer,
                      { backgroundColor: getWorkoutColor(workout.name) + '20' }
                    ]}>
                      <Ionicons
                        name={getWorkoutIcon(workout.name) as any}
                        size={20}
                        color={getWorkoutColor(workout.name)}
                      />
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>{workout.name}</Text>
                      <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                    </View>
                    <View style={styles.workoutMeta}>
                      <Text style={styles.workoutDuration}>{getWorkoutDuration(workout)}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                    </View>
                  </View>
                  
                  {workout.notes && (
                    <Text style={styles.workoutNotes} numberOfLines={2}>
                      {workout.notes}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="barbell-outline" size={64} color="#CCCCCC" />
              </View>
              <Text style={styles.emptyStateTitle}>No workouts yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Start your fitness journey by logging your first workout
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => {
                  hapticService.light();
                  setShowWorkoutLog(true);
                }}
              >
                <Text style={styles.emptyStateButtonText}>Log First Workout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tips Section */}
        {workouts.length > 0 && (
          <View style={styles.tipsSection}>
            <View style={styles.tipCard}>
              <Ionicons name="bulb" size={20} color="#FFA500" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Pro Tip</Text>
                <Text style={styles.tipText}>
                  {weeklyStats.totalWorkouts >= 3
                    ? "You're crushing it! Consider adding rest days for recovery."
                    : "Aim for 3-5 workouts per week for optimal results."}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Workout Log Modal */}
      <Modal
        visible={showWorkoutLog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWorkoutLog(false)}
      >
        <QuickWorkoutLogScreen
          onClose={() => setShowWorkoutLog(false)}
          onSuccess={handleWorkoutLogSuccess}
        />
      </Modal>
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
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
  workoutsList: {
    gap: 12,
  },
  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  workoutDate: {
    fontSize: 14,
    color: '#666666',
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  workoutNotes: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
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

export default FitnessScreen;