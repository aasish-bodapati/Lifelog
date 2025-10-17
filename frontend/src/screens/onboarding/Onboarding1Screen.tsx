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
      goal: selectedGoal ?? undefined,
      activity: selectedActivity ?? undefined
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
          {/* Basic Information Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Information</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.age?.toString() || ''}
                  onChangeText={(value) => updateField('age', value ? parseInt(value) || 0 : 0)}
                  placeholder="25"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.height?.toString() || ''}
                  onChangeText={(value) => updateField('height', value ? parseInt(value) || 0 : 0)}
                  placeholder="175"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.weight?.toString() || ''}
                  onChangeText={(value) => updateField('weight', value ? parseInt(value) || 0 : 0)}
                  placeholder="70"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.genderSection}>
              <Text style={styles.genderLabel}>Gender</Text>
              <View style={styles.genderOptions}>
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
                    <Text style={[
                      styles.genderText,
                      profile.gender === option.value && styles.genderTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {profile.height && profile.weight && (
              <View style={styles.bmiCard}>
                <Text style={styles.bmiLabel}>Your BMI</Text>
                {(() => {
                  const bmi = calculationService.getBMICategory(profile as OnboardingProfile);
                  return (
                    <View style={styles.bmiContent}>
                      <Text style={styles.bmiValue}>{bmi.bmi}</Text>
                      <Text style={[styles.bmiCategory, { color: bmi.color }]}>
                        {bmi.category}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            )}
          </View>

          {/* Goals Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Goal</Text>
            <View style={styles.goalOptions}>
              {calculationService.getGoalOptions().map((goal) => (
                <TouchableOpacity
                  key={goal.type}
                  style={[
                    styles.goalOption,
                    selectedGoal?.type === goal.type && styles.goalOptionSelected,
                  ]}
                  onPress={() => handleGoalSelect(goal)}
                >
                  <View style={styles.goalContent}>
                    <Text style={styles.goalIcon}>
                      {goal.type === 'maintain' ? '⚖️' :
                       goal.type === 'gain' ? '💪' : '🔥'}
                    </Text>
                    <View style={styles.goalTextContainer}>
                      <Text style={[
                        styles.goalTitle,
                        selectedGoal?.type === goal.type && styles.goalTitleSelected,
                      ]}>
                        {goal.type === 'maintain' ? 'Maintain Weight' :
                         goal.type === 'gain' ? 'Gain Muscle' : 'Lose Fat'}
                      </Text>
                      <Text style={[
                        styles.goalDescription,
                        selectedGoal?.type === goal.type && styles.goalDescriptionSelected,
                      ]}>
                        {goal.description}
                      </Text>
                    </View>
                    {selectedGoal?.type === goal.type && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Activity Level Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity Level</Text>
            <View style={styles.activityOptions}>
              {calculationService.getActivityOptions().map((activity) => (
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
                      <View style={[
                        styles.multiplierBadge,
                        selectedActivity?.level === activity.level && styles.multiplierBadgeSelected,
                      ]}>
                        <Text style={[
                          styles.multiplierText,
                          selectedActivity?.level === activity.level && styles.multiplierTextSelected,
                        ]}>
                          {activity.multiplier}x
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.activityDescription,
                      selectedActivity?.level === activity.level && styles.activityDescriptionSelected,
                    ]}>
                      {activity.description}
                    </Text>
                  </View>
                  {selectedActivity?.level === activity.level && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
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
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 30,
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '500',
  },
  genderSection: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  bmiCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  bmiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  bmiContent: {
    alignItems: 'center',
  },
  bmiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  bmiCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalOptions: {
    gap: 8,
  },
  goalOption: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 16,
  },
  goalOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  goalTitleSelected: {
    color: '#007AFF',
  },
  goalDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  goalDescriptionSelected: {
    color: '#007AFF',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityOptions: {
    gap: 8,
  },
  activityOption: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 16,
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
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  activityTitleSelected: {
    color: '#007AFF',
  },
  multiplierBadge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  multiplierBadgeSelected: {
    backgroundColor: '#007AFF',
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  multiplierTextSelected: {
    color: '#FFFFFF',
  },
  activityDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  activityDescriptionSelected: {
    color: '#007AFF',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Onboarding1Screen;

