import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { queryClient } from '@/lib/queryClient';

interface LoadingBoundaryProps {
  children: React.ReactNode;
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStart, setLoadingStart] = useState<number | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Listen for query loading states
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.state?.status === 'pending') {
        setIsLoading(true);
        setLoadingStart(Date.now());
        setError(null);
        
        // Set timeout for loading state
        timeoutId = setTimeout(() => {
          setError('Request is taking longer than expected. The server might be busy.');
        }, 5000); // 5 seconds timeout warning
      } else {
        setIsLoading(false);
        setLoadingStart(null);
        clearTimeout(timeoutId);
        
        if (event?.query?.state?.status === 'error') {
          const errorMessage = event.query.state.error?.message || 'Unknown error';
          if (errorMessage.includes('timeout') || errorMessage.includes('503')) {
            setError('Server is busy. Please wait a moment and try again.');
          } else {
            setError('Failed to load data. Please try again.');
          }
        } else {
          setError(null);
        }
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    setIsLoading(false);
    queryClient.invalidateQueries();
    // Force reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleClearCache = () => {
    queryClient.clear();
    setError(null);
    setIsLoading(false);
    window.location.reload();
  };

  // Show error overlay for critical errors
  if (error && error.includes('Server is busy')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-4">
              <div>{error}</div>
              <div className="flex gap-2">
                <Button onClick={handleRetry} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={handleClearCache} size="sm" variant="outline">
                  Clear Cache
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show loading indicator for long requests
  if (isLoading && loadingStart && (Date.now() - loadingStart) > 3000) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-sm text-gray-600">
            Loading data... This may take a moment.
          </div>
          {loadingStart && (Date.now() - loadingStart) > 5000 && (
            <Button onClick={handleRetry} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};