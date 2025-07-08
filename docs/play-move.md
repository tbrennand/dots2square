# Play Move Function

This document explains how to use the `playMove()` function for making moves in the Dots to Squares multiplayer game.

## Overview

The `playMove()` function handles the complete game move logic using Firestore transactions to ensure atomic updates. It includes:

- **Move validation** - Checks if the move is legal
- **Square detection** - Identifies completed squares
- **Score updates** - Updates player scores
- **Turn management** - Handles turn switching
- **Game completion** - Determines winners and game end

## Function Signature

```typescript
async function playMove(
  matchId: string,
  playerId: string,
  line: MoveLine
): Promise<PlayMoveResult>
```

### Parameters

- **`matchId`** - The ID of the match to play in
- **`playerId`** - The ID of the player making the move
- **`line`** - The line to draw (using dot IDs)

### Return Value

```typescript
interface PlayMoveResult {
  success: boolean
  squaresClaimed: number
  gameCompleted: boolean
  winner?: number | 'tie' | null
  error?: string
}
```

## MoveLine Interface

```typescript
interface MoveLine {
  startDot: string  // Format: "x-y" (e.g., "0-0")
  endDot: string    // Format: "x-y" (e.g., "1-0")
}
```

## Usage Examples

### Basic Move

```typescript
import { playMove } from '../firebase/matchHelpers'

const move = {
  startDot: '0-0',
  endDot: '1-0'
}

const result = await playMove('match-id-123', 'player-id', move)

if (result.success) {
  console.log(`Claimed ${result.squaresClaimed} squares`)
  if (result.gameCompleted) {
    console.log(`Game over! Winner: ${result.winner}`)
  }
} else {
  console.error(`Move failed: ${result.error}`)
}
```

### In a Vue Component

```vue
<script setup>
import { ref } from 'vue'
import { playMove, type MoveLine } from '../firebase/matchHelpers'

const isMakingMove = ref(false)
const lastResult = ref(null)

async function handleMove(startDot: string, endDot: string) {
  isMakingMove.value = true
  
  try {
    const move: MoveLine = { startDot, endDot }
    const result = await playMove(matchId, playerId, move)
    
    lastResult.value = result
    
    if (result.success) {
      // Handle successful move
      console.log(`Claimed ${result.squaresClaimed} squares`)
    } else {
      // Handle error
      console.error(result.error)
    }
  } catch (error) {
    console.error('Move failed:', error)
  } finally {
    isMakingMove.value = false
  }
}
</script>
```

## Move Validation Rules

The function validates moves according to these rules:

### 1. Player Validation
- Player must be in the match
- Must be player's turn
- Game must be active (not waiting, completed, or cancelled)

### 2. Line Validation
- Line must connect adjacent dots (horizontal or vertical)
- Line coordinates must be within grid bounds
- Line must not already exist

### 3. Game State Validation
- Game must not be completed
- Match must exist

## Game Logic

### Square Detection
When a line is drawn, the function checks if any squares are completed:

```typescript
// Example: Drawing the last line of a square
const move = { startDot: '0-0', endDot: '0-1' }
// If lines (0,0)-(1,0), (1,0)-(1,1), (0,1)-(1,1) already exist
// This move completes the square (0,0)-(1,1)
```

### Turn Management
- **No squares claimed**: Turn switches to other player
- **Squares claimed**: Player gets another turn

### Score Updates
- Each completed square gives 1 point to the player
- Scores are updated atomically in the transaction

### Game Completion
- Game ends when all squares are claimed
- Winner is determined by highest score
- Ties are handled appropriately

## Error Handling

The function returns detailed error messages:

```typescript
// Common error scenarios
const errors = {
  'Match not found': 'Match ID is invalid',
  'Not your turn': 'Player tried to move out of turn',
  'Game is not active': 'Match is in waiting or completed state',
  'Game is already completed': 'Game has already ended',
  'Line already exists': 'Line has already been drawn',
  'Player not found in match': 'Player is not part of this match',
  'Line coordinates are out of bounds': 'Invalid dot coordinates',
  'Line must be horizontal or vertical': 'Diagonal lines not allowed',
  'Horizontal line must connect adjacent dots': 'Invalid horizontal move',
  'Vertical line must connect adjacent dots': 'Invalid vertical move'
}
```

## Integration with Match Subscription

Combine with the match subscription system for real-time updates:

```vue
<script setup>
import { playMove } from '../firebase/matchHelpers'
import { useMatchSubscription } from '../composables/useMatchSubscription'

const { match, isActive, currentPlayer } = useMatchSubscription('match-id')

async function makeMove(startDot: string, endDot: string) {
  // Check if it's player's turn
  if (currentPlayer.value !== getPlayerNumber()) {
    console.log('Not your turn')
    return
  }
  
  const result = await playMove('match-id', 'player-id', {
    startDot,
    endDot
  })
  
  // The subscription will automatically update with the new state
  // No need to manually refresh
}
</script>
```

## Transaction Safety

The function uses Firestore transactions to ensure:

- **Atomicity**: All updates happen together or not at all
- **Consistency**: Game state remains valid
- **Isolation**: Concurrent moves are handled safely
- **Durability**: Changes are persisted reliably

## Performance Considerations

- Transactions are fast for small datasets
- Consider batching multiple moves if needed
- Monitor transaction retries for high-concurrency scenarios

## Testing

The function includes comprehensive validation and error handling:

```typescript
// Test different scenarios
const testCases = [
  { startDot: '0-0', endDot: '1-0', expected: 'valid' },
  { startDot: '0-0', endDot: '2-0', expected: 'invalid - not adjacent' },
  { startDot: '0-0', endDot: '1-1', expected: 'invalid - diagonal' },
  { startDot: '0-0', endDot: '1-0', expected: 'invalid - already exists' }
]
```

## Best Practices

### 1. Always Check Results
```typescript
const result = await playMove(matchId, playerId, move)
if (!result.success) {
  // Handle error appropriately
  showError(result.error)
  return
}
```

### 2. Handle Loading States
```vue
<template>
  <button 
    @click="makeMove" 
    :disabled="isMakingMove || !canMove"
  >
    {{ isMakingMove ? 'Making Move...' : 'Make Move' }}
  </button>
</template>
```

### 3. Validate Before Sending
```typescript
function validateMoveLocally(startDot: string, endDot: string): boolean {
  // Basic validation before calling playMove
  const [startX, startY] = startDot.split('-').map(Number)
  const [endX, endY] = endDot.split('-').map(Number)
  
  const isAdjacent = Math.abs(endX - startX) + Math.abs(endY - startY) === 1
  const isHorizontalOrVertical = startX === endX || startY === endY
  
  return isAdjacent && isHorizontalOrVertical
}
```

### 4. Use with Real-time Updates
```typescript
// The subscription will automatically reflect changes
const { match } = useMatchSubscription(matchId)

// After a successful move, the UI updates automatically
watch(() => match.value?.scores, (newScores) => {
  updateScoreDisplay(newScores)
})
```

## Complete Example

See `src/components/PlayMoveExample.vue` for a complete working example that demonstrates:

- ✅ Real-time game state display
- ✅ Move validation and input
- ✅ Visual game board representation
- ✅ Score tracking
- ✅ Turn management
- ✅ Error handling
- ✅ Loading states

This provides a complete foundation for implementing game moves in your Dots to Squares multiplayer game. 