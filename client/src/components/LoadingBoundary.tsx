import React, { ReactNode, useState, useEffect } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LoadingState {
  isLoading: boolean;
  error?: string;
  timeoutError?: boolean;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  timeout?: number; // in milliseconds
}

export const LoadingBoundary: React.FC<Props> = ({ 
  children, 
  fallback, 
  timeout = 30000 // 30 seconds default
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: undefined,
    timeoutError: false,
  });

  useEffect(() => {
    // Set loading timeout
    const timeoutId = setTimeout(() => {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        timeoutError: true,
        error: 'Request timed out. The server might be experiencing high load.',
      }));
    }, timeout);

    // Listen for data loading completion
    const handleDataLoaded = () => {
      clearTimeout(timeoutId);
      setLoadingState({ isLoading: false });
    };

    // Listen for data loading errors
    const handleDataError = (event: CustomEvent) => {
      clearTimeout(timeoutId);
      setLoadingState({
        isLoading: false,
        error: event.detail.message || 'Failed to load data',
        timeoutError: false,
      });
    };

    // Add event listeners
    window.addEventListener('dataLoaded', handleDataLoaded);
    window.addEventListener('dataError', handleDataError as EventListener);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('dataLoaded', handleDataLoaded);
      window.removeEventListener('dataError', handleDataError as EventListener);
    };
  }, [timeout]);

  const handleRetry = () => {
    setLoadingState({ isLoading: true });
    window.location.reload();
  };

  if (loadingState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {loadingState.timeoutError ? 'Connection Timeout' : 'Loading Error'}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {loadingState.error}
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingState.isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Helper functions to dispatch loading events
export const dispatchDataLoaded = () => {
  window.dispatchEvent(new CustomEvent('dataLoaded'));
};

export const dispatchDataError = (message: string) => {
  window.dispatchEvent(new CustomEvent('dataError', { detail: { message } }));
};