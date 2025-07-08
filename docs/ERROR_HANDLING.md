# Error Handling and Loading States

This document describes the comprehensive error handling and loading states implemented in `GameBoard.vue` for the Dots to Squares multiplayer game.

## 🎯 Overview

The `GameBoard.vue` component now includes robust error handling for three critical scenarios:
- **Match not found**
- **Opponent disconnects**
- **Firestore write failures**

Plus enhanced loading states and connection monitoring.

## 📋 Error Scenarios

### 1. Match Not Found
**Trigger:** When a match ID is invalid or the match has been deleted

**User Experience:**
- Clear error message: "Match not found or has been deleted"
- Action button: "Go Home" to return to the main menu
- Visual indicator with warning icon

**Technical Implementation:**
```typescript
// Error detection
if (result.error?.includes('not found')) {
  errorType.value = 'match-not-found'
  matchStore.error = 'Match not found or has been deleted.'
}

// UI Response
<div v-if="errorType === 'match-not-found'" class="error-container">
  <div class="error-icon">⚠️</div>
  <h2>Match Not Found</h2>
  <p>{{ error }}</p>
  <button @click="goHome" class="btn-primary">Go Home</button>
</div>
```

### 2. Opponent Disconnects
**Trigger:** When the opponent player leaves the game or loses connection

**User Experience:**
- Warning notification: "Opponent has disconnected. Waiting for reconnection..."
- Option to wait for reconnection or go home
- Progressive messaging (5s, 10s timeouts)
- Connection status indicator

**Technical Implementation:**
```typescript
// Detection via player count monitoring
watch(players, (newPlayers, oldPlayers) => {
  if (oldPlayers && newPlayers.length < oldPlayers.length) {
    showConnectionWarning.value = true
    connectionWarningMessage.value = 'Opponent has disconnected. Waiting for reconnection...'
    
    // Progressive messaging
    setTimeout(() => {
      if (showConnectionWarning.value) {
        connectionWarningMessage.value = 'Opponent is still disconnected. You can wait or go home.'
      }
    }, 5000)
  }
})
```

### 3. Firestore Write Failures
**Trigger:** When moves fail to save due to network issues or permissions

**User Experience:**
- Error message: "Failed to save move. Please check your connection and try again."
- Retry button to attempt reconnection
- Connection status monitoring
- Move processing overlay during attempts

**Technical Implementation:**
```typescript
// Error detection in move handling
if (result.error?.includes('permission') || result.error?.includes('write')) {
  errorType.value = 'firestore-error'
  matchStore.error = 'Failed to save move. Please check your connection and try again.'
}

// Connection check before moves
if (!isConnected.value) {
  showConnectionWarning.value = true
  connectionWarningMessage.value = 'No connection to server. Please check your internet connection.'
  return
}
```

## 🔄 Loading States

### Enhanced Loading Experience
**Features:**
- Progress bar with percentage
- Dynamic loading messages
- Smooth transitions
- Connection status indicators

**Implementation:**
```typescript
// Progressive loading messages
const messageInterval = setInterval(() => {
  if (loadingProgress.value < 30) {
    loadingMessage.value = 'Connecting to game...'
  } else if (loadingProgress.value < 60) {
    loadingMessage.value = 'Loading match data...'
  } else if (loadingProgress.value < 90) {
    loadingMessage.value = 'Setting up game board...'
  }
}, 600)
```

### Loading UI Components
```vue
<div v-if="isLoading" class="loading-container">
  <div class="loading-spinner"></div>
  <p>{{ loadingMessage }}</p>
  <div v-if="loadingProgress" class="loading-progress">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
    </div>
    <span>{{ loadingProgress }}%</span>
  </div>
</div>
```

## 📡 Connection Monitoring

### Real-time Connection Status
**Features:**
- Live connection indicator in header
- Connection status card in side panel
- Automatic reconnection attempts
- Last update timestamp

**Implementation:**
```typescript
// Connection status monitoring
watch(isConnected, (connected) => {
  if (!connected && matchData.value) {
    showConnectionWarning.value = true
    connectionWarningMessage.value = 'Lost connection to server. Attempting to reconnect...'
  } else if (connected) {
    showConnectionWarning.value = false
    connectionWarningMessage.value = ''
  }
})
```

