# Dots2Squares 🎮

A production-grade multiplayer web game built with Vue 3, Firebase, and real-time collaboration. Players take turns connecting dots to form squares and compete for the highest score.

## 🚀 Features

### Core Gameplay
- **Multiplayer Dots & Squares**: Classic game with real-time multiplayer support
- **Turn-based Gameplay**: Players take turns drawing lines between dots
- **Square Completion**: Complete squares to earn points and extra turns
- **Real-time Updates**: Live game state synchronization across all players

### Social Features
- **Leaderboard System**: Track player statistics and rankings
- **Emoji Reactions**: Send reactions during gameplay
- **Match Lobby**: Join games with friends via shareable links
- **Rematch System**: Quick rematch functionality with same opponents

### Technical Features
- **Real-time Firebase Integration**: Live game state with Firestore
- **Vue 3 Composition API**: Modern reactive state management
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Works perfectly on desktop and mobile
- **Comprehensive Testing**: Unit tests, integration tests, and E2E tests

## 🛠️ Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Testing**: Vitest + Cypress
- **Deployment**: GitHub Actions + Firebase Hosting

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase CLI (for deployment)

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

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

### Development

```bash
# Start development server
npm run dev

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Start Firebase emulators
npm run emulator:start

# Test with emulators
npm run emulator:test
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase Hosting
npm run deploy
```

## 🏗️ Project Structure

```
src/
├── components/          # Vue components
│   ├── DotGrid.vue     # Game grid component
│   ├── Leaderboard.vue # Leaderboard display
│   ├── ScoreCard.vue   # Score tracking
│   └── ...
├── composables/         # Vue 3 composables
│   ├── useGameBoard.ts # Game logic
│   ├── useLeaderboard.ts # Leaderboard management
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
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

### Firebase Emulator Tests
```bash
npm run emulator:full
```

## 🚀 Deployment

### Manual Deployment
```bash
npm run build
firebase deploy
```

### Automated Deployment
The project includes GitHub Actions workflows for:
- Automatic testing on pull requests
- Deployment to Firebase Hosting on main branch
- Preview deployments for pull requests

## 📚 Documentation

- [Game Logic Documentation](docs/GAME_LOGIC.md)
- [Firebase Integration](docs/FIREBASE_INTEGRATION.md)
- [Leaderboard System](docs/LEADERBOARD.md)
- [Reaction System](docs/REACTION_PANEL.md)
- [Testing Guide](docs/TESTING.md)

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

## 📞 Support

For support, email support@dots2squares.com or create an issue in this repository.

---

**Happy Gaming! 🎮✨** 