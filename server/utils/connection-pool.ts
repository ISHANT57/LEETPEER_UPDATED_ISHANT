import { retryDbOperation } from './db-utils';

// Simple connection pool simulation for better request handling
class ConnectionPool {
  private activeConnections = 0;
  private maxConnections = 5; // Reduced for better performance
  private waitingQueue: Array<{ resolve: Function; reject: Function }> = [];

  async acquire(): Promise<boolean> {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return true;
    }

    // If no connections available, queue the request with shorter timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection pool timeout'));
      }, 2000); // Reduced to 2 seconds

      this.waitingQueue.push({
        resolve: () => {
          clearTimeout(timeout);
          this.activeConnections++;
          resolve(true);
        },
        reject: () => {
          clearTimeout(timeout);
          reject(new Error('Connection pool timeout'));
        }
      });
    });
  }

  release(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    
    // Process waiting queue
    if (this.waitingQueue.length > 0 && this.activeConnections < this.maxConnections) {
      const waiting = this.waitingQueue.shift();
      if (waiting) {
        waiting.resolve();
      }
    }
  }

  getStatus() {
    return {
      active: this.activeConnections,
      max: this.maxConnections,
      waiting: this.waitingQueue.length
    };
  }
}

export const connectionPool = new ConnectionPool();

// Wrapper for database operations with connection pooling
export async function withConnection<T>(operation: () => Promise<T>): Promise<T> {
  let acquired = false;
  
  try {
    await connectionPool.acquire();
    acquired = true;
    
    // Execute the operation with aggressive timeout
    const operationPromise = retryDbOperation(operation, 1, 200); // Single retry, fast
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 3000) // 3 second max
    );
    
    return await Promise.race([operationPromise, timeoutPromise]);
  } finally {
    if (acquired) {
      connectionPool.release();
    }
  }
}