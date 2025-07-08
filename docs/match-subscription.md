# Match Subscription System

This document explains how to use the real-time match subscription system for the Dots to Squares multiplayer game.

## Overview

The match subscription system provides real-time updates from Firestore match documents to your Vue components. It includes:

- **`subscribeToMatch()`** - Core Firestore subscription function
- **`useMatchStore`** - Pinia store for managing match state
- **`useMatchSubscription`** - Vue composable for easy integration

## Core Function: `subscribeToMatch()`

### Location
`src/firebase/matchHelpers.ts`

### Signature
```typescript
function subscribeToMatch(
  matchId: string, 
  callback: (match: MatchData | null) => void
): Unsubscribe
```

### Usage
```typescript
import { subscribeToMatch } from '../firebase/matchHelpers'

const unsubscribe = subscribeToMatch('match-id-123', (matchData) => {
  if (matchData) {
    console.log('Match updated:', matchData)
    // Handle match data updates
  } else {
    console.log('Match not found or error occurred')
    // Handle error case
  }
})

// Later, to stop listening:
unsubscribe()
```

### Features
- ✅ Real-time Firestore document listening
- ✅ Automatic error handling
- ✅ Clean unsubscribe function
- ✅ TypeScript support

## Pinia Store: `useMatchStore`

### Location
`src/stores/matchStore.ts`

### State Properties
```typescript
const store = useMatchStore()

// Connection state
store.currentMatchId    // string | null
store.isLoading         // boolean
store.error            // string | null
store.isConnected      // computed boolean

// Match data
store.matchData        // MatchData | null
store.isWaiting        // computed boolean
store.isActive         // computed boolean
store.isCompleted      // computed boolean
store.isCancelled      // computed boolean

// Game state
store.players          // computed Player[]
store.currentPlayer    // computed number
store.scores           // computed { 1: number, 2: number }
store.gameOver         // computed boolean
store.winner           // computed string | null
store.dots             // computed Dot[]
store.squares          // computed Square[]
store.lines            // computed Line[]
store.gridSize         // computed number
```

### Actions
```typescript
// Subscribe to a match
store.subscribeToMatchById('match-id-123')

// Unsubscribe and reset state
store.unsubscribeFromMatch()

// Clear error messages
store.clearError()

// Helper methods
store.getPlayerById('player-id')
store.isPlayerInMatch('player-id')
store.getPlayerNumber('player-id')
store.isCurrentPlayerTurn('player-id')
store.canPlayerMove('player-id')
store.getMatchStatus()
store.getMatchProgress()
store.getRemainingSquares()
store.getClaimedSquaresByPlayer(1)
```

### Usage Example
```typescript
import { useMatchStore } from '../stores/matchStore'

const store = useMatchStore()

// Subscribe to a match
store.subscribeToMatchById('match-id-123')

// Watch for changes
watch(() => store.matchData, (newMatch) => {
  if (newMatch) {
    console.log('Match status:', newMatch.status)
    console.log('Current player:', store.currentPlayer)
  }
})

// Check if player can move
const canMove = store.canPlayerMove('current-player-id')
```

## Vue Composable: `useMatchSubscription`

### Location
`src/composables/useMatchSubscription.ts`

### Signature
```typescript
function useMatchSubscription(
  matchId: string | null = null,
  options: UseMatchSubscriptionOptions = {}
)
```

### Options
```typescript
interface UseMatchSubscriptionOptions {
  autoSubscribe?: boolean        // Default: true
  onMatchUpdate?: (match: MatchData | null) => void
  onError?: (error: string) => void
  onStatusChange?: (status: string) => void
}
```

### Return Value
The composable returns all store properties plus additional methods:

```typescript
const {
  // State
  matchId,
  isSubscribing,
  isLoading,
  error,
  
  // Match data
  match,
  isConnected,
  isWaiting,
  isActive,
  isCompleted,
  isCancelled,
  
  // Game state
  players,
  currentPlayer,
  scores,
  gameOver,
  winner,
  dots,
  squares,
  lines,
  gridSize,
  
  // Actions
  subscribe,
  unsubscribe,
  updateMatchId,
  clearError,
  
  // Helper methods (all from store)
  getPlayerById,
  isPlayerInMatch,
  getPlayerNumber,
  isCurrentPlayerTurn,
  canPlayerMove,
  getMatchStatus,
  getMatchProgress,
  getRemainingSquares,
  getClaimedSquaresByPlayer
} = useMatchSubscription()
```

