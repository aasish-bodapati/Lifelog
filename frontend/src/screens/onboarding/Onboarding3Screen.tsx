import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { useUser } from '../../context/UserContext';
import { calculationService } from '../../services/calculationService';
import { toastService } from '../../services/toastService';
import { Colors, Layout, Spacing } from '../../styles/designSystem';

const Onboarding3Screen: React.FC = () => {
  const { data, completeOnboarding, isLoading } = useOnboarding();
  const { state: userState } = useUser();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await completeOnboarding();
      toastService.success('Welcome to Lifelog!', 'Your profile has been set up successfully.');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toastService.error('Setup Failed', 'There was an error setting up your profile. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (!data.profile || !data.goal || !data.activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Missing required information. Please go back and complete all steps.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const targets = data.targets || calculationService.calculateDailyTargets(
    data.profile,
    data.goal,
    data.activity
  );

  const bmi = calculationService.getBMICategory(data.profile);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Summary</Text>
          <Text style={styles.subtitle}>Review your goals and get started</Text>
        </View>

        <View style={styles.summaryContainer}>
          {/* Profile Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Profile</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.profileText}>
                {userState.user?.full_name || userState.user?.username || 'User'}, {data.profile.age} years old
              </Text>
              <Text style={styles.profileText}>
                {data.profile.height}cm, {data.profile.weight}kg
              </Text>
              <Text style={styles.profileText}>
                BMI: {bmi.bmi} ({bmi.category})
              </Text>
            </View>
          </View>

          {/* Goal Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Goal</Text>
            <View style={styles.goalInfo}>
              <Text style={styles.goalText}>
                {data.goal.type === 'maintain' ? '⚖️ Maintain Weight' :
                 data.goal.type === 'gain' ? '⬆️ Gain Muscle' : '⬇️ Lose Fat'}
              </Text>
              <Text style={styles.goalDescription}>{data.goal.description}</Text>
            </View>
          </View>

          {/* Activity Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Level</Text>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>
                {data.activity.level === 'sedentary' ? 'Sedentary' :
                 data.activity.level === 'light' ? 'Lightly Active' :
                 data.activity.level === 'moderate' ? 'Moderately Active' :
                 data.activity.level === 'active' ? 'Very Active' : 'Extra Active'}
              </Text>
              <Text style={styles.activityDescription}>{data.activity.description}</Text>
            </View>
          </View>

          {/* Daily Targets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Daily Targets</Text>
            <View style={styles.targetsContainer}>
              <View style={styles.targetCard}>
                <Text style={styles.targetValue}>{targets.calories}</Text>
                <Text style={styles.targetLabel}>Calories</Text>
              </View>
              <View style={styles.targetCard}>
                <Text style={styles.targetValue}>{targets.protein}g</Text>
                <Text style={styles.targetLabel}>Protein</Text>
              </View>
              <View style={styles.targetCard}>
                <Text style={styles.targetValue}>{targets.carbs}g</Text>
                <Text style={styles.targetLabel}>Carbs</Text>
              </View>
              <View style={styles.targetCard}>
                <Text style={styles.targetValue}>{targets.fat}g</Text>
                <Text style={styles.targetLabel}>Fat</Text>
              </View>
            </View>
            <View style={styles.hydrationInfo}>
              <Text style={styles.hydrationText}>
                💧 Hydration: {targets.hydration}L per day
              </Text>
            </View>
          </View>

          {/* Preferences Summary */}
          {data.preferences && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <View style={styles.preferencesInfo}>
                {data.preferences.mealReminders && (
                  <Text style={styles.preferenceText}>✓ Meal reminders enabled</Text>
                )}
                {data.preferences.hydrationReminders && (
                  <Text style={styles.preferenceText}>✓ Hydration reminders enabled</Text>
                )}
                {data.preferences.weeklyProgressReminders && (
                  <Text style={styles.preferenceText}>✓ Weekly progress reports enabled</Text>
                )}
                {!data.preferences.mealReminders && 
                 !data.preferences.hydrationReminders && 
                 !data.preferences.weeklyProgressReminders && (
                  <Text style={styles.preferenceText}>No notifications enabled</Text>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Ready to start your journey!</Text>
          <Text style={styles.infoText}>
            Your personalized targets are calculated based on your profile and goals. 
            You can adjust these anytime in the app settings.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.primaryButton, (isLoading || isCompleting) && styles.primaryButtonDisabled]} 
          onPress={handleComplete}
          disabled={isLoading || isCompleting}
        >
          {isLoading || isCompleting ? (
            <ActivityIndicator color={Colors.textLight} />
          ) : (
            <Text style={styles.primaryButtonText}>Start Logging</Text>
          )}
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
  },
  summaryContainer: {
    marginBottom: 32,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  profileInfo: {
    gap: 4,
  },
  profileText: {
    fontSize: 16,
    color: Colors.text,
  },
  goalInfo: {
    gap: 8,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  goalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  activityInfo: {
    gap: Spacing.sm,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  activityDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  targetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  targetCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusSmall,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  targetLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  hydrationInfo: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: Layout.radiusSmall,
  },
  hydrationText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
  },
  preferencesInfo: {
    gap: 4,
  },
  preferenceText: {
    fontSize: 14,
    color: Colors.text,
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
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
    paddingTop: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 32,
    borderRadius: Layout.radiusMedium,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  primaryButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Onboarding3Screen;

