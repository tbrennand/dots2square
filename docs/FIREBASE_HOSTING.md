# Firebase Hosting Setup

This document explains the Firebase hosting configuration for the Dots2Squares multiplayer game, including SPA routing for Vue Router.

## Configuration Files

### firebase.json
The main Firebase configuration file includes:

- **Hosting Configuration**: Points to `dist` directory (Vite build output)
- **SPA Routing**: Rewrites all routes to `/index.html` for Vue Router
- **Caching Headers**: Optimized caching for static assets
- **CORS Headers**: Allows cross-origin requests for assets
- **Emulator Configuration**: Local development setup

### .firebaserc
Project configuration file that specifies the Firebase project ID:
```json
{
  "projects": {
    "default": "dots2squares-game"
  }
}
```

### vite.config.ts
Vite configuration optimized for Firebase hosting:

- **Build Output**: `dist` directory
- **Asset Optimization**: Manual chunks for vendor and Firebase libraries
- **Source Maps**: Disabled for production
- **Server Configuration**: Port 5173 with host access

## SPA Routing Configuration

The Firebase hosting configuration includes a rewrite rule that ensures all routes are handled by the Vue Router:

```json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

This allows Vue Router to handle client-side routing for:
- `/` - Home screen
- `/lobby/:matchId` - Match lobby
- `/game/:matchId` - Game board
- `/result/:matchId` - Game result

## Available Scripts

### Development
```bash
npm run dev                    # Start Vite dev server
npm run emulator:start        # Start Firebase emulators
```

### Building
```bash
npm run build                 # Build for production
npm run hosting:build         # Build specifically for hosting
```

### Deployment
```bash
npm run hosting:deploy        # Build and deploy only hosting
npm run deploy               # Build and deploy all services
npm run hosting:serve        # Deploy to preview channel
```

## Deployment Process

1. **Build the Application**:
   ```bash
   npm run build
   ```
   This creates the `dist` directory with optimized assets.

2. **Deploy to Firebase**:
   ```bash
   npm run hosting:deploy
   ```
   This builds and deploys only the hosting service.

3. **Full Deployment**:
   ```bash
   npm run deploy
   ```
   This deploys all Firebase services (hosting, Firestore rules, indexes).

## Local Testing

### Emulator Testing
```bash
npm run emulator:start
```
This starts all Firebase emulators including hosting on port 5000.

### Preview Build
```bash
npm run build
npm run preview
```
This builds and serves the production build locally.

## Performance Optimizations

### Asset Caching
Static assets (JS, CSS) are cached for 1 year:
```json
{
  "key": "Cache-Control",
  "value": "max-age=31536000"
}
```

### Code Splitting
Vite configuration includes manual chunks:
- `vendor`: Vue, Vue Router, Pinia
- `firebase`: Firebase SDK modules

### Compression
Firebase hosting automatically compresses:
- HTML, CSS, JavaScript files
- JSON responses
- Text-based assets

## Environment Configuration

### Development
- Uses Firebase emulators
- Vite dev server on port 5173
- Hot module replacement enabled

### Production
- Uses Firebase production services
- Optimized build output
- CDN distribution

## Troubleshooting

### Common Issues

1. **Routing Not Working**:
   - Ensure the rewrite rule is in `firebase.json`
   - Check that Vue Router is configured correctly
   - Verify the build output contains `index.html`

2. **Assets Not Loading**:
   - Check that the `public` directory is set to `dist`
   - Verify asset paths in the build output
   - Ensure CORS headers are configured

3. **Build Failures**:
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Ensure Vite configuration is correct

### Debug Commands
```bash
# Check Firebase project
firebase projects:list

# View hosting configuration
firebase hosting:channel:list

# Test locally
firebase serve --only hosting
```

## Security Considerations

### Headers Configuration
- CORS headers for cross-origin assets
- Cache control for performance
- No sensitive information in client-side code

### Environment Variables
- Firebase config is public (safe for client-side)
- API keys are restricted by Firebase Security Rules
- No secrets in build output

## Monitoring and Analytics

### Firebase Analytics
The application can be configured with Firebase Analytics for:
- User engagement tracking
- Performance monitoring
- Error reporting

### Hosting Metrics
Firebase hosting provides:
- Request volume
- Response times
- Error rates
- Geographic distribution

## Best Practices

1. **Always test locally** with emulators before deploying
2. **Use preview channels** for testing before production
3. **Monitor performance** after deployment
4. **Keep dependencies updated** for security
5. **Use environment-specific configurations**
6. **Implement proper error handling** for offline scenarios

## Next Steps

1. Set up Firebase Analytics
2. Configure custom domain
3. Implement service worker for offline support
4. Add performance monitoring
5. Set up automated deployment pipeline 