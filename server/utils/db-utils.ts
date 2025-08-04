import { db } from '../db';

// Database connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Retry database operations with exponential backoff
export async function retryDbOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain types of errors
      if (error.message?.includes('syntax') || error.message?.includes('validation')) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`Database operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Batch database operations to reduce connections
export async function batchDbOperations<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      const batchResults = await retryDbOperation(() => operation(batch));
      results.push(...batchResults);
    } catch (error) {
      console.error(`Batch operation failed for items ${i}-${i + batch.length - 1}:`, error);
      throw error;
    }
  }
  
  return results;
}

// Create a database connection pool status monitor
let connectionAttempts = 0;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

export async function getDbConnectionStatus(): Promise<{
  isHealthy: boolean;
  attempts: number;
  lastCheck: number;
}> {
  const now = Date.now();
  
  if (now - lastConnectionCheck > CONNECTION_CHECK_INTERVAL) {
    connectionAttempts++;
    const isHealthy = await checkDatabaseHealth();
    lastConnectionCheck = now;
    
    return {
      isHealthy,
      attempts: connectionAttempts,
      lastCheck: lastConnectionCheck,
    };
  }
  
  return {
    isHealthy: true, // Assume healthy if recently checked
    attempts: connectionAttempts,
    lastCheck: lastConnectionCheck,
  };
}