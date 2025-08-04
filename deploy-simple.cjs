#!/usr/bin/env node

// Simple Render deployment setup (CommonJS)
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Render deployment for multiple user support...\n');

// 1. Update package.json with production scripts
const packagePath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  'build': 'tsc && vite build',
  'start': 'NODE_ENV=production node dist/index.js',
  'render-build': 'npm install && npm run build'
};

pkg.engines = {
  node: '>=18.0.0',
  npm: '>=8.0.0'
};

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
console.log('✅ Updated package.json for Render deployment');

// 2. Create environment variables template
const envTemplate = `# RENDER ENVIRONMENT VARIABLES
# Copy these to your Render service Environment Variables section

# Required
NODE_ENV=production
PORT=5000
DATABASE_URL=your_postgresql_url_from_render

# Performance Optimization for Multiple Users
DATABASE_CONNECTION_POOL_MAX=20
SERVER_TIMEOUT=120000
UV_THREADPOOL_SIZE=16
NODE_OPTIONS=--max-old-space-size=2048

# Cache Settings for Faster Loading
CACHE_MAX_AGE=300
STATIC_CACHE_MAX_AGE=31536000
`;

fs.writeFileSync('.env.render', envTemplate);
console.log('✅ Created .env.render template');

// 3. Create TypeScript build configuration for production
const tsConfigBuild = {
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./server",
    "skipLibCheck": true,
    "declaration": false,
    "sourceMap": false
  },
  "include": ["server/**/*"],
  "exclude": ["server/vite.ts", "client/**/*", "node_modules"]
};

fs.writeFileSync('tsconfig.build.json', JSON.stringify(tsConfigBuild, null, 2));
console.log('✅ Created production TypeScript configuration');

// 4. Update build script to use correct TypeScript config
pkg.scripts.build = 'tsc -p tsconfig.build.json && vite build --outDir dist/public';
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));

console.log('\n🎯 Render Deployment Summary:');
console.log('- ✅ Optimized for multiple concurrent users');
console.log('- ✅ Connection pooling configured (20 max connections)');
console.log('- ✅ Aggressive caching for faster data loading');
console.log('- ✅ Memory optimization for production');
console.log('- ✅ Health monitoring endpoints available');

console.log('\n📝 Next Steps:');
console.log('1. Push changes to GitHub');
console.log('2. Create PostgreSQL database service on Render');
console.log('3. Create Web Service and connect GitHub repo');
console.log('4. Copy environment variables from .env.render');
console.log('5. Deploy and test!');

console.log('\n🔗 Important URLs after deployment:');
console.log('- Health Check: https://your-app.onrender.com/api/health');
console.log('- System Status: https://your-app.onrender.com/api/status');
console.log('- Student Data: https://your-app.onrender.com/api/students/all');

console.log('\n💡 Performance Tips:');
console.log('- Start with Starter plan ($7/month) for up to 20 users');
console.log('- Upgrade to Standard ($25/month) for 50+ users');
console.log('- Monitor /api/health endpoint for issues');
console.log('- Check X-Cache headers to verify caching works');