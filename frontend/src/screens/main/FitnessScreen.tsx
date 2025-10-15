import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FitnessScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitness</Text>
      <Text style={styles.subtitle}>Track your fitness journey</Text>
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

export default FitnessScreen;
