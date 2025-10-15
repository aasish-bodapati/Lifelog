import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useUser } from '../context/UserContext';
import { useOnboarding } from '../context/OnboardingContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { state: userState } = useUser();
  const { isComplete: onboardingComplete, checkOnboardingStatus } = useOnboarding();

  // Check onboarding status when user becomes authenticated
  useEffect(() => {
    if (userState.isAuthenticated && !userState.isLoading) {
      checkOnboardingStatus();
    }
  }, [userState.isAuthenticated, userState.isLoading, checkOnboardingStatus]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userState.isAuthenticated ? (
        onboardingComplete ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        )
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
