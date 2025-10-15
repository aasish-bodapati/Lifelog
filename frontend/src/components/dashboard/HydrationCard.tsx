import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HydrationCardProps {
  current: number;
  target: number;
  isLoading?: boolean;
}

const HydrationCard: React.FC<HydrationCardProps> = ({
  current,
  target,
  isLoading = false,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const waterDropAnim = useRef(new Animated.Value(0)).current;

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

      // Water drop animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(waterDropAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(waterDropAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [progress, isLoading, progressAnim, waterDropAnim]);

  const getProgressColor = () => {
    if (progress < 0.3) return '#FF6B6B';
    if (progress < 0.6) return '#FFE66D';
    if (progress < 0.8) return '#4ECDC4';
    return '#45B7D1';
  };

  const getStatusText = () => {
    if (progress < 0.3) return 'Stay hydrated! 💧';
    if (progress < 0.6) return 'Keep drinking! 💪';
    if (progress < 0.8) return 'Almost there! 🌊';
    if (progress < 1) return 'Great job! 🎉';
    return 'Hydration master! 🏆';
  };

  const getWaterDrops = () => {
    const drops = Math.floor(progress * 8); // 8 drops max
    return Array.from({ length: 8 }, (_, i) => (
      <Animated.View
        key={i}
        style={[
          styles.waterDrop,
          {
            opacity: i < drops ? 1 : 0.2,
            transform: [
              {
                scale: waterDropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: i < drops ? [1, 1.2] : [1, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="water" size={16} color={getProgressColor()} />
      </Animated.View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="water" size={24} color="#45B7D1" />
          <Text style={styles.title}>Hydration</Text>
        </View>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <View style={styles.content}>
        {/* Water Level Visual */}
        <View style={styles.waterContainer}>
          <View style={styles.waterGlass}>
            <Animated.View
              style={[
                styles.waterLevel,
                {
                  backgroundColor: getProgressColor(),
                  height: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
            <View style={styles.waterGlassOverlay}>
              <Ionicons name="wine" size={32} color="#E0E0E0" />
            </View>
          </View>
          
          {/* Water Drops */}
          <View style={styles.waterDropsContainer}>
            {getWaterDrops()}
          </View>
        </View>

        {/* Numbers */}
        <View style={styles.numbersContainer}>
          <View style={styles.numberItem}>
            <Text style={styles.currentNumber}>{current.toFixed(1)}L</Text>
            <Text style={styles.numberLabel}>Consumed</Text>
          </View>
          <View style={styles.numberItem}>
            <Text style={styles.targetNumber}>{target.toFixed(1)}L</Text>
            <Text style={styles.numberLabel}>Target</Text>
          </View>
          <View style={styles.numberItem}>
            <Text style={[styles.remainingNumber, { color: remaining > 0 ? '#666' : '#4ECDC4' }]}>
              {remaining.toFixed(1)}L
            </Text>
            <Text style={styles.numberLabel}>Remaining</Text>
          </View>
        </View>

        {/* Status */}
        <Text style={[styles.statusText, { color: getProgressColor() }]}>
          {getStatusText()}
        </Text>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddContainer}>
          <Text style={styles.quickAddLabel}>Quick add:</Text>
          <View style={styles.quickAddButtons}>
            {[0.25, 0.5, 1.0].map((amount) => (
              <View key={amount} style={styles.quickAddButton}>
                <Text style={styles.quickAddText}>+{amount}L</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
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
  waterContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  waterGlass: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    position: 'relative',
  },
  waterLevel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 6,
  },
  waterGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterDropsContainer: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  waterDrop: {
    margin: 2,
  },
  numbersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
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
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  quickAddContainer: {
    alignItems: 'center',
  },
  quickAddLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  quickAddButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
});

export default HydrationCard;
