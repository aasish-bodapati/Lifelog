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
            <ActivityIndicator color="#FFFFFF" />
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  profileInfo: {
    gap: 4,
  },
  profileText: {
    fontSize: 16,
    color: '#333333',
  },
  goalInfo: {
    gap: 8,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  activityInfo: {
    gap: 8,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  targetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  targetCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  targetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  targetLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  hydrationInfo: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
  },
  hydrationText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  preferencesInfo: {
    gap: 4,
  },
  preferenceText: {
    fontSize: 14,
    color: '#333333',
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

export default Onboarding3Screen;

