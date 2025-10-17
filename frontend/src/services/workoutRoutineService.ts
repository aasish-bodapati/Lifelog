/**
 * Workout Routine Service
 * 
 * Provides goal-based workout routines for users
 * - Maintain: Functional Performance Plan
 * - Gain: Lean Mass Builder Plan
 * - Lose: Metabolic Shred Plan
 * - Custom: User-created routines
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RoutineExercise {
  name: string;
  sets: number;
  reps?: number;
  duration?: number; // in seconds
  rest?: number; // rest between sets in seconds
  notes?: string;
}

export interface RoutineDay {
  dayNumber: number;
  title: string;
  focus: string;
  warmup: string;
  exercises: RoutineExercise[];
  cooldown?: string;
  isCircuit?: boolean;
  circuitRounds?: number;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  goalType: 'maintain' | 'gain' | 'lose' | 'custom';
  description: string;
  equipment: string[];
  focusAreas: string[];
  daysPerWeek: number;
  days: RoutineDay[];
  isCustom?: boolean;
  createdAt?: string;
}

const CUSTOM_ROUTINES_KEY = 'customWorkoutRoutines';

class WorkoutRoutineService {
  /**
   * Get all available routines (pre-built + custom)
   */
  async getAllRoutines(): Promise<WorkoutRoutine[]> {
    const customRoutines = await this.getCustomRoutines();
    return [
      this.getMaintainRoutine(),
      this.getGainRoutine(),
      this.getLoseRoutine(),
      ...customRoutines,
    ];
  }

  /**
   * Get routine by goal type
   */
  getRoutineByGoal(goalType: 'maintain' | 'gain' | 'lose'): WorkoutRoutine {
    switch (goalType) {
      case 'maintain':
        return this.getMaintainRoutine();
      case 'gain':
        return this.getGainRoutine();
      case 'lose':
        return this.getLoseRoutine();
      default:
        return this.getMaintainRoutine();
    }
  }

  /**
   * Get routine by ID (pre-built or custom)
   */
  async getRoutineById(id: string): Promise<WorkoutRoutine | null> {
    const allRoutines = await this.getAllRoutines();
    return allRoutines.find(r => r.id === id) || null;
  }

  /**
   * Get all custom routines from AsyncStorage
   */
  async getCustomRoutines(): Promise<WorkoutRoutine[]> {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_ROUTINES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error loading custom routines:', error);
      return [];
    }
  }

  /**
   * Save a custom routine
   */
  async saveCustomRoutine(routine: WorkoutRoutine): Promise<void> {
    try {
      const customRoutines = await this.getCustomRoutines();
      
      // Check if updating existing routine
      const existingIndex = customRoutines.findIndex(r => r.id === routine.id);
      
      if (existingIndex >= 0) {
        // Update existing
        customRoutines[existingIndex] = {
          ...routine,
          isCustom: true,
        };
      } else {
        // Add new routine
        customRoutines.push({
          ...routine,
          isCustom: true,
          createdAt: new Date().toISOString(),
        });
      }
      
      await AsyncStorage.setItem(CUSTOM_ROUTINES_KEY, JSON.stringify(customRoutines));
    } catch (error) {
      console.error('Error saving custom routine:', error);
      throw error;
    }
  }

  /**
   * Delete a custom routine
   */
  async deleteCustomRoutine(id: string): Promise<void> {
    try {
      const customRoutines = await this.getCustomRoutines();
      const filtered = customRoutines.filter(r => r.id !== id);
      await AsyncStorage.setItem(CUSTOM_ROUTINES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting custom routine:', error);
      throw error;
    }
  }

  /**
   * ⚖️ Maintain Weight – "Functional Performance Plan"
   */
  private getMaintainRoutine(): WorkoutRoutine {
    return {
      id: 'maintain-functional',
      name: 'Functional Performance Plan',
      goalType: 'maintain',
      description: 'Stay fit, mobile, and balanced with full-body training',
      equipment: ['Dumbbells (light/medium)', 'Resistance band', 'Mat'],
      focusAreas: ['Strength', 'Mobility', 'Stability', 'Conditioning'],
      daysPerWeek: 3,
      days: [
        {
          dayNumber: 1,
          title: 'Full Body Strength',
          focus: 'Balanced full-body training',
          warmup: '5 min brisk walk or skipping',
          exercises: [
            { name: 'Dumbbell Squat to Press', sets: 3, reps: 12 },
            { name: 'Resistance Band Rows', sets: 3, reps: 12 },
            { name: 'Glute Bridge Hold', sets: 3, duration: 30 },
            { name: 'Plank with Shoulder Tap', sets: 3, duration: 30 },
          ],
          cooldown: 'Lower back + shoulders stretch',
        },
        {
          dayNumber: 2,
          title: 'Mobility & Core',
          focus: 'Stability and core strength',
          warmup: 'Dynamic stretching',
          exercises: [
            { name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 12 },
            { name: 'Lateral Band Walks', sets: 3, reps: 15 },
            { name: 'Side Plank with Hip Drop', sets: 3, duration: 15 },
            { name: 'Seated Leg Raises', sets: 3, reps: 15 },
          ],
          cooldown: 'Foam roll or yoga flow',
        },
        {
          dayNumber: 3,
          title: 'Conditioning',
          focus: 'Cardiovascular endurance',
          warmup: '3 min skipping',
          isCircuit: true,
          circuitRounds: 3,
          exercises: [
            { name: 'Jump Squats', sets: 1, reps: 12 },
            { name: 'Push-ups', sets: 1, reps: 10 },
            { name: 'Dumbbell Rows', sets: 1, reps: 10, notes: 'each side' },
            { name: 'Mountain Climbers', sets: 1, reps: 20 },
          ],
          cooldown: 'Full body stretch',
        },
      ],
    };
  }

  /**
   * 💪 Gain Muscle – "Lean Mass Builder Plan"
   */
  private getGainRoutine(): WorkoutRoutine {
    return {
      id: 'gain-mass-builder',
      name: 'Lean Mass Builder Plan',
      goalType: 'gain',
      description: 'Build muscle with progressive overload and time-under-tension',
      equipment: ['Adjustable dumbbells', 'Resistance bands', 'Mat'],
      focusAreas: ['Muscle growth', 'Progressive overload', 'Hypertrophy'],
      daysPerWeek: 3,
      days: [
        {
          dayNumber: 1,
          title: 'Push Day',
          focus: 'Chest, Shoulders, Triceps',
          warmup: 'Arm circles and light cardio',
          exercises: [
            { name: 'Dumbbell Bench Press', sets: 4, reps: 10, notes: 'Floor press if no bench' },
            { name: 'Dumbbell Shoulder Press', sets: 3, reps: 10 },
            { name: 'Resistance Band Lateral Raises', sets: 3, reps: 12 },
            { name: 'Overhead Tricep Extension', sets: 3, reps: 10 },
            { name: 'Weighted Sit-ups', sets: 3, reps: 15 },
          ],
        },
        {
          dayNumber: 2,
          title: 'Pull Day',
          focus: 'Back, Biceps',
          warmup: 'Arm swings and light cardio',
          exercises: [
            { name: 'Resistance Band Pull-aparts', sets: 3, reps: 15 },
            { name: 'Dumbbell Rows', sets: 4, reps: 10, notes: 'each side' },
            { name: 'Dumbbell Bicep Curl', sets: 3, reps: 12 },
            { name: 'Dumbbell Reverse Fly', sets: 3, reps: 12 },
            { name: 'Superman Holds', sets: 3, duration: 20 },
          ],
        },
        {
          dayNumber: 3,
          title: 'Lower Body & Core',
          focus: 'Legs, Glutes, Core',
          warmup: 'Leg swings and hip circles',
          exercises: [
            { name: 'Dumbbell Squats', sets: 4, reps: 12 },
            { name: 'Dumbbell Deadlifts', sets: 3, reps: 10 },
            { name: 'Lunges', sets: 3, reps: 10, notes: 'each leg' },
            { name: 'Calf Raises', sets: 3, reps: 20 },
            { name: 'Plank with Leg Lift', sets: 3, duration: 30 },
          ],
        },
      ],
    };
  }

  /**
   * 🔥 Lose Fat – "Metabolic Shred Plan"
   */
  private getLoseRoutine(): WorkoutRoutine {
    return {
      id: 'lose-metabolic-shred',
      name: 'Metabolic Shred Plan',
      goalType: 'lose',
      description: 'Fat loss while maintaining muscle with HIIT-inspired circuits',
      equipment: ['Dumbbells', 'Resistance band', 'Timer', 'Mat'],
      focusAreas: ['Fat loss', 'Conditioning', 'Muscle retention'],
      daysPerWeek: 3,
      days: [
        {
          dayNumber: 1,
          title: 'Total Body Burn',
          focus: 'Full body circuit',
          warmup: 'Jump rope 3 min',
          isCircuit: true,
          circuitRounds: 3,
          exercises: [
            { name: 'Dumbbell Squats', sets: 1, reps: 12 },
            { name: 'Push-ups', sets: 1, reps: 10 },
            { name: 'Jumping Jacks', sets: 1, reps: 20 },
            { name: 'Dumbbell Rows', sets: 1, reps: 10, notes: 'each side' },
          ],
          cooldown: 'Plank – 3×30 sec',
        },
        {
          dayNumber: 2,
          title: 'Strength & Tone',
          focus: 'Resistance training',
          warmup: 'Dynamic stretching',
          exercises: [
            { name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 12 },
            { name: 'Dumbbell Shoulder Press', sets: 3, reps: 10 },
            { name: 'Band Squat Walks', sets: 3, reps: 15 },
            { name: 'Push-up to Row', sets: 3, reps: 10, notes: 'Renegade row' },
            { name: 'Flutter Kicks', sets: 3, duration: 20 },
          ],
        },
        {
          dayNumber: 3,
          title: 'Core + Conditioning',
          focus: 'High-intensity intervals',
          warmup: 'Light cardio',
          isCircuit: true,
          circuitRounds: 4,
          exercises: [
            { name: 'Dumbbell Swing', sets: 1, reps: 15 },
            { name: 'Jump Rope', sets: 1, duration: 30, notes: 'or high knees' },
            { name: 'Dumbbell Curl to Press', sets: 1, reps: 10 },
            { name: 'Mountain Climbers', sets: 1, duration: 30 },
          ],
          cooldown: '5 min stretch',
        },
      ],
    };
  }
}

export const workoutRoutineService = new WorkoutRoutineService();

