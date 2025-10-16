import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExpoGoNotificationProps {
  onDismiss?: () => void;
}

const ExpoGoNotification: React.FC<ExpoGoNotificationProps> = ({ onDismiss }) => {
  const isExpoGo = __DEV__ && !global.Expo?.modules?.expo?.modules?.ExpoModules;

  if (!isExpoGo) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="information-circle" size={20} color="#007AFF" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Development Mode</Text>
          <Text style={styles.message}>
            Notifications have limited functionality in Expo Go. For full notification support, use a development build.
          </Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={20} color="#666666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default ExpoGoNotification;
