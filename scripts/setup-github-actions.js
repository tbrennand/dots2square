#!/usr/bin/env node

/**
 * Setup script for GitHub Actions deployment
 * This script helps configure the necessary secrets and settings
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 GitHub Actions Deployment Setup\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupGitHubActions() {
  console.log('This script will help you set up GitHub Actions for Firebase Hosting deployment.\n');

  // Check if workflow files exist
  const workflowDir = path.join(__dirname, '..', '.github', 'workflows');
  const deployYml = path.join(workflowDir, 'deploy.yml');
  const deploySimpleYml = path.join(workflowDir, 'deploy-simple.yml');

  if (!fs.existsSync(deployYml) && !fs.existsSync(deploySimpleYml)) {
    console.error('❌ Workflow files not found!');
    console.log('Please ensure the workflow files are in .github/workflows/');
    process.exit(1);
  }

  console.log('✅ Workflow files found\n');

  // Step 1: Firebase Project ID
  const projectId = await question('Enter your Firebase project ID (default: dots2squares-game): ') || 'dots2squares-game';
  console.log(`📋 Project ID: ${projectId}\n`);

  // Step 2: Service Account Setup
  console.log('🔑 Firebase Service Account Setup:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log(`2. Select project: ${projectId}`);
  console.log('3. Go to Project Settings → Service Accounts');
  console.log('4. Click "Generate new private key"');
  console.log('5. Download the JSON file\n');

  const serviceAccountPath = await question('Enter the path to your service account JSON file: ');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account file not found!');
    process.exit(1);
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('✅ Service account file is valid JSON\n');
  } catch (error) {
    console.error('❌ Invalid JSON file!');
    process.exit(1);
  }

  // Step 3: Generate GitHub Secrets Instructions
  console.log('🔐 GitHub Secrets Setup:');
  console.log('\nGo to your GitHub repository:');
  console.log('Settings → Secrets and variables → Actions\n');

  console.log('Add the following secrets:\n');

  console.log('1. FIREBASE_SERVICE_ACCOUNT_DOTS2SQUARES');
  console.log('   Value: (The entire content of your service account JSON file)');
  console.log('   Type: Secret\n');

  console.log('2. FIREBASE_PROJECT (Optional)');
  console.log(`   Value: ${projectId}`);
  console.log('   Type: Variable\n');

  // Step 4: Update workflow files if needed
  const updateWorkflows = await question('Update workflow files with your project ID? (y/n): ');
  
  if (updateWorkflows.toLowerCase() === 'y') {
    console.log('\n📝 Updating workflow files...');
    
    if (fs.existsSync(deployYml)) {
      let content = fs.readFileSync(deployYml, 'utf8');
      content = content.replace(/dots2squares-game/g, projectId);
      fs.writeFileSync(deployYml, content);
      console.log('✅ Updated .github/workflows/deploy.yml');
    }
    
    if (fs.existsSync(deploySimpleYml)) {
      let content = fs.readFileSync(deploySimpleYml, 'utf8');
      content = content.replace(/dots2squares-game/g, projectId);
      fs.writeFileSync(deploySimpleYml, content);
      console.log('✅ Updated .github/workflows/deploy-simple.yml');
    }
  }

  // Step 5: Test configuration
  console.log('\n🧪 Testing Configuration:');
  
  const testConfig = await question('Test the configuration locally? (y/n): ');
  
  if (testConfig.toLowerCase() === 'y') {
    console.log('\nTesting Firebase configuration...');
    
    // Test service account
    if (serviceAccount.project_id === projectId) {
      console.log('✅ Service account project ID matches');
    } else {
      console.log('⚠️  Warning: Service account project ID does not match');
      console.log(`   Expected: ${projectId}`);
      console.log(`   Found: ${serviceAccount.project_id}`);
    }
    
    // Test build
    console.log('\nTesting build process...');
    try {
      const { execSync } = require('child_process');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build successful');
    } catch (error) {
      console.error('❌ Build failed');
      console.log('Please fix build issues before deploying');
    }
  }

  // Step 6: Final instructions
  console.log('\n🎉 Setup Complete!\n');
  
  console.log('Next steps:');
  console.log('1. Add the GitHub secrets as shown above');
  console.log('2. Push your changes to GitHub');
  console.log('3. Go to Actions tab to monitor deployments');
  console.log('4. Test with a pull request to see preview deployments\n');
  
  console.log('Useful commands:');
  console.log(`  npm run hosting:deploy  # Deploy manually`);
  console.log(`  npm run hosting:test   # Test configuration`);
  console.log(`  firebase emulators:start  # Test locally\n`);
  
  console.log('Documentation:');
  console.log('  docs/GITHUB_ACTIONS.md  # Detailed setup guide');
  console.log('  docs/FIREBASE_HOSTING.md  # Hosting configuration');

  rl.close();
}

setupGitHubActions().catch(console.error); 