import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../types/onboarding';

// Import onboarding screens
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import ProfileScreen from '../screens/onboarding/ProfileScreen';
import GoalScreen from '../screens/onboarding/GoalScreen';
import ActivityScreen from '../screens/onboarding/ActivityScreen';
import PreferencesScreen from '../screens/onboarding/PreferencesScreen';
import SummaryScreen from '../screens/onboarding/SummaryScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F8F9FA' },
        gestureEnabled: false, // Disable swipe back during onboarding
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Activity" component={ActivityScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="Summary" component={SummaryScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
