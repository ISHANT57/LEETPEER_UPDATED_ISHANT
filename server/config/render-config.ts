// Render deployment configuration
export const renderConfig = {
  // Server configuration optimized for Render
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: '0.0.0.0',
    timeout: parseInt(process.env.SERVER_TIMEOUT || '120000', 10),
    keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT || '65000', 10),
    headersTimeout: parseInt(process.env.HEADERS_TIMEOUT || '66000', 10),
  },

  // Database configuration for production
  database: {
    connectionString: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DATABASE_CONNECTION_POOL_MIN || '2', 10),
      max: parseInt(process.env.DATABASE_CONNECTION_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000', 10),
    },
  },

  // Cache configuration
  cache: {
    maxAge: parseInt(process.env.CACHE_MAX_AGE || '300', 10) * 1000, // Convert to milliseconds
    staticMaxAge: parseInt(process.env.STATIC_CACHE_MAX_AGE || '31536000', 10),
  },

  // Rate limiting for production
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // Increased for production load
    skipSuccessfulRequests: true,
  },

  // Health check configuration
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3,
  },

  // Memory management
  memory: {
    maxOldSpaceSize: parseInt(process.env.NODE_MAX_OLD_SPACE_SIZE || '2048', 10),
    gcInterval: 60000, // Force GC every minute in production
  }
};

// Environment validation for Render
export function validateRenderEnvironment(): boolean {
  const required = ['DATABASE_URL', 'PORT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }

  console.log('✅ Render environment validation passed');
  return true;
}

// Performance monitoring for Render
export function setupRenderMonitoring() {
  // Memory usage monitoring
  setInterval(() => {
    const usage = process.memoryUsage();
    const used = Math.round(usage.heapUsed / 1024 / 1024);
    const total = Math.round(usage.heapTotal / 1024 / 1024);
    
    if (used > renderConfig.memory.maxOldSpaceSize * 0.8) {
      console.warn(`⚠️ High memory usage: ${used}MB/${total}MB`);
    }
  }, 60000);

  // CPU usage monitoring (basic)
  let lastCpuUsage = process.cpuUsage();
  setInterval(() => {
    const currentUsage = process.cpuUsage(lastCpuUsage);
    const userPercent = (currentUsage.user / 1000000) * 100;
    const systemPercent = (currentUsage.system / 1000000) * 100;
    
    if (userPercent + systemPercent > 80) {
      console.warn(`⚠️ High CPU usage: ${Math.round(userPercent + systemPercent)}%`);
    }
    
    lastCpuUsage = process.cpuUsage();
  }, 30000);
}