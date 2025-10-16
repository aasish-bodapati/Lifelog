import { useMemo } from 'react';

interface WeeklyStatsOptions<T> {
  data: T[];
  getDateField: (item: T) => string;
  getValueField?: (item: T) => number;
  daysBack?: number;
}

interface WeeklyStatsResult {
  totalItems: number;
  totalValue: number;
  avgValue: number;
  filteredData: any[];
}

/**
 * Custom hook to calculate weekly statistics from any data array
 * Consolidates weekly stats calculation across FitnessScreen, NutritionScreen, and ProgressScreen
 * 
 * @example
 * // For workouts (with duration)
 * const stats = useWeeklyStats({
 *   data: workouts,
 *   getDateField: (w) => w.date,
 *   getValueField: (w) => w.duration_minutes,
 * });
 * 
 * @example
 * // For meals (with calories)
 * const stats = useWeeklyStats({
 *   data: meals,
 *   getDateField: (m) => m.date,
 *   getValueField: (m) => m.calories,
 * });
 * 
 * @example
 * // For simple counts (no value field)
 * const stats = useWeeklyStats({
 *   data: logs,
 *   getDateField: (l) => l.date,
 * });
 */
export function useWeeklyStats<T>({
  data,
  getDateField,
  getValueField,
  daysBack = 7,
}: WeeklyStatsOptions<T>): WeeklyStatsResult {
  return useMemo(() => {
    // Calculate date threshold
    const now = new Date();
    const threshold = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const thresholdStr = threshold.toISOString().split('T')[0];

    // Filter data for the time period
    const filteredData = data.filter((item) => {
      const itemDate = getDateField(item);
      return itemDate >= thresholdStr;
    });

    // Calculate total value if value field is provided
    const totalValue = getValueField
      ? filteredData.reduce((sum, item) => sum + (getValueField(item) || 0), 0)
      : 0;

    // Calculate average
    const avgValue =
      filteredData.length > 0 && getValueField
        ? Math.round(totalValue / filteredData.length)
        : 0;

    return {
      totalItems: filteredData.length,
      totalValue,
      avgValue,
      filteredData,
    };
  }, [data, getDateField, getValueField, daysBack]);
}

/**
 * Specialized hook for workout weekly stats
 */
export function useWeeklyWorkoutStats(workouts: any[]) {
  return useWeeklyStats({
    data: workouts,
    getDateField: (w) => w.date,
    getValueField: (w) => w.duration_minutes,
  });
}

/**
 * Specialized hook for nutrition weekly stats
 */
export function useWeeklyNutritionStats(meals: any[]) {
  return useWeeklyStats({
    data: meals,
    getDateField: (m) => m.date,
    getValueField: (m) => m.calories,
  });
}

/**
 * Specialized hook for body stats weekly tracking
 */
export function useWeeklyBodyStats(stats: any[]) {
  return useWeeklyStats({
    data: stats,
    getDateField: (s) => s.date,
    getValueField: (s) => s.weight_kg,
  });
}

