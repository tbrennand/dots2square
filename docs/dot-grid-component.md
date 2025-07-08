# DotGrid Component Documentation

The `DotGrid` component is a reusable Vue 3 component that renders a dots and squares game grid with interactive line drawing and square highlighting capabilities.

## Features

- ✅ **Configurable Grid Size**: Accepts grid size as a prop
- ✅ **Drawn Lines Display**: Shows existing lines with player colors
- ✅ **Claimed Squares Highlighting**: Displays completed squares with player colors
- ✅ **Interactive Line Selection**: Emits events when lines are clicked
- ✅ **Hover Effects**: Visual feedback for possible moves
- ✅ **Responsive Design**: Scales appropriately with grid size

## Props

### `gridSize` (optional)
- **Type**: `number`
- **Default**: `5`
- **Description**: The size of the grid (e.g., 5 creates a 5x5 grid)

### `drawnLines` (optional)
- **Type**: `Line[]`
- **Default**: `[]`
- **Description**: Array of lines that have been drawn

```typescript
interface Line {
  id: string
  startDot: string
  endDot: string
  player?: number
}
```

### `claimedSquares` (optional)
- **Type**: `Square[]`
- **Default**: `[]`
- **Description**: Array of squares that have been claimed by players

```typescript
interface Square {
  id: string
  topLeftX: number
  topLeftY: number
  player?: number
}
```

## Events

### `line-selected`
- **Payload**: `{ startDot: string; endDot: string }`
- **Description**: Emitted when a user clicks on a possible line or selects a line to draw

## Usage Examples

### Basic Usage
```vue
<template>
  <DotGrid 
    :grid-size="5"
    :drawn-lines="gameLines"
    :claimed-squares="gameSquares"
    @line-selected="handleLineSelected"
  />
</template>

<script setup>
import DotGrid from '@/components/DotGrid.vue'

const gameLines = ref([])
const gameSquares = ref([])

const handleLineSelected = (line) => {
  console.log('Line selected:', line)
  // Handle the line selection (e.g., make a move)
}
</script>
```

### With Game State
```vue
<template>
  <div class="game-container">
    <DotGrid
      :grid-size="gridSize"
      :drawn-lines="matchData.lines || []"
      :claimed-squares="matchData.squares || []"
      @line-selected="playMove"
    />
    
    <div class="game-info">
      <p>Current Turn: {{ matchData.currentTurn }}</p>
      <p>Player 1 Score: {{ matchData.scores?.[1] || 0 }}</p>
      <p>Player 2 Score: {{ matchData.scores?.[2] || 0 }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DotGrid from '@/components/DotGrid.vue'
import { playMove as playMoveAction } from '@/firebase/matchHelpers'

const gridSize = ref(5)
const matchData = ref({
  lines: [],
  squares: [],
  currentTurn: 1,
  scores: { 1: 0, 2: 0 }
})

const playMove = async (line) => {
  try {
    const result = await playMoveAction('match-id', 'player-id', line)
    if (result.success) {
      console.log('Move played successfully!')
    }
  } catch (error) {
    console.error('Failed to play move:', error)
  }
}
</script>
```

## Data Format

### Dot IDs
Dots are identified by their grid coordinates in the format `"row-column"`:
- `"0-0"` = top-left corner
- `"2-3"` = row 2, column 3
- `"4-4"` = bottom-right corner (in a 5x5 grid)

### Line Format
Lines connect two dots:
```typescript
{
  id: "0-0-0-1",        // Unique identifier
  startDot: "0-0",      // Starting dot ID
  endDot: "0-1",        // Ending dot ID
  player: 1             // Player who drew the line (optional)
}
```

### Square Format
Squares are identified by their top-left corner:
```typescript
{
  id: "0-0",            // Square ID (top-left dot coordinates)
  topLeftX: 0,          // X coordinate of top-left corner
  topLeftY: 0,          // Y coordinate of top-left corner
  player: 1             // Player who claimed the square (optional)
}
```

## Player Colors

The component automatically assigns colors to players:
- **Player 1**: Blue (`#3b82f6`)
- **Player 2**: Red (`#ef4444`)
- **No Player**: Gray (`#9ca3af`)

## Styling

The component uses Tailwind CSS classes and includes:
- Responsive grid sizing
- Hover effects for interactive elements
- Smooth transitions
- Player color coding
- Visual feedback for possible moves

### Custom Styling
You can customize the appearance by overriding CSS classes:

```vue
<style scoped>
/* Custom dot styling */
.dot-grid .dot {
  fill: #your-color;
}

/* Custom line styling */
.dot-grid .drawn-line {
  stroke-width: 4;
}

/* Custom square styling */
.dot-grid .claimed-square {
  opacity: 0.5;
}
</style>
```

## Integration with Firebase

The component works seamlessly with your Firebase game helpers:

```vue
<script setup>
import { subscribeToMatch } from '@/firebase/matchHelpers'
import { useMatchSubscription } from '@/composables/useMatchSubscription'

const matchId = 'your-match-id'

// Subscribe to match updates
const { matchData, loading, error } = useMatchSubscription(matchId, {
  onUpdate: (data) => {
    console.log('Match updated:', data)
  }
})
</script>

<template>
  <DotGrid
    v-if="!loading && matchData"
    :grid-size="matchData.gridSize || 5"
    :drawn-lines="matchData.lines || []"
    :claimed-squares="matchData.squares || []"
    @line-selected="handleMove"
  />
</template>
```

## Performance Considerations

- The component efficiently renders only visible elements
- Grid generation is memoized using computed properties
- Line and square lookups are optimized
- Hover effects use CSS transitions for smooth performance

## Browser Support

- Modern browsers with SVG support
- Vue 3.0+
- Tailwind CSS (for styling)

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast color scheme
- Focus indicators for interactive elements 