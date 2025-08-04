import type { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });

    if (!store[ip]) {
      store[ip] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    if (store[ip].resetTime < now) {
      store[ip] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    if (store[ip].count >= options.maxRequests) {
      return res.status(429).json({
        error: options.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((store[ip].resetTime - now) / 1000),
      });
    }

    store[ip].count++;
    next();
  };
};

// Specific rate limiters for different endpoints
export const apiRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many API requests from this IP, please try again later.',
});

export const syncRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // limit sync operations to 5 per minute
  message: 'Too many sync requests, please wait before trying again.',
});