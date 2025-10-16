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
import { databaseService, LocalWorkout } from '../../services/databaseService';
import { apiService } from '../../services/api';
import { hapticService } from '../../services/hapticService';
import { toastService } from '../../services/toastService';
import { exerciseProgressService, ExerciseProgress } from '../../services/exerciseProgressService';
import { useScreenData, useWeeklyWorkoutStats } from '../../hooks';
import { getWorkoutIcon, getWorkoutColor } from '../../utils';
import { CommonStyles, Layout, Colors, Typography } from '../../styles/designSystem';
import QuickWorkoutLogScreen from '../logging/QuickWorkoutLogScreen';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ExerciseProgressCard from '../../components/dashboard/ExerciseProgressCard';

const FitnessScreen: React.FC = () => {
  const { state: userState } = useUser();
  const [showWorkoutLog, setShowWorkoutLog] = useState(false);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);

  const quickWorkouts = [
    { name: 'Morning Run', duration: 30, icon: 'walk', color: '#FF6B6B' },
    { name: 'Weight Training', duration: 45, icon: 'barbell', color: '#4ECDC4' },
    { name: 'Yoga Session', duration: 20, icon: 'leaf', color: '#45B7D1' },
    { name: 'Cycling', duration: 60, icon: 'bicycle', color: '#FFD93D' },
    { name: 'Swimming', duration: 30, icon: 'water', color: '#A29BFE' },
  ];

  // Use the new useScreenData hook for workouts
  const { data: workouts, isLoading, isRefreshing, refresh, loadData } = useScreenData<LocalWorkout[]>({
    fetchData: async () => {
      const userId = userState.user?.id || 0;
      
      // Load recent workouts from local database
      const recentWorkouts = await databaseService.getWorkouts(userId, 30);
      
      // Try to fetch from backend for sync (silent failure)
      try {
        const backendWorkouts = await apiService.getWorkouts(userId, 30);
        if (backendWorkouts && backendWorkouts.length > 0) {
          console.log('Backend workouts loaded:', backendWorkouts.length);
        }
      } catch (error) {
        console.log('Backend workouts unavailable, using local data');
      }

      // Load exercise progress data (silent failure)
      try {
        const progressData = await exerciseProgressService.getExerciseProgress(userId, 10);
        setExerciseProgress(progressData);
      } catch (error) {
        console.error('Error loading exercise progress:', error);
      }
      
      return recentWorkouts;
    },
    dependencies: [userState.user?.id],
    errorMessage: 'Failed to load workout data',
  });

  // Use the new useWeeklyWorkoutStats hook for weekly calculations
  const weeklyStats = useWeeklyWorkoutStats(workouts || []);

  // Convert to match existing interface
  const weeklyStatsFormatted = {
    totalWorkouts: weeklyStats.totalItems,
    totalDuration: weeklyStats.totalValue,
    avgDuration: weeklyStats.avgValue,
  };

  const handleWorkoutLogSuccess = () => {
    setShowWorkoutLog(false);
    loadData();
    hapticService.success();
    toastService.success('Workout logged successfully!');
  };

  const handleQuickWorkout = (workout: { name: string; duration: number; icon: string; color: string }) => {
    hapticService.light();
    // For now, just open the modal with pre-filled duration
    // TODO: In the future, we could pre-fill the exercise search with the workout name
    setShowWorkoutLog(true);
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


  if (isLoading) {
    return (
      <SafeAreaView style={CommonStyles.screenContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Fitness</Text>
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

        {/* Quick Workouts */}
        <View style={styles.quickWorkoutsSection}>
          <Text style={styles.sectionTitle}>Quick Workouts</Text>
          <View style={styles.quickWorkoutsContainer}>
            {quickWorkouts.map((workout, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickWorkoutButton}
                onPress={() => handleQuickWorkout(workout)}
              >
                <View style={[styles.quickWorkoutIconContainer, { backgroundColor: workout.color + '20' }]}>
                  <Ionicons name={workout.icon as any} size={20} color={workout.color} />
                </View>
                <Text style={styles.quickWorkoutText}>{workout.name}</Text>
                <Text style={styles.quickWorkoutDuration}>{workout.duration} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FF6B6B20' }]}>
                <Ionicons name="barbell" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.statNumber}>{weeklyStatsFormatted.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#4ECDC420' }]}>
                <Ionicons name="time" size={24} color="#4ECDC4" />
              </View>
              <Text style={styles.statNumber}>{weeklyStatsFormatted.totalDuration}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#45B7D120' }]}>
                <Ionicons name="stats-chart" size={24} color="#45B7D1" />
              </View>
              <Text style={styles.statNumber}>{weeklyStatsFormatted.avgDuration}</Text>
              <Text style={styles.statLabel}>Avg Duration</Text>
            </View>
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {workouts && workouts.length > 0 && (
              <Text style={styles.sectionSubtitle}>{workouts.length} total</Text>
            )}
          </View>
          
          {workouts && workouts.length > 0 ? (
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

        {/* Exercise Progress */}
        {exerciseProgress.length > 0 && (
          <View style={styles.section}>
            <ExerciseProgressCard
              exerciseProgress={exerciseProgress}
              onViewAll={() => console.log('View all exercises')}
              onExercisePress={(exerciseName) => console.log('Exercise pressed:', exerciseName)}
            />
          </View>
        )}

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
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent={true}
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
    paddingVertical: Layout.sectionSpacing,
  },
  quickWorkoutsSection: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.sectionSpacing,
  },
  quickWorkoutsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickWorkoutButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 120,
    maxWidth: 140,
    ...Layout.shadowSmall,
  },
  quickWorkoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickWorkoutText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickWorkoutDuration: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  primaryButton: {
    ...CommonStyles.buttonPrimary,
    flexDirection: 'row',
  },
  primaryButtonText: {
    ...Typography.h4,
    color: Colors.surface,
    marginLeft: 8,
  },
  statsSection: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Layout.sectionSpacingLarge,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Layout.cardSpacing,
  },
  statsGrid: {
    ...CommonStyles.grid,
  },
  statCard: {
    ...CommonStyles.card,
    flex: 1,
    alignItems: 'center',
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
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Layout.sectionSpacingLarge,
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