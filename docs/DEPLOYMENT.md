# Deployment Guide

## Overview

Dots2Squares supports dual deployment options:
- **Vercel** (Recommended): Primary deployment with automatic builds and previews
- **Firebase Hosting**: Secondary deployment option for Firebase ecosystem integration

## 🚀 Vercel Deployment (Recommended)

### Prerequisites
- Vercel CLI installed: `npm install -g vercel`
- Vercel account and project created

### Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure Environment Variables**
   In your Vercel project dashboard, add these environment variables:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   Vercel_FIREBASE_APP_ID=your_app_id
   VITE_PUBLIC_URL=https://your-vercel-domain.vercel.app
   ```

### Deployment Commands

```bash
# Deploy to production
npm run vercel:deploy

# Deploy to preview
vercel

# Start development server with Vercel
npm run vercel:dev
```

### Vercel Configuration

The project includes `vercel.json` with optimized settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Benefits of Vercel Deployment

- **Automatic Builds**: Deploys on every push to main branch
- **Preview Deployments**: Automatic previews for pull requests
- **Global CDN**: Fast loading worldwide
- **Edge Functions**: Serverless functions at the edge
- **Analytics**: Built-in performance monitoring
- **Custom Domains**: Easy domain management

## 🔥 Firebase Hosting Deployment

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created

### Setup

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase**
   ```bash
   firebase init
   ```
   Select:
   - Hosting
   - Firestore
   - Use existing project
   - Public directory: `dist`
   - Single-page app: Yes
   - Overwrite index.html: No

### Deployment Commands

```bash
# Deploy everything (Hosting + Firestore rules)
npm run firebase:deploy

# Deploy only hosting
npm run firebase:deploy:hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

### Firebase Configuration

The project includes `firebase.json` with comprehensive settings:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": true, "port": 4000 },
    "hosting": { "port": 5000 }
  }
}
```

## 🔧 Environment Configuration

### Development Environment

Create `.env.local` in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_PUBLIC_URL=http://localhost:5173
```

### Production Environment

For Vercel, set these in the project dashboard:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_PUBLIC_URL=https://your-vercel-domain.vercel.app
```

## 🧪 Testing Before Deployment

### Local Testing

```bash
# Build and test locally
npm run build
npm run preview

# Test with Firebase emulators
npm run emulator:start
npm run emulator:test
```

### E2E Testing

```bash
# Run Cypress tests
npm run cypress:run

# Open Cypress UI
npm run cypress:open
```

### Unit Testing

```bash
# Run unit tests
npm run test:run

# Run tests with UI
npm run test:ui
```

## 🔄 CI/CD Pipeline

### GitHub Actions

The project includes GitHub Actions workflows for automated deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:run
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Required Secrets

Set these secrets in your GitHub repository:

- `VERCEL_TOKEN`: Vercel API token
- `ORG_ID`: Vercel organization ID
- `PROJECT_ID`: Vercel project ID

## 📊 Performance Optimization

### Build Optimization

The project uses Vite with optimized settings:

```javascript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          firebase: ['firebase/app', 'firebase/firestore']
        }
      }
    }
  }
})
```

### Caching Strategy

- **Static Assets**: 1-year cache with immutable flag
- **HTML**: No cache (always fresh)
- **API Responses**: Short cache for dynamic content

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

## 🔍 Monitoring & Analytics

### Vercel Analytics

Enable Vercel Analytics in your project dashboard for:
- Performance monitoring
- User behavior tracking
- Error tracking
- Real-time metrics

### Firebase Analytics

Add Firebase Analytics for:
- User engagement metrics
- Game performance tracking
- Error reporting
- Custom event tracking

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify no trailing spaces

3. **Firebase Rules**
   ```bash
   # Test rules locally
   firebase emulators:start
   npm run emulator:test
   ```

4. **CORS Issues**
   - Verify Firebase project settings
   - Check domain whitelist
   - Ensure proper authentication setup

### Debug Commands

```bash
# Debug Vercel deployment
vercel --debug

# Debug Firebase deployment
firebase deploy --debug

# Check build output
npm run build && ls -la dist/

# Test production build locally
npm run build && npm run preview
```

## 🔐 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use Vercel/Firebase secret management
- Rotate API keys regularly

### Firebase Security Rules
- Test rules thoroughly before deployment
- Use least privilege principle
- Monitor rule performance

### Content Security Policy
- Implement CSP headers
- Whitelist necessary domains
- Monitor CSP violations

## 📈 Scaling Considerations

### Vercel Scaling
- Automatic scaling based on traffic
- Edge functions for global performance
- CDN optimization

### Firebase Scaling
- Automatic Firestore scaling
- Real-time listener optimization
- Connection pooling

## 🔄 Rollback Strategy

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-id>
```

### Firebase Rollback
```bash
# List hosting releases
firebase hosting:releases:list

# Rollback to previous release
firebase hosting:rollback <release-id>
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vue 3 Deployment Guide](https://vuejs.org/guide/best-practices/production-deployment.html)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)

---

**Happy Deploying! 🚀** 