### Usage Examples

#### Basic Usage
```vue
<script setup>
import { useMatchSubscription } from '../composables/useMatchSubscription'

const {
  match,
  isConnected,
  isLoading,
  error,
  players,
  currentPlayer
} = useMatchSubscription('match-id-123')
</script>

<template>
  <div>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="isConnected">
      <h3>Match Status: {{ match?.status }}</h3>
      <p>Current Player: {{ currentPlayer }}</p>
      <ul>
        <li v-for="player in players" :key="player.id">
          {{ player.name }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

#### With Callbacks
```vue
<script setup>
import { useMatchSubscription } from '../composables/useMatchSubscription'

const {
  match,
  isConnected,
  subscribe,
  unsubscribe
} = useMatchSubscription(null, {
  autoSubscribe: false,
  onMatchUpdate: (matchData) => {
    if (matchData) {
      console.log('Match updated:', matchData.status)
    }
  },
  onError: (error) => {
    console.error('Subscription error:', error)
  },
  onStatusChange: (status) => {
    console.log('Status changed to:', status)
  }
})

// Manual subscription
const joinMatch = (matchId) => {
  subscribe(matchId)
}

// Cleanup on component unmount is automatic
</script>
```

#### Dynamic Match ID
```vue
<script setup>
import { ref } from 'vue'
import { useMatchSubscription } from '../composables/useMatchSubscription'

const matchId = ref('match-123')

const {
  match,
  isConnected,
  updateMatchId
} = useMatchSubscription(matchId.value)

// Change match ID
const switchToMatch = (newMatchId) => {
  updateMatchId(newMatchId, true) // true = auto-resubscribe
}
</script>
```

## Component Example

See `src/components/MatchSubscriptionExample.vue` for a complete working example that demonstrates:

- ✅ Real-time connection status
- ✅ Match information display
- ✅ Player list with current turn highlighting
- ✅ Game state monitoring
- ✅ Manual subscription/unsubscription
- ✅ Error handling
- ✅ Event logging
- ✅ Responsive design

## Best Practices

### 1. Always Clean Up
The composable automatically cleans up on component unmount, but you can manually unsubscribe:

```typescript
const { unsubscribe } = useMatchSubscription('match-id')

// Manual cleanup if needed
onBeforeUnmount(() => {
  unsubscribe()
})
```

### 2. Handle Loading States
```vue
<template>
  <div v-if="isLoading" class="loading">
    Connecting to match...
  </div>
  <div v-else-if="error" class="error">
    {{ error }}
  </div>
  <div v-else-if="isConnected" class="match-content">
    <!-- Match content -->
  </div>
</template>
```

### 3. Use Computed Properties
```typescript
const canMove = computed(() => 
  isActive.value && 
  isPlayerInMatch(currentPlayerId.value) && 
  isCurrentPlayerTurn(currentPlayerId.value)
)
```

### 4. Error Handling
```typescript
const { error, clearError } = useMatchSubscription('match-id', {
  onError: (errorMessage) => {
    // Log error, show notification, etc.
    console.error('Match subscription error:', errorMessage)
  }
})
```

### 5. Status Monitoring
```typescript
const { getMatchStatus } = useMatchSubscription('match-id', {
  onStatusChange: (status) => {
    switch (status) {
      case 'waiting':
        // Show waiting room
        break
      case 'active':
        // Show game board
        break
      case 'completed':
        // Show results
        break
    }
  }
})
```

## Testing

Run the subscription tests:

```bash
npm run test:unit -- src/tests/matchSubscription.test.ts
```

The tests cover:
- ✅ Store initialization and state management
- ✅ Subscription and unsubscription
- ✅ Error handling
- ✅ Computed properties
- ✅ Helper methods
- ✅ Composable functionality

## Integration with Game Board

To integrate with the existing game board:

```vue
<script setup>
import { useMatchSubscription } from '../composables/useMatchSubscription'
import { useGameBoard } from '../composables/useGameBoard'

const { match, isConnected, dots, squares, lines } = useMatchSubscription('match-id')

// Sync with local game board
const gameBoard = useGameBoard()

watch([dots, squares, lines], ([newDots, newSquares, newLines]) => {
  if (newDots && newSquares && newLines) {
    gameBoard.initializeFromMatch(newDots, newSquares, newLines)
  }
})
</script>
```

This provides a complete real-time multiplayer experience with automatic state synchronization. 