# ScoreCard Component Enhancement

## Overview

The `ScoreCard.vue` component has been significantly enhanced to display both player names and square counts with live updates, providing a comprehensive view of the game state.

## New Features

### ✅ Player Information Display
- **Player Names**: Shows actual player names instead of generic "Player 1/2"
- **Player IDs**: Displays truncated player IDs for identification
- **Turn Indicators**: Visual indicators showing whose turn it is

### ✅ Live Square Counts
- **Real-time Updates**: Square counts update automatically as players claim squares
- **Progress Bar**: Visual progress indicator showing game completion
- **Detailed Statistics**: Shows claimed vs total squares

### ✅ Enhanced Visual Design
- **Current Turn Highlighting**: Active player is highlighted with blue border
- **Winner Announcement**: Animated trophy icon and winner display
- **Game Status**: Shows current game status (waiting, active, completed, cancelled)
- **Responsive Design**: Optimized for all screen sizes

## Props Interface

```typescript
interface Props {
  scores: Record<number, number>           // Player scores
  gameOver: boolean                        // Game completion status
  winner: number | 'tie' | null           // Winner (1, 2, 'tie', or null)
  currentTurn?: number                     // Current player's turn
  player1?: Player                        // Player 1 data
  player2?: Player                        // Player 2 data
  squares?: Square[]                      // Game squares array
  gridSize?: number                       // Grid size for calculations
  status?: 'waiting' | 'active' | 'completed' | 'cancelled'
}

interface Player {
  id: string
  name: string
  joinedAt: Date
}

interface Square {
  id: string
  topLeftX: number
  topLeftY: number
  player?: number
  lines: string[]
}
```

## Component Structure

### Player Score Display
```vue
<div class="player-score" :class="{ 
  winner: winner === 1, 
  current: currentTurn === 1 && !gameOver 
}">
  <div class="player-info">
    <div class="player-name">
      {{ getPlayerName(1) }}
      <span v-if="currentTurn === 1 && !gameOver" class="turn-indicator">←</span>
    </div>
    <div class="player-id">{{ getPlayerId(1) }}</div>
  </div>
  <div class="score-info">
    <div class="score">{{ scores[1] || 0 }}</div>
    <div class="score-label">squares</div>
  </div>
</div>
```

### Game Progress Bar
```vue
<div class="game-progress">
  <div class="progress-bar">
    <div 
      class="progress-fill" 
      :style="{ width: `${getProgressPercentage()}%` }"
    ></div>
  </div>
  <div class="progress-text">
    {{ getClaimedSquares() }} / {{ getTotalSquares() }} squares claimed
  </div>
</div>
```

### Winner Announcement
```vue
<div v-if="gameOver && winner" class="winner-announcement">
  <div class="winner-icon">🏆</div>
  <div class="winner-text">
    {{ winner === 'tie' ? "It's a tie!" : `${getPlayerName(winner)} wins!` }}
  </div>
</div>
```

## Key Functions

### Player Information
```typescript
// Get player name by player number
const getPlayerName = (playerNumber: number): string => {
  if (playerNumber === 1 && props.player1) {
    return props.player1.name
  }
  if (playerNumber === 2 && props.player2) {
    return props.player2.name
  }
  return `Player ${playerNumber}`
}

// Get player ID by player number
const getPlayerId = (playerNumber: number): string => {
  if (playerNumber === 1 && props.player1) {
    return props.player1.id.slice(0, 8) + '...'
  }
  if (playerNumber === 2 && props.player2) {
    return props.player2.id.slice(0, 8) + '...'
  }
  return 'Unknown'
}
```

### Game Progress Calculations
```typescript
// Get total number of squares
const getTotalSquares = (): number => {
  if (!props.gridSize) return 0
  return (props.gridSize - 1) * (props.gridSize - 1)
}

// Get number of claimed squares
const getClaimedSquares = (): number => {
  if (!props.squares) return 0
  return props.squares.filter(square => square.player !== undefined).length
}

// Get progress percentage
const getProgressPercentage = (): number => {
  const total = getTotalSquares()
  const claimed = getClaimedSquares()
  return total > 0 ? (claimed / total) * 100 : 0
}
```

### Status Management
```typescript
// Get status class for styling
const getStatusClass = (): string => {
  switch (props.status) {
    case 'waiting': return 'status-waiting'
    case 'active': return 'status-active'
    case 'completed': return 'status-completed'
    case 'cancelled': return 'status-cancelled'
    default: return 'status-unknown'
  }
}

// Get status text
const getStatusText = (): string => {
  switch (props.status) {
    case 'waiting': return 'Waiting for players...'
    case 'active': return 'Game in progress'
    case 'completed': return 'Game completed'
    case 'cancelled': return 'Game cancelled'
    default: return 'Unknown status'
  }
}
```

