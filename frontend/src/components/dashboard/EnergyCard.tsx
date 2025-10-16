import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EnergyCardProps {
  current: number;
  target: number;
  isLoading?: boolean;
}

const EnergyCard: React.FC<EnergyCardProps> = ({
  current,
  target,
  isLoading = false,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

      // Pulse animation when approaching target
      if (progress > 0.8) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [progress, isLoading, progressAnim, pulseAnim]);

  const getProgressColor = () => {
    if (progress < 0.5) return '#FF6B6B';
    if (progress < 0.8) return '#FFE66D';
    if (progress < 1) return '#4ECDC4';
    return '#45B7D1';
  };

  const getStatusText = () => {
    if (progress < 0.5) return 'Keep going!';
    if (progress < 0.8) return 'You\'re doing great!';
    if (progress < 1) return 'Almost there!';
    return 'Target reached! 🎉';
  };

  const getStatusIcon = () => {
    if (progress < 0.5) return 'flame-outline';
    if (progress < 0.8) return 'flame';
    if (progress < 1) return 'flame';
    return 'trophy';
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="flame" size={24} color="#FF6B6B" />
          <Text style={styles.title}>Energy</Text>
        </View>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.numbersContainer}>
          <View style={styles.numberItem}>
            <Text style={styles.currentNumber}>{current.toLocaleString()}</Text>
            <Text style={styles.numberLabel}>Consumed</Text>
          </View>
          <View style={styles.numberItem}>
            <Text style={styles.targetNumber}>{target.toLocaleString()}</Text>
            <Text style={styles.numberLabel}>Target</Text>
          </View>
          <View style={styles.numberItem}>
            <Text style={[styles.remainingNumber, { color: remaining > 0 ? '#666' : '#4ECDC4' }]}>
              {remaining.toLocaleString()}
            </Text>
            <Text style={styles.numberLabel}>Remaining</Text>
          </View>
        </View>

        {/* Progress Ring */}
        <View style={styles.progressContainer}>
          <View style={styles.progressRing}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: getProgressColor(),
                  transform: [
                    {
                      scaleX: progressAnim,
                    },
                  ],
                },
              ]}
            />
          </View>
          <View style={styles.progressCenter}>
            <Ionicons name={getStatusIcon() as any} size={32} color={getProgressColor()} />
          </View>
        </View>

        <Text style={[styles.statusText, { color: getProgressColor() }]}>
          {getStatusText()}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    alignItems: 'center',
  },
  numbersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  numberItem: {
    alignItems: 'center',
  },
  currentNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  targetNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
  },
  remainingNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  numberLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    transformOrigin: 'left center',
  },
  progressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EnergyCard;

