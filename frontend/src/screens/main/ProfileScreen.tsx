import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { calculationService } from '../../services/calculationService';
import { Colors, Typography, Layout, Spacing } from '../../styles/designSystem';

const ProfileScreen: React.FC = () => {
  const { state, logout } = useUser();
  const { data: onboardingData, restartOnboarding } = useOnboarding();

  // Debug logging
  console.log('ProfileScreen - onboardingData:', onboardingData);
  console.log('ProfileScreen - user state:', state);

  const handleLogout = async () => {
    await logout();
  };

  const handleRerunOnboarding = async () => {
    try {
      await restartOnboarding();
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  };

  const getGoalText = (goalType: string) => {
    switch (goalType) {
      case 'maintain': return 'Maintain Weight';
      case 'gain': return 'Gain Muscle';
      case 'lose': return 'Lose Fat';
      default: return 'Not Set';
    }
  };

  const getActivityText = (activityLevel: string) => {
    switch (activityLevel) {
      case 'sedentary': return 'Sedentary';
      case 'light': return 'Lightly Active';
      case 'moderate': return 'Moderately Active';
      case 'active': return 'Very Active';
      case 'extra': return 'Extra Active';
      default: return 'Not Set';
    }
  };

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'M': return 'Male';
      case 'F': return 'Female';
      case 'Other': return 'Other';
      default: return 'Not Set';
    }
  };

  // Calculate targets if we have profile data
  const calculateTargets = () => {
    if (onboardingData.profile && onboardingData.goal && onboardingData.activity) {
      return calculationService.calculateDailyTargets(
        onboardingData.profile as any,
        onboardingData.goal,
        onboardingData.activity
      );
    }
    return null;
  };

  const targets = calculateTargets();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Welcome, {state.user?.username}</Text>
        </View>

        {/* Basic Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{onboardingData.profile?.age || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{getGenderText(onboardingData.profile?.gender || '')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height</Text>
            <Text style={styles.infoValue}>{onboardingData.profile?.height ? `${onboardingData.profile.height} cm` : 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight</Text>
            <Text style={styles.infoValue}>{onboardingData.profile?.weight ? `${onboardingData.profile.weight} kg` : 'Not set'}</Text>
          </View>
          {onboardingData.profile?.height && onboardingData.profile?.weight && (
            <View style={styles.bmiRow}>
              <Text style={styles.infoLabel}>BMI</Text>
              <View style={styles.bmiContainer}>
                {(() => {
                  const bmi = calculationService.getBMICategory(onboardingData.profile as any);
                  return (
                    <>
                      <Text style={styles.bmiValue}>{bmi.bmi}</Text>
                      <Text style={[styles.bmiCategory, { color: bmi.color }]}>{bmi.category}</Text>
                    </>
                  );
                })()}
              </View>
            </View>
          )}
        </View>

        {/* Goals & Activity Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Goals & Activity</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Goal</Text>
            <Text style={styles.infoValue}>{getGoalText(onboardingData.goal?.type || '')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Activity Level</Text>
            <Text style={styles.infoValue}>{getActivityText(onboardingData.activity?.level || '')}</Text>
          </View>
        </View>

        {/* Daily Targets Card */}
        {targets && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Targets</Text>
            <View style={styles.targetsGrid}>
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{targets.calories}</Text>
                <Text style={styles.targetLabel}>Calories</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{targets.protein}g</Text>
                <Text style={styles.targetLabel}>Protein</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{targets.carbs}g</Text>
                <Text style={styles.targetLabel}>Carbs</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{targets.fat}g</Text>
                <Text style={styles.targetLabel}>Fat</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{targets.hydration}L</Text>
                <Text style={styles.targetLabel}>Water</Text>
              </View>
            </View>
          </View>
        )}

        {/* Preferences Card */}
        {onboardingData.preferences && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Meal Reminders</Text>
              <Text style={styles.preferenceValue}>{onboardingData.preferences.mealReminders ? 'On' : 'Off'}</Text>
            </View>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Hydration Reminders</Text>
              <Text style={styles.preferenceValue}>{onboardingData.preferences.hydrationReminders ? 'On' : 'Off'}</Text>
            </View>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Weekly Progress Reminders</Text>
              <Text style={styles.preferenceValue}>{onboardingData.preferences.weeklyProgressReminders ? 'On' : 'Off'}</Text>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.rerunButton} onPress={handleRerunOnboarding}>
            <Text style={styles.rerunButtonText}>Update Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs + 2,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Layout.shadowSmall,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  bmiContainer: {
    alignItems: 'flex-end',
  },
  bmiValue: {
    ...Typography.h4,
    fontWeight: '700',
    color: Colors.text,
  },
  bmiCategory: {
    ...Typography.caption,
    fontWeight: '600',
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  targetItem: {
    backgroundColor: Colors.background,
    borderRadius: Layout.radiusSmall,
    padding: Spacing.lg,
    alignItems: 'center',
    width: '30%',
    minWidth: 80,
  },
  targetValue: {
    ...Typography.h3,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  targetLabel: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  preferenceLabel: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  preferenceValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
    marginBottom: 30,
    gap: Spacing.md,
  },
  rerunButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 32,
    borderRadius: Layout.radiusMedium,
    alignItems: 'center',
    ...Layout.shadowMedium,
  },
  rerunButtonText: {
    ...Typography.button,
    color: Colors.textLight,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 32,
    borderRadius: Layout.radiusMedium,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...Typography.button,
    color: Colors.textLight,
  },
});

export default ProfileScreen;
