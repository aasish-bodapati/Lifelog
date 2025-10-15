// Onboarding types
export interface OnboardingProfile {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  height: number; // in cm
  weight: number; // in kg
}

export interface OnboardingGoal {
  type: 'maintain' | 'gain' | 'lose';
  description: string;
}

export interface OnboardingActivity {
  level: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';
  description: string;
  multiplier: number;
}

export interface OnboardingPreferences {
  mealReminders: boolean;
  hydrationReminders: boolean;
  weeklyProgressReminders: boolean;
}

export interface CalculatedTargets {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  hydration: number; // in liters
}

export interface OnboardingData {
  profile: OnboardingProfile;
  goal: OnboardingGoal;
  activity: OnboardingActivity;
  preferences: OnboardingPreferences;
  targets: CalculatedTargets;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  isOptional: boolean;
}

export interface OnboardingContextType {
  currentStep: number;
  totalSteps: number;
  data: Partial<OnboardingData>;
  steps: OnboardingStep[];
  isComplete: boolean;
  isLoading: boolean;
  
  // Actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  updateData: (data: Partial<OnboardingData>) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
  checkOnboardingStatus: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
}

export type OnboardingStackParamList = {
  Welcome: undefined;
  Profile: undefined;
  Goal: undefined;
  Activity: undefined;
  Preferences: undefined;
  Summary: undefined;
};
