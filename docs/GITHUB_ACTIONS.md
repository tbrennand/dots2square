# GitHub Actions Deployment Setup

This document explains how to set up automated deployment to Firebase Hosting using GitHub Actions.

## Overview

The GitHub Actions workflow automatically:
- Runs tests on every push and pull request
- Builds the application
- Deploys to Firebase Hosting on push to main branch
- Creates preview deployments for pull requests

## Workflow Files

### Primary Workflow: `.github/workflows/deploy.yml`
Comprehensive workflow with:
- Separate test, build, and deploy jobs
- Build artifact sharing
- Detailed deployment comments
- Preview deployments for PRs

### Simple Workflow: `.github/workflows/deploy-simple.yml`
Streamlined workflow using Firebase's official action:
- Single job for faster execution
- Uses Firebase's official deployment action
- Simpler configuration

## Setup Instructions

### 1. Create Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`dots2squares-game`)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate new private key**
5. Download the JSON file

### 2. Add GitHub Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions** and add:

#### Required Secrets

**`FIREBASE_SERVICE_ACCOUNT_DOTS2SQUARES`**
- Value: The entire content of the downloaded service account JSON file
- Example:
```json
{
  "type": "service_account",
  "project_id": "dots2squares-game",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@dots2squares-game.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

#### Optional Secrets (for advanced workflow)

**`FIREBASE_TOKEN`**
- Generate using: `firebase login:ci`
- Used for additional Firebase CLI commands

### 3. Enable GitHub Actions

1. Push the workflow files to your repository
2. Go to **Actions** tab in GitHub
3. The workflow will automatically run on the next push to main

## Workflow Behavior

### On Push to Main Branch
1. **Test Job**: Runs unit tests and type checking
2. **Build Job**: Builds the application and uploads artifacts
3. **Deploy Job**: Deploys to Firebase Hosting production
4. **Comment**: Posts deployment URL in commit comments

### On Pull Request
1. **Test Job**: Runs unit tests and type checking
2. **Build Job**: Builds the application and uploads artifacts
3. **Preview Job**: Deploys to Firebase Hosting preview channel
4. **Comment**: Posts preview URL in PR comments

## Workflow Jobs

### Test Job
```yaml
test:
  name: Run Tests
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Setup Node.js 18
    - Install dependencies
    - Run unit tests
    - Run TypeScript type check
```

### Build Job
```yaml
build:
  name: Build Application
  runs-on: ubuntu-latest
  needs: test
  steps:
    - Checkout code
    - Setup Node.js 18
    - Install dependencies
    - Build application
    - Upload build artifacts
```

### Deploy Job
```yaml
deploy:
  name: Deploy to Firebase Hosting
  runs-on: ubuntu-latest
  needs: build
  if: github.ref == 'refs/heads/main'
  steps:
    - Download build artifacts
    - Setup Firebase CLI
    - Deploy to Firebase Hosting
    - Comment deployment URL
```

## Environment Variables

### Global Environment
- `NODE_VERSION: '18'` - Node.js version for all jobs

### Job-Specific Environment
- `FIREBASE_PROJECT: dots2squares-game` - Firebase project ID
- `FIREBASE_SERVICE_ACCOUNT_DOTS2SQUARES` - Service account credentials

## Deployment URLs

### Production Deployment
- **URL**: `https://dots2squares-game.web.app`
- **Trigger**: Push to main branch
- **Status**: Live production site

### Preview Deployments
- **URL Pattern**: `https://dots2squares-game--preview-{PR_NUMBER}.web.app`
- **Trigger**: Pull request to main branch
- **Status**: Preview for testing
- **Expiration**: 7 days after PR is closed

## Troubleshooting

### Common Issues

#### 1. Service Account Permission Error
```
Error: The caller does not have permission
```
**Solution**: Ensure the service account has the following roles:
- Firebase Hosting Admin
- Firebase Admin

#### 2. Build Failure
```
Error: Build failed
```
**Solution**: Check the build logs for:
- Missing dependencies
- TypeScript errors
- Vite build issues

#### 3. Deployment Failure
```
Error: Deploy failed
```
**Solution**: Verify:
- Firebase project ID is correct
- Service account has proper permissions
- Build artifacts are available

### Debug Commands

#### Check Service Account Permissions
```bash
# Test service account locally
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
firebase projects:list
```

#### Test Deployment Locally
```bash
# Build and deploy locally
npm run build
firebase deploy --only hosting
```

#### Check Workflow Logs
1. Go to GitHub Actions tab
2. Click on the failed workflow run
3. Check individual job logs for errors

## Security Considerations

### Service Account Security
- Never commit service account JSON to repository
- Use GitHub Secrets for sensitive data
- Rotate service account keys regularly
- Limit service account permissions to minimum required

### Repository Security
- Enable branch protection on main branch
- Require PR reviews before merge
- Enable status checks for deployment

## Performance Optimization

### Caching
- Node modules are cached between runs
- Build artifacts are shared between jobs
- Firebase CLI is cached

### Parallel Execution
- Test and build jobs can run in parallel
- Preview deployments don't block production

### Resource Usage
- Uses Ubuntu latest runners
- Jobs timeout after 6 hours
- Artifacts are retained for 1 day

## Monitoring and Notifications

### Deployment Notifications
- GitHub comments on commits/PRs
- Deployment URLs posted automatically
- Build status badges available

### Error Notifications
- Failed workflows send notifications
- Detailed error logs in GitHub Actions
- Rollback procedures documented

## Best Practices

### Code Quality
1. Run tests before deployment
2. Use TypeScript for type safety
3. Lint code before commit
4. Review PRs before merge

### Deployment Strategy
1. Use preview deployments for testing
2. Deploy to production only from main
3. Monitor deployment health
4. Have rollback procedures ready

### Security
1. Use least privilege service accounts
2. Rotate credentials regularly
3. Monitor access logs
4. Enable security scanning

## Next Steps

1. **Set up repository secrets** with Firebase service account
2. **Push workflow files** to trigger first deployment
3. **Test preview deployments** with a PR
4. **Monitor deployment health** and performance
5. **Set up additional monitoring** if needed

## Support

For issues with:
- **GitHub Actions**: Check GitHub documentation
- **Firebase Hosting**: Check Firebase documentation
- **Workflow configuration**: Review this documentation
- **Service account setup**: Contact Firebase support 