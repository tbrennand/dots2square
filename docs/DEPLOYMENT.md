# Deployment Guide

This guide covers deploying Dots2Squares to both Firebase Hosting and Vercel.

## Prerequisites

1. **Firebase Project Setup**
2. **Environment Variables**
3. **Build Tools**

## Option 1: Firebase Hosting (Recommended)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., `dots2squares-game`)
3. Enable Firestore Database
4. Enable Authentication (optional for now)

### Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### Step 3: Update Firebase Project ID

Update `.firebaserc`:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### Step 4: Deploy

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy everything
npm run firebase:deploy

# Or deploy only hosting
npm run firebase:deploy:hosting
```

## Option 2: Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Configure Environment Variables

In Vercel dashboard or via CLI:

```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
```

### Step 3: Deploy

```bash
# Deploy to production
npm run vercel:deploy

# Or for development
npm run vercel:dev
```

## Option 3: Netlify Deployment

### Step 1: Create netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 2: Deploy

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | Yes |

## Getting Firebase Config Values

1. Go to Firebase Console
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps"
5. Click on the web app or create one
6. Copy the config values

## Troubleshooting

### Common Issues

1. **Build Fails**: Check if all dependencies are installed
2. **Environment Variables Not Found**: Ensure `.env` file exists and variables are prefixed with `VITE_`
3. **Firebase Connection Issues**: Verify Firebase project ID and API key
4. **CORS Errors**: Check Firebase Security Rules

### Development vs Production

- **Development**: Uses Firebase Emulators
- **Production**: Uses real Firebase services

### Security Rules

Ensure your Firestore rules are deployed:

```bash
firebase deploy --only firestore:rules
```

## Quick Start Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to Firebase
npm run firebase:deploy

# Deploy to Vercel
npm run vercel:deploy

# Test with emulators
npm run emulator:start
``` 