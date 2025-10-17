import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  category: 'consistency' | 'nutrition' | 'fitness' | 'progress';
}

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: achievement.progress / achievement.maxProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Glow animation for unlocked achievements
    if (achievement.unlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [achievement, scaleAnim, progressAnim, glowAnim]);

  const getCategoryColor = () => {
    switch (achievement.category) {
      case 'consistency': return '#8E44AD';
      case 'nutrition': return '#E67E22';
      case 'fitness': return '#E74C3C';
      case 'progress': return '#4ECDC4';
      default: return '#666666';
    }
  };

  const getCategoryIcon = () => {
    switch (achievement.category) {
      case 'consistency': return 'flame';
      case 'nutrition': return 'restaurant';
      case 'fitness': return 'fitness';
      case 'progress': return 'trending-up';
      default: return 'star';
    }
  };

  const getProgressText = () => {
    if (achievement.unlocked) {
      return 'Unlocked!';
    }
    return `${achievement.progress}/${achievement.maxProgress}`;
  };

  const getProgressPercentage = () => {
    return (achievement.progress / achievement.maxProgress) * 100;
  };

  const categoryColor = getCategoryColor();
  const progressPercentage = getProgressPercentage();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: achievement.unlocked ? 1 : 0.7,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          achievement.unlocked && styles.unlockedCard,
        ]}
        disabled={!achievement.unlocked}
      >
        {/* Glow effect for unlocked achievements */}
        {achievement.unlocked && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    }),
                  },
                ],
              },
            ]}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
            <Ionicons
              name={achievement.icon as any}
              size={28}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.categoryContainer}>
            <Ionicons
              name={getCategoryIcon() as any}
              size={12}
              color={categoryColor}
            />
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {achievement.category.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: achievement.unlocked ? '#4ECDC4' : categoryColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{getProgressText()}</Text>
        </View>

        {/* Unlocked badge */}
        {achievement.unlocked && (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
            <Text style={styles.unlockedText}>UNLOCKED</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  unlockedCard: {
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.3,
    elevation: 6,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unlockedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginLeft: 2,
  },
});

export default AchievementCard;
