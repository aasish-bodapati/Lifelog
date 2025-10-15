import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingGoal } from '../../types/onboarding';
import { calculationService } from '../../services/calculationService';

const GoalScreen: React.FC = () => {
  const { nextStep, updateData, data } = useOnboarding();
  const [selectedGoal, setSelectedGoal] = useState<OnboardingGoal | null>(
    data.goal || null
  );

  const goalOptions = calculationService.getGoalOptions();

  const handleNext = () => {
    if (!selectedGoal) {
      return;
    }

    updateData({ goal: selectedGoal });
    nextStep();
  };

  const handleGoalSelect = (goal: OnboardingGoal) => {
    setSelectedGoal(goal);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Goal</Text>
          <Text style={styles.subtitle}>What do you want to achieve?</Text>
        </View>

        <View style={styles.goalsContainer}>
          {goalOptions.map((goal, index) => (
            <TouchableOpacity
              key={goal.type}
              style={[
                styles.goalOption,
                selectedGoal?.type === goal.type && styles.goalOptionSelected,
              ]}
              onPress={() => handleGoalSelect(goal)}
            >
              <View style={styles.goalIcon}>
                <Text style={styles.goalIconText}>
                  {goal.type === 'maintain' ? '⚖️' : 
                   goal.type === 'gain' ? '⬆️' : '⬇️'}
                </Text>
              </View>
              <View style={styles.goalContent}>
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
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How this helps you:</Text>
          <Text style={styles.infoText}>
            • Sets your daily calorie target automatically
          </Text>
          <Text style={styles.infoText}>
            • Adjusts your macronutrient ratios for your goal
          </Text>
          <Text style={styles.infoText}>
            • Provides personalized recommendations
          </Text>
          <Text style={styles.infoText}>
            • You can change this anytime in settings
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.primaryButton,
            !selectedGoal && styles.primaryButtonDisabled
          ]} 
          onPress={handleNext}
          disabled={!selectedGoal}
        >
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
  goalsContainer: {
    marginBottom: 32,
  },
  goalOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  goalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalIconText: {
    fontSize: 24,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
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
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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

export default GoalScreen;

