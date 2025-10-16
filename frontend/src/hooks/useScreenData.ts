import { useState, useEffect, useCallback } from 'react';
import { toastService } from '../services/toastService';

interface UseScreenDataOptions<T> {
  fetchData: () => Promise<T>;
  dependencies?: any[];
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  errorMessage?: string;
  autoLoad?: boolean;
}

interface UseScreenDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  loadData: () => Promise<void>;
  refresh: () => Promise<void>;
  setData: (data: T | null) => void;
}

/**
 * Custom hook to manage screen data loading, refreshing, and error handling
 * Consolidates common patterns across all main screens
 * 
 * @example
 * const { data, isLoading, refresh } = useScreenData({
 *   fetchData: async () => await apiService.getData(userId),
 *   dependencies: [userId],
 *   errorMessage: 'Failed to load data'
 * });
 */
export function useScreenData<T>({
  fetchData,
  dependencies = [],
  onSuccess,
  onError,
  errorMessage = 'Failed to load data',
  autoLoad = true,
}: UseScreenDataOptions<T>): UseScreenDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await fetchData();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err);
      
      if (onError) {
        onError(err);
      } else {
        toastService.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, onSuccess, onError, errorMessage]);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const result = await fetchData();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setError(err);
      
      if (onError) {
        onError(err);
      } else {
        toastService.error(errorMessage);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData, onSuccess, onError, errorMessage]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    loadData,
    refresh,
    setData,
  };
}

