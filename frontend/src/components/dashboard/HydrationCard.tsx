import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HydrationCardProps {
  current: number;
  target: number;
  isLoading?: boolean;
  onAddWater?: (amount: number) => void;
}

const HydrationCard: React.FC<HydrationCardProps> = ({
  current,
  target,
  isLoading = false,
  onAddWater,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const percentage = Math.round(progress * 100);
  const remaining = Math.max(target - current, 0);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, isLoading, progressAnim]);

  const getProgressColor = () => {
    if (progress < 0.3) return '#FF6B6B';
    if (progress < 0.6) return '#FFE66D';
    if (progress < 0.8) return '#4ECDC4';
    if (progress < 1.2) return '#45B7D1';
    return '#FF9800';
  };

  const getStatusText = () => {
    if (progress < 0.3) return 'Stay hydrated! 💧';
    if (progress < 0.6) return 'Keep drinking! 💪';
    if (progress < 0.8) return 'Almost there! 🌊';
    if (progress < 1) return 'Great job! 🎉';
    return 'Hydration master! 🏆';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="water" size={22} color="#45B7D1" />
          <Text style={styles.title}>Hydration</Text>
        </View>
        <Text style={styles.subtitle}>Today's intake</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressValue, { color: getProgressColor() }]}>
            {current.toFixed(1)}L / {target.toFixed(1)}L
          </Text>
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: getProgressColor(),
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Remaining */}
      {remaining > 0 && (
        <View style={styles.remainingSection}>
          <Ionicons name="water-outline" size={16} color="#666666" />
          <Text style={styles.remainingText}>
            {remaining.toFixed(1)}L remaining to reach your goal
          </Text>
        </View>
      )}

      {/* Quick Add Buttons */}
      <View style={styles.quickAddSection}>
        <View style={styles.quickAddButtons}>
          {[0.25, 0.5, 1.0].map((amount) => (
            <TouchableOpacity 
              key={amount} 
              style={styles.quickAddButton}
              onPress={() => onAddWater?.(amount)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAddText}>+{amount}L</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusSection}>
        <Text style={[styles.statusText, { color: getProgressColor() }]}>
          {getStatusText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 30,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  percentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  remainingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  remainingText: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  quickAddSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 12,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#45B7D1',
  },
  quickAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#45B7D1',
  },
  statusSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HydrationCard;

