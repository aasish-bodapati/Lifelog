import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';

// Import onboarding screens
import ProfileScreen from '../screens/onboarding/ProfileScreen';
import GoalScreen from '../screens/onboarding/GoalScreen';
import ActivityScreen from '../screens/onboarding/ActivityScreen';
import PreferencesScreen from '../screens/onboarding/PreferencesScreen';
import SummaryScreen from '../screens/onboarding/SummaryScreen';

const OnboardingNavigator: React.FC = () => {
  const { currentStep } = useOnboarding();

  const renderCurrentScreen = () => {
    switch (currentStep) {
      case 0:
        return <ProfileScreen />;
      case 1:
        return <GoalScreen />;
      case 2:
        return <ActivityScreen />;
      case 3:
        return <PreferencesScreen />;
      case 4:
        return <SummaryScreen />;
      default:
        return <ProfileScreen />;
    }
  };

  return renderCurrentScreen();
};

export default OnboardingNavigator;

