# useRematch Composable

The `useRematch` composable provides functionality for creating rematches between players who have completed a game. It handles match creation, navigation, and sharing capabilities.

## Overview

The `useRematch` composable allows players to:
- Create a new match with the same opponent
- Navigate to the new match lobby
- Share rematch links with opponents
- Handle loading states and errors
- Validate rematch eligibility

## API Reference

### State

| Property | Type | Description |
|----------|------|-------------|
| `isCreating` | `Ref<boolean>` | Whether a rematch is currently being created |
| `error` | `Ref<string \| null>` | Current error message, if any |
| `newMatchId` | `Ref<string \| null>` | ID of the newly created rematch |
| `canCreateRematch` | `ComputedRef<boolean>` | Whether a rematch can be created |
| `originalMatchData` | `Ref<MatchData \| null>` | Data from the original match |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setOriginalMatch` | `MatchData` | `void` | Set the original match data |
| `createRematch` | `RematchOptions` | `Promise<string \| null>` | Create a new rematch |
| `navigateToRematch` | `RematchOptions` | `Promise<void>` | Create rematch and navigate |
| `getRematchShareLink` | `string` | `string` | Generate share link for match |
| `copyRematchLink` | `string` | `Promise<boolean>` | Copy link to clipboard |
| `reset` | - | `void` | Reset all state |

## Interfaces

### RematchOptions

```typescript
interface RematchOptions {
  originalMatchId: string
  currentUserId: string
  currentUserName: string
  gridSize?: number
  isPublic?: boolean
}
```

### RematchState

```typescript
interface RematchState {
  isCreating: boolean
  error: string | null
  newMatchId: string | null
  canCreateRematch: boolean
}
```

## Usage Examples

### Basic Usage

```vue
<script setup>
import { useRematch } from '@/composables/useRematch'

const {
  isCreating,
  error,
  newMatchId,
  canCreateRematch,
  setOriginalMatch,
  navigateToRematch
} = useRematch()

// Set original match data
setOriginalMatch(matchData)

// Create rematch
const handleRematch = async () => {
  try {
    await navigateToRematch({
      originalMatchId: 'match123',
      currentUserId: 'user1',
      currentUserName: 'Player 1'
    })
  } catch (err) {
    console.error('Rematch failed:', err)
  }
}
</script>

<template>
  <button 
    @click="handleRematch"
    :disabled="!canCreateRematch || isCreating"
  >
    <span v-if="isCreating">Creating...</span>
    <span v-else>Play Again</span>
  </button>
  
  <div v-if="error" class="error">
    {{ error }}
  </div>
</template>
```

### Advanced Usage with Custom Settings

```vue
<script setup>
import { useRematch } from '@/composables/useRematch'

const rematch = useRematch()

const createCustomRematch = async () => {
  try {
    const matchId = await rematch.createRematch({
      originalMatchId: 'match123',
      currentUserId: 'user1',
      currentUserName: 'Player 1',
      gridSize: 7, // Custom grid size
      isPublic: false // Private match
    })
    
    if (matchId) {
      // Custom navigation or handling
      console.log('New match created:', matchId)
    }
  } catch (err) {
    console.error('Failed to create rematch:', err)
  }
}
</script>
```

### Sharing Rematch Links

```vue
<script setup>
import { useRematch } from '@/composables/useRematch'

const { getRematchShareLink, copyRematchLink, newMatchId } = useRematch()

const shareRematch = async () => {
  if (newMatchId.value) {
    const success = await copyRematchLink(newMatchId.value)
    if (success) {
      alert('Rematch link copied to clipboard!')
    } else {
      alert('Failed to copy link')
    }
  }
}

const getShareLink = () => {
  if (newMatchId.value) {
    return getRematchShareLink(newMatchId.value)
  }
  return null
}
</script>
```

## Integration with Components

### GameResult Component

The `GameResult` component demonstrates full integration:

```vue
<template>
  <div class="game-result">
    <!-- Winner display -->
    <div v-if="winner">
      <h3>{{ winner.name }} Wins!</h3>
    </div>
    
    <!-- Rematch buttons -->
    <div class="rematch-section">
      <button
        @click="handleRematch"
        :disabled="!canCreateRematch || isCreating"
      >
        🎮 Play Again
      </button>
      
      <button
        v-if="newMatchId"
        @click="copyRematchLink"
      >
        📋 Copy Link
      </button>
    </div>
    
    <!-- Error display -->
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { useRematch } from '@/composables/useRematch'

const props = defineProps<{
  matchData: MatchData
  currentUserId: string
  currentUserName: string
}>()

const {
  isCreating,
  error,
  newMatchId,
  canCreateRematch,
  setOriginalMatch,
  navigateToRematch,
  copyRematchLink: copyLink,
  reset
} = useRematch()

// Set original match on mount
onMounted(() => {
  setOriginalMatch(props.matchData)
})

// Cleanup on unmount
onUnmounted(() => {
  reset()
})

const handleRematch = async () => {
  await navigateToRematch({
    originalMatchId: props.matchData.id || '',
    currentUserId: props.currentUserId,
    currentUserName: props.currentUserName,
    gridSize: props.matchData.gridSize,
    isPublic: props.matchData.isPublic
  })
}

