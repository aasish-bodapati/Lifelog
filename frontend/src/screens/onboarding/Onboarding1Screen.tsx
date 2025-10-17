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
import { Colors, Layout, Spacing } from '../../styles/designSystem';

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
    // Don't set 0 for numeric fields, leave as undefined to show placeholder
    const finalValue = (typeof value === 'number' && value === 0) ? undefined : value;
    setProfile(prev => ({ ...prev, [field]: finalValue }));
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  header: {
    paddingTop: 30,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: Layout.radiusSmall,
    marginBottom: Spacing.lg,
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
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Layout.shadowSmall,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.radiusSmall,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  genderSection: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.radiusSmall,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  genderTextSelected: {
    color: Colors.textLight,
  },
  bmiCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusSmall,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  bmiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  bmiContent: {
    alignItems: 'center',
  },
  bmiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  bmiCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalOptions: {
    gap: Spacing.sm,
  },
  goalOption: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.radiusSmall,
    padding: Spacing.lg,
  },
  goalOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
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
    color: Colors.text,
    marginBottom: 2,
  },
  goalTitleSelected: {
    color: Colors.primary,
  },
  goalDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  goalDescriptionSelected: {
    color: Colors.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  checkmarkText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityOptions: {
    gap: Spacing.sm,
  },
  activityOption: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.radiusSmall,
    padding: Spacing.lg,
  },
  activityOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
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
    color: Colors.text,
    flex: 1,
  },
  activityTitleSelected: {
    color: Colors.primary,
  },
  multiplierBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  multiplierBadgeSelected: {
    backgroundColor: Colors.primary,
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  multiplierTextSelected: {
    color: Colors.textLight,
  },
  activityDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  activityDescriptionSelected: {
    color: Colors.primary,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 30,
    paddingTop: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 32,
    borderRadius: Layout.radiusMedium,
    alignItems: 'center',
    ...Layout.shadowMedium,
  },
  primaryButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Onboarding1Screen;

