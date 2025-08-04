import type { Request, Response, NextFunction } from 'express';

// Middleware to handle request timeouts
export const timeoutHandler = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set timeout for the request
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: 'Request timeout',
          message: 'The server took too long to respond. Please try again.',
          timeout: timeoutMs
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    // Clear timeout on response close
    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// Different timeout configurations for different endpoints
export const shortTimeout = timeoutHandler(15000); // 15 seconds
export const mediumTimeout = timeoutHandler(30000); // 30 seconds  
export const longTimeout = timeoutHandler(120000); // 2 minutes for sync operations