import { apiService } from './api';
import { databaseService } from './databaseService';

export interface DailyInsights {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  workout_count: number;
  total_workout_duration: number;
  weight?: number;
  calories_burned?: number;
  net_calories?: number;
  protein_goal_achieved?: boolean;
  hydration_level?: number;
  consistency_score?: number;
}

export interface WeeklyTrends {
  week_start: string;
  week_end: string;
  avg_daily_calories: number;
  avg_daily_protein: number;
  total_workouts: number;
  total_workout_duration: number;
  weight_change?: number;
  consistency_streak: number;
  weekly_goals_achieved: number;
  weekly_goals_total: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface ProgressMetrics {
  user_id: number;
  period_days: number;
  start_date: string;
  end_date: string;
  daily_summaries: DailyInsights[];
  calories_trend: number[];
  weight_trend: number[];
  avg_daily_calories: number;
  weight_change: number;
  workout_frequency: number;
  consistency_score: number;
}

export interface ConsistencyStreak {
  user_id: number;
  current_streak: number;
  last_updated: string;
  longest_streak?: number;
  streak_type: 'daily' | 'weekly' | 'monthly';
}

class AdvancedAnalyticsService {
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Get daily insights with advanced analytics
  async getDailyInsights(userId: number, date: string): Promise<DailyInsights> {
    const cacheKey = `daily_insights_${userId}_${date}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Try backend API first
      const backendData = await apiService.getDailyAnalytics(userId, date);
      
      // Enhance with additional calculations
      const enhancedData: DailyInsights = {
        ...backendData,
        calories_burned: this.calculateCaloriesBurned(backendData.total_workout_duration, 70), // Default weight
        net_calories: backendData.total_calories - this.calculateCaloriesBurned(backendData.total_workout_duration, 70),
        protein_goal_achieved: backendData.total_protein >= 100, // Default protein goal
        hydration_level: 0, // Will be calculated from body stats
        consistency_score: this.calculateConsistencyScore(backendData),
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: enhancedData,
        timestamp: Date.now()
      });

      return enhancedData;
    } catch (error) {
      console.log('Backend analytics unavailable, using local data');
      
      // Fallback to local data
      const localData = await this.getLocalDailyInsights(userId, date);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: localData,
        timestamp: Date.now()
      });

      return localData;
    }
  }

  // Get weekly trends with advanced analysis
  async getWeeklyTrends(userId: number, startDate: string): Promise<WeeklyTrends> {
    const cacheKey = `weekly_trends_${userId}_${startDate}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const backendData = await apiService.getWeeklyAnalytics(userId, startDate);
      
      // Enhance with additional analysis
      const enhancedData: WeeklyTrends = {
        ...backendData,
        consistency_streak: await this.getConsistencyStreak(userId),
        weekly_goals_achieved: this.calculateWeeklyGoalsAchieved(backendData),
        weekly_goals_total: 7, // 7 days in a week
        trend_direction: this.calculateTrendDirection(backendData),
      };

      this.cache.set(cacheKey, {
        data: enhancedData,
        timestamp: Date.now()
      });

      return enhancedData;
    } catch (error) {
      console.log('Backend weekly analytics unavailable, using local data');
      return await this.getLocalWeeklyTrends(userId, startDate);
    }
  }

  // Get progress metrics for a specific period
  async getProgressMetrics(userId: number, days: number = 30): Promise<ProgressMetrics> {
    const cacheKey = `progress_metrics_${userId}_${days}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const backendData = await apiService.getProgressMetrics(userId, days);
      
      // Enhance with additional calculations
      const enhancedData: ProgressMetrics = {
        ...backendData,
        workout_frequency: this.calculateWorkoutFrequency(backendData.daily_summaries),
        consistency_score: this.calculateOverallConsistencyScore(backendData.daily_summaries),
      };

      this.cache.set(cacheKey, {
        data: enhancedData,
        timestamp: Date.now()
      });

      return enhancedData;
    } catch (error) {
      console.log('Backend progress metrics unavailable, using local data');
      return await this.getLocalProgressMetrics(userId, days);
    }
  }

  // Get consistency streak
  async getConsistencyStreak(userId: number): Promise<ConsistencyStreak> {
    const cacheKey = `consistency_streak_${userId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const backendData = await apiService.getConsistencyStreak(userId);
      
      const enhancedData: ConsistencyStreak = {
        ...backendData,
        longest_streak: await this.getLongestStreak(userId),
        streak_type: 'daily',
      };

      this.cache.set(cacheKey, {
        data: enhancedData,
        timestamp: Date.now()
      });

      return enhancedData;
    } catch (error) {
      console.log('Backend streak data unavailable, using local calculation');
      return await this.getLocalConsistencyStreak(userId);
    }
  }

  // Helper methods for calculations
  private calculateCaloriesBurned(durationMinutes: number, weightKg: number): number {
    // Rough estimate: 8-12 calories per minute for moderate exercise
    const caloriesPerMinute = 10;
    return durationMinutes * caloriesPerMinute;
  }

  private calculateConsistencyScore(dailyData: DailyInsights): number {
    let score = 0;
    
    // Calorie logging consistency
    if (dailyData.total_calories > 0) score += 25;
    
    // Protein goal achievement
    if (dailyData.protein_goal_achieved) score += 25;
    
    // Workout consistency
    if (dailyData.workout_count > 0) score += 25;
    
    // Hydration (if tracked)
    if (dailyData.hydration_level && dailyData.hydration_level > 0) score += 25;
    
    return Math.min(score, 100);
  }

