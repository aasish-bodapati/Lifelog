import { databaseService, LocalWorkout, LocalNutritionLog, LocalBodyStat } from './databaseService';
import { useUser } from '../context/UserContext';
import { useSync } from '../context/SyncContext';
import { toastService } from './toastService';

export interface YesterdayData {
  workouts: LocalWorkout[];
  nutrition: LocalNutritionLog[];
  bodyStats: LocalBodyStat[];
}

class RepeatYesterdayService {
  /**
   * Get yesterday's data for a user
   */
  async getYesterdayData(userId: number): Promise<YesterdayData> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    try {
      const [workouts, nutrition, bodyStats] = await Promise.all([
        databaseService.getWorkouts(userId, 50),
        databaseService.getNutritionLogs(userId, yesterdayStr, 50),
        databaseService.getBodyStats(userId, 50),
      ]);

      // Filter workouts from yesterday
      const yesterdayWorkouts = workouts.filter(workout => 
        workout.date === yesterdayStr
      );

      // Filter body stats from yesterday
      const yesterdayBodyStats = bodyStats.filter(bodyStat => 
        bodyStat.date === yesterdayStr
      );

      return {
        workouts: yesterdayWorkouts,
        nutrition: nutrition, // Already filtered by date
        bodyStats: yesterdayBodyStats,
      };
    } catch (error) {
      console.error('Error getting yesterday data:', error);
      throw error;
    }
  }

  /**
   * Repeat yesterday's workouts
   */
  async repeatYesterdayWorkouts(userId: number): Promise<void> {
    try {
      const yesterdayData = await this.getYesterdayData(userId);
      
      if (yesterdayData.workouts.length === 0) {
        toastService.info('No Data', 'No workouts found from yesterday');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      let repeatedCount = 0;

      for (const workout of yesterdayData.workouts) {
        const newWorkoutData = {
          local_id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          name: workout.name,
          date: today,
          duration_minutes: workout.duration_minutes,
          notes: workout.notes,
        };

        await databaseService.saveWorkout(newWorkoutData);
        repeatedCount++;
      }

      toastService.success('Success', `Repeated ${repeatedCount} workout(s) from yesterday`);
    } catch (error) {
      console.error('Error repeating yesterday workouts:', error);
      toastService.error('Error', 'Failed to repeat yesterday workouts');
    }
  }

  /**
   * Repeat yesterday's nutrition
   */
  async repeatYesterdayNutrition(userId: number): Promise<void> {
    try {
      const yesterdayData = await this.getYesterdayData(userId);
      
      if (yesterdayData.nutrition.length === 0) {
        toastService.info('No Data', 'No meals found from yesterday');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      let repeatedCount = 0;

      for (const nutrition of yesterdayData.nutrition) {
        const newNutritionData = {
          local_id: `nutrition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          meal_type: nutrition.meal_type,
          food_name: nutrition.food_name,
          calories: nutrition.calories,
          protein_g: nutrition.protein_g,
          carbs_g: nutrition.carbs_g,
          fat_g: nutrition.fat_g,
          fiber_g: nutrition.fiber_g,
          sugar_g: nutrition.sugar_g,
          sodium_mg: nutrition.sodium_mg,
          date: today,
        };

        await databaseService.saveNutritionLog(newNutritionData);
        repeatedCount++;
      }

      toastService.success('Success', `Repeated ${repeatedCount} meal(s) from yesterday`);
    } catch (error) {
      console.error('Error repeating yesterday nutrition:', error);
      toastService.error('Error', 'Failed to repeat yesterday meals');
    }
  }

  /**
   * Repeat yesterday's body stats
   */
  async repeatYesterdayBodyStats(userId: number): Promise<void> {
    try {
      const yesterdayData = await this.getYesterdayData(userId);
      
      if (yesterdayData.bodyStats.length === 0) {
        toastService.info('No Data', 'No body stats found from yesterday');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      let repeatedCount = 0;

      for (const bodyStat of yesterdayData.bodyStats) {
        const newBodyStatData = {
          local_id: `bodystat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          weight_kg: bodyStat.weight_kg,
          body_fat_percentage: bodyStat.body_fat_percentage,
          muscle_mass_kg: bodyStat.muscle_mass_kg,
          waist_cm: bodyStat.waist_cm,
          chest_cm: bodyStat.chest_cm,
          arm_cm: bodyStat.arm_cm,
          thigh_cm: bodyStat.thigh_cm,
          date: today,
        };

        await databaseService.saveBodyStat(newBodyStatData);
        repeatedCount++;
      }

      toastService.success('Success', `Repeated ${repeatedCount} body stat(s) from yesterday`);
    } catch (error) {
      console.error('Error repeating yesterday body stats:', error);
      toastService.error('Error', 'Failed to repeat yesterday body stats');
    }
  }

  /**
   * Repeat all of yesterday's data
   */
  async repeatAllYesterday(userId: number): Promise<void> {
    try {
      const yesterdayData = await this.getYesterdayData(userId);
      
      if (yesterdayData.workouts.length === 0 && 
          yesterdayData.nutrition.length === 0 && 
          yesterdayData.bodyStats.length === 0) {
        toastService.info('No Data', 'No data found from yesterday');
        return;
      }

      let totalRepeated = 0;

      // Repeat workouts
      if (yesterdayData.workouts.length > 0) {
        await this.repeatYesterdayWorkouts(userId);
        totalRepeated += yesterdayData.workouts.length;
      }

      // Repeat nutrition
      if (yesterdayData.nutrition.length > 0) {
        await this.repeatYesterdayNutrition(userId);
        totalRepeated += yesterdayData.nutrition.length;
      }

      // Repeat body stats
      if (yesterdayData.bodyStats.length > 0) {
        await this.repeatYesterdayBodyStats(userId);
        totalRepeated += yesterdayData.bodyStats.length;
      }

      toastService.success('Success', `Repeated ${totalRepeated} items from yesterday`);
    } catch (error) {
      console.error('Error repeating all yesterday data:', error);
      toastService.error('Error', 'Failed to repeat yesterday data');
    }
  }

  /**
   * Get summary of yesterday's data
   */
  async getYesterdaySummary(userId: number): Promise<{
    hasWorkouts: boolean;
    hasNutrition: boolean;
    hasBodyStats: boolean;
    workoutCount: number;
    nutritionCount: number;
    bodyStatCount: number;
  }> {
    try {
      const yesterdayData = await this.getYesterdayData(userId);
      
      return {
        hasWorkouts: yesterdayData.workouts.length > 0,
        hasNutrition: yesterdayData.nutrition.length > 0,
        hasBodyStats: yesterdayData.bodyStats.length > 0,
        workoutCount: yesterdayData.workouts.length,
        nutritionCount: yesterdayData.nutrition.length,
        bodyStatCount: yesterdayData.bodyStats.length,
      };
    } catch (error) {
      console.error('Error getting yesterday summary:', error);
      return {
        hasWorkouts: false,
        hasNutrition: false,
        hasBodyStats: false,
        workoutCount: 0,
        nutritionCount: 0,
        bodyStatCount: 0,
      };
    }
  }
}

export const repeatYesterdayService = new RepeatYesterdayService();

