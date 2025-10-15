import React, { useState } from 'react';
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
import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingProfile, OnboardingGoal, OnboardingActivity } from '../../types/onboarding';
import { calculationService } from '../../services/calculationService';

const Onboarding1Screen: React.FC = () => {
  const { nextStep, updateData, data } = useOnboarding();
  const [profile, setProfile] = useState<Partial<OnboardingProfile>>({
    age: data.profile?.age || undefined,
    gender: data.profile?.gender || undefined,
    height: data.profile?.height || undefined,
    weight: data.profile?.weight || undefined,
  });

  const [selectedGoal, setSelectedGoal] = useState<OnboardingGoal | null>(
    data.goal || null
  );

  const [selectedActivity, setSelectedActivity] = useState<OnboardingActivity | null>(
    data.activity || null
  );

  const [errors, setErrors] = useState<string[]>([]);

  const handleNext = () => {
    const validation = calculationService.validateProfile(profile);
    const allErrors: string[] = [...validation.errors];
    
    if (!selectedGoal) {
      allErrors.push('Please select your goal');
    }
    
    if (!selectedActivity) {
      allErrors.push('Please select your activity level');
    }
    
    if (allErrors.length > 0) {
      setErrors(allErrors);
      return;
    }

    setErrors([]);
    updateData({ 
      profile: profile as OnboardingProfile,
      goal: selectedGoal,
      activity: selectedActivity
    });
    nextStep();
  };

  const updateField = (field: keyof OnboardingProfile, value: string | number) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleGoalSelect = (goal: OnboardingGoal) => {
    setSelectedGoal(goal);
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleActivitySelect = (activity: OnboardingActivity) => {
    setSelectedActivity(activity);
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Let's Get Started</Text>
          <Text style={styles.subtitle}>Tell us about yourself and your goals</Text>
        </View>

        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.form}>
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.measurementsRow}>
              <View style={styles.measurementInput}>
                <Text style={styles.measurementLabel}>Age</Text>
                <TextInput
                  style={styles.measurementField}
                  value={profile.age?.toString() || ''}
                  onChangeText={(value) => updateField('age', value ? parseInt(value) : undefined)}
                  placeholder="Age"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={styles.measurementInput}>
                <Text style={styles.measurementLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.measurementField}
                  value={profile.height?.toString() || ''}
                  onChangeText={(value) => updateField('height', value ? parseInt(value) : undefined)}
                  placeholder="Height"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={styles.measurementInput}>
                <Text style={styles.measurementLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.measurementField}
                  value={profile.weight?.toString() || ''}
                  onChangeText={(value) => updateField('weight', value ? parseInt(value) : undefined)}
                  placeholder="Weight"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.genderRow}>
              <Text style={styles.genderLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                {[
                  { value: 'M', label: 'Male' },
                  { value: 'F', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      profile.gender === option.value && styles.genderOptionSelected,
                    ]}
                    onPress={() => updateField('gender', option.value as 'M' | 'F' | 'Other')}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        profile.gender === option.value && styles.genderOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {profile.height && profile.weight && (
              <View style={styles.bmiContainer}>
                {(() => {
                  const bmi = calculationService.getBMICategory(profile as OnboardingProfile);
                  return (
                    <View style={styles.bmiInfo}>
                      <Text style={styles.bmiLabel}>BMI: {bmi.bmi}</Text>
                      <Text style={[styles.bmiCategory, { color: bmi.color }]}>
                        {bmi.category}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            )}
          </View>

          {/* Goals and Activity Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goals & Activity</Text>
            
            <View style={styles.twoColumnContainer}>
              {/* Goals Column */}
              <View style={styles.column}>
                <Text style={styles.columnTitle}>Your Goal</Text>
                <View style={styles.goalsContainer}>
                  {calculationService.getGoalOptions().map((goal) => (
                    <TouchableOpacity
                      key={goal.type}
                      style={[
                        styles.compactOption,
                        selectedGoal?.type === goal.type && styles.compactOptionSelected,
                      ]}
                      onPress={() => handleGoalSelect(goal)}
                    >
                      <Text style={[
                        styles.compactTitle,
                        selectedGoal?.type === goal.type && styles.compactTitleSelected,
                      ]}>
                        {goal.type === 'maintain' ? '⚖️ Maintain' :
                         goal.type === 'gain' ? '⬆️ Gain Muscle' : '⬇️ Lose Fat'}
                      </Text>
                      {selectedGoal?.type === goal.type && (
                        <View style={styles.compactIndicator}>
                          <Text style={styles.compactIndicatorText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Activity Column */}
              <View style={styles.column}>
                <Text style={styles.columnTitle}>Activity Level</Text>
                <View style={styles.activitiesContainer}>
                  {calculationService.getActivityOptions().map((activity) => (
                    <TouchableOpacity
                      key={activity.level}
                      style={[
                        styles.compactOption,
                        selectedActivity?.level === activity.level && styles.compactOptionSelected,
                      ]}
                      onPress={() => handleActivitySelect(activity)}
                    >
                      <View style={styles.compactContent}>
                        <Text style={[
                          styles.compactTitle,
                          selectedActivity?.level === activity.level && styles.compactTitleSelected,
                        ]}>
                          {activity.level === 'sedentary' ? 'Sedentary' :
                           activity.level === 'light' ? 'Light' :
                           activity.level === 'moderate' ? 'Moderate' :
                           activity.level === 'active' ? 'Active' : 'Extra'}
                        </Text>
                        <Text style={[
                          styles.compactMultiplier,
                          selectedActivity?.level === activity.level && styles.compactMultiplierSelected,
                        ]}>
                          {activity.multiplier}x
                        </Text>
                      </View>
                      {selectedActivity?.level === activity.level && (
                        <View style={styles.compactIndicator}>
                          <Text style={styles.compactIndicatorText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
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
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    marginBottom: 2,
  },
  form: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  measurementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  measurementInput: {
    flex: 1,
  },
  measurementLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
  },
  measurementField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  genderContainer: {
    flexDirection: 'row',
    flex: 2,
    gap: 6,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
  },
  bmiContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  bmiInfo: {
    alignItems: 'center',
  },
  bmiLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  bmiCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  goalsContainer: {
    gap: 6,
  },
  activitiesContainer: {
    gap: 6,
  },
  compactOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  compactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  compactTitleSelected: {
    color: '#007AFF',
  },
  compactMultiplier: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  compactMultiplierSelected: {
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  compactIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  compactIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 15,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Onboarding1Screen;

