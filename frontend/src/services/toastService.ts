import Toast from 'react-native-simple-toast';

export const toastService = {
  success: (message: string, description?: string) => {
    const fullMessage = description ? `${message}: ${description}` : message;
    Toast.show(fullMessage, Toast.LONG);
  },

  error: (message: string, description?: string) => {
    const fullMessage = description ? `${message}: ${description}` : message;
    Toast.show(fullMessage, Toast.LONG);
  },

  info: (message: string, description?: string) => {
    const fullMessage = description ? `${message}: ${description}` : message;
    Toast.show(fullMessage, Toast.SHORT);
  },

  warning: (message: string, description?: string) => {
    const fullMessage = description ? `${message}: ${description}` : message;
    Toast.show(fullMessage, Toast.LONG);
  },
};