const copyRematchLink = async () => {
  if (newMatchId.value) {
    await copyLink(newMatchId.value)
  }
}
</script>
```

## Validation Rules

### Rematch Eligibility

A rematch can only be created when:

1. **Original match exists**: `originalMatchData` is set
2. **Match is completed**: `status === 'completed'`
3. **Two players**: Both `player1` and `player2` are present
4. **User participated**: Current user was part of the original match
5. **Not already creating**: `isCreating` is false

### Error Handling

Common error scenarios:

- **No original match data**: "No original match data available"
- **User not in match**: "You were not part of the original match"
- **Missing opponent**: "Cannot create rematch: other player not found"
- **Already creating**: "Rematch creation already in progress"
- **Firebase errors**: "Failed to create rematch"

## State Management

### State Flow

1. **Initial**: All state is null/false
2. **Set match**: `originalMatchData` is set, `canCreateRematch` computed
3. **Creating**: `isCreating` becomes true, `canCreateRematch` becomes false
4. **Success**: `newMatchId` is set, `isCreating` becomes false
5. **Error**: `error` is set, `isCreating` becomes false
6. **Reset**: All state returns to initial values

### State Dependencies

- `canCreateRematch` depends on `originalMatchData` and `isCreating`
- `newMatchId` is set after successful `createRematch`
- `error` is cleared when `setOriginalMatch` is called

## Testing

### Unit Tests

The composable includes comprehensive tests covering:

- Initial state validation
- State transitions
- Error handling
- Edge cases
- Integration scenarios

### Test Examples

```typescript
describe('useRematch', () => {
  it('should create rematch successfully', async () => {
    const { createRematch, setOriginalMatch } = useRematch()
    setOriginalMatch(mockMatchData)
    
    const result = await createRematch({
      originalMatchId: 'match1',
      currentUserId: 'player1',
      currentUserName: 'Player 1'
    })
    
    expect(result).toBe('new-match-id')
  })
  
  it('should validate user participation', async () => {
    const { createRematch, setOriginalMatch } = useRematch()
    setOriginalMatch(mockMatchData)
    
    await expect(createRematch({
      originalMatchId: 'match1',
      currentUserId: 'player3', // Not in match
      currentUserName: 'Player 3'
    })).rejects.toThrow('You were not part of the original match')
  })
})
```

## Best Practices

### 1. Error Handling

Always handle errors when calling rematch methods:

```typescript
try {
  await navigateToRematch(options)
} catch (err) {
  // Show user-friendly error message
  showError('Failed to create rematch. Please try again.')
}
```

### 2. Loading States

Use `isCreating` to show loading states:

```vue
<button :disabled="isCreating">
  <span v-if="isCreating">Creating...</span>
  <span v-else>Play Again</span>
</button>
```

### 3. State Cleanup

Reset state when component unmounts:

```typescript
onUnmounted(() => {
  reset()
})
```

### 4. Validation

Check `canCreateRematch` before allowing rematch creation:

```vue
<button :disabled="!canCreateRematch">
  Play Again
</button>
```

### 5. User Feedback

Provide clear feedback for all actions:

```typescript
const handleRematch = async () => {
  try {
    await navigateToRematch(options)
    showSuccess('Rematch created!')
  } catch (err) {
    showError('Failed to create rematch')
  }
}
```

## Integration Points

### Firebase Integration

- Uses `createMatch` from `@/firebase/matchHelpers`
- Creates new Firestore documents
- Maintains player relationships

### Router Integration

- Uses Vue Router for navigation
- Navigates to `/lobby/:matchId` after creation
- Handles navigation errors gracefully

### Clipboard Integration

- Uses `navigator.clipboard.writeText`
- Provides fallback for unsupported browsers
- Returns success/failure status

## Performance Considerations

### Memory Management

- State is reactive and automatically cleaned up
- `reset()` method clears all references
- No memory leaks from subscriptions

### Network Optimization

- Single Firebase call per rematch creation
- No unnecessary re-renders
- Efficient state updates

### User Experience

- Immediate feedback for all actions
- Loading states prevent double-clicks
- Error messages are user-friendly

## Troubleshooting

### Common Issues

1. **Rematch button disabled**
   - Check `canCreateRematch` value
   - Verify original match data is set
   - Ensure match status is 'completed'

2. **Navigation not working**
   - Check router configuration
   - Verify match ID is valid
   - Ensure Firebase permissions

3. **Clipboard not working**
   - Check browser permissions
   - Verify HTTPS context
   - Provide fallback for older browsers

### Debug Commands

```typescript
// Check current state
console.log('Can create rematch:', canCreateRematch.value)
console.log('Original match:', originalMatchData.value)
console.log('Is creating:', isCreating.value)

// Test rematch creation
const result = await createRematch(options)
console.log('Rematch result:', result)
```

## Future Enhancements

### Potential Features

1. **Rematch history**: Track previous rematches
2. **Auto-join**: Automatically join rematch as second player
3. **Rematch settings**: Customize game settings for rematch
4. **Rematch notifications**: Notify opponent of rematch creation
5. **Rematch analytics**: Track rematch success rates

### API Extensions

```typescript
// Future interface extensions
interface RematchOptions {
  // ... existing properties
  autoJoin?: boolean
  customSettings?: GameSettings
  notifyOpponent?: boolean
}

interface RematchHistory {
  originalMatchId: string
  rematchIds: string[]
  totalRematches: number
}
```

The `useRematch` composable provides a robust foundation for rematch functionality with comprehensive error handling, state management, and user experience considerations. 