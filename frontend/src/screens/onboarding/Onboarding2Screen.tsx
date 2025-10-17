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
import { Colors, Layout, Spacing } from '../../styles/designSystem';

const Onboarding2Screen: React.FC = () => {
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
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  header: {
    paddingTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  optionalText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  preferencesContainer: {
    marginBottom: 32,
  },
  preferenceItem: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  preferenceContent: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.lg,
    borderRadius: Layout.radiusSmall,
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
    paddingTop: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 32,
    borderRadius: Layout.radiusMedium,
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipButtonText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 32,
    borderRadius: Layout.radiusMedium,
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Onboarding2Screen;

