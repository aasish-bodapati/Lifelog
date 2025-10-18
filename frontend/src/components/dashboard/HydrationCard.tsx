import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout, Spacing, getHydrationProgressColor, getProgressMessage } from '../../styles/designSystem';

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

  const progressColor = getHydrationProgressColor(progress);
  const statusText = getProgressMessage(progress, 'hydration');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="water" size={22} color={Colors.other} />
          <Text style={styles.title}>Hydration</Text>
        </View>
        <Text style={styles.subtitle}>Today's intake</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressValue, { color: progressColor }]}>
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
                  backgroundColor: progressColor,
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
          <Ionicons name="water-outline" size={16} color={Colors.textSecondary} />
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
        <Text style={[styles.statusText, { color: progressColor }]}>
          {statusText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusLarge,
    padding: Layout.cardPadding,
    ...Layout.shadowMedium,
  },
  header: {
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...Typography.h4,
    fontSize: 17,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 30,
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressValue: {
    ...Typography.body,
    fontWeight: '700',
  },
  percentage: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.borderLight,
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
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.xs + 2,
  },
  remainingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  quickAddSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.sm,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.radiusSmall,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.other,
  },
  quickAddText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.other,
  },
  statusSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statusText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HydrationCard;

