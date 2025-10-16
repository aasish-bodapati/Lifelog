/**
 * Centralized color mapping utilities
 * Consolidates color selection logic across all components
 */

export type ColorHex = string;

/**
 * Get color for meal type
 */
export function getMealTypeColor(mealType: string): ColorHex {
  switch (mealType.toLowerCase()) {
    case 'breakfast':
      return '#FF9500';
    case 'lunch':
      return '#34C759';
    case 'dinner':
      return '#5856D6';
    case 'snack':
      return '#FF2D92';
    default:
      return '#8E8E93';
  }
}

/**
 * Get color for workout type
 */
export function getWorkoutColor(workoutName: string): ColorHex {
  const nameLower = workoutName.toLowerCase();
  
  // Strength training
  if (nameLower.includes('weight') || nameLower.includes('strength') || 
      nameLower.includes('lift') || nameLower.includes('bench')) {
    return '#4ECDC4';
  }
  
  // Cardio
  if (nameLower.includes('run') || nameLower.includes('jog') ||
      nameLower.includes('bike') || nameLower.includes('cycl') ||
      nameLower.includes('swim')) {
    return '#FF6B6B';
  }
  
  // Flexibility
  if (nameLower.includes('yoga') || nameLower.includes('stretch')) {
    return '#A29BFE';
  }
  
  // Default
  return '#45B7D1';
}

/**
 * Get color for exercise type
 */
export function getExerciseTypeColor(exerciseType: string): ColorHex {
  switch (exerciseType.toLowerCase()) {
    case 'strength':
      return '#4ECDC4';
    case 'cardio':
      return '#FF6B6B';
    case 'flexibility':
      return '#A29BFE';
    case 'endurance':
      return '#FFE66D';
    case 'power':
      return '#FF9500';
    case 'balance':
      return '#45B7D1';
    default:
      return '#8E8E93';
  }
}

/**
 * Get color for progress level (0-1)
 */
export function getProgressColor(progress: number): ColorHex {
  if (progress < 0.25) return '#FF6B6B'; // Red - Low
  if (progress < 0.5) return '#FF9500';  // Orange - Below average
  if (progress < 0.75) return '#FFE66D'; // Yellow - Good
  if (progress < 1) return '#4ECDC4';    // Cyan - Very good
  return '#45B7D1';                      // Blue - Excellent/Complete
}

/**
 * Get color for consistency score (0-100)
 */
export function getConsistencyColor(score: number): ColorHex {
  if (score >= 80) return '#4CAF50'; // Green - Excellent
  if (score >= 60) return '#FF9800'; // Orange - Good
  if (score >= 40) return '#FFC107'; // Yellow - Fair
  return '#F44336';                   // Red - Needs improvement
}

/**
 * Get color for streak count
 */
export function getStreakColor(streak: number): ColorHex {
  if (streak === 0) return '#CCCCCC';   // Gray - No streak
  if (streak < 3) return '#FF6B6B';     // Red - Starting
  if (streak < 7) return '#FFE66D';     // Yellow - Building
  if (streak < 30) return '#4ECDC4';    // Cyan - Strong
  return '#45B7D1';                     // Blue - Legendary
}

/**
 * Get color for trend direction
 */
export function getTrendColor(trend: 'up' | 'down' | 'stable', isPositive: boolean = true): ColorHex {
  switch (trend) {
    case 'up':
      return isPositive ? '#4CAF50' : '#F44336'; // Green if positive, red if negative
    case 'down':
      return isPositive ? '#F44336' : '#4CAF50'; // Red if positive, green if negative
    default:
      return '#666666'; // Gray for stable
  }
}

/**
 * Get color for macro nutrient type
 */
export function getMacroColor(macroType: 'protein' | 'carbs' | 'fat'): ColorHex {
  switch (macroType) {
    case 'protein':
      return '#4ECDC4'; // Cyan
    case 'carbs':
      return '#FFD93D'; // Yellow
    case 'fat':
      return '#FF6B6B'; // Red
    default:
      return '#8E8E93';
  }
}

/**
 * Get color for goal type
 */
export function getGoalColor(goalType: string): ColorHex {
  switch (goalType.toLowerCase()) {
    case 'maintain':
      return '#45B7D1'; // Blue
    case 'gain':
    case 'bulk':
      return '#4CAF50'; // Green
    case 'lose':
    case 'cut':
      return '#FF6B6B'; // Red
    case 'recomp':
    case 'recomposition':
      return '#A29BFE'; // Purple
    default:
      return '#8E8E93';
  }
}

/**
 * Get color for activity level
 */
export function getActivityColor(activityLevel: string): ColorHex {
  switch (activityLevel.toLowerCase()) {
    case 'sedentary':
      return '#CCCCCC'; // Gray
    case 'light':
      return '#FFE66D'; // Yellow
    case 'moderate':
      return '#FF9500'; // Orange
    case 'active':
      return '#4ECDC4'; // Cyan
    case 'extra':
    case 'very_active':
      return '#FF6B6B'; // Red
    default:
      return '#8E8E93';
  }
}

/**
 * Get color for status type
 */
export function getStatusColor(status: 'success' | 'error' | 'warning' | 'info'): ColorHex {
  switch (status) {
    case 'success':
      return '#4CAF50'; // Green
    case 'error':
      return '#F44336'; // Red
    case 'warning':
      return '#FF9800'; // Orange
    case 'info':
      return '#2196F3'; // Blue
    default:
      return '#8E8E93';
  }
}

/**
 * Get color with opacity (alpha channel)
 */
export function getColorWithOpacity(color: ColorHex, opacity: number): string {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Return RGBA string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get light version of a color (with 20% opacity)
 */
export function getLightColor(color: ColorHex): string {
  return color + '20'; // Adds 20 in hex (approximately 12% opacity)
}

/**
 * Get gradient colors for progress
 */
export function getProgressGradient(progress: number): [ColorHex, ColorHex] {
  if (progress < 0.5) {
    return ['#FF6B6B', '#FF9500']; // Red to Orange
  } else if (progress < 0.75) {
    return ['#FF9500', '#FFE66D']; // Orange to Yellow
  } else if (progress < 1) {
    return ['#FFE66D', '#4ECDC4']; // Yellow to Cyan
  }
  return ['#4ECDC4', '#45B7D1']; // Cyan to Blue
}

