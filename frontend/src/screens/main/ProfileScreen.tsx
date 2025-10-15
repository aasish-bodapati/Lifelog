import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { calculationService } from '../../services/calculationService';

const ProfileScreen: React.FC = () => {
  const { state, logout } = useUser();
  const { data: onboardingData } = useOnboarding();

  // Debug logging
  console.log('ProfileScreen - onboardingData:', onboardingData);
  console.log('ProfileScreen - user state:', state);

  const handleLogout = async () => {
    await logout();
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

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bmiContainer: {
    alignItems: 'flex-end',
  },
  bmiValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bmiCategory: {
    fontSize: 12,
    fontWeight: '600',
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  targetItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    minWidth: 80,
  },
  targetValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