### Connection Status UI
```vue
<!-- Header connection indicator -->
<span v-if="!isConnected" class="connection-status disconnected">Disconnected</span>
<span v-else class="connection-status connected">Connected</span>

<!-- Connection status card -->
<div class="connection-status-card">
  <h3>Connection Status</h3>
  <div class="status-grid">
    <div class="status-item">
      <span class="label">Firebase:</span>
      <span :class="['status-indicator', isConnected ? 'connected' : 'disconnected']">
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </span>
    </div>
    <div class="status-item">
      <span class="label">Players:</span>
      <span class="value">{{ players.length }}/2</span>
    </div>
    <div class="status-item">
      <span class="label">Last Update:</span>
      <span class="value">{{ lastUpdateTime }}</span>
    </div>
  </div>
</div>
```

## 🚨 Error Recovery Actions

### Error-Specific Actions
Each error type provides appropriate recovery options:

1. **Match Not Found**
   - Action: "Go Home"
   - Behavior: Navigate to home screen

2. **Opponent Disconnected**
   - Action: "Wait for Reconnection"
   - Behavior: Continue waiting with progressive messaging

3. **Firestore Error**
   - Action: "Retry Connection"
   - Behavior: Re-subscribe to match and retry

### Retry Logic
```typescript
const retryConnection = () => {
  if (currentMatchId.value) {
    matchStore.clearError()
    matchStore.subscribeToMatchById(currentMatchId.value)
  }
}
```

## 🎨 Visual Design

### Error States
- **Warning Icon:** ⚠️ for general errors
- **Color Coding:** Red for errors, orange for warnings, green for success
- **Progressive Disclosure:** Show most relevant action first
- **Responsive Design:** Adapts to mobile and desktop

### Loading States
- **Spinner Animation:** Smooth rotating animation
- **Progress Bar:** Visual progress indication
- **Dynamic Messages:** Context-aware loading text
- **Smooth Transitions:** CSS transitions for state changes

### Connection Warnings
- **Fixed Position:** Top-right corner notification
- **Dismissible:** User can dismiss warnings
- **Auto-hide:** Automatically hides when connection restored
- **Progressive Messaging:** Updates message over time

## 🔧 Configuration

### Error Types
```typescript
type ErrorType = 'match-not-found' | 'opponent-disconnected' | 'firestore-error' | 'unknown'
```

### Loading Configuration
```typescript
const loadingConfig = {
  progressInterval: 200,    // ms between progress updates
  messageInterval: 600,     // ms between message updates
  maxProgress: 90,         // maximum progress before completion
  completionDelay: 500     // ms to show 100% before hiding
}
```

### Connection Timeouts
```typescript
const connectionTimeouts = {
  opponentReconnect: 5000,  // ms before showing reconnection message
  connectionWarning: 10000, // ms before showing persistent warning
  retryDelay: 2000         // ms between retry attempts
}
```

## 🧪 Testing

### Error Scenarios to Test
1. **Invalid Match ID**
   - Navigate to `/game/invalid-id`
   - Verify "Match Not Found" error

2. **Network Disconnection**
   - Disconnect internet during game
   - Verify connection warning appears
   - Reconnect and verify recovery

3. **Firestore Write Failure**
   - Simulate permission errors
   - Verify retry functionality
   - Test move processing overlay

4. **Opponent Disconnect**
   - Have opponent leave game
   - Verify disconnect detection
   - Test reconnection waiting

### Test Commands
```bash
# Test error handling
npm run test:e2e -- --spec "cypress/e2e/error-handling.cy.ts"

# Test connection scenarios
npm run test:e2e -- --spec "cypress/e2e/connection-testing.cy.ts"
```

## 🚀 Best Practices

### Error Handling
1. **Be Specific:** Provide clear, actionable error messages
2. **Offer Recovery:** Always provide a way to recover from errors
3. **Progressive Disclosure:** Show most important actions first
4. **User-Friendly Language:** Avoid technical jargon

### Loading States
1. **Show Progress:** Always indicate progress when possible
2. **Context-Aware Messages:** Update messages based on current step
3. **Smooth Transitions:** Use CSS transitions for state changes
4. **Timeout Handling:** Don't let loading states hang indefinitely

### Connection Monitoring
1. **Real-time Updates:** Monitor connection status continuously
2. **Graceful Degradation:** Handle disconnections gracefully
3. **Auto-recovery:** Attempt automatic reconnection when possible
4. **User Control:** Allow users to dismiss warnings and take action

## 📈 Monitoring and Analytics

### Error Tracking
Track error occurrences to identify patterns:
- Error type frequency
- Recovery success rates
- User behavior after errors

### Performance Metrics
Monitor loading performance:
- Average loading times
- Connection stability
- User engagement during errors

---

**Implementation Status:** ✅ Complete

The enhanced error handling provides a robust user experience that gracefully handles network issues, opponent disconnections, and other common multiplayer game problems. 