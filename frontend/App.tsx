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
import { ToastProvider, useToast } from './src/components/ToastContainer';
import { setToastInstance } from './src/services/toastService';

const AppContent: React.FC = () => {
  const toast = useToast();

  useEffect(() => {
    setToastInstance(toast);
  }, [toast]);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <AppNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <UserProvider>
            <OnboardingProvider>
              <LogProvider>
                <SyncProvider>
                  <AppContent />
                </SyncProvider>
              </LogProvider>
            </OnboardingProvider>
          </UserProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
