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
import { OnboardingProfile } from '../../types/onboarding';
import { calculationService } from '../../services/calculationService';

const Onboarding1Screen: React.FC = () => {
  const { nextStep, updateData, data } = useOnboarding();
  const [profile, setProfile] = useState<Partial<OnboardingProfile>>({
    age: data.profile?.age || undefined,
    gender: data.profile?.gender || undefined,
    height: data.profile?.height || undefined,
    weight: data.profile?.weight || undefined,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleNext = () => {
    const validation = calculationService.validateProfile(profile);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    updateData({ profile: profile as OnboardingProfile });
    nextStep();
  };

  const updateField = (field: keyof OnboardingProfile, value: string | number) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Basic Information</Text>
          <Text style={styles.subtitle}>Tell us about yourself</Text>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age, Height & Weight</Text>
            <View style={styles.measurementsContainer}>
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
  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 4,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
  },
  measurementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  measurementInput: {
    flex: 1,
  },
  measurementLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  measurementField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  bmiContainer: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bmiInfo: {
    alignItems: 'center',
  },
  bmiLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  bmiCategory: {
    fontSize: 16,
    fontWeight: '500',
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Onboarding1Screen;

