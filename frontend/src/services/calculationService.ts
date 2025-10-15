import { OnboardingProfile, OnboardingGoal, OnboardingActivity, CalculatedTargets } from '../types/onboarding';

export const calculationService = {
  /**
   * Calculate BMR using Mifflin-St Jeor Equation
   */
  calculateBMR(profile: OnboardingProfile): number {
    const { weight, height, age, gender } = profile;
    
    if (gender === 'M') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  },

  /**
   * Get activity multiplier
   */
  getActivityMultiplier(activityLevel: string): number {
    const multipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'extra': 1.9
    };
    return multipliers[activityLevel as keyof typeof multipliers] || 1.55;
  },

  /**
   * Get macro ratio based on goal
   */
  getMacroRatio(goal: string): { P: number; C: number; F: number } {
    const ratios = {
      'maintain': { P: 0.30, C: 0.45, F: 0.25 },
      'gain': { P: 0.32, C: 0.48, F: 0.20 },
      'lose': { P: 0.37, C: 0.40, F: 0.23 }
    };
    return ratios[goal as keyof typeof ratios] || ratios['maintain'];
  },

  /**
   * Get remaining macro ratio for carbs and fat after protein is calculated
   */
  getRemainingMacroRatio(goal: string): { C: number; F: number } {
    const ratios = {
      'maintain': { C: 0.60, F: 0.40 }, // 60% carbs, 40% fat
      'gain': { C: 0.70, F: 0.30 },     // 70% carbs, 30% fat
      'lose': { C: 0.50, F: 0.50 }      // 50% carbs, 50% fat
    };
    return ratios[goal as keyof typeof ratios] || ratios['maintain'];
  },

  /**
   * Calculate dynamic hydration based on gender and activity level
   */
  calculateHydration(profile: OnboardingProfile, activity: OnboardingActivity): number {
    // Base hydration per kg body weight (gender-specific)
    const basePerKg = profile.gender === 'M' ? 35 : 31; // ml per kg
    
    // Activity bonus (ml)
    const activityBonus = this.getActivityHydrationBonus(activity.level);
    
    // Calculate total hydration
    const totalML = (profile.weight * basePerKg) + activityBonus;
    
    // Convert to liters and round to 1 decimal
    return Math.round((totalML / 1000) * 10) / 10;
  },

  /**
   * Get hydration bonus based on activity level
   */
  getActivityHydrationBonus(activityLevel: string): number {
    const bonuses = {
      'sedentary': 0,
      'light': 200,
      'moderate': 400,
      'active': 600,
      'extra': 800
    };
    return bonuses[activityLevel as keyof typeof bonuses] || 0;
  },

  /**
   * Calculate TDEE (Total Daily Energy Expenditure)
   */
  calculateTDEE(profile: OnboardingProfile, activity: OnboardingActivity): number {
    const BMR = this.calculateBMR(profile);
    return BMR * activity.multiplier;
  },

  /**
   * Calculate daily targets based on profile, goal, and activity
   */
  calculateDailyTargets(
    profile: OnboardingProfile,
    goal: OnboardingGoal,
    activity: OnboardingActivity
  ): CalculatedTargets {
    // 1. Calculate BMR (gender-specific)
    const BMR = this.calculateBMR(profile);
    
    // 2. Calculate TDEE
    const TDEE = BMR * activity.multiplier;
    
    // 3. Adjust for goal
    let targetCalories = TDEE;
    if (goal.type === 'gain') {
      targetCalories += 400;
    } else if (goal.type === 'lose') {
      targetCalories -= 400;
    }
    
    // 4. Calculate protein with body weight cap
    const macroRatio = this.getMacroRatio(goal.type);
    const proteinFromCalories = (targetCalories * macroRatio.P) / 4;
    
    // Cap protein based on body weight (2.0g/kg for muscle gain, 1.6g/kg for others)
    const maxProteinPerKg = goal.type === 'gain' ? 2.0 : 1.6;
    const maxProtein = profile.weight * maxProteinPerKg;
    const protein = Math.round(Math.min(proteinFromCalories, maxProtein));
    
    // 5. Calculate remaining calories for carbs and fat
    const proteinCalories = protein * 4;
    const remainingCalories = targetCalories - proteinCalories;
    
    // 6. Split remaining calories between carbs and fat
    const remainingRatio = this.getRemainingMacroRatio(goal.type);
    const carbs = Math.round((remainingCalories * remainingRatio.C) / 4);
    const fat = Math.round((remainingCalories * remainingRatio.F) / 9);
    
    // 7. Calculate dynamic hydration based on gender and activity
    const hydration = this.calculateHydration(profile, activity);
    
    return {
      calories: Math.round(targetCalories),
      protein,
      carbs,
      fat,
      hydration
    };
  },

  /**
   * Get goal options
   */
  getGoalOptions(): OnboardingGoal[] {
    return [
      {
        type: 'maintain',
        description: 'Keep my current weight and build healthy habits'
      },
      {
        type: 'gain',
        description: 'Build muscle and gain weight in a healthy way'
      },
      {
        type: 'lose',
        description: 'Lose weight and improve my body composition'
      }
    ];
  },

  /**
   * Get activity level options
   */
  getActivityOptions(): OnboardingActivity[] {
    return [
      {
        level: 'sedentary',
        description: 'Office job, little to no exercise',
        multiplier: 1.2
      },
      {
        level: 'light',
        description: 'Light exercise 1-3 days/week',
        multiplier: 1.375
      },
      {
        level: 'moderate',
        description: 'Moderate exercise 3-5 days/week',
        multiplier: 1.55
      },
      {
        level: 'active',
        description: 'Heavy exercise 6-7 days/week',
        multiplier: 1.725
      },
      {
        level: 'extra',
        description: 'Very heavy exercise, physical job',
        multiplier: 1.9
      }
    ];
  },

  /**
   * Validate profile data
   */
  validateProfile(profile: Partial<OnboardingProfile>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if required fields are filled
    if (!profile.age) {
      errors.push('Age is required');
    } else if (profile.age < 13 || profile.age > 120) {
      errors.push('Age must be between 13 and 120 years');
    }
    
    if (!profile.gender) {
      errors.push('Please select your gender');
    }
    
    if (!profile.height) {
      errors.push('Height is required');
    } else if (profile.height < 100 || profile.height > 250) {
      errors.push('Height must be between 100 and 250 cm');
    }
    
    if (!profile.weight) {
      errors.push('Weight is required');
    } else if (profile.weight < 30 || profile.weight > 300) {
      errors.push('Weight must be between 30 and 300 kg');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Format macro targets for display
   */
  formatMacroTargets(targets: CalculatedTargets): string {
    return `${targets.calories} kcal • ${targets.protein}g protein • ${targets.carbs}g carbs • ${targets.fat}g fat`;
  },

  /**
   * Get BMI category
   */
  getBMICategory(profile: OnboardingProfile): { bmi: number; category: string; color: string } {
    const bmi = profile.weight / Math.pow(profile.height / 100, 2);
    
    if (bmi < 18.5) {
      return { bmi: Math.round(bmi * 10) / 10, category: 'Underweight', color: '#FF6B6B' };
    } else if (bmi < 25) {
      return { bmi: Math.round(bmi * 10) / 10, category: 'Normal weight', color: '#4ECDC4' };
    } else if (bmi < 30) {
      return { bmi: Math.round(bmi * 10) / 10, category: 'Overweight', color: '#FFE66D' };
    } else {
      return { bmi: Math.round(bmi * 10) / 10, category: 'Obese', color: '#FF6B6B' };
    }
  }
};

