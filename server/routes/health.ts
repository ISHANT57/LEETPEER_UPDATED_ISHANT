import type { Express } from "express";
import { checkDatabaseHealth, getDbConnectionStatus } from "../utils/db-utils";

export function registerHealthRoutes(app: Express) {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const dbStatus = await getDbConnectionStatus();
      const isHealthy = dbStatus.isHealthy;
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: isHealthy,
          attempts: dbStatus.attempts,
          lastCheck: new Date(dbStatus.lastCheck).toISOString(),
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Detailed system status endpoint
  app.get("/api/status", async (req, res) => {
    try {
      const dbHealthy = await checkDatabaseHealth();
      const dbStatus = await getDbConnectionStatus();
      
      res.json({
        system: {
          status: 'operational',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
        },
        database: {
          status: dbHealthy ? 'connected' : 'disconnected',
          attempts: dbStatus.attempts,
          lastCheck: new Date(dbStatus.lastCheck).toISOString(),
        },
        memory: {
          ...process.memoryUsage(),
          free: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        system: {
          status: 'error',
          error: error.message,
        },
      });
    }
  });
}