# Deployment Guide

## Overview

Dots2Squares is deployed exclusively on **Vercel**, which provides a seamless and powerful platform for hosting modern web applications. Vercel offers automatic builds, preview deployments, a global CDN, and many other features that make it the ideal choice for this project.

## 🚀 Vercel Deployment

### Prerequisites
- Vercel CLI installed: `npm install -g vercel`
- A Vercel account connected to your GitHub repository.

### Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Your Project**
   From your local project directory, run:
   ```bash
   vercel link
   ```
   Follow the prompts to connect your local repository to your Vercel project.

4. **Configure Environment Variables**
   In your Vercel project dashboard, add the following environment variables. These are required for the application to connect to your Firebase backend.
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_PUBLIC_URL=https://your-vercel-domain.vercel.app
   ```
   *Replace the placeholder values with your actual Firebase project credentials.*

### Deployment Commands

- **Deploy to Production**:
  ```bash
  npm run vercel:deploy
  ```
  This command will build the application and deploy it to your production URL on Vercel.

- **Deploy to Preview**:
  ```bash
  vercel
  ```
  Running `vercel` from your local directory will create a unique preview deployment, which is perfect for testing changes before merging them into your main branch.

- **Local Development with Vercel**:
  ```bash
  npm run vercel:dev
  ```
  This command starts a local development server using the Vercel CLI, which is useful for testing in an environment that closely mirrors production.

### Vercel Configuration (`vercel.json`)

The project includes a `vercel.json` file that is optimized for this application. It ensures that all routes are correctly handled by the Vue router and that assets are served with the proper cache headers.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "installCommand": "npm install",
        "buildCommand": "npm run build",
        "outputDirectory": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "headers": { "Cache-Control": "public, no-cache" },
      "dest": "/index.html"
    }
  ]
}
```

### Benefits of Vercel Deployment

- **Automatic Builds**: Vercel automatically deploys your application every time you push to your `main` branch.
- **Preview Deployments**: You get automatic preview deployments for every pull request, making it easy to review changes.
- **Global CDN**: Your application is served from a global network of edge locations, ensuring fast loading times for users worldwide.
- **Custom Domains**: Vercel makes it easy to connect your own custom domains.

## 🧪 Testing Before Deployment

It is highly recommended to run tests locally before deploying to production to catch any issues early.

- **Run Unit Tests**:
  ```bash
  npm run test:run
  ```

- **Run E2E Tests with Cypress**:
  ```bash
  npm run cypress:run
  ```

- **Test Production Build Locally**:
  ```bash
  npm run build && npm run preview
  ```

## 🔐 Security Considerations

- **Environment Variables**: Never commit your `.env` files to version control. Use Vercel's environment variable management to keep your secrets secure.
- **Firebase Security Rules**: Ensure your Firestore security rules are properly configured to prevent unauthorized access to your database.

---

**Happy Deploying! 🚀** 