import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { LogProvider } from './src/context/LogContext';
import { OnboardingProvider } from './src/context/OnboardingContext';

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <OnboardingProvider>
            <LogProvider>
              <NavigationContainer>
                <StatusBar style="dark" />
                <AppNavigator />
              </NavigationContainer>
            </LogProvider>
          </OnboardingProvider>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
