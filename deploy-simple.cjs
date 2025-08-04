#!/usr/bin/env node

/**
 * Simple deployment script with maximum compatibility
 * Uses CommonJS for older Node.js environments
 */

const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const distPublicPath = path.resolve(__dirname, 'dist', 'public');
  const deploymentPaths = [
    path.resolve(__dirname, 'server', 'public'),
    path.resolve(__dirname, 'client', 'dist'),
    path.resolve(__dirname, 'public'),
    path.resolve(__dirname, 'build'),
  ];
  
  console.log('Setting up deployment files...');
  console.log('Working directory:', process.cwd());
  console.log('Script directory:', __dirname);
  
  if (!fs.existsSync(distPublicPath)) {
    console.error('Error: Build directory not found at', distPublicPath);
    console.error('Please run "npm run build" first');
    process.exit(1);
  }
  
  console.log('Creating build files in all expected locations:');
  
  for (const targetPath of deploymentPaths) {
    console.log(`Copying files to: ${targetPath}`);
    copyDir(distPublicPath, targetPath);
    
    const hasIndex = fs.existsSync(path.join(targetPath, 'index.html'));
    console.log(`${hasIndex ? 'SUCCESS' : 'FAILED'}: ${targetPath}`);
  }
  
  console.log('Deployment setup complete!');
}

main();