import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, LocalWorkout } from '../../services/databaseService';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { toastService } from '../../services/toastService';

interface QuickWorkoutLogScreenProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const QuickWorkoutLogScreen: React.FC<QuickWorkoutLogScreenProps> = ({
  onClose,
  onSuccess,
}) => {
  const { state: userState } = useUser();
  const { forceSync } = useSync();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  // Recent workouts for autofill
  const [recentWorkouts, setRecentWorkouts] = useState<LocalWorkout[]>([]);

  useEffect(() => {
    loadRecentWorkouts();
  }, []);

  const loadRecentWorkouts = async () => {
    if (!userState.user?.id) return;

    try {
      const workouts = await databaseService.getWorkouts(userState.user.id, 10);
      setRecentWorkouts(workouts);
    } catch (error) {
      console.error('Error loading recent workouts:', error);
    }
  };

  const handleQuickFill = (workout: LocalWorkout) => {
    setWorkoutName(workout.name);
    setDuration(workout.duration_minutes?.toString() || '');
    setNotes(workout.notes || '');
  };

  const handleSave = async () => {
    if (!userState.user?.id) {
      toastService.error('Error', 'User not logged in');
      return;
    }

    if (!workoutName.trim()) {
      toastService.error('Error', 'Workout name is required');
      return;
    }

    setIsLoading(true);

    try {
      const workoutData = {
        user_id: userState.user.id,
        name: workoutName.trim(),
        date: new Date().toISOString().split('T')[0],
        duration_minutes: duration ? parseInt(duration) : undefined,
        notes: notes.trim() || undefined,
      };

      await databaseService.saveWorkout(workoutData);
      
      // Trigger sync
      await forceSync();
      
      toastService.success('Success', 'Workout logged successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving workout:', error);
      toastService.error('Error', 'Failed to log workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickWorkouts = [
    { name: 'Morning Run', duration: 30 },
    { name: 'Weight Training', duration: 45 },
    { name: 'Yoga Session', duration: 20 },
    { name: 'Cycling', duration: 60 },
    { name: 'Swimming', duration: 30 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Quick Log Workout</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentWorkouts.map((workout, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentWorkoutCard}
                  onPress={() => handleQuickFill(workout)}
                >
                  <Text style={styles.recentWorkoutName}>{workout.name}</Text>
                  <Text style={styles.recentWorkoutDuration}>
                    {workout.duration_minutes ? `${workout.duration_minutes} min` : 'No duration'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Workouts</Text>
          <View style={styles.quickWorkoutsContainer}>
            {quickWorkouts.map((workout, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickWorkoutButton}
                onPress={() => {
                  setWorkoutName(workout.name);
                  setDuration(workout.duration.toString());
                }}
              >
                <Ionicons name="fitness" size={20} color="#007AFF" />
                <Text style={styles.quickWorkoutText}>{workout.name}</Text>
                <Text style={styles.quickWorkoutDuration}>{workout.duration} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Workout Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Workout Name *</Text>
            <TextInput
              style={styles.textInput}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="e.g., Morning Run"
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={duration}
              onChangeText={setDuration}
              placeholder="30"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it feel? Any notes..."
              multiline
              numberOfLines={3}
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
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recentWorkoutCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentWorkoutName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  recentWorkoutDuration: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  quickWorkoutsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 120,
  },
  quickWorkoutText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  quickWorkoutDuration: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default QuickWorkoutLogScreen;

