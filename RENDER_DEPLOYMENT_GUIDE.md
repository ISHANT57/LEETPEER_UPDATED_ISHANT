# Render Deployment Guide - Performance Optimized

## Overview
This guide provides comprehensive instructions for deploying your LeetCode tracking app to Render with optimal performance for handling multiple users and fast data loading.

## Pre-Deployment Checklist

### ✅ Code Optimizations Applied
- [x] Connection pooling (max 20 connections for production)
- [x] Render-specific caching middleware
- [x] Compression enabled for production
- [x] Aggressive timeout handling (6-8 seconds)
- [x] Health monitoring endpoints
- [x] Memory and CPU monitoring
- [x] Rate limiting for multiple users

## Render Service Configuration

### 1. Create New Web Service
```
Service Type: Web Service
Build Command: npm install && npm run build
Start Command: npm start
Node Version: 18 (or latest)
Instance Type: Starter ($7/month minimum for production load)
```

### 2. Environment Variables (Critical)
Set these in Render dashboard under Environment Variables:
```
NODE_ENV=production
DATABASE_URL=your_postgresql_url_here
PORT=5000

# Database Connection Optimization
DATABASE_CONNECTION_POOL_MIN=2
DATABASE_CONNECTION_POOL_MAX=20
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=10000

# Server Performance
SERVER_TIMEOUT=120000
KEEP_ALIVE_TIMEOUT=65000
HEADERS_TIMEOUT=66000
UV_THREADPOOL_SIZE=16

# Cache Settings
CACHE_MAX_AGE=300
STATIC_CACHE_MAX_AGE=31536000

# Memory Management
NODE_OPTIONS=--max-old-space-size=2048
NODE_NO_WARNINGS=1
```

### 3. Build Settings
```yaml
# render.yaml (optional - can be configured in dashboard)
services:
  - type: web
    name: leetcode-tracker
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_CONNECTION_POOL_MAX
        value: 20
    healthCheckPath: /api/health
```

## Database Setup for Production

### 1. PostgreSQL Database Service
Create a separate PostgreSQL database service in Render:
```
Service Type: PostgreSQL
Plan: Starter ($7/month minimum)
Database Name: leetcode_tracker
```

### 2. Get Database URL
After creation, copy the External Database URL and set it as `DATABASE_URL` environment variable.

## Performance Optimizations for Multiple Users

### 1. Connection Pooling
```typescript
// Automatic - configured in render-config.ts
database: {
  pool: {
    min: 2,     // Minimum connections
    max: 20,    // Maximum connections (increased for production)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }
}
```

### 2. Caching Strategy
```typescript
// API endpoints are cached:
// /api/students/all - 2 minutes
// /api/dashboard/admin - 5 minutes  
// /api/leaderboard - 3 minutes
```

### 3. Rate Limiting
```typescript
// Production rate limits:
// API requests: 200 per 15 minutes per IP
// Sync operations: 5 per minute per IP
```

## Deployment Steps

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up/login with GitHub account
3. Connect your repository

### Step 2: Create PostgreSQL Database
1. New → PostgreSQL
2. Name: `leetcode-tracker-db`
3. Plan: Starter ($7/month)
4. Wait for creation and copy External Database URL

### Step 3: Create Web Service
1. New → Web Service  
2. Connect your GitHub repository
3. Configure build settings:
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

### Step 4: Set Environment Variables
In Render dashboard, go to Environment tab and add:
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/database
PORT=5000
DATABASE_CONNECTION_POOL_MAX=20
SERVER_TIMEOUT=120000
UV_THREADPOOL_SIZE=16
NODE_OPTIONS=--max-old-space-size=2048
```

### Step 5: Deploy
1. Click "Deploy Latest Commit"
2. Monitor build logs
3. Wait for deployment to complete
4. Test health endpoint: `https://your-app.onrender.com/api/health`

## Performance Monitoring

### Health Check Endpoints
- `GET /api/health` - Quick health status
- `GET /api/status` - Detailed system info

### Expected Performance Metrics
- **Response Time**: 500ms - 2s for cached data
- **Concurrent Users**: 10-50 users simultaneously
- **Memory Usage**: 200-500MB
- **CPU Usage**: 20-60% under normal load

## Troubleshooting Common Issues

### 1. Slow Data Loading
**Symptoms**: Pages take 10+ seconds to load
**Solutions**:
- Check database connection in logs
- Verify environment variables are set
- Monitor `/api/health` endpoint
- Check if cache is working (X-Cache header)

### 2. Multiple User Issues
**Symptoms**: App becomes unresponsive with multiple users
**Solutions**:
- Increase `DATABASE_CONNECTION_POOL_MAX` to 30
- Upgrade to Standard plan ($25/month) for more resources
- Monitor memory usage in logs

### 3. Deployment Failures
**Common Fixes**:
```bash
# Clear build cache
rm -rf node_modules package-lock.json
npm install

# Check build locally
NODE_ENV=production npm run build
npm start
```

### 4. Database Connection Issues
**Solutions**:
- Verify DATABASE_URL format
- Check database service is running
- Ensure database accepts external connections
- Test connection: `curl https://your-app.onrender.com/api/health`

## Scaling Recommendations

### For 50+ Concurrent Users
- Upgrade to Standard plan ($25/month)
- Increase database plan to Standard
- Set `DATABASE_CONNECTION_POOL_MAX=30`
- Consider Redis caching for session data

### For 100+ Concurrent Users  
- Professional plan ($85/month)
- Professional database plan
- Implement Redis caching
- Consider load balancing with multiple instances

## Monitoring & Maintenance

### Daily Checks
1. Check `/api/health` endpoint
2. Monitor response times
3. Review error logs in Render dashboard

### Weekly Checks
1. Database performance metrics
2. Memory usage trends
3. Update dependencies if needed

### Monthly Checks
1. Review and optimize cache strategies
2. Database cleanup and optimization
3. Performance testing with load

## Cost Optimization

### Minimum Production Setup ($14/month)
- Web Service: Starter ($7/month)
- PostgreSQL: Starter ($7/month)
- Total: $14/month for 10-20 concurrent users

### Recommended Production Setup ($32/month)
- Web Service: Standard ($25/month)
- PostgreSQL: Starter ($7/month) 
- Total: $32/month for 50+ concurrent users

This configuration provides optimal performance for multiple users with fast data loading and reliable error handling.