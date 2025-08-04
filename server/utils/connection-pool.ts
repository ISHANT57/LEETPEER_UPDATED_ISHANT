import { retryDbOperation } from './db-utils';

// Simple connection pool simulation for better request handling
class ConnectionPool {
  private activeConnections = 0;
  private maxConnections = 10;
  private waitingQueue: Array<{ resolve: Function; reject: Function }> = [];

  async acquire(): Promise<boolean> {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return true;
    }

    // If no connections available, queue the request
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection pool timeout'));
      }, 5000); // 5 second timeout for connection

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
    
    // Execute the operation with retry logic
    return await retryDbOperation(operation, 2, 500); // Reduced retries for faster response
  } finally {
    if (acquired) {
      connectionPool.release();
    }
  }
}