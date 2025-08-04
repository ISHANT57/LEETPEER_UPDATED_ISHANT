

import express, { type Request, Response, NextFunction } from "express";
import compression from 'compression'; // Import at the top
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { globalErrorHandler } from "./middleware/error-handler";
import { apiRateLimit } from "./middleware/rate-limiter";
import { renderConfig, validateRenderEnvironment, setupRenderMonitoring } from "./config/render-config";

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api', apiRateLimit);

// Set server timeouts optimized for Render
app.use((req, res, next) => {
  // Use Render-optimized timeouts
  req.setTimeout(renderConfig.server.timeout);
  res.setTimeout(renderConfig.server.timeout);
  next();
});

// Add compression for better performance on Render
if (process.env.NODE_ENV === 'production') {
  // Use the imported module conditionally
  app.use(compression({
    level: 6,
    threshold: 1024,
  }));
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Validate Render environment
    if (process.env.NODE_ENV === 'production' && !validateRenderEnvironment()) {
      process.exit(1);
    }

    // Test database connection
    await db.execute('SELECT 1');
    console.log('PostgreSQL connected successfully');

    const server = await registerRoutes(app);

    // Use global error handler
    app.use(globalErrorHandler);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = renderConfig.server.port;
    server.listen({
      port,
      host: renderConfig.server.host,
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);

      // Setup monitoring for production
      if (process.env.NODE_ENV === 'production') {
        setupRenderMonitoring();
        console.log('✅ Render monitoring enabled');
      }
    });

    // Render-specific server optimizations
    server.keepAliveTimeout = renderConfig.server.keepAliveTimeout;
    server.headersTimeout = renderConfig.server.headersTimeout;
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();