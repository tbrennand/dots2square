# Leaderboard System

The Leaderboard System provides a comprehensive solution for tracking player statistics and displaying rankings in the Dots to Squares multiplayer game.

## Overview

The leaderboard system consists of:
- **userHelpers.ts**: Firebase functions for user management and leaderboard data
- **useLeaderboard.ts**: Composable for managing leaderboard state
- **Leaderboard.vue**: UI component for displaying rankings
- Real-time leaderboard updates
- User statistics tracking
- Rank calculations and display

## Firebase Integration

### Users Collection

The system uses a `users` collection in Firestore to store player statistics:

```typescript
interface User {
  id: string
  name: string
  email?: string
  totalGames: number
  gamesWon: number
  gamesLost: number
  totalScore: number
  bestScore: number
  averageScore: number
  winRate: number
  lastPlayed: Date
  createdAt: Date
  updatedAt: Date
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // No deletion allowed
    }
  }
}
```

## Components

### userHelpers.ts

Firebase helper functions for user management and leaderboard operations.

#### Functions

| Function | Description |
|----------|-------------|
| `createOrUpdateUser(userId, userData)` | Create or update a user profile |
| `getUser(userId)` | Get user by ID |
| `updateUserStats(userId, stats)` | Update user statistics after a game |
| `getLeaderboard(limit)` | Get top players for leaderboard |
| `subscribeToLeaderboard(limit, callback, onError)` | Subscribe to real-time leaderboard updates |
| `getUserRank(userId)` | Get user's current rank |
| `getUsers(userIds)` | Get multiple users by IDs |

#### Usage Examples

```typescript
import { 
  createOrUpdateUser, 
  updateUserStats, 
  getLeaderboard 
} from '@/firebase/userHelpers'

// Create a new user
const user = await createOrUpdateUser('user123', {
  name: 'Player Name',
  email: 'player@example.com'
})

// Update stats after a game
await updateUserStats('user123', {
  gameWon: true,
  score: 50
})

// Get leaderboard
const leaderboard = await getLeaderboard(10)
```

### useLeaderboard.ts

A composable that manages leaderboard state and Firebase integration.

#### Interface

```typescript
interface LeaderboardOptions {
  limit?: number
  currentUserId?: string
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `leaderboard` | `ComputedRef<LeaderboardEntry[]>` | All leaderboard entries |
| `topPlayers` | `ComputedRef<LeaderboardEntry[]>` | Top 3 players |
| `currentUserEntry` | `ComputedRef<LeaderboardEntry \| null>` | Current user's entry |
| `userRank` | `ComputedRef<number \| null>` | Current user's rank |
| `isLoading` | `ComputedRef<boolean>` | Loading state |
| `error` | `ComputedRef<string \| null>` | Error message |
| `hasData` | `ComputedRef<boolean>` | Whether data is available |
| `loadLeaderboard()` | `() => Promise<void>` | Load leaderboard data |
| `refreshLeaderboard()` | `() => Promise<void>` | Refresh data |
| `clearError()` | `() => void` | Clear error message |
| `reset()` | `() => void` | Reset all state |

#### Usage Example

```typescript
import { useLeaderboard } from '@/composables/useLeaderboard'

const {
  leaderboard,
  topPlayers,
  currentUserEntry,
  userRank,
  isLoading,
  error,
  loadLeaderboard,
  refreshLeaderboard
} = useLeaderboard({
  limit: 10,
  currentUserId: 'user123'
})
```

### Leaderboard.vue

A Vue component that displays the leaderboard with rankings, scores, and user information.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentUserId` | `string` | - | ID of the current user |
| `limit` | `number` | `10` | Number of players to display |

#### Features

- **Top 3 Players**: Special display with medals and crowns
- **Full Leaderboard Table**: Complete ranking with all statistics
- **Current User Highlighting**: Highlights the current user's entry
- **Real-time Updates**: Automatically updates when data changes
- **Loading States**: Shows loading indicators during data fetch
- **Error Handling**: Displays error messages with retry options
- **Responsive Design**: Works on mobile and desktop
- **User Rank Display**: Shows current user's rank if not in top 10

## Usage Examples

### Basic Leaderboard

