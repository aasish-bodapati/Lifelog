import { Alert, Platform } from 'react-native';

// Simple toast service using Alert for cross-platform compatibility
// No native dependencies required
export const toastService = {
  success: (title: string, message?: string) => {
    if (Platform.OS === 'web') {
      console.log(`✅ ${title}${message ? `: ${message}` : ''}`);
      return;
    }
    Alert.alert(title, message, [{ text: 'OK' }]);
  },

  error: (title: string, message?: string) => {
    if (Platform.OS === 'web') {
      console.error(`❌ ${title}${message ? `: ${message}` : ''}`);
      return;
    }
    Alert.alert(title, message, [{ text: 'OK' }]);
  },

  info: (title: string, message?: string) => {
    if (Platform.OS === 'web') {
      console.info(`ℹ️ ${title}${message ? `: ${message}` : ''}`);
      return;
    }
    Alert.alert(title, message, [{ text: 'OK' }]);
  },

  warning: (title: string, message?: string) => {
    if (Platform.OS === 'web') {
      console.warn(`⚠️ ${title}${message ? `: ${message}` : ''}`);
      return;
    }
    Alert.alert(title, message, [{ text: 'OK' }]);
  },
};
