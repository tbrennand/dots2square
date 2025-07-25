<template>
  <div class="dot-grid-container" :style="gridStyle">
    <!-- Dots -->
    <div v-for="dot in dots" :key="dot.id" class="dot" :style="{ top: `${dot.y * 100}px`, left: `${dot.x * 100}px` }"></div>
    
    <!-- Potential Lines (for hover effect) -->
    <div
      v-for="line in potentialLines"
      :key="line.id"
      :id="line.id"
      class="line-container potential"
      @click="selectLine(line)"
      @mouseenter="hoverLine = line.id"
      @mouseleave="hoverLine = null"
      :class="{ 'disabled': !canMakeMove }"
    >
      <div class="line-hitbox"></div>
      <div class="line-visual" :class="{ 'line-hover': hoverLine === line.id && canMakeMove }"></div>
    </div>

    <!-- Drawn Lines -->
    <div v-for="line in drawnLines" :key="line.id" :id="line.id" class="line-container drawn">
      <div class="line-visual line-drawn" :class="{ 'player1-line': line.player === 1, 'player2-line': line.player === 2 }"></div>
    </div>
    
    <!-- Claimed Squares -->
    <div v-for="square in claimedSquares" :key="square.id" class="square" :style="squareStyle(square)">
      <span class="text-4xl">{{ square.player === 1 ? '✏️' : '🎨' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Define interfaces for the component
interface Dot {
  id: string
  x: number
  y: number
}

interface Line {
  id: string
  startDot: string
  endDot: string
  player?: number
}

interface Square {
  id: string
  topLeftX: number
  topLeftY: number
  player?: number
}

interface PossibleLine {
  id: string
  startDot: string
  endDot: string
}

// Props
const props = defineProps<{
  gridSize?: number
  drawnLines?: Line[]
  claimedSquares?: Square[]
  canMakeMove?: boolean
}>()

// Emits
const emit = defineEmits<{
  'line-selected': [line: { startDot: string; endDot: string }]
}>()

// Component state
const gridSize = props.gridSize || 5
const spacing = 100 // Use 100px to match template
const gridWidth = gridSize * spacing
const gridHeight = gridSize * spacing
const hoverLine = ref<string | null>(null)

// Generate dots based on grid size
const dots = computed(() => {
  const dotsArray: Dot[] = []
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      dotsArray.push({
        id: `${row}-${col}`,
        x: col,
        y: row
      })
    }
  }
  return dotsArray
})

// Grid style computed property
const gridStyle = computed(() => ({
  width: `${gridWidth}px`,
  height: `${gridHeight}px`,
  position: 'relative' as const,
  border: '2px solid #e5e7eb',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  maxWidth: '100%',
  maxHeight: '100%'
}))

// Get drawn lines from props
const drawnLines = computed(() => props.drawnLines || [])

// Get claimed squares from props
const claimedSquares = computed(() => props.claimedSquares || [])

// Generate possible lines (all valid connections between adjacent dots)
const possibleLines = computed(() => {
  const lines: PossibleLine[] = []
  
  // Check if a line already exists
  const lineExists = (startDot: string, endDot: string) => {
    return drawnLines.value.some(line => 
      (line.startDot === startDot && line.endDot === endDot) ||
      (line.startDot === endDot && line.endDot === startDot)
    )
  }
  
  // Generate horizontal lines
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize - 1; col++) {
      const startDot = `${row}-${col}`
      const endDot = `${row}-${col + 1}`
      
      if (!lineExists(startDot, endDot)) {
        lines.push({
          id: `${startDot}-${endDot}`,
          startDot,
          endDot
        })
      }
    }
  }
  
  // Generate vertical lines
  for (let row = 0; row < gridSize - 1; row++) {
    for (let col = 0; col < gridSize; col++) {
      const startDot = `${row}-${col}`
      const endDot = `${row + 1}-${col}`
      
      if (!lineExists(startDot, endDot)) {
        lines.push({
          id: `${startDot}-${endDot}`,
          startDot,
          endDot
        })
      }
    }
  }
  
  return lines
})

// Alias for potentialLines (same as possibleLines)
const potentialLines = computed(() => possibleLines.value)

