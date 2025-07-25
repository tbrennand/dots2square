# Dots2Squares 🎮

A production-grade multiplayer web game built with Vue 3, Firebase, and real-time collaboration. Players take turns connecting dots to form squares and compete for the highest score.

## 🚀 Features

### Core Gameplay
- **Multiplayer Dots & Squares**: Classic game with real-time multiplayer support
- **Turn-based Gameplay**: Players take turns drawing lines between dots
- **Square Completion**: Complete squares to earn points and extra turns
- **Real-time Updates**: Live game state synchronization across all players

### Social Features
- **Enhanced Match Lobby**: Modern, responsive lobby with real-time player status
- **Native Sharing**: Share games via native device sharing or platform-specific buttons
- **Leaderboard System**: Track player statistics and rankings
- **Emoji Reactions**: Send reactions during gameplay
- **Rematch System**: Quick rematch functionality with same opponents

### Technical Features
- **Real-time Firebase Integration**: Live game state with Firestore
- **Vue 3 Composition API**: Modern reactive state management
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Comprehensive Testing**: Unit tests, integration tests, and E2E tests
- **Dual Deployment**: Firebase Hosting and Vercel support

## 🛠️ Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Testing**: Vitest + Cypress
- **Deployment**: Vercel (primary) + Firebase Hosting

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase CLI (for Firebase deployment)
- Vercel CLI (for Vercel deployment)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/tbrennand/dots2square.git
   cd dots2square
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   ```bash
   # Install Firebase CLI globally
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (follow prompts)
   firebase init
   ```

4. **Set up Vercel (Recommended)**
   ```bash
   # Install Vercel CLI globally
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   ```

5. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_PUBLIC_URL=https://your-vercel-domain.vercel.app
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

### Development

```bash
# Start development server
npm run dev

# Run unit tests
npm run test:run

# Run E2E tests
npm run cypress:run

# Start Firebase emulators
npm run emulator:start

# Test with emulators
npm run emulator:test
```

### Building & Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel (Recommended)
npm run vercel:deploy

# Deploy to Firebase Hosting
npm run firebase:deploy
```

## 🏗️ Project Structure

```
src/
├── components/          # Vue components
│   ├── DotGrid.vue     # Game grid component
│   ├── MatchLobby.vue  # Enhanced match lobby
│   ├── Leaderboard.vue # Leaderboard display
│   ├── ScoreCard.vue   # Score tracking
│   ├── Chat.vue        # Real-time chat
│   └── ...
├── composables/         # Vue 3 composables
│   ├── useGameBoard.ts # Game logic
│   ├── useLeaderboard.ts # Leaderboard management
│   ├── useMatchSubscription.ts # Real-time match updates
│   └── ...
├── firebase/           # Firebase configuration
│   ├── index.ts        # Firebase setup
│   ├── matchHelpers.ts # Match management
│   └── userHelpers.ts  # User management
├── router/             # Vue Router configuration
├── stores/             # Pinia stores
├── tests/              # Test files
├── views/              # Page components
└── assets/             # Static assets
```

## 🎮 Game Rules

1. **Objective**: Complete more squares than your opponent
2. **Turns**: Players take turns drawing lines between adjacent dots
3. **Scoring**: Complete a square to earn 1 point and an extra turn
4. **Game End**: Game ends when all possible lines are drawn
5. **Winner**: Player with the most completed squares wins

## 🔥 Firebase Configuration

### Required Collections

- **matches**: Game state and player information
- **users**: Player statistics and leaderboard data
- **reactions**: Emoji reactions during gameplay

### Security Rules

The project includes comprehensive Firestore security rules that:
- Allow only authenticated users to read/write
- Prevent unauthorized access to game data
- Ensure data integrity during gameplay

### Indexes

Required Firestore indexes for optimal performance:
```javascript
// Users collection
{
  "collectionGroup": "users",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "totalGames", "order": "DESCENDING" },
    { "fieldPath": "totalScore", "order": "DESCENDING" }
  ]
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test:run
```

### E2E Tests
```bash
npm run cypress:run
```

### Firebase Emulator Tests
```bash
npm run emulator:test
```

## 🚀 Deployment

### Vercel Deployment (Recommended)
```bash
npm run vercel:deploy
```

### Firebase Hosting Deployment
```bash
npm run firebase:deploy
```

### Automated Deployment
The project includes GitHub Actions workflows for:
- Automatic testing on pull requests
- Deployment to Vercel on main branch
- Preview deployments for pull requests

## 📚 Documentation

- [Features Overview](docs/FEATURES_OVERVIEW.md) - Complete feature list and capabilities
- [Match Lobby Enhancement](docs/matchlobby-enhancement.md) - Enhanced lobby with native sharing
- [Game Board Implementation](docs/gameboard-implementation.md) - Core game mechanics
- [Game Result Implementation](docs/gameresult-implementation.md) - Game results and statistics
- [Leaderboard System](docs/LEADERBOARD.md) - Player rankings and statistics
- [Reaction System](docs/REACTION_PANEL.md) - Emoji reactions during gameplay
- [Rematch System](docs/USE_REMATCH.md) - Quick rematch functionality
- [Firebase Security Rules](docs/firestore-security-rules.md) - Security configuration
- [Error Handling](docs/ERROR_HANDLING.md) - Error management and recovery
- [Emulator Testing](docs/EMULATOR_TESTING.md) - Local development testing
- [Deployment Guide](docs/DEPLOYMENT.md) - Vercel and Firebase deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vue 3](https://vuejs.org/)
- Powered by [Firebase](https://firebase.google.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Tested with [Vitest](https://vitest.dev/) and [Cypress](https://cypress.io/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

For support, email support@dots2squares.com or create an issue in this repository.

---

**Happy Gaming! 🎮✨** 