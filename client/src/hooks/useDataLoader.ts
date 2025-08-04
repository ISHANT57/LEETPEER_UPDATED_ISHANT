import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { dispatchDataLoaded, dispatchDataError } from '@/components/LoadingBoundary';

interface UseDataLoaderOptions {
  queryKey: (string | number)[];
  enabled?: boolean;
  staleTime?: number;
  retry?: boolean | number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useDataLoader<T = any>({
  queryKey,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  retry = 2,
  retryDelay = 1000,
  onSuccess,
  onError,
}: UseDataLoaderOptions): UseQueryResult<T> & {
  hasTimedOut: boolean;
} {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const query = useQuery<T>({
    queryKey,
    enabled,
    staleTime,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.message?.includes('40')) return false;
      if (typeof retry === 'boolean') return retry && failureCount < 2;
      return failureCount < retry;
    },
    retryDelay: (attemptIndex) => {
      return Math.min(retryDelay * Math.pow(2, attemptIndex), 5000);
    },
  });

  // Handle loading timeout
  useEffect(() => {
    if (!query.isLoading) return;

    const timeoutId = setTimeout(() => {
      if (query.isLoading) {
        setHasTimedOut(true);
        dispatchDataError('Request is taking longer than expected. Please check your connection.');
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeoutId);
  }, [query.isLoading]);

  // Dispatch events for loading boundary
  useEffect(() => {
    if (query.isSuccess) {
      dispatchDataLoaded();
      onSuccess?.(query.data);
    }
  }, [query.isSuccess, query.data, onSuccess]);

  useEffect(() => {
    if (query.isError) {
      const errorMessage = query.error?.message || 'Failed to load data';
      dispatchDataError(errorMessage);
      onError?.(query.error);
    }
  }, [query.isError, query.error, onError]);

  return {
    ...query,
    hasTimedOut,
  };
}

// Specialized hook for student data
export function useStudentData() {
  return useDataLoader<any[]>({
    queryKey: ['/api/students/all'],
    staleTime: 2 * 60 * 1000, // 2 minutes for frequently updated data
    retry: 3,
  });
}

// Specialized hook for dashboard data with better error handling
export function useDashboardData(type: 'admin' | 'university' | string) {
  const endpoint = type === 'admin' 
    ? '/api/dashboard/admin'
    : type === 'university'
    ? '/api/dashboard/university'
    : `/api/dashboard/batch/${type}`;

  return useDataLoader({
    queryKey: [endpoint],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error) => {
      console.error(`Dashboard data error (${type}):`, error);
    },
  });
}