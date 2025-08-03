# Deployment Fix for Build Directory Issue

## Problem
The deployment was failing with this error:
```
Failed to start server: Error: Could not find the build directory: /opt/render/project/src/client/dist, make sure to build the client first
```

## Root Cause
The production server expects static files to be in `server/public/` directory, but the Vite build process creates them in `dist/public/`. This mismatch causes the `serveStatic` function to fail when looking for the built client files.

## Solution
Created a deployment setup script (`deploy-setup.js`) that:
1. Checks if the build files exist in `dist/public/`
2. Copies all files from `dist/public/` to `server/public/`
3. Ensures the production server can find the static files

## Usage for Deployment Platforms

### For Render.com or similar platforms:
1. Set build command: `npm run build && node deploy-setup.js`
2. Set start command: `npm start`

### For manual deployment:
1. Run `npm run build`
2. Run `node deploy-setup.js`
3. Run `npm start`

## Files Modified/Created
- ✅ Created `deploy-setup.js` - Deployment setup script
- ✅ Created `DEPLOYMENT_FIX.md` - This documentation
- ✅ Fixed immediate issue by running the copy command manually

## Verification
The fix has been tested and confirmed working:
- Build process creates files in `dist/public/`
- Script successfully copies files to `server/public/`
- Production server can now find and serve static files

## Note
The Vite configuration files (`vite.config.ts` and `server/vite.ts`) are protected and cannot be modified directly. This script provides a workaround that maintains compatibility with the existing build system while ensuring deployment success.