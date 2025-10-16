/**
 * Centralized icon mapping utilities
 * Consolidates icon selection logic across all components
 */

export type IconName = string;

/**
 * Get icon for meal type
 */
export function getMealTypeIcon(mealType: string): IconName {
  switch (mealType.toLowerCase()) {
    case 'breakfast':
      return 'sunny';
    case 'lunch':
      return 'partly-sunny';
    case 'dinner':
      return 'moon';
    case 'snack':
      return 'cafe';
    default:
      return 'restaurant';
  }
}

/**
 * Get icon for workout type
 */
export function getWorkoutIcon(workoutName: string): IconName {
  const nameLower = workoutName.toLowerCase();
  
  // Strength training
  if (nameLower.includes('weight') || nameLower.includes('strength') || 
      nameLower.includes('lift') || nameLower.includes('bench')) {
    return 'barbell';
  }
  
  // Cardio
  if (nameLower.includes('run') || nameLower.includes('jog')) {
    return 'walk';
  }
  if (nameLower.includes('bike') || nameLower.includes('cycl')) {
    return 'bicycle';
  }
  if (nameLower.includes('swim')) {
    return 'water';
  }
  
  // Flexibility
  if (nameLower.includes('yoga') || nameLower.includes('stretch')) {
    return 'body';
  }
  
  // Sports
  if (nameLower.includes('basketball')) {
    return 'basketball';
  }
  if (nameLower.includes('football') || nameLower.includes('soccer')) {
    return 'football';
  }
  if (nameLower.includes('tennis')) {
    return 'tennisball';
  }
  
  // Default
  return 'fitness';
}

/**
 * Get icon for exercise type
 */
export function getExerciseTypeIcon(exerciseType: string): IconName {
  switch (exerciseType.toLowerCase()) {
    case 'strength':
      return 'barbell';
    case 'cardio':
      return 'heart';
    case 'flexibility':
      return 'body';
    case 'endurance':
      return 'infinite';
    case 'power':
      return 'flash';
    case 'balance':
      return 'scale';
    default:
      return 'fitness';
  }
}

/**
 * Get icon for body stat type
 */
export function getBodyStatIcon(statType: string): IconName {
  switch (statType.toLowerCase()) {
    case 'weight':
      return 'scale';
    case 'body_fat':
    case 'bodyfat':
      return 'analytics';
    case 'muscle_mass':
      return 'fitness';
    case 'bmi':
      return 'stats-chart';
    case 'waist':
    case 'chest':
    case 'arms':
    case 'legs':
      return 'resize';
    default:
      return 'body';
  }
}

/**
 * Get icon for progress status
 */
export function getProgressIcon(progress: number): IconName {
  if (progress >= 100) return 'trophy';
  if (progress >= 75) return 'flame';
  if (progress >= 50) return 'trending-up';
  if (progress >= 25) return 'arrow-up';
  return 'arrow-forward';
}

/**
 * Get icon for consistency streak
 */
export function getStreakIcon(streak: number): IconName {
  if (streak === 0) return 'flame-outline';
  if (streak < 7) return 'flame';
  if (streak < 30) return 'flame';
  return 'trophy';
}

/**
 * Get icon for trend direction
 */
export function getTrendIcon(trend: 'up' | 'down' | 'stable'): IconName {
  switch (trend) {
    case 'up':
      return 'trending-up';
    case 'down':
      return 'trending-down';
    default:
      return 'remove';
  }
}

/**
 * Get icon for goal type
 */
export function getGoalIcon(goalType: string): IconName {
  switch (goalType.toLowerCase()) {
    case 'maintain':
      return 'remove';
    case 'gain':
    case 'bulk':
      return 'trending-up';
    case 'lose':
    case 'cut':
      return 'trending-down';
    case 'recomp':
    case 'recomposition':
      return 'repeat';
    default:
      return 'flag';
  }
}

/**
 * Get icon for activity level
 */
export function getActivityIcon(activityLevel: string): IconName {
  switch (activityLevel.toLowerCase()) {
    case 'sedentary':
      return 'bed';
    case 'light':
      return 'walk';
    case 'moderate':
      return 'bicycle';
    case 'active':
      return 'fitness';
    case 'extra':
    case 'very_active':
      return 'flame';
    default:
      return 'body';
  }
}

/**
 * Get icon for notification type
 */
export function getNotificationIcon(type: 'success' | 'error' | 'warning' | 'info'): IconName {
  switch (type) {
    case 'success':
      return 'checkmark-circle';
    case 'error':
      return 'close-circle';
    case 'warning':
      return 'warning';
    case 'info':
      return 'information-circle';
    default:
      return 'notifications';
  }
}

/**
 * Get icon for sync status
 */
export function getSyncIcon(status: 'syncing' | 'synced' | 'error' | 'offline'): IconName {
  switch (status) {
    case 'syncing':
      return 'sync';
    case 'synced':
      return 'cloud-done';
    case 'error':
      return 'cloud-offline';
    case 'offline':
      return 'cloud-offline';
    default:
      return 'cloud';
  }
}