## Visual States

### Player Score States
- **Default**: White background with subtle border
- **Current Turn**: Blue border and background with pulsing indicator
- **Winner**: Green border and background with winner styling

### Status Indicators
- **Waiting**: Yellow background - "Waiting for players..."
- **Active**: Blue background - "Game in progress"
- **Completed**: Green background - "Game completed"
- **Cancelled**: Red background - "Game cancelled"

### Progress Bar
- **Visual**: Gradient fill from blue to purple
- **Animation**: Smooth width transitions
- **Text**: Shows "X / Y squares claimed"

## Integration with GameBoard

The ScoreCard is integrated into GameBoard.vue with all necessary props:

```vue
<ScoreCard
  :scores="scores"
  :game-over="gameOver"
  :winner="winner"
  :current-turn="currentPlayer"
  :player1="matchData?.player1"
  :player2="matchData?.player2"
  :squares="squares"
  :grid-size="gridSize"
  :status="matchData?.status"
/>
```

## Live Updates

### Real-time Data Flow
1. **Firebase Updates**: Match data changes in Firestore
2. **Pinia Store**: Updates propagate through match store
3. **Component Props**: ScoreCard receives updated props
4. **Reactive Display**: UI updates automatically

### Update Triggers
- **Square Claims**: When players complete squares
- **Turn Changes**: When turn switches between players
- **Game Completion**: When all squares are claimed
- **Status Changes**: When game status updates

## Styling Features

### Animations
- **Turn Indicator**: Pulsing arrow for current player
- **Winner Icon**: Bouncing trophy animation
- **Progress Bar**: Smooth width transitions
- **Score Updates**: Smooth transitions for score changes

### Responsive Design
- **Desktop**: Full layout with all details
- **Tablet**: Optimized spacing and sizing
- **Mobile**: Compact layout with essential info

### Color Scheme
- **Primary**: Blue (#3b82f6) for current turn
- **Success**: Green (#22c55e) for winners
- **Warning**: Yellow (#f59e0b) for waiting
- **Error**: Red (#ef4444) for cancelled games

## Usage Examples

### Basic Usage
```vue
<ScoreCard
  :scores="{ 1: 3, 2: 2 }"
  :game-over="false"
  :winner="null"
  :current-turn="1"
/>
```

### With Player Data
```vue
<ScoreCard
  :scores="{ 1: 5, 2: 3 }"
  :game-over="true"
  :winner="1"
  :current-turn="1"
  :player1="{ id: 'user123', name: 'Alice', joinedAt: new Date() }"
  :player2="{ id: 'user456', name: 'Bob', joinedAt: new Date() }"
  :squares="gameSquares"
  :grid-size="5"
  :status="'completed'"
/>
```

## Performance Considerations

### Optimization Features
- **Computed Properties**: Efficient calculations for progress and statistics
- **Conditional Rendering**: Only render relevant sections
- **Smooth Animations**: CSS transitions for better UX
- **Memory Efficient**: No unnecessary re-renders

### Update Efficiency
- **Reactive Props**: Automatic updates when props change
- **Minimal Recalculations**: Cached values where possible
- **Efficient Filtering**: Quick square counting algorithms

## Accessibility

### Screen Reader Support
- **Semantic HTML**: Proper heading structure
- **ARIA Labels**: Descriptive labels for interactive elements
- **Status Announcements**: Clear status messages

### Keyboard Navigation
- **Focus Indicators**: Visible focus states
- **Logical Tab Order**: Intuitive navigation flow
- **Keyboard Shortcuts**: Support for keyboard interactions

## Future Enhancements

### Planned Features
1. **Player Avatars**: Display player profile pictures
2. **Score Animations**: Animated score changes
3. **Sound Effects**: Audio feedback for updates
4. **Custom Themes**: User-selectable color schemes
5. **Statistics**: Detailed player statistics and history

### Technical Improvements
1. **Performance Monitoring**: Track render performance
2. **Memory Optimization**: Reduce memory footprint
3. **Bundle Size**: Optimize component size
4. **Testing**: Comprehensive unit and integration tests

The enhanced ScoreCard component provides a rich, interactive display of game state with real-time updates and excellent user experience. 