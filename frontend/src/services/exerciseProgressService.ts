import { databaseService, LocalWorkout, LocalExercise } from './databaseService';
import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersonalRecord {
  exercise_name: string;
  exercise_type: 'strength' | 'cardio' | 'flexibility' | 'other';
  record_value: number;
  record_unit: string;
  record_type: 'max_weight' | 'max_reps' | 'max_duration' | 'max_distance' | 'best_time';
  achieved_date: string;
  workout_id: string;
}

export interface ExerciseProgress {
  exercise_name: string;
  exercise_type: 'strength' | 'cardio' | 'flexibility' | 'other';
  total_workouts: number;
  first_performed: string;
  last_performed: string;
  personal_records: PersonalRecord[];
  progression_trend: 'improving' | 'stable' | 'declining' | 'new';
  average_performance: {
    weight?: number;
    reps?: number;
    duration?: number;
    distance?: number;
  };
  best_performance: {
    weight?: number;
    reps?: number;
    duration?: number;
    distance?: number;
  };
}

export interface ExerciseStats {
  total_exercises: number;
  total_workouts: number;
  most_frequent_exercise: string;
  longest_streak: number;
  current_streak: number;
  favorite_exercise_type: string;
  total_weight_lifted: number;
  total_distance_covered: number;
  total_duration: number;
}

const CACHE_KEY_PREFIX = 'exerciseProgressCache_';
const CACHE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