```vue
<template>
  <Leaderboard />
</template>

<script setup>
import Leaderboard from '@/components/Leaderboard.vue'
</script>
```

### Leaderboard with Current User

```vue
<template>
  <Leaderboard
    :current-user-id="currentUserId"
    :limit="20"
  />
</template>

<script setup>
import { ref } from 'vue'
import Leaderboard from '@/components/Leaderboard.vue'

const currentUserId = ref('user123')
</script>
```

### Integration with Game Results

```vue
<template>
  <div class="game-result">
    <h2>Game Complete!</h2>
    
    <!-- Game result display -->
    <div class="result-details">
      <p>Winner: {{ winner }}</p>
      <p>Score: {{ score }}</p>
    </div>
    
    <!-- Update user stats -->
    <button @click="updateStats">Update Stats</button>
    
    <!-- Show leaderboard -->
    <Leaderboard :current-user-id="currentUserId" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Leaderboard from '@/components/Leaderboard.vue'
import { updateUserStats } from '@/firebase/userHelpers'

const currentUserId = ref('user123')
const winner = ref('Player 1')
const score = ref(50)

const updateStats = async () => {
  try {
    await updateUserStats(currentUserId.value, {
      gameWon: winner.value === 'Player 1',
      score: score.value
    })
  } catch (error) {
    console.error('Failed to update stats:', error)
  }
}
</script>
```

### Custom Leaderboard with Composable

```vue
<template>
  <div class="custom-leaderboard">
    <div v-if="isLoading" class="loading">
      Loading leaderboard...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="loadLeaderboard">Retry</button>
    </div>
    
    <div v-else class="leaderboard-content">
      <!-- Top 3 Players -->
      <div class="top-players">
        <div 
          v-for="player in topPlayers" 
          :key="player.id"
          class="player-card"
        >
          <div class="rank">#{{ player.rank }}</div>
          <div class="name">{{ player.name }}</div>
          <div class="score">{{ player.totalScore }} pts</div>
        </div>
      </div>
      
      <!-- Full List -->
      <div class="full-list">
        <div 
          v-for="entry in leaderboard" 
          :key="entry.id"
          class="entry"
          :class="{ 'current-user': entry.id === currentUserId }"
        >
          <span class="rank">{{ entry.rank }}</span>
          <span class="name">{{ entry.name }}</span>
          <span class="score">{{ entry.totalScore }}</span>
          <span class="wins">{{ entry.gamesWon }} wins</span>
        </div>
      </div>
      
      <!-- Current User Rank -->
      <div v-if="userRank && userRank > 10" class="user-rank">
        Your Rank: #{{ userRank }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useLeaderboard } from '@/composables/useLeaderboard'

const currentUserId = 'user123'

const {
  leaderboard,
  topPlayers,
  userRank,
  isLoading,
  error,
  loadLeaderboard
} = useLeaderboard({
  limit: 10,
  currentUserId
})
</script>
```

## User Statistics Tracking

### Automatic Updates

The system automatically tracks and updates user statistics:

```typescript
// After each game completion
await updateUserStats(userId, {
  gameWon: true,  // or false
  score: 50       // points earned in the game
})
```

### Calculated Fields

The system automatically calculates:

- **Win Rate**: `(gamesWon / totalGames) * 100`
- **Average Score**: `totalScore / totalGames`
- **Best Score**: Highest score achieved in any game

### Statistics Display

```typescript
interface LeaderboardEntry {
  id: string
  name: string
  totalScore: number    // Total points across all games
  gamesWon: number      // Number of games won
  winRate: number       // Win percentage
  rank: number          // Current ranking position
}
```

## Real-time Updates

### Subscription Management

The leaderboard automatically subscribes to real-time updates:

```typescript
// Automatic subscription on component mount
const unsubscribe = subscribeToLeaderboard(
  10,
  (leaderboard) => {
    // Handle leaderboard updates
    console.log('Leaderboard updated:', leaderboard)
  },
  (error) => {
    // Handle errors
    console.error('Leaderboard error:', error)
  }
)

// Automatic cleanup on component unmount
onUnmounted(() => {
  unsubscribe()
})
```

### Performance Optimization

