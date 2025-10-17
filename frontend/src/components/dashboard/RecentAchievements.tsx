import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { personalizationService } from '../../services/personalizationService';
import { useUser } from '../../context/UserContext';
import MicroBadges from '../MicroBadges';

interface MicroBadge {
  id: string;
  title: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  category: 'streak' | 'workout' | 'nutrition' | 'achievement';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const RecentAchievements: React.FC = () => {
  const { state: userState } = useUser();
  const [microBadges, setMicroBadges] = useState<MicroBadge[]>([]);

  useEffect(() => {
    loadAchievements();
  }, [userState.user?.id]);

  const loadAchievements = async () => {
    if (!userState.user?.id) return;

    try {
      // Generate micro-badges
      const insights = personalizationService.getCurrentInsights();
      if (insights) {
        const badges = generateMicroBadges(insights);
        setMicroBadges(badges);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const generateMicroBadges = (insights: any): MicroBadge[] => {
    const badges: MicroBadge[] = [];

    // Streak badges
    const streakBadges = personalizationService.generateStreakBadges(insights.streak);
    streakBadges.forEach((badge, index) => {
      badges.push({
        id: `streak_${index}`,
        title: badge,
        emoji: '🔥',
        description: `${insights.streak} day streak`,
        unlocked: true,
        category: 'streak',
        rarity: insights.streak >= 30 ? 'legendary' : insights.streak >= 14 ? 'epic' : insights.streak >= 7 ? 'rare' : 'uncommon',
      });
    });

    // Workout badges
    const workoutBadges = personalizationService.generateWorkoutBadges(insights.weeklyWorkouts);
    workoutBadges.forEach((badge, index) => {
      badges.push({
        id: `workout_${index}`,
        title: badge,
        emoji: '💪',
        description: `${insights.weeklyWorkouts} workouts this week`,
        unlocked: true,
        category: 'workout',
        rarity: insights.weeklyWorkouts >= 7 ? 'legendary' : insights.weeklyWorkouts >= 5 ? 'epic' : 'rare',
      });
    });

    // Nutrition badges
    const nutritionBadges = personalizationService.generateNutritionBadges(
      insights.avgCalories,
      insights.proteinGoalHit
    );
    nutritionBadges.forEach((badge, index) => {
      badges.push({
        id: `nutrition_${index}`,
        title: badge,
        emoji: '🍎',
        description: 'Nutrition tracking',
        unlocked: true,
        category: 'nutrition',
        rarity: 'uncommon',
      });
    });

    return badges.slice(0, 8); // Limit to 8 badges
  };

  if (microBadges.length === 0) {
    return null;
  }

  return (
    <View style={styles.badgesContainer}>
      <View style={styles.badgesHeader}>
        <Ionicons name="trophy" size={16} color="#FFD700" />
        <Text style={styles.badgesTitle}>Recent Achievements</Text>
      </View>
      <MicroBadges
        badges={microBadges}
        maxVisible={4}
        showUnlockedOnly={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  badgesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 6,
  },
});

export default RecentAchievements;