class ExerciseProgressService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  private async getCachedData<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT_MS) {
      return cached.data as T;
    }
    // Also check AsyncStorage for persistence across app restarts
    const stored = await AsyncStorage.getItem(CACHE_KEY_PREFIX + key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_TIMEOUT_MS) {
        this.cache.set(key, parsed); // Restore to in-memory cache
        return parsed.data as T;
      }
    }
    return null;
  }

  private async setCachedData<T>(key: string, data: T): Promise<void> {
    const entry = { data, timestamp: Date.now() };
    this.cache.set(key, entry);
    await AsyncStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
  }

  async getExerciseProgress(userId: number, limit: number = 20): Promise<ExerciseProgress[]> {
    const cacheKey = `exerciseProgress_${userId}_${limit}`;
    const cached = await this.getCachedData<ExerciseProgress[]>(cacheKey);
    if (cached) return cached;

    try {
      // Try to get from backend first
      const data = await apiService.getExerciseProgress(userId, limit);
      await this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.log('Backend exercise progress unavailable, calculating from local data');
      
      // Fallback to local calculation
      const localData = await this.calculateLocalExerciseProgress(userId, limit);
      await this.setCachedData(cacheKey, localData);
      return localData;
    }
  }

  async getPersonalRecords(userId: number, exerciseName?: string): Promise<PersonalRecord[]> {
    const cacheKey = `personalRecords_${userId}_${exerciseName || 'all'}`;
    const cached = await this.getCachedData<PersonalRecord[]>(cacheKey);
    if (cached) return cached;

    try {
      // Try to get from backend first
      const data = await apiService.getPersonalRecords(userId, exerciseName);
      await this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.log('Backend personal records unavailable, calculating from local data');
      
      // Fallback to local calculation
      const localData = await this.calculateLocalPersonalRecords(userId, exerciseName);
      await this.setCachedData(cacheKey, localData);
      return localData;
    }
  }

  async getExerciseStats(userId: number): Promise<ExerciseStats> {
    const cacheKey = `exerciseStats_${userId}`;
    const cached = await this.getCachedData<ExerciseStats>(cacheKey);
    if (cached) return cached;

    try {
      // Try to get from backend first
      const data = await apiService.getExerciseStats(userId);
      await this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.log('Backend exercise stats unavailable, calculating from local data');
      
      // Fallback to local calculation
      const localData = await this.calculateLocalExerciseStats(userId);
      await this.setCachedData(cacheKey, localData);
      return localData;
    }
  }

  private async calculateLocalExerciseProgress(userId: number, limit: number): Promise<ExerciseProgress[]> {
    try {
      // Get all workouts for the user
      const workouts = await databaseService.getWorkouts(userId, 1000);
      
      // Group exercises by name
      const exerciseMap = new Map<string, {
        name: string;
        type: 'strength' | 'cardio' | 'flexibility' | 'other';
        performances: Array<{
          date: string;
          weight?: number;
          reps?: number;
          duration?: number;
          distance?: number;
          workout_id: string;
        }>;
      }>();

      // Process each workout
      workouts.forEach(workout => {
        if (workout.exercises && Array.isArray(workout.exercises)) {
          workout.exercises.forEach((exercise: any) => {
            const exerciseName = exercise.name || exercise.exercise_name || 'Unknown Exercise';
            const exerciseType = this.determineExerciseType(exerciseName);
            
            if (!exerciseMap.has(exerciseName)) {
              exerciseMap.set(exerciseName, {
                name: exerciseName,
                type: exerciseType,
                performances: []
              });
            }

            const exerciseData = exerciseMap.get(exerciseName)!;
            exerciseData.performances.push({
              date: workout.date,
              weight: exercise.weight,
              reps: exercise.reps,
              duration: exercise.duration_minutes,
              distance: exercise.distance_km,
              workout_id: workout.local_id || workout.id?.toString() || ''
            });
          });
        }
      });

      // Convert to ExerciseProgress format
      const exerciseProgress: ExerciseProgress[] = Array.from(exerciseMap.values())
        .map(exercise => {
          const performances = exercise.performances.sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          const personalRecords = this.calculatePersonalRecords(exercise.name, exercise.type, performances);
          const progressionTrend = this.calculateProgressionTrend(performances);
          const averagePerformance = this.calculateAveragePerformance(performances);
          const bestPerformance = this.calculateBestPerformance(performances);

          return {
            exercise_name: exercise.name,
            exercise_type: exercise.type,
            total_workouts: performances.length,
            first_performed: performances[0]?.date || '',
            last_performed: performances[performances.length - 1]?.date || '',
            personal_records: personalRecords,
            progression_trend: progressionTrend,
            average_performance: averagePerformance,
            best_performance: bestPerformance
          };
        })
        .sort((a, b) => b.total_workouts - a.total_workouts)
        .slice(0, limit);

      return exerciseProgress;
    } catch (error) {
      console.error('Error calculating local exercise progress:', error);
      return [];
    }
  }

  private async calculateLocalPersonalRecords(userId: number, exerciseName?: string): Promise<PersonalRecord[]> {
    try {
      const workouts = await databaseService.getWorkouts(userId, 1000);
      const records: PersonalRecord[] = [];

      workouts.forEach(workout => {
        if (workout.exercises && Array.isArray(workout.exercises)) {
          workout.exercises.forEach((exercise: any) => {
            const name = exercise.name || exercise.exercise_name || 'Unknown Exercise';
            
            if (exerciseName && name !== exerciseName) return;

            const exerciseType = this.determineExerciseType(name);
            
            // Calculate different types of records
            if (exercise.weight && exercise.weight > 0) {
              records.push({
                exercise_name: name,
                exercise_type: exerciseType,
                record_value: exercise.weight,
                record_unit: 'kg',
                record_type: 'max_weight',
                achieved_date: workout.date,
                workout_id: workout.local_id || workout.id?.toString() || ''
              });
            }

            if (exercise.reps && exercise.reps > 0) {
              records.push({
                exercise_name: name,
                exercise_type: exerciseType,
                record_value: exercise.reps,
                record_unit: 'reps',
                record_type: 'max_reps',
                achieved_date: workout.date,
                workout_id: workout.local_id || workout.id?.toString() || ''
              });
            }

            if (exercise.duration_minutes && exercise.duration_minutes > 0) {
              records.push({
                exercise_name: name,
                exercise_type: exerciseType,
                record_value: exercise.duration_minutes,
                record_unit: 'min',
                record_type: 'max_duration',
                achieved_date: workout.date,
                workout_id: workout.local_id || workout.id?.toString() || ''
              });
            }

            if (exercise.distance_km && exercise.distance_km > 0) {
              records.push({
                exercise_name: name,
                exercise_type: exerciseType,
                record_value: exercise.distance_km,
                record_unit: 'km',
                record_type: 'max_distance',
                achieved_date: workout.date,
                workout_id: workout.local_id || workout.id?.toString() || ''
              });
            }
          });
        }
      });

      // Group by exercise and record type, keep only the best
      const bestRecords = new Map<string, PersonalRecord>();
      
      records.forEach(record => {
        const key = `${record.exercise_name}_${record.record_type}`;
        const existing = bestRecords.get(key);
        
        if (!existing || record.record_value > existing.record_value) {
          bestRecords.set(key, record);
        }
      });

      return Array.from(bestRecords.values()).sort((a, b) => 
        new Date(b.achieved_date).getTime() - new Date(a.achieved_date).getTime()
      );
    } catch (error) {
      console.error('Error calculating local personal records:', error);
      return [];
    }
  }

  private async calculateLocalExerciseStats(userId: number): Promise<ExerciseStats> {
    try {
      const workouts = await databaseService.getWorkouts(userId, 1000);
      
      let totalExercises = 0;
      let totalWeightLifted = 0;
      let totalDistanceCovered = 0;
      let totalDuration = 0;
      const exerciseCounts = new Map<string, number>();
      const exerciseTypeCounts = new Map<string, number>();

      workouts.forEach(workout => {
        if (workout.exercises && Array.isArray(workout.exercises)) {
          workout.exercises.forEach((exercise: any) => {
            const name = exercise.name || exercise.exercise_name || 'Unknown Exercise';
            const type = this.determineExerciseType(name);
            
            totalExercises++;
            exerciseCounts.set(name, (exerciseCounts.get(name) || 0) + 1);
            exerciseTypeCounts.set(type, (exerciseTypeCounts.get(type) || 0) + 1);
            
            if (exercise.weight && exercise.reps) {
              totalWeightLifted += exercise.weight * exercise.reps;
            }
            if (exercise.distance_km) {
              totalDistanceCovered += exercise.distance_km;
            }
            if (exercise.duration_minutes) {
              totalDuration += exercise.duration_minutes;
            }
          });
        }
      });

      // Find most frequent exercise
      let mostFrequentExercise = 'None';
      let maxCount = 0;
      exerciseCounts.forEach((count, name) => {
        if (count > maxCount) {
          maxCount = count;
          mostFrequentExercise = name;
        }
      });

      // Find favorite exercise type
      let favoriteType = 'strength';
      let maxTypeCount = 0;
      exerciseTypeCounts.forEach((count, type) => {
        if (count > maxTypeCount) {
          maxTypeCount = count;
          favoriteType = type;
        }
      });

      // Calculate streaks (simplified)
      const workoutDates = workouts
        .map(w => new Date(w.date))
        .sort((a, b) => a.getTime() - b.getTime());

      let longestStreak = 0;
      let currentStreak = 0;
      let tempStreak = 1;

      for (let i = 1; i < workoutDates.length; i++) {
        const diffDays = (workoutDates[i].getTime() - workoutDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      currentStreak = tempStreak;

      return {
        total_exercises: totalExercises,
        total_workouts: workouts.length,
        most_frequent_exercise: mostFrequentExercise,
        longest_streak: longestStreak,
        current_streak: currentStreak,
        favorite_exercise_type: favoriteType,
        total_weight_lifted: Math.round(totalWeightLifted),
        total_distance_covered: Math.round(totalDistanceCovered * 100) / 100,
        total_duration: Math.round(totalDuration)
      };
    } catch (error) {
      console.error('Error calculating local exercise stats:', error);
      return {
        total_exercises: 0,
        total_workouts: 0,
        most_frequent_exercise: 'None',
        longest_streak: 0,
        current_streak: 0,
        favorite_exercise_type: 'strength',
        total_weight_lifted: 0,
        total_distance_covered: 0,
        total_duration: 0
      };
    }
  }

  private determineExerciseType(exerciseName: string): 'strength' | 'cardio' | 'flexibility' | 'other' {
    const name = exerciseName.toLowerCase();
    
    if (name.includes('squat') || name.includes('deadlift') || name.includes('bench') || 
        name.includes('press') || name.includes('curl') || name.includes('row') ||
        name.includes('pull') || name.includes('push') || name.includes('lift')) {
      return 'strength';
    }
    
    if (name.includes('run') || name.includes('bike') || name.includes('cardio') ||
        name.includes('treadmill') || name.includes('elliptical') || name.includes('cycle')) {
      return 'cardio';
    }
    
    if (name.includes('yoga') || name.includes('stretch') || name.includes('flexibility') ||
        name.includes('mobility') || name.includes('pilates')) {
      return 'flexibility';
    }
    
    return 'other';
  }

  private calculatePersonalRecords(exerciseName: string, exerciseType: string, performances: any[]): PersonalRecord[] {
    const records: PersonalRecord[] = [];
    
    // Find max weight
    const maxWeight = Math.max(...performances.filter(p => p.weight).map(p => p.weight));
    if (maxWeight > 0) {
      const maxWeightPerf = performances.find(p => p.weight === maxWeight);
      if (maxWeightPerf) {
        records.push({
          exercise_name: exerciseName,
          exercise_type: exerciseType as any,
          record_value: maxWeight,
          record_unit: 'kg',
          record_type: 'max_weight',
          achieved_date: maxWeightPerf.date,
          workout_id: maxWeightPerf.workout_id
        });
      }
    }

    // Find max reps
    const maxReps = Math.max(...performances.filter(p => p.reps).map(p => p.reps));
    if (maxReps > 0) {
      const maxRepsPerf = performances.find(p => p.reps === maxReps);
      if (maxRepsPerf) {
        records.push({
          exercise_name: exerciseName,
          exercise_type: exerciseType as any,
          record_value: maxReps,
          record_unit: 'reps',
          record_type: 'max_reps',
          achieved_date: maxRepsPerf.date,
          workout_id: maxRepsPerf.workout_id
        });
      }
    }

    return records;
  }

  private calculateProgressionTrend(performances: any[]): 'improving' | 'stable' | 'declining' | 'new' {
    if (performances.length < 3) return 'new';
    
    // Simple trend calculation based on weight progression
    const weights = performances.filter(p => p.weight).map(p => p.weight);
    if (weights.length < 3) return 'stable';
    
    const recent = weights.slice(-3);
    const older = weights.slice(0, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const improvement = (recentAvg - olderAvg) / olderAvg;
    
    if (improvement > 0.05) return 'improving';
    if (improvement < -0.05) return 'declining';
    return 'stable';
  }

  private calculateAveragePerformance(performances: any[]): any {
    const weights = performances.filter(p => p.weight).map(p => p.weight);
    const reps = performances.filter(p => p.reps).map(p => p.reps);
    const durations = performances.filter(p => p.duration).map(p => p.duration);
    const distances = performances.filter(p => p.distance).map(p => p.distance);

    return {
      weight: weights.length > 0 ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length) : undefined,
      reps: reps.length > 0 ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) : undefined,
      duration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : undefined,
      distance: distances.length > 0 ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length * 100) / 100 : undefined
    };
  }

  private calculateBestPerformance(performances: any[]): any {
    const weights = performances.filter(p => p.weight).map(p => p.weight);
    const reps = performances.filter(p => p.reps).map(p => p.reps);
    const durations = performances.filter(p => p.duration).map(p => p.duration);
    const distances = performances.filter(p => p.distance).map(p => p.distance);

    return {
      weight: weights.length > 0 ? Math.max(...weights) : undefined,
      reps: reps.length > 0 ? Math.max(...reps) : undefined,
      duration: durations.length > 0 ? Math.max(...durations) : undefined,
      distance: distances.length > 0 ? Math.max(...distances) : undefined
    };
  }
}

export const exerciseProgressService = new ExerciseProgressService();
