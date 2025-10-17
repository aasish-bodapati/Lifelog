import { useCallback } from 'react';
import { toastService } from '../services/toastService';

export interface ErrorHandlerOptions {
  defaultMessage?: string;
  onError?: (error: any, message: string) => void;
  logErrors?: boolean;
}

export interface ErrorHandlerReturn {
  handleError: (error: any, customMessage?: string) => void;
  parseErrorMessage: (error: any) => string;
}

/**
 * Custom hook for consistent error handling across the application
 * Consolidates error parsing and toast notification patterns
 * 
 * @example
 * const { handleError } = useErrorHandler({
 *   defaultMessage: 'Operation failed',
 *   logErrors: true
 * });
 * 
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error, 'Custom error message');
 * }
 */
export function useErrorHandler({
  defaultMessage = 'An error occurred. Please try again.',
  onError,
  logErrors = true,
}: ErrorHandlerOptions = {}): ErrorHandlerReturn {
  const parseErrorMessage = useCallback((error: any): string => {
    // Network errors
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your internet connection.';
    }

    // Timeout errors
    if (error.code === 'ERR_TIMEOUT') {
      return 'Request timed out. Please try again.';
    }

    // HTTP status errors
    if (error.response?.status) {
      const status = error.response.status;
      const backendMessage = error.response?.data?.detail;

      switch (status) {
        case 400:
          return backendMessage || 'Invalid request. Please check your input.';
        case 401:
          return backendMessage || 'Invalid credentials. Please check your login details.';
        case 403:
          return 'Access denied. You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return backendMessage || 'A conflict occurred. Please try again.';
        case 422:
          return backendMessage || 'Validation error. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return backendMessage || defaultMessage;
      }
    }

    // Error with message property
    if (error.message) {
      return error.message;
    }

    // String error
    if (typeof error === 'string') {
      return error;
    }

    // Fallback to default message
    return defaultMessage;
  }, [defaultMessage]);

  const handleError = useCallback(
    (error: any, customMessage?: string) => {
      const errorMessage = customMessage || parseErrorMessage(error);

      // Log error if enabled
      if (logErrors) {
        console.error('Error occurred:', {
          error,
          message: errorMessage,
          stack: error?.stack,
          response: error?.response?.data,
        });
      }

      // Show toast notification
      toastService.error(errorMessage);

      // Call custom error handler if provided
      if (onError) {
        onError(error, errorMessage);
      }
    },
    [parseErrorMessage, onError, logErrors]
  );

  return {
    handleError,
    parseErrorMessage,
  };
}

/**
 * Specialized error handler for authentication errors
 */
export function useAuthErrorHandler() {
  return useErrorHandler({
    defaultMessage: 'Authentication failed. Please try again.',
    onError: (error, message) => {
      // Could trigger logout or redirect to login if needed
      console.warn('Auth error:', message);
    },
  });
}

/**
 * Specialized error handler for data operations
 */
export function useDataErrorHandler(operationType: string = 'Operation') {
  return useErrorHandler({
    defaultMessage: `${operationType} failed. Please try again.`,
    logErrors: true,
  });
}

/**
 * Specialized error handler for silent errors (no toast)
 */
export function useSilentErrorHandler() {
  return {
    handleError: (error: any, customMessage?: string) => {
      console.error('Silent error:', customMessage || error);
    },
    parseErrorMessage: (error: any): string => {
      return error?.message || error?.toString() || 'Unknown error';
    },
  };
}

