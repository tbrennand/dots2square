#!/usr/bin/env node

/**
 * Test script for Firebase hosting configuration
 * This script builds the application and verifies the hosting setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Firebase Hosting Configuration...\n');

// Step 1: Check if dist directory exists, if not build the app
if (!fs.existsSync('dist')) {
  console.log('📦 Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Step 2: Verify build output
console.log('🔍 Verifying build output...');
const distPath = path.join(__dirname, '..', 'dist');
const requiredFiles = ['index.html', 'assets'];

for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} missing`);
    process.exit(1);
  }
}

// Step 3: Check index.html for Vue Router compatibility
console.log('\n📄 Checking index.html...');
const indexPath = path.join(distPath, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

if (indexContent.includes('<div id="app">')) {
  console.log('✅ Vue app mount point found');
} else {
  console.error('❌ Vue app mount point missing');
  process.exit(1);
}

if (indexContent.includes('assets/')) {
  console.log('✅ Asset references found');
} else {
  console.error('❌ Asset references missing');
  process.exit(1);
}

// Step 4: Check Firebase configuration
console.log('\n🔥 Checking Firebase configuration...');
const firebaseJsonPath = path.join(__dirname, '..', 'firebase.json');
const firebasercPath = path.join(__dirname, '..', '.firebaserc');

if (fs.existsSync(firebaseJsonPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
  
  if (firebaseConfig.hosting) {
    console.log('✅ Firebase hosting configuration found');
    
    if (firebaseConfig.hosting.public === 'dist') {
      console.log('✅ Public directory set to dist');
    } else {
      console.error('❌ Public directory not set to dist');
      process.exit(1);
    }
    
    if (firebaseConfig.hosting.rewrites && firebaseConfig.hosting.rewrites.length > 0) {
      console.log('✅ SPA routing rewrites configured');
    } else {
      console.error('❌ SPA routing rewrites missing');
      process.exit(1);
    }
  } else {
    console.error('❌ Firebase hosting configuration missing');
    process.exit(1);
  }
} else {
  console.error('❌ firebase.json not found');
  process.exit(1);
}

if (fs.existsSync(firebasercPath)) {
  console.log('✅ .firebaserc found');
} else {
  console.error('❌ .firebaserc missing');
  process.exit(1);
}

// Step 5: Check Vite configuration
console.log('\n⚡ Checking Vite configuration...');
const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');

if (viteConfigContent.includes('outDir: \'dist\'')) {
  console.log('✅ Vite build output directory configured');
} else {
  console.error('❌ Vite build output directory not configured');
  process.exit(1);
}

if (viteConfigContent.includes('manualChunks')) {
  console.log('✅ Code splitting configured');
} else {
  console.error('❌ Code splitting not configured');
  process.exit(1);
}

// Step 6: Check package.json scripts
console.log('\n📋 Checking package.json scripts...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredScripts = ['build', 'hosting:deploy', 'deploy'];
for (const script of requiredScripts) {
  if (packageJson.scripts[script]) {
    console.log(`✅ ${script} script found`);
  } else {
    console.error(`❌ ${script} script missing`);
    process.exit(1);
  }
}

console.log('\n🎉 All Firebase hosting configuration tests passed!');
console.log('\n📝 Next steps:');
console.log('1. Run "npm run hosting:deploy" to deploy to Firebase hosting');
console.log('2. Run "firebase emulators:start" to test locally');
console.log('3. Check the deployed site for SPA routing functionality'); 