// Square style method
const squareStyle = (square: Square) => {
  const x = square.topLeftX * spacing
  const y = square.topLeftY * spacing
  const size = spacing - 4 // Slightly smaller than spacing
  
  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`
  }
}

// Select a line and emit the event
const selectLine = (line: PossibleLine) => {
  if (!props.canMakeMove) return
  
  emit('line-selected', {
    startDot: line.startDot,
    endDot: line.endDot
  })
}
</script>

<style scoped>
.dot-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  position: relative;
}

.dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #374151;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.2s ease;
}

.dot:hover {
  background-color: #1f2937;
  cursor: pointer;
  transform: translate(-50%, -50%) scale(1.2);
}

.line-container {
  position: absolute;
  cursor: pointer;
  pointer-events: auto;
}

.line-container.drawn {
  pointer-events: none;
}

.line-container.disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.line-hitbox {
  position: absolute;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 1;
}

.line-visual {
  width: 100%;
  height: 100%;
  background-color: #e5e7eb;
  border-radius: 2px;
  transition: all 0.2s ease;
  opacity: 0.3;
}

.line-visual.line-hover {
  background-color: #f97316;
  opacity: 0.8;
  transform: scale(1.05);
}

.line-drawn {
  background-color: #374151;
  opacity: 1;
}

.player1-line {
  background-color: #3b82f6;
  box-shadow: 0 0 4px rgba(59, 130, 246, 0.4);
}

.player2-line {
  background-color: #f97316;
  box-shadow: 0 0 4px rgba(249, 115, 22, 0.4);
}

.square {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid transparent;
}

.square:hover {
  transform: scale(1.05);
  opacity: 0.8;
}

/* Line positioning for 5x5 grid */
/* Horizontal lines */
[id*="0-0-0-1"] { left: 100px; top: 0px; width: 100px; height: 4px; }
[id*="0-1-0-2"] { left: 200px; top: 0px; width: 100px; height: 4px; }
[id*="0-2-0-3"] { left: 300px; top: 0px; width: 100px; height: 4px; }
[id*="0-3-0-4"] { left: 400px; top: 0px; width: 100px; height: 4px; }

[id*="1-0-1-1"] { left: 100px; top: 100px; width: 100px; height: 4px; }
[id*="1-1-1-2"] { left: 200px; top: 100px; width: 100px; height: 4px; }
[id*="1-2-1-3"] { left: 300px; top: 100px; width: 100px; height: 4px; }
[id*="1-3-1-4"] { left: 400px; top: 100px; width: 100px; height: 4px; }

[id*="2-0-2-1"] { left: 100px; top: 200px; width: 100px; height: 4px; }
[id*="2-1-2-2"] { left: 200px; top: 200px; width: 100px; height: 4px; }
[id*="2-2-2-3"] { left: 300px; top: 200px; width: 100px; height: 4px; }
[id*="2-3-2-4"] { left: 400px; top: 200px; width: 100px; height: 4px; }

[id*="3-0-3-1"] { left: 100px; top: 300px; width: 100px; height: 4px; }
[id*="3-1-3-2"] { left: 200px; top: 300px; width: 100px; height: 4px; }
[id*="3-2-3-3"] { left: 300px; top: 300px; width: 100px; height: 4px; }
[id*="3-3-3-4"] { left: 400px; top: 300px; width: 100px; height: 4px; }

[id*="4-0-4-1"] { left: 100px; top: 400px; width: 100px; height: 4px; }
[id*="4-1-4-2"] { left: 200px; top: 400px; width: 100px; height: 4px; }
[id*="4-2-4-3"] { left: 300px; top: 400px; width: 100px; height: 4px; }
[id*="4-3-4-4"] { left: 400px; top: 400px; width: 100px; height: 4px; }

/* Vertical lines */
[id*="0-0-1-0"] { left: 0px; top: 100px; width: 4px; height: 100px; }
[id*="1-0-2-0"] { left: 0px; top: 200px; width: 4px; height: 100px; }
[id*="2-0-3-0"] { left: 0px; top: 300px; width: 4px; height: 100px; }
[id*="3-0-4-0"] { left: 0px; top: 400px; width: 4px; height: 100px; }

[id*="0-1-1-1"] { left: 100px; top: 100px; width: 4px; height: 100px; }
[id*="1-1-2-1"] { left: 100px; top: 200px; width: 4px; height: 100px; }
[id*="2-1-3-1"] { left: 100px; top: 300px; width: 4px; height: 100px; }
[id*="3-1-4-1"] { left: 100px; top: 400px; width: 4px; height: 100px; }

[id*="0-2-1-2"] { left: 200px; top: 100px; width: 4px; height: 100px; }
[id*="1-2-2-2"] { left: 200px; top: 200px; width: 4px; height: 100px; }
[id*="2-2-3-2"] { left: 200px; top: 300px; width: 4px; height: 100px; }
[id*="3-2-4-2"] { left: 200px; top: 400px; width: 4px; height: 100px; }

[id*="0-3-1-3"] { left: 300px; top: 100px; width: 4px; height: 100px; }
[id*="1-3-2-3"] { left: 300px; top: 200px; width: 4px; height: 100px; }
[id*="2-3-3-3"] { left: 300px; top: 300px; width: 4px; height: 100px; }
[id*="3-3-4-3"] { left: 300px; top: 400px; width: 4px; height: 100px; }

[id*="0-4-1-4"] { left: 400px; top: 100px; width: 4px; height: 100px; }
[id*="1-4-2-4"] { left: 400px; top: 200px; width: 4px; height: 100px; }
[id*="2-4-3-4"] { left: 400px; top: 300px; width: 4px; height: 100px; }
[id*="3-4-4-4"] { left: 400px; top: 400px; width: 4px; height: 100px; }

/* Mobile responsiveness */
@media (max-width: 480px) {
  .dot-grid-container {
    padding: 0.5rem;
  }
}

@media (max-width: 768px) {
  .dot-grid-container {
    padding: 0.75rem;
  }
}
</style> 