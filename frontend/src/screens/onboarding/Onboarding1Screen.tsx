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
          {/* Basic Information Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Information</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.age?.toString() || ''}
                  onChangeText={(value) => updateField('age', value ? parseInt(value) : undefined)}
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
                  onChangeText={(value) => updateField('height', value ? parseInt(value) : undefined)}
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
                  onChangeText={(value) => updateField('weight', value ? parseInt(value) : undefined)}
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
                  { value: 'M', label: 'Male', icon: '👨' },
                  { value: 'F', label: 'Female', icon: '👩' },
                  { value: 'Other', label: 'Other', icon: '🧑' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      profile.gender === option.value && styles.genderOptionSelected,
                    ]}
                    onPress={() => updateField('gender', option.value as 'M' | 'F' | 'Other')}
                  >
                    <Text style={styles.genderIcon}>{option.icon}</Text>
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
    paddingTop: 40,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
  },
  genderSection: {
    marginBottom: 20,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderIcon: {
    fontSize: 24,
    marginBottom: 8,
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
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  bmiLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  bmiContent: {
    alignItems: 'center',
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  bmiCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalOptions: {
    gap: 12,
  },
  goalOption: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 20,
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
    fontSize: 24,
    marginRight: 16,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  goalTitleSelected: {
    color: '#007AFF',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  goalDescriptionSelected: {
    color: '#007AFF',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityOptions: {
    gap: 12,
  },
  activityOption: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 20,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  activityTitleSelected: {
    color: '#007AFF',
  },
  multiplierBadge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  multiplierBadgeSelected: {
    backgroundColor: '#007AFF',
  },
  multiplierText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666666',
  },
  multiplierTextSelected: {
    color: '#FFFFFF',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  activityDescriptionSelected: {
    color: '#007AFF',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default Onboarding1Screen;

