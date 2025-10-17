import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './databaseService';

// Helper function to format date in local timezone as YYYY-MM-DD
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface UserInsights {
  streak: number;
  weeklyWorkouts: number;
  avgCalories: number;
  proteinGoalHit: boolean;
  hydrationGoalHit: boolean;
  lastWorkoutDays: number;
  consistencyScore: number;
  motivationalLevel: 'low' | 'medium' | 'high';
}

export interface PersonalizedMessage {
  greeting: string;
  motivationalMessage: string;
  tip: string;
  emoji: string;
  color: string;
}

class PersonalizationService {
  private insights: UserInsights | null = null;

  async generatePersonalizedGreeting(userId: number, username: string): Promise<PersonalizedMessage> {
    try {
      // Load user insights
      await this.loadUserInsights(userId);
      
      const hour = new Date().getHours();
      const insights = this.insights || this.getDefaultInsights();
      
      // Generate contextual greeting
      const greeting = this.generateGreeting(hour, username);
      const motivationalMessage = this.generateMotivationalMessage(insights);
      const tip = this.generateTip(insights);
      const emoji = this.selectEmoji(insights);
      const color = this.selectColor(insights);

      return {
        greeting,
        motivationalMessage,
        tip,
        emoji,
        color,
      };
    } catch (error) {
      console.error('Error generating personalized greeting:', error);
      return this.getDefaultMessage(username);
    }
  }

