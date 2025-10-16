import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { LogProvider } from './src/context/LogContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { SyncProvider } from './src/context/SyncContext';
import { notificationService } from './src/services/notificationService';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize notifications when app starts
    const initNotifications = async () => {
      try {
        await notificationService.initialize();
        console.log('Notifications initialized successfully');
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <OnboardingProvider>
            <LogProvider>
              <SyncProvider>
                <NavigationContainer>
                  <StatusBar style="dark" />
                  <AppNavigator />
                </NavigationContainer>
              </SyncProvider>
            </LogProvider>
          </OnboardingProvider>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