- **Limited Queries**: Only fetches top N players
- **Efficient Indexing**: Uses compound indexes for sorting
- **Incremental Updates**: Only updates changed data
- **Connection Management**: Automatic reconnection on errors

## Styling and Customization

### CSS Classes

The component uses Tailwind CSS classes and custom CSS:

```css
.leaderboard {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.top-player-card {
  @apply relative bg-gradient-to-br rounded-lg p-4 text-center text-white;
}

.first-place {
  @apply bg-gradient-to-br from-yellow-400 to-yellow-600;
  transform: scale(1.05);
}

.current-user {
  @apply bg-blue-50 border-blue-200;
}
```

### Customization Options

```vue
<style scoped>
/* Custom leaderboard styling */
.leaderboard {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.top-player-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* Custom animations */
.player-card {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
```

## Testing

### Unit Tests

The system includes comprehensive tests:

```typescript
describe('userHelpers', () => {
  it('should create a new user', async () => {
    const user = await createOrUpdateUser('user123', {
      name: 'Test User',
      email: 'test@example.com'
    })
    
    expect(user.id).toBe('user123')
    expect(user.name).toBe('Test User')
  })
  
  it('should update user stats', async () => {
    await updateUserStats('user123', {
      gameWon: true,
      score: 50
    })
    
    // Verify stats were updated
  })
})
```

### Integration Tests

```typescript
describe('Leaderboard Integration', () => {
  it('should display leaderboard with real data', async () => {
    // Mock Firebase data
    // Render component
    // Verify leaderboard displays correctly
  })
  
  it('should update in real-time', async () => {
    // Simulate Firebase updates
    // Verify component updates automatically
  })
})
```

## Best Practices

### 1. User Management

```typescript
// Always create user profile on first login
const user = await createOrUpdateUser(authUser.uid, {
  name: authUser.displayName || 'Anonymous',
  email: authUser.email
})
```

### 2. Statistics Updates

```typescript
// Update stats immediately after game completion
try {
  await updateUserStats(userId, {
    gameWon: isWinner,
    score: finalScore
  })
} catch (error) {
  console.error('Failed to update stats:', error)
  // Handle gracefully - maybe retry later
}
```

### 3. Error Handling

```vue
<template>
  <div v-if="error" class="error-message">
    {{ error }}
    <button @click="clearError">Dismiss</button>
    <button @click="refreshLeaderboard">Retry</button>
  </div>
</template>
```

### 4. Performance

```typescript
// Use appropriate limits
const { leaderboard } = useLeaderboard({
  limit: 10, // Don't load too many entries
  currentUserId: userId
})

// Clean up subscriptions
onUnmounted(() => {
  // Automatic cleanup handled by composable
})
```

### 5. Accessibility

```vue
<template>
  <table role="table" aria-label="Player Rankings">
    <thead>
      <tr>
        <th scope="col">Rank</th>
        <th scope="col">Player</th>
        <th scope="col">Score</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in leaderboard" :key="entry.id">
        <td>{{ entry.rank }}</td>
        <td>{{ entry.name }}</td>
        <td>{{ entry.totalScore }}</td>
      </tr>
    </tbody>
  </table>
</template>
```

## Deployment Considerations

### Firebase Configuration

1. **Enable Firestore**: Ensure Firestore is enabled in your Firebase project
2. **Security Rules**: Deploy appropriate security rules
3. **Indexes**: Create compound indexes for efficient queries

```javascript
// Required Firestore indexes
{
  "collectionGroup": "users",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "totalGames", "order": "DESCENDING" },
    { "fieldPath": "totalScore", "order": "DESCENDING" }
  ]
}
```

### Performance Monitoring

- Monitor Firestore read/write operations
- Track leaderboard query performance
- Monitor real-time subscription connections

### Data Migration

```typescript
// Migration script for existing users
async function migrateUsers() {
  const users = await getAllUsers()
  
  for (const user of users) {
    await createOrUpdateUser(user.id, {
      name: user.name,
      email: user.email
    })
  }
}
```

The Leaderboard System provides a robust foundation for competitive gameplay with real-time updates, comprehensive statistics tracking, and a beautiful, responsive UI that enhances the multiplayer experience. 