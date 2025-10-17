import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../context/UserContext';
import { databaseService, LocalWorkout } from '../../services/databaseService';
import { apiService } from '../../services/api';
import { hapticService } from '../../services/hapticService';
import { toastService } from '../../services/toastService';
import { exerciseProgressService, ExerciseProgress } from '../../services/exerciseProgressService';
import { workoutRoutineService, WorkoutRoutine } from '../../services/workoutRoutineService';
import { useScreenData, useWeeklyWorkoutStats } from '../../hooks';
import { getWorkoutIcon, getWorkoutColor } from '../../utils';
import { CommonStyles, Layout, Colors, Typography } from '../../styles/designSystem';
import QuickWorkoutLogScreen from '../logging/QuickWorkoutLogScreen';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ExerciseProgressCard from '../../components/dashboard/ExerciseProgressCard';
import { useOnboarding } from '../../context/OnboardingContext';

const FitnessScreen: React.FC = () => {
  const { state: userState } = useUser();
  const { data: onboardingData, isComplete: onboardingComplete } = useOnboarding();
  const [showWorkoutLog, setShowWorkoutLog] = useState(false);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'logs'>('overview');
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [editValues, setEditValues] = useState<{
    sets?: string;
    reps?: string;
    weight?: string;
    duration?: string;
    distance?: string;
  }>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRoutineDetails, setShowRoutineDetails] = useState(false);


  // Load routine based on user's goal
  React.useEffect(() => {
    const loadRoutine = async () => {
      console.log('Loading routine...');
      console.log('Onboarding state isComplete:', onboardingComplete);
      console.log('Onboarding data:', onboardingData);
      console.log('Goal from state:', onboardingData?.goal);
      
      // First, try to load from onboarding context
      if (onboardingData?.goal?.type) {
        const routine = workoutRoutineService.getRoutineByGoal(onboardingData.goal.type);
        console.log('Loading routine from context for goal:', onboardingData.goal.type);
        setSelectedRoutine(routine);
        return;
      }
      
      // If not in context, try to load directly from AsyncStorage
      try {
        const savedData = await AsyncStorage.getItem('onboardingData');
        const isComplete = await AsyncStorage.getItem('onboardingComplete');
        console.log('Saved data from AsyncStorage:', savedData);
        console.log('Onboarding complete flag:', isComplete);
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('Parsed data:', parsedData);
          console.log('Goal from storage:', parsedData.goal);
          
          if (parsedData.goal?.type) {
            const routine = workoutRoutineService.getRoutineByGoal(parsedData.goal.type);
            console.log('Loading routine from storage for goal:', parsedData.goal.type);
            setSelectedRoutine(routine);
            return;
          }
        }
        
        // If we have onboarding data or completion flag, default to maintain
        if (savedData || isComplete === 'true') {
          console.log('Onboarding data exists but no goal found, defaulting to maintain');
          const routine = workoutRoutineService.getRoutineByGoal('maintain');
          setSelectedRoutine(routine);
        } else {
          console.log('No routine to load - onboarding not complete');
        }
      } catch (error) {
        console.error('Error loading from storage:', error);
      }
    };
    
    loadRoutine();
  }, [onboardingData?.goal, onboardingComplete]);

  // Use the new useScreenData hook for workouts
  const { data: workouts, isLoading, isRefreshing, refresh, loadData } = useScreenData<LocalWorkout[]>({
    fetchData: async () => {
      const userId = userState.user?.id || 0;
      
      let recentWorkouts: LocalWorkout[] = [];
      
      // Load recent workouts from local database with error handling
      try {
        recentWorkouts = await databaseService.getWorkouts(userId, 30);
        console.log('Local workouts loaded:', recentWorkouts.length);
      } catch (error) {
        console.error('Error loading recent workouts:', error);
        // Return empty array if database fails
        return [];
      }
      
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

  const parseWorkoutDetails = (notes: string | undefined | null) => {
    if (!notes) return null;

    // Parse notes like "3 sets × 10 reps • 20kg"
    const details: Array<{ icon: string; text: string; color: string }> = [];

    // Check for sets and reps
    const setsRepsMatch = notes.match(/(\d+)\s*sets?\s*×\s*(\d+)\s*reps?/i);
    if (setsRepsMatch) {
      details.push({
        icon: 'fitness',
        text: `Sets: ${setsRepsMatch[1]}`,
        color: Colors.primary,
      });
      details.push({
        icon: 'repeat',
        text: `Reps: ${setsRepsMatch[2]}`,
        color: Colors.primary,
      });
    }

    // Check for weight
    const weightMatch = notes.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (weightMatch) {
      details.push({
        icon: 'barbell',
        text: `Weight: ${weightMatch[1]} kg`,
        color: Colors.success,
      });
    }

    // Check for duration (minutes)
    const durationMatch = notes.match(/(\d+)\s*minutes?/i);
    if (durationMatch) {
      details.push({
        icon: 'time',
        text: `Duration: ${durationMatch[1]} min`,
        color: Colors.info,
      });
    }

    // Check for distance
    const distanceMatch = notes.match(/(\d+(?:\.\d+)?)\s*km/i);
    if (distanceMatch) {
      details.push({
        icon: 'location',
        text: `Distance: ${distanceMatch[1]} km`,
        color: Colors.warning,
      });
    }

    return details.length > 0 ? details : null;
  };

  const parseWorkoutValues = (notes: string | undefined | null) => {
    const values: { sets?: string; reps?: string; weight?: string; duration?: string; distance?: string } = {};
    
    if (!notes) return values;

    const setsMatch = notes.match(/(\d+)\s*sets?/i);
    if (setsMatch) values.sets = setsMatch[1];

    const repsMatch = notes.match(/×\s*(\d+)\s*reps?/i);
    if (repsMatch) values.reps = repsMatch[1];

    const weightMatch = notes.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (weightMatch) values.weight = weightMatch[1];

    const durationMatch = notes.match(/(\d+)\s*minutes?/i);
    if (durationMatch) values.duration = durationMatch[1];

    const distanceMatch = notes.match(/(\d+(?:\.\d+)?)\s*km/i);
    if (distanceMatch) values.distance = distanceMatch[1];

    return values;
  };

  const handleEditWorkout = (workout: LocalWorkout) => {
    hapticService.light();
    setEditingWorkoutId(workout.local_id);
    const parsedValues = parseWorkoutValues(workout.notes);
    
    // Only set values that actually exist in the workout
    const values: typeof editValues = {};
    if (parsedValues.sets) values.sets = parsedValues.sets;
    if (parsedValues.reps) values.reps = parsedValues.reps;
    if (parsedValues.weight) values.weight = parsedValues.weight;
    
    // Only include duration if it's explicitly in the notes (not from workout.duration_minutes)
    // Strength exercises shouldn't show duration field
    if (parsedValues.duration) {
      values.duration = parsedValues.duration;
    }
    
    if (parsedValues.distance) values.distance = parsedValues.distance;
    
    setEditValues(values);
  };

  const handleCancelEdit = () => {
    hapticService.light();
    setEditingWorkoutId(null);
    setEditValues({});
  };

  const handleSaveEdit = async (workoutId: string) => {
    try {
      hapticService.medium();
      
      // Build new notes from edited values
      const noteParts = [];
      if (editValues.sets && editValues.reps) {
        noteParts.push(`${editValues.sets} sets × ${editValues.reps} reps`);
      }
      if (editValues.weight) {
        noteParts.push(`${editValues.weight}kg`);
      }
      if (editValues.duration) {
        noteParts.push(`${editValues.duration} minutes`);
      }
      if (editValues.distance) {
        noteParts.push(`${editValues.distance}km`);
      }
      
      const newNotes = noteParts.join(' • ');
      
      await databaseService.updateWorkout(workoutId, {
        duration_minutes: parseInt(editValues.duration || '0') || 0,
        notes: newNotes,
      });
      
      toastService.success('Success', 'Workout updated successfully');
      setEditingWorkoutId(null);
      setEditValues({});
      loadData();
    } catch (error) {
      console.error('Error updating workout:', error);
      toastService.error('Error', 'Failed to update workout');
    }
  };

  const handleDeleteWorkout = async (workout: LocalWorkout) => {
    try {
      hapticService.medium();
      await databaseService.deleteWorkout(workout.local_id);
      toastService.success('Success', 'Workout deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting workout:', error);
      toastService.error('Error', 'Failed to delete workout');
    }
  };

  // Date navigation functions
  const formatSelectedDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const handlePreviousDay = () => {
    hapticService.light();
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    hapticService.light();
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowCalendar(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      hapticService.light();
    }
  };

  const getFilteredWorkoutsByDate = () => {
    if (!workouts) return [];
    
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate.toDateString() === selectedDate.toDateString();
    });
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

        {/* Tabs */}
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
            style={[styles.tab, activeTab === 'routines' && styles.activeTab]}
            onPress={() => {
              hapticService.light();
              setActiveTab('routines');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'routines' && styles.activeTabText]}>
              Routines
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
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
            {workouts && workouts.length > 0 && (
              <View style={styles.tipsSection}>
                <View style={styles.tipCard}>
                  <Ionicons name="bulb" size={20} color="#FFA500" />
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Pro Tip</Text>
                    <Text style={styles.tipText}>
                      {weeklyStats.totalItems >= 3
                        ? "You're crushing it! Consider adding rest days for recovery."
                        : "Aim for 3-5 workouts per week for optimal results."}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Routines Tab */}
        {activeTab === 'routines' && (
          <>
            {selectedRoutine ? (
              <View style={styles.section}>
                {/* Routine Summary Card */}
                <TouchableOpacity 
                  style={styles.routineSummaryCard}
                  onPress={() => {
                    hapticService.light();
                    console.log('Opening routine modal, selectedRoutine:', selectedRoutine);
                    setShowRoutineDetails(true);
                  }}
                >
                  <View style={styles.routineSummaryHeader}>
                    <Text style={styles.routineGoalBadge}>
                      {selectedRoutine.goalType === 'maintain' ? '⚖️ Maintain' :
                       selectedRoutine.goalType === 'gain' ? '💪 Gain' : '🔥 Lose'}
                    </Text>
                    <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
                  </View>
                  <Text style={styles.routineName}>{selectedRoutine.name}</Text>
                  <Text style={styles.routineDescription}>{selectedRoutine.description}</Text>
                  
                  <View style={styles.routineMetaRow}>
                    <View style={styles.routineMetaItem}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                      <Text style={styles.routineMetaText}>{selectedRoutine.daysPerWeek} days/week</Text>
                    </View>
                    <View style={styles.routineMetaItem}>
                      <Ionicons name="barbell-outline" size={16} color={Colors.primary} />
                      <Text style={styles.routineMetaText}>{selectedRoutine.focusAreas[0]}</Text>
                    </View>
                  </View>

                  <Text style={styles.tapToViewText}>Tap to view full workout plan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.section}>
                <View style={styles.emptyState}>
                  <Ionicons name="clipboard-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyStateTitle}>Complete Onboarding</Text>
                  <Text style={styles.emptyState}>
                    Complete your profile setup to get a personalized workout routine
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <>
            {/* Date Navigation */}
            <View style={styles.dateNavigationContainer}>
              <TouchableOpacity 
                onPress={handlePreviousDay}
                style={styles.dateNavButton}
              >
                <Ionicons name="chevron-back" size={24} color={Colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  hapticService.light();
                  setShowCalendar(true);
                }}
                style={styles.dateDisplay}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.dateText}>{formatSelectedDate(selectedDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleNextDay}
                style={styles.dateNavButton}
                disabled={selectedDate.toDateString() === new Date().toDateString()}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color={selectedDate.toDateString() === new Date().toDateString() ? Colors.border : Colors.primary} 
                />
              </TouchableOpacity>
            </View>

            {/* Workout Logs List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedDate.toDateString() === new Date().toDateString() ? "Today's Workouts" : 'Workouts'}
                </Text>
                {getFilteredWorkoutsByDate().length > 0 && (
                  <Text style={styles.sectionSubtitle}>{getFilteredWorkoutsByDate().length} total</Text>
                )}
              </View>
              
              {getFilteredWorkoutsByDate().length > 0 ? (
                <View style={styles.workoutsList}>
                  {getFilteredWorkoutsByDate().map((workout) => (
                    <View
                      key={workout.local_id}
                      style={styles.workoutLogCard}
                    >
                      <>
                        {/* Card Header - Always Same */}
                        <View style={styles.workoutLogHeader}>
                          <View style={[styles.workoutIconContainer, { backgroundColor: getWorkoutColor(workout.name) + '20' }]}>
                            <Ionicons
                              name={getWorkoutIcon(workout.name) as any}
                              size={24}
                              color={getWorkoutColor(workout.name)}
                            />
                          </View>
                          <View style={styles.workoutLogInfo}>
                            <Text style={styles.workoutLogName}>{workout.name}</Text>
                            <Text style={styles.workoutLogDate}>{formatDate(workout.date)}</Text>
                          </View>
                          <View style={styles.workoutLogActions}>
                            <View style={styles.workoutLogButtons}>
                              {editingWorkoutId === workout.local_id ? (
                                <>
                                  <TouchableOpacity
                                    onPress={handleCancelEdit}
                                    style={styles.actionButton}
                                  >
                                    <Ionicons name="close" size={20} color={Colors.textSecondary} />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => handleSaveEdit(workout.local_id)}
                                    style={styles.actionButton}
                                  >
                                    <Ionicons name="checkmark" size={20} color={Colors.success} />
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <>
                                  <TouchableOpacity
                                    onPress={() => handleEditWorkout(workout)}
                                    style={styles.actionButton}
                                  >
                                    <Ionicons name="create-outline" size={20} color={Colors.primary} />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => handleDeleteWorkout(workout)}
                                    style={styles.actionButton}
                                  >
                                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                        
                        {/* Workout Details - Editable or Display */}
                        {editingWorkoutId === workout.local_id ? (
                          <View style={styles.workoutDetails}>
                            {/* Sets */}
                            {editValues.sets && (
                              <View style={styles.editDetailItem}>
                                <View style={[styles.detailIconContainer, { backgroundColor: Colors.primary + '20' }]}>
                                  <Ionicons name="fitness" size={14} color={Colors.primary} />
                                </View>
                                <Text style={styles.editDetailLabel}>Sets:</Text>
                                <TextInput
                                  style={styles.editDetailInput}
                                  value={editValues.sets}
                                  onChangeText={(text) => setEditValues({ ...editValues, sets: text })}
                                  keyboardType="numeric"
                                  selectTextOnFocus
                                />
                              </View>
                            )}
                            {/* Reps */}
                            {editValues.reps && (
                              <View style={styles.editDetailItem}>
                                <View style={[styles.detailIconContainer, { backgroundColor: Colors.primary + '20' }]}>
                                  <Ionicons name="repeat" size={14} color={Colors.primary} />
                                </View>
                                <Text style={styles.editDetailLabel}>Reps:</Text>
                                <TextInput
                                  style={styles.editDetailInput}
                                  value={editValues.reps}
                                  onChangeText={(text) => setEditValues({ ...editValues, reps: text })}
                                  keyboardType="numeric"
                                  selectTextOnFocus
                                />
                              </View>
                            )}
                            {/* Weight */}
                            {editValues.weight && (
                              <View style={styles.editDetailItem}>
                                <View style={[styles.detailIconContainer, { backgroundColor: Colors.success + '20' }]}>
                                  <Ionicons name="barbell" size={14} color={Colors.success} />
                                </View>
                                <Text style={styles.editDetailLabel}>Weight:</Text>
                                <TextInput
                                  style={styles.editDetailInput}
                                  value={editValues.weight}
                                  onChangeText={(text) => setEditValues({ ...editValues, weight: text })}
                                  keyboardType="decimal-pad"
                                  selectTextOnFocus
                                />
                                <Text style={styles.editDetailUnit}>kg</Text>
                              </View>
                            )}
                            {/* Duration */}
                            {editValues.duration && (
                              <View style={styles.editDetailItem}>
                                <View style={[styles.detailIconContainer, { backgroundColor: Colors.info + '20' }]}>
                                  <Ionicons name="time" size={14} color={Colors.info} />
                                </View>
                                <Text style={styles.editDetailLabel}>Duration:</Text>
                                <TextInput
                                  style={styles.editDetailInput}
                                  value={editValues.duration}
                                  onChangeText={(text) => setEditValues({ ...editValues, duration: text })}
                                  keyboardType="numeric"
                                  selectTextOnFocus
                                />
                                <Text style={styles.editDetailUnit}>min</Text>
                              </View>
                            )}
                            {/* Distance */}
                            {editValues.distance && (
                              <View style={styles.editDetailItem}>
                                <View style={[styles.detailIconContainer, { backgroundColor: Colors.warning + '20' }]}>
                                  <Ionicons name="location" size={14} color={Colors.warning} />
                                </View>
                                <Text style={styles.editDetailLabel}>Distance:</Text>
                                <TextInput
                                  style={styles.editDetailInput}
                                  value={editValues.distance}
                                  onChangeText={(text) => setEditValues({ ...editValues, distance: text })}
                                  keyboardType="decimal-pad"
                                  selectTextOnFocus
                                />
                                <Text style={styles.editDetailUnit}>km</Text>
                              </View>
                            )}
                          </View>
                        ) : parseWorkoutDetails(workout.notes) ? (
                          <View style={styles.workoutDetails}>
                            {parseWorkoutDetails(workout.notes)!.map((detail, idx) => (
                              <View key={idx} style={styles.workoutDetailItem}>
                                <View style={[styles.detailIconContainer, { backgroundColor: detail.color + '20' }]}>
                                  <Ionicons name={detail.icon as any} size={14} color={detail.color} />
                                </View>
                                <Text style={styles.workoutDetailText}>{detail.text}</Text>
                              </View>
                            ))}
                          </View>
                        ) : workout.notes ? (
                          <Text style={styles.workoutLogNotes} numberOfLines={2}>
                            {workout.notes}
                          </Text>
                        ) : null}
                      </>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="barbell-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyStateTitle}>No workouts logged yet</Text>
                  <Text style={styles.emptyState}>
                    Start tracking your fitness journey by logging your first workout!
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => {
                      hapticService.light();
                      setShowWorkoutLog(true);
                    }}
                  >
                    <Text style={styles.emptyStateButtonText}>Log Your First Workout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
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

      {/* Routine Details Modal */}
      <Modal
        visible={showRoutineDetails}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRoutineDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalPopup}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Workout Routine</Text>
              <TouchableOpacity 
                onPress={() => {
                  hapticService.light();
                  setShowRoutineDetails(false);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
            >
              {selectedRoutine ? (
                <View style={styles.modalContent}>
                {/* Routine Header */}
                <View style={styles.routineHeader}>
                  <View style={styles.routineHeaderContent}>
                    <Text style={styles.routineGoalBadge}>
                      {selectedRoutine.goalType === 'maintain' ? '⚖️ Maintain' :
                       selectedRoutine.goalType === 'gain' ? '💪 Gain' : '🔥 Lose'}
                    </Text>
                    <Text style={styles.routineName}>{selectedRoutine.name}</Text>
                    <Text style={styles.routineDescription}>{selectedRoutine.description}</Text>
                    
                    <View style={styles.routineMetaRow}>
                      <View style={styles.routineMetaItem}>
                        <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                        <Text style={styles.routineMetaText}>{selectedRoutine.daysPerWeek} days/week</Text>
                      </View>
                      <View style={styles.routineMetaItem}>
                        <Ionicons name="barbell-outline" size={16} color={Colors.primary} />
                        <Text style={styles.routineMetaText}>{selectedRoutine.focusAreas[0]}</Text>
                      </View>
                    </View>

                    {/* Equipment */}
                    <View style={styles.equipmentContainer}>
                      <Text style={styles.equipmentLabel}>Equipment:</Text>
                      <View style={styles.equipmentList}>
                        {selectedRoutine.equipment.map((item, idx) => (
                          <View key={idx} style={styles.equipmentBadge}>
                            <Text style={styles.equipmentText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Day Selector */}
                <View style={styles.daySelectorContainer}>
                  <Text style={styles.daySelectorTitle}>Select Workout Day:</Text>
                  <View style={styles.daySelector}>
                    {selectedRoutine.days.map((day) => (
                      <TouchableOpacity
                        key={day.dayNumber}
                        style={[
                          styles.dayButton,
                          selectedDay === day.dayNumber && styles.dayButtonActive,
                        ]}
                        onPress={() => {
                          hapticService.light();
                          setSelectedDay(day.dayNumber);
                        }}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          selectedDay === day.dayNumber && styles.dayButtonTextActive,
                        ]}>
                          Day {day.dayNumber}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Selected Day Workout */}
                {selectedRoutine.days.find(d => d.dayNumber === selectedDay) && (() => {
                  const currentDay = selectedRoutine.days.find(d => d.dayNumber === selectedDay)!;
                  return (
                    <View style={styles.workoutDayCard}>
                      <View style={styles.workoutDayHeader}>
                        <Text style={styles.workoutDayTitle}>{currentDay.title}</Text>
                        <Text style={styles.workoutDayFocus}>{currentDay.focus}</Text>
                      </View>

                      {/* Warmup */}
                      <View style={styles.workoutSection}>
                        <View style={styles.workoutSectionHeader}>
                          <Ionicons name="flame-outline" size={20} color={Colors.warning} />
                          <Text style={styles.workoutSectionTitle}>Warm-up</Text>
                        </View>
                        <Text style={styles.workoutSectionText}>{currentDay.warmup}</Text>
                      </View>

                      {/* Exercises */}
                      <View style={styles.workoutSection}>
                        <View style={styles.workoutSectionHeader}>
                          <Ionicons name="barbell-outline" size={20} color={Colors.primary} />
                          <Text style={styles.workoutSectionTitle}>
                            {currentDay.isCircuit ? `Circuit (${currentDay.circuitRounds} rounds)` : 'Exercises'}
                          </Text>
                        </View>
                        {currentDay.exercises.map((exercise, idx) => (
                          <View key={idx} style={styles.exerciseItem}>
                            <View style={styles.exerciseNumber}>
                              <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                            </View>
                            <View style={styles.exerciseContent}>
                              <Text style={styles.exerciseName}>{exercise.name}</Text>
                              <View style={styles.exerciseDetails}>
                                <Text style={styles.exerciseDetailText}>
                                  {exercise.sets} × {exercise.reps ? `${exercise.reps} reps` : `${exercise.duration}s`}
                                </Text>
                                {exercise.notes && (
                                  <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        ))}
                        {currentDay.isCircuit && (
                          <Text style={styles.circuitNote}>Rest 45 sec between rounds</Text>
                        )}
                      </View>

                      {/* Cooldown */}
                      {currentDay.cooldown && (
                        <View style={styles.workoutSection}>
                          <View style={styles.workoutSectionHeader}>
                            <Ionicons name="water-outline" size={20} color={Colors.info} />
                            <Text style={styles.workoutSectionTitle}>Cool-down</Text>
                          </View>
                          <Text style={styles.workoutSectionText}>{currentDay.cooldown}</Text>
                        </View>
                      )}

                      {/* Start Workout Button */}
                      <TouchableOpacity
                        style={styles.startWorkoutButton}
                        onPress={() => {
                          hapticService.medium();
                          toastService.info('Coming Soon', 'Guided workout will be available soon!');
                        }}
                      >
                        <Ionicons name="play-circle" size={24} color={Colors.textLight} />
                        <Text style={styles.startWorkoutButtonText}>Start This Workout</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.emptyState}>Loading routine...</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>

      {/* Calendar Picker */}
      {showCalendar && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

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
  // Tab styles
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
  },
  activeTabText: {
    color: Colors.primary,
  },
  // Workout Log Card styles
  workoutLogCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    padding: Layout.cardPadding,
    marginBottom: Layout.cardSpacing,
    ...Layout.shadowSmall,
  },
  workoutLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutLogInfo: {
    flex: 1,
  },
  workoutLogName: {
    ...Typography.h4,
    marginBottom: 2,
  },
  workoutLogDate: {
    ...Typography.caption,
    marginBottom: 4,
  },
  workoutLogDuration: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Layout.radiusSmall,
    alignSelf: 'flex-start',
  },
  workoutLogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutLogButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  workoutLogNotes: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  workoutDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  workoutDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Layout.radiusMedium,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutDetailText: {
    ...Typography.label,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  actionButton: {
    padding: 8,
    borderRadius: Layout.radiusSmall,
    backgroundColor: Colors.background,
  },
  // Inline Edit Styles
  editDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Layout.radiusMedium,
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  editDetailLabel: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  editDetailInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSmall,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...Typography.label,
    fontSize: 13,
    minWidth: 40,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  editDetailUnit: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // Date Navigation Styles
  dateNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    marginBottom: Layout.cardSpacing,
    ...Layout.shadowSmall,
  },
  dateNavButton: {
    padding: 8,
    borderRadius: Layout.radiusMedium,
    backgroundColor: Colors.background,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Layout.radiusMedium,
    backgroundColor: Colors.primaryLight,
  },
  dateText: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '600',
  },
  addButton: {
    padding: 4,
  },
  // Routine Styles
  routineSummaryCard: {
    backgroundColor: Colors.surface,
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMedium,
    marginBottom: Layout.cardSpacing,
    ...Layout.shadowSmall,
  },
  routineSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tapToViewText: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalPopup: {
    width: '100%',
    maxWidth: 500,
    height: '90%',
    backgroundColor: Colors.background,
    borderRadius: 20,
    overflow: 'hidden',
    ...Layout.shadowLarge,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  routineHeader: {
    backgroundColor: Colors.surface,
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMedium,
    marginBottom: Layout.cardSpacing,
    ...Layout.shadowSmall,
  },
  routineHeaderContent: {
    gap: 12,
  },
  routineGoalBadge: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.radiusSmall,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  routineName: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  routineDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  routineMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  routineMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routineMetaText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  equipmentContainer: {
    gap: 8,
  },
  equipmentLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  equipmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  daySelectorContainer: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Layout.cardSpacing,
  },
  daySelectorTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 12,
  },
  daySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Layout.radiusMedium,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: Colors.textLight,
  },
  workoutDayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    padding: Layout.cardPadding,
    ...Layout.shadowSmall,
  },
  workoutDayHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  workoutDayTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  workoutDayFocus: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  workoutSection: {
    marginBottom: 20,
  },
  workoutSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  workoutSectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  workoutSectionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  exerciseItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusMedium,
    marginBottom: 8,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumberText: {
    ...Typography.label,
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: 14,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  exerciseDetailText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  exerciseNotes: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  circuitNote: {
    ...Typography.bodySmall,
    color: Colors.info,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusSmall,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Layout.radiusMedium,
    marginTop: 20,
    ...Layout.shadowMedium,
  },
  startWorkoutButtonText: {
    ...Typography.label,
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FitnessScreen;
