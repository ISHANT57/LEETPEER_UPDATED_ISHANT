// Render-specific optimization build script
const fs = require('fs');
const path = require('path');

// Create optimized production configuration
const renderConfig = {
  // Render-specific environment optimizations
  NODE_ENV: 'production',
  NODE_OPTIONS: '--max-old-space-size=2048',
  
  // Database connection optimizations for Render
  DATABASE_CONNECTION_POOL_MIN: '2',
  DATABASE_CONNECTION_POOL_MAX: '20',
  DATABASE_IDLE_TIMEOUT: '30000',
  DATABASE_CONNECTION_TIMEOUT: '10000',
  
  // Server optimizations
  SERVER_TIMEOUT: '120000',
  KEEP_ALIVE_TIMEOUT: '65000',
  HEADERS_TIMEOUT: '66000',
  
  // Cache optimizations
  CACHE_MAX_AGE: '300', // 5 minutes
  STATIC_CACHE_MAX_AGE: '31536000', // 1 year for static assets
  
  // Performance optimizations
  UV_THREADPOOL_SIZE: '16',
  NODE_NO_WARNINGS: '1'
};

// Write render configuration
fs.writeFileSync('.env.render', 
  Object.entries(renderConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
);

console.log('✅ Render optimization configuration created');

// Create render-specific package.json scripts
const packagePath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add render-optimized scripts
pkg.scripts = {
  ...pkg.scripts,
  'render-build': 'npm install && npm run build && node render-optimization.js',
  'render-start': 'NODE_ENV=production node dist/index.js',
  'render-health': 'curl -f http://localhost:$PORT/api/health || exit 1'
};

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
console.log('✅ Render-optimized package.json updated');