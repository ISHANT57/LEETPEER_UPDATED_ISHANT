import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

interface DataLoaderOptions {
  endpoint: string;
  fallbackEndpoint?: string;
  cacheTime?: number;
  retryAttempts?: number;
}

export function useDataLoader<T>({ 
  endpoint, 
  fallbackEndpoint, 
  cacheTime = 30000,
  retryAttempts = 1
}: DataLoaderOptions) {
  const [useFallback, setUseFallback] = useState(false);
  
  const currentEndpoint = useFallback && fallbackEndpoint ? fallbackEndpoint : endpoint;
  
  const query = useQuery({
    queryKey: [currentEndpoint],
    queryFn: async (): Promise<T> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(currentEndpoint, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 503 || response.status === 504) {
            throw new Error('SERVER_BUSY');
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
      } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'SERVER_BUSY') {
          if (!useFallback && fallbackEndpoint) {
            setUseFallback(true);
            throw new Error('FALLBACK_NEEDED');
          }
        }
        throw error;
      }
    },
    staleTime: cacheTime,
    gcTime: cacheTime * 2,
    retry: (failureCount, error: any) => {
      if (error?.message === 'FALLBACK_NEEDED') {
        return true; // Allow one retry with fallback
      }
      return failureCount < retryAttempts;
    },
    retryDelay: 100, // Fast retry
  });

  const forceRefresh = useCallback(() => {
    setUseFallback(false);
    query.refetch();
  }, [query]);

  const switchToFallback = useCallback(() => {
    if (fallbackEndpoint) {
      setUseFallback(true);
      query.refetch();
    }
  }, [fallbackEndpoint, query]);

  return {
    ...query,
    isFallback: useFallback,
    forceRefresh,
    switchToFallback,
    hasError: query.isError,
    isEmpty: !query.data && !query.isLoading,
  };
}