  private async loadUserInsights(userId: number) {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return formatLocalDate(date);
      });

      // Calculate streak
      let streak = 0;
      try {
        for (const date of last7Days) {
          const hasData = await this.hasUserDataOnDate(userId, date);
          if (hasData) {
            streak++;
          } else {
            break;
          }
        }
      } catch (error) {
        console.error('Error calculating streak:', error);
        streak = 0;
      }

      // Calculate weekly workouts
      let workouts: Array<{ date: string }> = [];
      let weeklyWorkouts = 0;
      try {
        workouts = await databaseService.getWorkouts(userId, 50);
        weeklyWorkouts = workouts.filter(w => 
          last7Days.includes(w.date)
        ).length;
      } catch (error) {
        console.error('Error loading workouts:', error);
      }

      // Calculate average calories
      let totalCalories = 0;
      let daysWithCalories = 0;
      try {
        for (const date of last7Days) {
          const nutritionLogs = await databaseService.getNutritionLogs(userId, date, 100);
          const dayCalories = nutritionLogs.reduce((sum, log) => sum + log.calories, 0);
          if (dayCalories > 0) {
            totalCalories += dayCalories;
            daysWithCalories++;
          }
        }
      } catch (error) {
        console.error('Error loading nutrition data:', error);
      }
      const avgCalories = daysWithCalories > 0 ? totalCalories / daysWithCalories : 0;

      // Calculate protein goal hit (simplified)
      const proteinGoalHit = avgCalories > 1500; // Simplified check

      // Calculate hydration goal hit (simplified)
      const hydrationGoalHit = streak >= 3; // Simplified check

      // Calculate last workout days
      const lastWorkout = workouts[0];
      const lastWorkoutDays = lastWorkout ? 
        Math.floor((new Date().getTime() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24)) : 999;

      // Calculate consistency score (0-100)
      const consistencyScore = Math.min(100, (streak * 20) + (weeklyWorkouts * 10));

      // Determine motivational level
      let motivationalLevel: 'low' | 'medium' | 'high' = 'medium';
      if (consistencyScore >= 80) motivationalLevel = 'high';
      else if (consistencyScore <= 40) motivationalLevel = 'low';

      this.insights = {
        streak,
        weeklyWorkouts,
        avgCalories,
        proteinGoalHit,
        hydrationGoalHit,
        lastWorkoutDays,
        consistencyScore,
        motivationalLevel,
      };
    } catch (error) {
      console.error('Error loading user insights:', error);
      this.insights = this.getDefaultInsights();
    }
  }

  private async hasUserDataOnDate(userId: number, date: string): Promise<boolean> {
    try {
      const [nutritionLogs, workouts, bodyStats] = await Promise.all([
        databaseService.getNutritionLogs(userId, date, 1),
        databaseService.getWorkouts(userId, 50),
        databaseService.getBodyStats(userId, 50),
      ]);

      const hasNutrition = nutritionLogs.length > 0;
      const hasWorkouts = workouts.some(w => w.date === date);
      const hasBodyStats = bodyStats.some(b => b.date === date);

      return hasNutrition || hasWorkouts || hasBodyStats;
    } catch (error) {
      console.error('Error checking user data on date:', error);
      return false;
    }
  }

  private generateGreeting(hour: number, username: string): string {
    if (hour < 6) return `Good night, ${username}! 🌙`;
    if (hour < 12) return `Good morning, ${username}! ☀️`;
    if (hour < 17) return `Good afternoon, ${username}! 🌤️`;
    if (hour < 21) return `Good evening, ${username}! 🌆`;
    return `Good night, ${username}! 🌙`;
  }

  private generateMotivationalMessage(insights: UserInsights): string {
    const { streak, weeklyWorkouts, consistencyScore, lastWorkoutDays, motivationalLevel } = insights;

    if (streak === 0) {
      return "Ready to start your fitness journey? Every step counts! 💪";
    }

    if (streak >= 7) {
      return `Incredible ${streak}-day streak! You're unstoppable! 🔥`;
    }

    if (streak >= 3) {
      return `Amazing ${streak}-day streak! Keep the momentum going! ⚡`;
    }

    if (weeklyWorkouts >= 5) {
      return "You're crushing your workouts this week! 💪";
    }

    if (lastWorkoutDays > 3) {
      return "Ready for a workout? Your body is waiting! 🏋️";
    }

    if (consistencyScore >= 80) {
      return "You're doing fantastic! Consistency is your superpower! 🌟";
    }

    if (consistencyScore <= 40) {
      return "Small steps lead to big changes. You've got this! 🌱";
    }

    return "Every day is a new opportunity to be better! ✨";
  }

  private generateTip(insights: UserInsights): string {
    const { streak, weeklyWorkouts, proteinGoalHit, hydrationGoalHit, lastWorkoutDays } = insights;

    if (streak === 0) {
      return "💡 Tip: Start small! Log just one meal or workout today.";
    }

    if (!proteinGoalHit) {
      return "💡 Tip: Try adding more protein to your meals for better muscle recovery.";
    }

    if (!hydrationGoalHit) {
      return "💡 Tip: Keep a water bottle nearby to stay hydrated throughout the day.";
    }

    if (lastWorkoutDays > 2) {
      return "💡 Tip: Even a 10-minute workout can boost your energy and mood.";
    }

    if (weeklyWorkouts < 3) {
      return "💡 Tip: Aim for at least 3 workouts this week for optimal results.";
    }

    if (streak >= 7) {
      return "💡 Tip: You're on fire! Consider increasing your workout intensity.";
    }

    return "💡 Tip: Consistency beats perfection. Keep up the great work!";
  }

  private selectEmoji(insights: UserInsights): string {
    const { streak, weeklyWorkouts, consistencyScore, motivationalLevel } = insights;

    if (streak >= 7) return "🔥";
    if (streak >= 3) return "⚡";
    if (weeklyWorkouts >= 5) return "💪";
    if (consistencyScore >= 80) return "🌟";
    if (consistencyScore <= 40) return "🌱";
    return "✨";
  }

  private selectColor(insights: UserInsights): string {
    const { consistencyScore, motivationalLevel } = insights;

    if (consistencyScore >= 80) return "#4ECDC4"; // Teal
    if (consistencyScore >= 60) return "#45B7D1"; // Blue
    if (consistencyScore >= 40) return "#FFE66D"; // Yellow
    return "#FF6B6B"; // Red
  }

  private getDefaultInsights(): UserInsights {
    return {
      streak: 0,
      weeklyWorkouts: 0,
      avgCalories: 0,
      proteinGoalHit: false,
      hydrationGoalHit: false,
      lastWorkoutDays: 999,
      consistencyScore: 0,
      motivationalLevel: 'low',
    };
  }

  private getDefaultMessage(username: string): PersonalizedMessage {
    const hour = new Date().getHours();
    return {
      greeting: this.generateGreeting(hour, username),
      motivationalMessage: "Welcome to your fitness journey! Let's make today count! 💪",
      tip: "💡 Tip: Start by logging your first meal or workout.",
      emoji: "✨",
      color: "#007AFF",
    };
  }

  // Get current insights for other components
  getCurrentInsights(): UserInsights | null {
    return this.insights;
  }

  // Generate streak-based micro-badges
  generateStreakBadges(streak: number): string[] {
    const badges: string[] = [];
    
    if (streak >= 1) badges.push("🌱 First Step");
    if (streak >= 3) badges.push("⚡ Getting Started");
    if (streak >= 7) badges.push("🔥 Week Warrior");
    if (streak >= 14) badges.push("💪 Two Week Champion");
    if (streak >= 30) badges.push("🏆 Monthly Master");
    if (streak >= 100) badges.push("👑 Century Streak");
    
    return badges;
  }

  // Generate workout-based micro-badges
  generateWorkoutBadges(weeklyWorkouts: number): string[] {
    const badges: string[] = [];
    
    if (weeklyWorkouts >= 1) badges.push("🏃 First Workout");
    if (weeklyWorkouts >= 3) badges.push("💪 Regular Exerciser");
    if (weeklyWorkouts >= 5) badges.push("🔥 Fitness Fanatic");
    if (weeklyWorkouts >= 7) badges.push("⚡ Daily Dedication");
    
    return badges;
  }

  // Generate nutrition-based micro-badges
  generateNutritionBadges(avgCalories: number, proteinGoalHit: boolean): string[] {
    const badges: string[] = [];
    
    if (avgCalories > 0) badges.push("🍎 Nutrition Tracker");
    if (avgCalories >= 1500) badges.push("🍽️ Calorie Counter");
    if (proteinGoalHit) badges.push("🥩 Protein Power");
    if (avgCalories >= 2000) badges.push("🍯 Fuel Master");
    
    return badges;
  }
}

export const personalizationService = new PersonalizationService();
