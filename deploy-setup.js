#!/usr/bin/env node

// Render deployment setup script
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up Render deployment...\n');

// 1. Create production build script
const packagePath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add Render-optimized build scripts
pkg.scripts = {
  ...pkg.scripts,
  'build': 'vite build',
  'start': 'NODE_ENV=production node dist/index.js',
  'render-build': 'npm install && npm run build',
  'health-check': 'curl -f http://localhost:$PORT/api/health || exit 1'
};

// Ensure build configurations
pkg.engines = {
  node: '>=18.0.0',
  npm: '>=8.0.0'
};

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
console.log('✅ Updated package.json with Render scripts');

// 2. Create render.yaml for deployment configuration
const renderYaml = `services:
  - type: web
    name: leetcode-tracker
    env: node
    buildCommand: npm run render-build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_CONNECTION_POOL_MAX
        value: 20
      - key: SERVER_TIMEOUT
        value: 120000
      - key: UV_THREADPOOL_SIZE
        value: 16
      - key: NODE_OPTIONS
        value: --max-old-space-size=2048
    plan: starter
`;

fs.writeFileSync('render.yaml', renderYaml);
console.log('✅ Created render.yaml configuration');

// 3. Create production environment template
const envTemplate = `# Render Production Environment Variables
# Copy these to your Render service's Environment Variables section

NODE_ENV=production
PORT=5000

# Database Configuration (get from Render PostgreSQL service)
DATABASE_URL=postgresql://username:password@host:port/database

# Connection Pool Settings
DATABASE_CONNECTION_POOL_MIN=2
DATABASE_CONNECTION_POOL_MAX=20
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=10000

# Server Performance Settings
SERVER_TIMEOUT=120000
KEEP_ALIVE_TIMEOUT=65000
HEADERS_TIMEOUT=66000

# Cache Settings
CACHE_MAX_AGE=300
STATIC_CACHE_MAX_AGE=31536000

# Performance Optimization
UV_THREADPOOL_SIZE=16
NODE_OPTIONS=--max-old-space-size=2048
NODE_NO_WARNINGS=1
`;

fs.writeFileSync('.env.render.template', envTemplate);
console.log('✅ Created .env.render.template');

// 4. Create deployment checklist
const checklist = `# Render Deployment Checklist

## Before Deployment
- [ ] Code committed and pushed to GitHub
- [ ] Database schema is up to date
- [ ] Environment variables configured
- [ ] Build scripts tested locally

## Render Setup Steps
1. [ ] Create PostgreSQL database service
2. [ ] Copy database URL from Render dashboard
3. [ ] Create web service from GitHub repository
4. [ ] Set all environment variables from .env.render.template
5. [ ] Deploy and monitor build logs

## Post-Deployment Testing
- [ ] Test health endpoint: https://your-app.onrender.com/api/health
- [ ] Verify data loading works
- [ ] Test with multiple browser tabs (simulate multiple users)
- [ ] Check error handling and timeout behavior

## Performance Monitoring
- [ ] Monitor response times
- [ ] Check memory usage in logs
- [ ] Verify caching is working (X-Cache headers)
- [ ] Test database connection stability

## Troubleshooting URLs
- Health Check: https://your-app.onrender.com/api/health
- System Status: https://your-app.onrender.com/api/status
- Student Data: https://your-app.onrender.com/api/students/all
`;

fs.writeFileSync('RENDER_CHECKLIST.md', checklist);
console.log('✅ Created deployment checklist');

// 5. Verify critical files exist
const criticalFiles = [
  'server/config/render-config.ts',
  'server/middleware/render-cache.ts',
  'server/middleware/rate-limiter.ts',
  'server/middleware/error-handler.ts',
  'server/utils/connection-pool.ts'
];

console.log('\n🔍 Verifying critical files...');
let allFilesExist = true;

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 All critical files present!');
} else {
  console.log('\n⚠️  Some critical files are missing. Please check the file structure.');
}

// 6. Create quick test script
const testScript = `#!/bin/bash
echo "🧪 Testing Render deployment readiness..."

# Test if build works
echo "Testing build process..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Test if server starts
echo "Testing server startup..."
timeout 10s npm start &
SERVER_PID=$!
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
curl -f http://localhost:5000/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Health endpoint working"
else
    echo "❌ Health endpoint failed"
fi

# Cleanup
kill $SERVER_PID 2>/dev/null

echo "🎉 Render deployment readiness test complete!"
`;

fs.writeFileSync('test-render-ready.sh', testScript);
fs.chmodSync('test-render-ready.sh', '755');
console.log('✅ Created deployment test script');

console.log('\n🚀 Render setup complete!');
console.log('\nNext steps:');
console.log('1. Run: chmod +x test-render-ready.sh && ./test-render-ready.sh');
console.log('2. Push changes to GitHub');
console.log('3. Create Render services (PostgreSQL + Web Service)');
console.log('4. Copy environment variables from .env.render.template');
console.log('5. Deploy and monitor!');
console.log('\nFor detailed instructions, see RENDER_DEPLOYMENT_GUIDE.md');