  private calculateWeeklyGoalsAchieved(weeklyData: WeeklyTrends): number {
    let goalsAchieved = 0;
    
    // Calorie goals (5+ days with good calorie intake)
    if (weeklyData.avg_daily_calories > 1500) goalsAchieved++;
    
    // Protein goals (5+ days with good protein)
    if (weeklyData.avg_daily_protein > 80) goalsAchieved++;
    
    // Workout goals (3+ workouts per week)
    if (weeklyData.total_workouts >= 3) goalsAchieved++;
    
    // Duration goals (150+ minutes per week)
    if (weeklyData.total_workout_duration >= 150) goalsAchieved++;
    
    // Weight goals (if applicable)
    if (weeklyData.weight_change !== undefined) goalsAchieved++;
    
    // Consistency goals (5+ days of activity)
    if (weeklyData.consistency_streak >= 5) goalsAchieved++;
    
    // Progress goals (positive trend)
    if (weeklyData.trend_direction === 'up') goalsAchieved++;
    
    return goalsAchieved;
  }

  private calculateTrendDirection(weeklyData: WeeklyTrends): 'up' | 'down' | 'stable' {
    if (weeklyData.weight_change === undefined) return 'stable';
    
    if (weeklyData.weight_change > 0.5) return 'up';
    if (weeklyData.weight_change < -0.5) return 'down';
    return 'stable';
  }

  private calculateWorkoutFrequency(dailySummaries: DailyInsights[]): number {
    const workoutDays = dailySummaries.filter(day => day.workout_count > 0).length;
    return (workoutDays / dailySummaries.length) * 100;
  }

  private calculateOverallConsistencyScore(dailySummaries: DailyInsights[]): number {
    if (dailySummaries.length === 0) return 0;
    
    const totalScore = dailySummaries.reduce((sum, day) => {
      return sum + (day.consistency_score || 0);
    }, 0);
    
    return Math.round(totalScore / dailySummaries.length);
  }

  // Local data fallback methods
  private async getLocalDailyInsights(userId: number, date: string): Promise<DailyInsights> {
    const nutritionLogs = await databaseService.getNutritionLogs(userId, date, 100);
    const workouts = await databaseService.getWorkouts(userId, 50);
    const dayWorkouts = workouts.filter(w => w.date === date);
    
    const totalCalories = nutritionLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
    const totalProtein = nutritionLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0);
    const totalCarbs = nutritionLogs.reduce((sum, log) => sum + (log.carbs_g || 0), 0);
    const totalFat = nutritionLogs.reduce((sum, log) => sum + (log.fat_g || 0), 0);
    const totalDuration = dayWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    
    return {
      date,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      workout_count: dayWorkouts.length,
      total_workout_duration: totalDuration,
      calories_burned: this.calculateCaloriesBurned(totalDuration, 70),
      net_calories: totalCalories - this.calculateCaloriesBurned(totalDuration, 70),
      protein_goal_achieved: totalProtein >= 100,
      hydration_level: 0,
      consistency_score: this.calculateConsistencyScore({
        date,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        workout_count: dayWorkouts.length,
        total_workout_duration: totalDuration,
      }),
    };
  }

  private async getLocalWeeklyTrends(userId: number, startDate: string): Promise<WeeklyTrends> {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalWorkouts = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyInsights = await this.getLocalDailyInsights(userId, dateStr);
      totalCalories += dailyInsights.total_calories;
      totalProtein += dailyInsights.total_protein;
      totalWorkouts += dailyInsights.workout_count;
      totalDuration += dailyInsights.total_workout_duration;
    }
    
    return {
      week_start: startDate,
      week_end: end.toISOString().split('T')[0],
      avg_daily_calories: totalCalories / 7,
      avg_daily_protein: totalProtein / 7,
      total_workouts: totalWorkouts,
      total_workout_duration: totalDuration,
      consistency_streak: await this.getLocalConsistencyStreak(userId),
      weekly_goals_achieved: this.calculateWeeklyGoalsAchieved({
        week_start: startDate,
        week_end: end.toISOString().split('T')[0],
        avg_daily_calories: totalCalories / 7,
        avg_daily_protein: totalProtein / 7,
        total_workouts: totalWorkouts,
        total_workout_duration: totalDuration,
      }),
      weekly_goals_total: 7,
      trend_direction: 'stable',
    };
  }

  private async getLocalProgressMetrics(userId: number, days: number): Promise<ProgressMetrics> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    
    const dailySummaries: DailyInsights[] = [];
    const caloriesTrend: number[] = [];
    const weightTrend: number[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyInsights = await this.getLocalDailyInsights(userId, dateStr);
      dailySummaries.push(dailyInsights);
      caloriesTrend.push(dailyInsights.total_calories);
    }
    
    const totalCalories = dailySummaries.reduce((sum, day) => sum + day.total_calories, 0);
    const avgDailyCalories = totalCalories / days;
    
    return {
      user_id: userId,
      period_days: days,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      daily_summaries: dailySummaries,
      calories_trend: caloriesTrend,
      weight_trend: weightTrend,
      avg_daily_calories: avgDailyCalories,
      weight_change: 0,
      workout_frequency: this.calculateWorkoutFrequency(dailySummaries),
      consistency_score: this.calculateOverallConsistencyScore(dailySummaries),
    };
  }

  private async getLocalConsistencyStreak(userId: number): Promise<ConsistencyStreak> {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dailyInsights = await this.getLocalDailyInsights(userId, dateStr);
      
      if (dailyInsights.total_calories > 0 || dailyInsights.workout_count > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      user_id: userId,
      current_streak: streak,
      last_updated: today.toISOString(),
      streak_type: 'daily',
    };
  }

  private async getLongestStreak(userId: number): Promise<number> {
    // This would require more complex analysis of historical data
    // For now, return current streak as longest
    const currentStreak = await this.getLocalConsistencyStreak(userId);
    return currentStreak.current_streak;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();
