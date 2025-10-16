/**
 * Centralized hooks export
 * Import all hooks from this single entry point
 */

export { useScreenData } from './useScreenData';
export type { UseScreenDataOptions, UseScreenDataReturn } from './useScreenData';

export { 
  useWeeklyStats,
  useWeeklyWorkoutStats,
  useWeeklyNutritionStats,
  useWeeklyBodyStats,
} from './useWeeklyStats';
export type { WeeklyStatsOptions, WeeklyStatsResult } from './useWeeklyStats';

export { 
  useErrorHandler,
  useAuthErrorHandler,
  useDataErrorHandler,
  useSilentErrorHandler,
} from './useErrorHandler';
export type { ErrorHandlerOptions, ErrorHandlerReturn } from './useErrorHandler';

