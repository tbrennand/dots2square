# Reaction Panel

The Reaction Panel system allows players to send emoji reactions during multiplayer games, enhancing the social experience and communication between players.

## Overview

The reaction system consists of:
- **ReactionPanel.vue**: UI component for sending and displaying reactions
- **useReactions.ts**: Composable for managing reactions with Firebase integration
- Real-time reaction updates across all players
- Spam protection and rate limiting
- Animated reaction bubbles

## Components

### ReactionPanel.vue

A Vue component that provides the UI for sending and displaying emoji reactions.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `matchId` | `string` | - | ID of the current match |
| `currentUserId` | `string` | - | ID of the current user |
| `currentUserName` | `string` | - | Name of the current user |
| `canSendReactions` | `boolean` | `true` | Whether reactions can be sent |
| `reactions` | `Reaction[]` | `[]` | Array of reactions to display |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `reaction-sent` | `Reaction` | Emitted when a reaction is sent |
| `reaction-received` | `Reaction` | Emitted when a reaction is received |

#### Features

- **Reaction Picker**: Dropdown with 20+ emoji options
- **Quick Reactions**: 4 commonly used emojis for quick access
- **Reaction Display**: Shows recent reactions with player names
- **Own Reactions**: Highlights reactions sent by the current player
- **Animations**: Bounce animation for new reactions
- **Responsive Design**: Works on mobile and desktop

### useReactions.ts

A composable that manages reaction state and Firebase integration.

#### Interface

```typescript
interface Reaction {
  id: string
  emoji: string
  playerId: string
  playerName: string
  timestamp: Date
  matchId: string
}

interface ReactionOptions {
  matchId: string
  currentUserId: string
  currentUserName: string
  maxReactions?: number
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `reactions` | `ComputedRef<Reaction[]>` | All reactions for the match |
| `recentReactions` | `ComputedRef<Reaction[]>` | Last 10 reactions (most recent first) |
| `playerReactions` | `ComputedRef<Reaction[]>` | Reactions sent by current player |
| `isLoading` | `ComputedRef<boolean>` | Whether a reaction is being sent |
| `error` | `ComputedRef<string \| null>` | Current error message |
| `canSendReaction` | `ComputedRef<boolean>` | Whether player can send reactions |
| `sendReaction` | `(emoji: string) => Promise<boolean>` | Send a reaction |
| `clearError` | `() => void` | Clear error message |
| `reset` | `() => void` | Reset all state |

## Usage Examples

### Basic Usage

```vue
<template>
  <ReactionPanel
    :match-id="matchId"
    :current-user-id="currentUserId"
    :current-user-name="currentUserName"
    :can-send-reactions="true"
    :reactions="reactions"
    @reaction-sent="handleReactionSent"
    @reaction-received="handleReactionReceived"
  />
</template>

<script setup>
import ReactionPanel from '@/components/ReactionPanel.vue'
import { useReactions } from '@/composables/useReactions'

const props = defineProps<{
  matchId: string
  currentUserId: string
  currentUserName: string
}>()

const {
  reactions,
  sendReaction,
  error,
  isLoading
} = useReactions({
  matchId: props.matchId,
  currentUserId: props.currentUserId,
  currentUserName: props.currentUserName
})

const handleReactionSent = (reaction) => {
  console.log('Reaction sent:', reaction)
}

const handleReactionReceived = (reaction) => {
  console.log('Reaction received:', reaction)
}
</script>
```

### Integration with GameBoard

```vue
<template>
  <div class="game-board">
    <!-- Game content -->
    <div class="game-area">
      <DotGrid :grid-size="gridSize" :drawn-lines="lines" />
    </div>
    
    <!-- Reaction panel -->
    <div class="reaction-area">
      <ReactionPanel
        :match-id="matchId"
        :current-user-id="currentUserId"
        :current-user-name="currentUserName"
        :can-send-reactions="canSendReactions"
        :reactions="reactions"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ReactionPanel from '@/components/ReactionPanel.vue'
import { useReactions } from '@/composables/useReactions'

// ... existing game logic ...

const canSendReactions = computed(() => {
  // Only allow reactions during active gameplay
  return matchStore.status === 'active' && !isGameOver.value
})

const { reactions } = useReactions({
  matchId: matchId.value,
  currentUserId: currentUserId.value,
  currentUserName: currentUserName.value
})
</script>
```

### Custom Reaction Handling

```vue
<script setup>
import { useReactions } from '@/composables/useReactions'

const {
  sendReaction,
  canSendReaction,
  error,
  clearError
} = useReactions(options)

// Custom reaction handler
const handleCustomReaction = async (emoji) => {
  const success = await sendReaction(emoji)
  
  if (success) {
    // Show success feedback
    showToast(`Reaction sent: ${emoji}`)
  } else {
    // Show error feedback
    showToast(error.value || 'Failed to send reaction')
  }
}

// Clear errors when needed
const dismissError = () => {
  clearError()
}
</script>
```

## Available Emojis

### Full Emoji Set (20 emojis)
```
😊 😂 😍 🤔 😎 😢 😡 🤯 🎉 👏
👍 👎 ❤️ 💪 🔥 💯 🎯 🏆 🤝 🙏
```

### Quick Reactions (4 emojis)
```
👍 ❤️ 🎉 😊
```

## Features

### Real-time Updates
- Reactions are synchronized across all players in real-time
- Uses Firebase Firestore for data persistence
- Automatic subscription management

### Spam Protection
- Maximum 3 reactions per 5 seconds per player
- Rate limiting prevents reaction spam
- Automatic cleanup of old reactions

### User Experience
- Animated reaction bubbles
- Visual distinction for own reactions
- Responsive design for mobile devices
- Click-outside-to-close picker

### Error Handling
- Network error recovery
- Firebase connection issues
- User-friendly error messages
- Automatic retry mechanisms

## Firebase Integration

### Firestore Collection: `reactions`

Document structure:
```typescript
{
  emoji: string
  playerId: string
  playerName: string
  matchId: string
  timestamp: Timestamp
}
```

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reactions/{reactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.resource.data.playerId == request.auth.uid
        && request.resource.data.matchId.matches('^[a-zA-Z0-9_-]+$');
      allow delete: if false; // No deletion allowed
    }
  }
}
```

