import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingPreferences } from '../../types/onboarding';

const PreferencesScreen: React.FC = () => {
  const { nextStep, updateData, data } = useOnboarding();
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    mealReminders: data.preferences?.mealReminders || false,
    hydrationReminders: data.preferences?.hydrationReminders || false,
    weeklyProgressReminders: data.preferences?.weeklyProgressReminders || false,
  });

  const handleNext = () => {
    updateData({ preferences });
    nextStep();
  };

  const handleSkip = () => {
    // Use default preferences (all false)
    updateData({ preferences });
    nextStep();
  };

  const togglePreference = (key: keyof OnboardingPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Preferences</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
          <Text style={styles.optionalText}>(Optional - you can skip this step)</Text>
        </View>

        <View style={styles.preferencesContainer}>
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Meal Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Get notified to log your meals throughout the day
              </Text>
            </View>
            <Switch
              value={preferences.mealReminders}
              onValueChange={() => togglePreference('mealReminders')}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor={preferences.mealReminders ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Hydration Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Get reminded to drink water based on your weight
              </Text>
            </View>
            <Switch
              value={preferences.hydrationReminders}
              onValueChange={() => togglePreference('hydrationReminders')}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor={preferences.hydrationReminders ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceTitle}>Weekly Progress</Text>
              <Text style={styles.preferenceDescription}>
                Get weekly summaries of your progress and achievements
              </Text>
            </View>
            <Switch
              value={preferences.weeklyProgressReminders}
              onValueChange={() => togglePreference('weeklyProgressReminders')}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor={preferences.weeklyProgressReminders ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About notifications:</Text>
          <Text style={styles.infoText}>
            • You can change these anytime in settings
          </Text>
          <Text style={styles.infoText}>
            • Notifications help build consistent habits
          </Text>
          <Text style={styles.infoText}>
            • We respect your time and won't spam you
          </Text>
          <Text style={styles.infoText}>
            • You can always turn them off later
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
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
    marginBottom: 4,
  },
  optionalText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  preferencesContainer: {
    marginBottom: 32,
  },
  preferenceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  preferenceContent: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 18,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PreferencesScreen;

