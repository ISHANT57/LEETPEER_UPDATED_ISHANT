import type { Request, Response, NextFunction } from 'express';
import { renderConfig } from '../config/render-config';

// In-memory cache for Render deployment
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class RenderCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Limit cache size for memory management

  set(key: string, data: any, ttlSeconds: number = 300): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new RenderCache();

// Cleanup expired entries every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

// Cache middleware for API responses
export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.originalUrl}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(data: any) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttlSeconds);
      }
      
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Static file caching
export const staticCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    // Cache static assets for 1 year
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', `public, max-age=${renderConfig.cache.staticMaxAge}`);
      res.setHeader('Expires', new Date(Date.now() + renderConfig.cache.staticMaxAge * 1000).toUTCString());
    }
  }
  next();
};

// Cache stats endpoint for monitoring
export const getCacheStats = () => cache.getStats();
export const clearCache = () => cache.clear();