#!/bin/bash

# Firestore Security Rules Deployment Script
# This script helps deploy the security rules to Firebase

set -e

echo "🚀 Deploying Firestore Security Rules..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please log in to Firebase..."
    firebase login
fi

# Validate rules syntax
echo "🔍 Validating security rules..."
if firebase firestore:rules:validate firestore.rules; then
    echo "✅ Rules validation passed"
else
    echo "❌ Rules validation failed"
    exit 1
fi

# Deploy rules
echo "📤 Deploying rules to Firebase..."
firebase deploy --only firestore:rules

echo "✅ Security rules deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test the rules in Firebase Console"
echo "2. Run your application tests"
echo "3. Monitor rule performance in Firebase Console"
echo ""
echo "🔗 Firebase Console: https://console.firebase.google.com" 