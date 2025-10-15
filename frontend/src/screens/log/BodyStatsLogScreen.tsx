import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BodyStatsLogScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Body Stats</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
});

export default BodyStatsLogScreen;
