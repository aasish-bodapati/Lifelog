import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, LocalBodyStat } from '../../services/databaseService';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { toastService } from '../../services/toastService';

interface QuickBodyStatLogScreenProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const QuickBodyStatLogScreen: React.FC<QuickBodyStatLogScreenProps> = ({
  onClose,
  onSuccess,
}) => {
  const { state: userState } = useUser();
  const { forceSync } = useSync();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arm, setArm] = useState('');
  const [thigh, setThigh] = useState('');

  // Recent body stats for autofill
  const [recentBodyStats, setRecentBodyStats] = useState<LocalBodyStat[]>([]);

  useEffect(() => {
    loadRecentBodyStats();
  }, []);

  const loadRecentBodyStats = async () => {
    if (!userState.user?.id) return;

    try {
      const bodyStats = await databaseService.getBodyStats(userState.user.id, 5);
      setRecentBodyStats(bodyStats);
    } catch (error) {
      console.error('Error loading recent body stats:', error);
    }
  };

  const handleQuickFill = (bodyStat: LocalBodyStat) => {
    setWeight(bodyStat.weight_kg?.toString() || '');
    setBodyFat(bodyStat.body_fat_percentage?.toString() || '');
    setMuscleMass(bodyStat.muscle_mass_kg?.toString() || '');
    setWaist(bodyStat.waist_cm?.toString() || '');
    setChest(bodyStat.chest_cm?.toString() || '');
    setArm(bodyStat.arm_cm?.toString() || '');
    setThigh(bodyStat.thigh_cm?.toString() || '');
  };

  const handleSave = async () => {
    if (!userState.user?.id) {
      toastService.error('Error', 'User not logged in');
      return;
    }

    // At least one measurement is required
    const hasAnyMeasurement = weight || bodyFat || muscleMass || waist || chest || arm || thigh;
    if (!hasAnyMeasurement) {
      toastService.error('Error', 'Please enter at least one measurement');
      return;
    }

    setIsLoading(true);

    try {
      const bodyStatData = {
        local_id: `bodystat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userState.user.id,
        weight_kg: weight ? parseFloat(weight) : undefined,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : undefined,
        muscle_mass_kg: muscleMass ? parseFloat(muscleMass) : undefined,
        waist_cm: waist ? parseFloat(waist) : undefined,
        chest_cm: chest ? parseFloat(chest) : undefined,
        arm_cm: arm ? parseFloat(arm) : undefined,
        thigh_cm: thigh ? parseFloat(thigh) : undefined,
        // Use local date (not UTC)
        date: (() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })(),
      };

      await databaseService.saveBodyStat(bodyStatData);
      
      // Trigger sync
      await forceSync();
      
      toastService.success('Success', 'Body stats logged successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving body stat:', error);
      toastService.error('Error', 'Failed to log body stats. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickMeasurements = [
    { label: 'Weight Only', fields: ['weight'] },
    { label: 'Weight + Body Fat', fields: ['weight', 'bodyFat'] },
    { label: 'Weight + Measurements', fields: ['weight', 'waist', 'chest'] },
  ];

  const handleQuickMeasurement = (fields: string[]) => {
    // Clear all fields first
    setWeight('');
    setBodyFat('');
    setMuscleMass('');
    setWaist('');
    setChest('');
    setArm('');
    setThigh('');

    // Focus on the first field
    if (fields.includes('weight')) {
      // Weight input will be focused automatically
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Quick Log Body Stats</Text>
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
        {/* Recent Body Stats */}
        {recentBodyStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Measurements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentBodyStats.map((bodyStat, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentBodyStatCard}
                  onPress={() => handleQuickFill(bodyStat)}
                >
                  <Text style={styles.recentBodyStatDate}>
                    {new Date(bodyStat.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.recentBodyStatWeight}>
                    {bodyStat.weight_kg ? `${bodyStat.weight_kg} kg` : 'No weight'}
                  </Text>
                  {bodyStat.body_fat_percentage && (
                    <Text style={styles.recentBodyStatDetail}>
                      {bodyStat.body_fat_percentage}% body fat
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Measurements</Text>
          <View style={styles.quickMeasurementsContainer}>
            {quickMeasurements.map((measurement, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickMeasurementButton}
                onPress={() => handleQuickMeasurement(measurement.fields)}
              >
                <Ionicons name="body" size={20} color="#007AFF" />
                <Text style={styles.quickMeasurementText}>{measurement.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Body Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Measurements</Text>
          
          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={weight}
                onChangeText={setWeight}
                placeholder="70.5"
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Body Fat (%)</Text>
              <TextInput
                style={styles.textInput}
                value={bodyFat}
                onChangeText={setBodyFat}
                placeholder="15.2"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Muscle Mass (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={muscleMass}
                onChangeText={setMuscleMass}
                placeholder="35.8"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Waist (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={waist}
                onChangeText={setWaist}
                placeholder="82.5"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Chest (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={chest}
                onChangeText={setChest}
                placeholder="102.5"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Arm (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={arm}
                onChangeText={setArm}
                placeholder="35.5"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementInput}>
              <Text style={styles.inputLabel}>Thigh (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={thigh}
                onChangeText={setThigh}
                placeholder="58.5"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.measurementInput}>
              {/* Empty space for alignment */}
            </View>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  recentBodyStatCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentBodyStatDate: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  recentBodyStatWeight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  recentBodyStatDetail: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  quickMeasurementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickMeasurementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickMeasurementText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  measurementRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  measurementInput: {
    flex: 1,
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
});

export default QuickBodyStatLogScreen;

