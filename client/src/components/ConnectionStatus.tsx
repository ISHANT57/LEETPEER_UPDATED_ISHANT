import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ConnectionStatusProps {
  onRetry?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onRetry }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | 'timeout'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkServerHealth = async () => {
    try {
      setServerStatus('checking');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/health', {
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setServerStatus('timeout');
      } else {
        setServerStatus('offline');
      }
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    // Check server health on mount
    checkServerHealth();

    // Set up periodic health checks
    const healthCheckInterval = setInterval(checkServerHealth, 30000); // Every 30 seconds

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      checkServerHealth();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setServerStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(healthCheckInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        text: 'No internet connection',
        variant: 'destructive' as const,
        color: 'text-red-600'
      };
    }

    switch (serverStatus) {
      case 'online':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Connected',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'timeout':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Server timeout - high load',
          variant: 'destructive' as const,
          color: 'text-orange-600'
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Server unavailable',
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      case 'checking':
      default:
        return {
          icon: <Wifi className="h-4 w-4 animate-pulse" />,
          text: 'Checking connection...',
          variant: 'default' as const,
          color: 'text-blue-600'
        };
    }
  };

  const status = getStatusInfo();

  // Only show alert for problematic states
  if (serverStatus === 'offline' || serverStatus === 'timeout' || !isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50 w-80">
        <Alert variant={status.variant}>
          {status.icon}
          <AlertDescription className="flex items-center justify-between">
            <span>{status.text}</span>
            {(serverStatus === 'timeout' || serverStatus === 'offline') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  checkServerHealth();
                  onRetry?.();
                }}
                className="ml-2"
              >
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show a subtle connection indicator in the corner
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${status.color} bg-white dark:bg-gray-800 shadow-sm border`}>
        {status.icon}
        <span className="hidden sm:inline">{status.text}</span>
      </div>
    </div>
  );
};