## Styling

### CSS Classes

The component uses Tailwind CSS classes and custom CSS:

```css
.reaction-panel {
  @apply relative flex flex-col gap-3;
}

.reaction-bubble {
  @apply flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full text-sm;
}

.reaction-bubble.own-reaction {
  @apply bg-green-100;
}

.reaction-picker {
  @apply relative;
}

.reaction-grid {
  @apply absolute bottom-full left-0 mb-2 p-2 bg-white border rounded-lg shadow-lg;
}
```

### Customization

You can customize the appearance by overriding CSS classes:

```vue
<style scoped>
/* Custom reaction bubble colors */
.reaction-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Custom picker styling */
.reaction-grid {
  background: #1a1a1a;
  border-color: #333;
}
</style>
```

## Testing

### Unit Tests

The `useReactions` composable includes comprehensive tests:

```typescript
describe('useReactions', () => {
  it('should send reaction successfully', async () => {
    const { sendReaction } = useReactions(mockOptions)
    const result = await sendReaction('👍')
    expect(result).toBe(true)
  })

  it('should prevent spam reactions', async () => {
    const { sendReaction, canSendReaction } = useReactions(mockOptions)
    
    // Send 3 reactions quickly
    await sendReaction('👍')
    await sendReaction('❤️')
    await sendReaction('🎉')
    
    // Fourth should be blocked
    const result = await sendReaction('😊')
    expect(result).toBe(false)
    expect(canSendReaction.value).toBe(false)
  })
})
```

### Integration Testing

Test the full reaction flow:

```typescript
describe('ReactionPanel Integration', () => {
  it('should display reactions from other players', async () => {
    // Mock Firebase subscription
    // Send reaction from another player
    // Verify reaction appears in UI
  })

  it('should handle network errors gracefully', async () => {
    // Mock Firebase error
    // Verify error message is displayed
    // Verify retry functionality works
  })
})
```

## Performance Considerations

### Optimization
- Reactions are limited to last 50 by default
- Automatic cleanup of old reactions
- Efficient Firebase queries with indexing
- Minimal re-renders with Vue reactivity

### Memory Management
- Automatic subscription cleanup
- No memory leaks from event listeners
- Efficient state management

### Network Efficiency
- Single Firebase call per reaction
- Optimized Firestore queries
- Real-time updates without polling

## Best Practices

### 1. Error Handling
Always handle reaction errors gracefully:

```typescript
const handleReaction = async (emoji) => {
  try {
    const success = await sendReaction(emoji)
    if (!success) {
      showError('Failed to send reaction')
    }
  } catch (err) {
    showError('Network error')
  }
}
```

### 2. User Feedback
Provide clear feedback for all actions:

```vue
<template>
  <div v-if="isLoading" class="loading-indicator">
    Sending reaction...
  </div>
  
  <div v-if="error" class="error-message">
    {{ error }}
    <button @click="clearError">Dismiss</button>
  </div>
</template>
```

### 3. Accessibility
Ensure reactions are accessible:

```vue
<button
  @click="sendReaction(emoji)"
  :aria-label="`Send ${emoji} reaction`"
  :title="`Send ${emoji} reaction`"
>
  {{ emoji }}
</button>
```

### 4. Mobile Optimization
Consider mobile users:

```css
@media (max-width: 640px) {
  .reaction-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .reaction-option {
    width: 2rem;
    height: 2rem;
  }
}
```

## Troubleshooting

### Common Issues

1. **Reactions not appearing**
   - Check Firebase connection
   - Verify match ID is correct
   - Check Firestore security rules

2. **Can't send reactions**
   - Check rate limiting (3 per 5 seconds)
   - Verify user authentication
   - Check network connection

3. **Performance issues**
   - Reduce maxReactions limit
   - Check Firebase query optimization
   - Monitor memory usage

### Debug Commands

```typescript
// Check current state
console.log('Can send reaction:', canSendReaction.value)
console.log('Total reactions:', reactions.value.length)
console.log('Recent reactions:', recentReactions.value)

// Test reaction sending
const success = await sendReaction('👍')
console.log('Reaction sent:', success)
```

## Future Enhancements

### Potential Features

1. **Reaction Categories**: Group emojis by category
2. **Custom Reactions**: Allow custom emoji uploads
3. **Reaction History**: View all reactions for a match
4. **Reaction Analytics**: Track most used reactions
5. **Sound Effects**: Audio feedback for reactions
6. **Reaction Animations**: More elaborate animations
7. **Reaction Moderation**: Admin controls for inappropriate reactions

### API Extensions

```typescript
interface ReactionOptions {
  // ... existing properties
  enableSound?: boolean
  customEmojis?: string[]
  moderationEnabled?: boolean
  maxReactionsPerPlayer?: number
}

interface ReactionAnalytics {
  totalReactions: number
  mostUsedEmoji: string
  reactionsByPlayer: Record<string, number>
  reactionsByTime: Array<{ time: Date; count: number }>
}
```

The Reaction Panel system provides a robust foundation for social interaction in multiplayer games with comprehensive error handling, performance optimization, and extensibility for future enhancements. 