import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';

// Import onboarding screens
import Onboarding1Screen from '../screens/onboarding/Onboarding1Screen';
import Onboarding2Screen from '../screens/onboarding/Onboarding2Screen';
import Onboarding3Screen from '../screens/onboarding/Onboarding3Screen';

const OnboardingNavigator: React.FC = () => {
  const { currentStep } = useOnboarding();

  const renderCurrentScreen = () => {
    switch (currentStep) {
      case 0:
        return <Onboarding1Screen />;
      case 1:
        return <Onboarding2Screen />;
      case 2:
        return <Onboarding3Screen />;
      default:
        return <Onboarding1Screen />;
    }
  };

  return renderCurrentScreen();
};

export default OnboardingNavigator;

