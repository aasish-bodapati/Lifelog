// User types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  goal: 'maintain' | 'lose' | 'gain';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  target_weight?: number;
  target_calories?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  goal?: 'maintain' | 'lose' | 'gain';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  target_weight?: number;
  target_calories?: number;
}

// Workout types
export interface Exercise {
  id?: number;
  workout_id?: number;
  name: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  distance?: number;
  notes?: string;
  order: number;
}

export interface Workout {
  id: number;
  user_id: number;
  date: string;
  name: string;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
  exercises: Exercise[];
}

export interface WorkoutCreate {
  date: string;
  name: string;
  duration_minutes?: number;
  notes?: string;
  exercises: Omit<Exercise, 'id' | 'workout_id'>[];
}

// Nutrition types
export interface NutritionLog {
  id: number;
  user_id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  notes?: string;
  created_at: string;
}

export interface NutritionLogCreate {
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  notes?: string;
}

// Body stats types
export interface BodyStat {
  id: number;
  user_id: number;
  date: string;
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  bone_density?: number;
  height?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  resting_heart_rate?: number;
  notes?: string;
  created_at: string;
}

export interface BodyStatCreate {
  date: string;
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  bone_density?: number;
  height?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  resting_heart_rate?: number;
  notes?: string;
}

// Summary types
export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  workout_count: number;
  total_workout_duration: number;
  weight?: number;
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  avg_daily_calories: number;
  avg_daily_protein: number;
  total_workouts: number;
  total_workout_duration: number;
  weight_change?: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Fitness: undefined;
  Nutrition: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  WorkoutLog: { workoutId?: number };
  NutritionLog: { logId?: number };
  BodyStatsLog: { statId?: number };
  Settings: undefined;
};
