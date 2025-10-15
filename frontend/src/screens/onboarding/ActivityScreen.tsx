import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingActivity } from '../../types/onboarding';
import { calculationService } from '../../services/calculationService';

const ActivityScreen: React.FC = () => {
  const { nextStep, updateData, data } = useOnboarding();
  const [selectedActivity, setSelectedActivity] = useState<OnboardingActivity | null>(
    data.activity || null
  );

  const activityOptions = calculationService.getActivityOptions();

  const handleNext = () => {
    if (!selectedActivity) {
      return;
    }

    updateData({ activity: selectedActivity });
    nextStep();
  };

  const handleActivitySelect = (activity: OnboardingActivity) => {
    setSelectedActivity(activity);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Activity Level</Text>
          <Text style={styles.subtitle}>How active are you?</Text>
        </View>

        <View style={styles.activitiesContainer}>
          {activityOptions.map((activity, index) => (
            <TouchableOpacity
              key={activity.level}
              style={[
                styles.activityOption,
                selectedActivity?.level === activity.level && styles.activityOptionSelected,
              ]}
              onPress={() => handleActivitySelect(activity)}
            >
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <Text style={[
                    styles.activityTitle,
                    selectedActivity?.level === activity.level && styles.activityTitleSelected,
                  ]}>
                    {activity.level === 'sedentary' ? 'Sedentary' :
                     activity.level === 'light' ? 'Lightly Active' :
                     activity.level === 'moderate' ? 'Moderately Active' :
                     activity.level === 'active' ? 'Very Active' : 'Extra Active'}
                  </Text>
                  <Text style={[
                    styles.activityMultiplier,
                    selectedActivity?.level === activity.level && styles.activityMultiplierSelected,
                  ]}>
                    {activity.multiplier}x
                  </Text>
                </View>
                <Text style={[
                  styles.activityDescription,
                  selectedActivity?.level === activity.level && styles.activityDescriptionSelected,
                ]}>
                  {activity.description}
                </Text>
              </View>
              {selectedActivity?.level === activity.level && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Why this matters:</Text>
          <Text style={styles.infoText}>
            • Determines your daily calorie needs
          </Text>
          <Text style={styles.infoText}>
            • More active = higher calorie target
          </Text>
          <Text style={styles.infoText}>
            • Helps personalize your nutrition goals
          </Text>
          <Text style={styles.infoText}>
            • You can adjust this anytime in settings
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.primaryButton,
            !selectedActivity && styles.primaryButtonDisabled
          ]} 
          onPress={handleNext}
          disabled={!selectedActivity}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  activitiesContainer: {
    marginBottom: 32,
  },
  activityOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  activityTitleSelected: {
    color: '#007AFF',
  },
  activityMultiplier: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityMultiplierSelected: {
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  activityDescriptionSelected: {
    color: '#007AFF',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ActivityScreen;
