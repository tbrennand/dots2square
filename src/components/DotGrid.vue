<template>
  <div class="dot-grid-container" :style="gridStyle">
    <!-- Dots -->
    <div v-for="dot in dots" :key="dot.id" class="dot" :style="{ top: `${dot.y * 80}px`, left: `${dot.x * 80}px` }"></div>
    
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
      <span class="square-icon">{{ square.player === 1 ? '✏️' : '🎨' }}</span>
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
const gridSize = props.gridSize || 6
const spacing = 80 // Use 80px for 6x6 grid
const gridWidth = gridSize * spacing
const gridHeight = gridSize * spacing
const hoverLine = ref<string | null>(null)

// Generate dots based on grid size (7x7 dots for 6x6 grid)
const dots = computed(() => {
  const dotsArray: Dot[] = []
  for (let row = 0; row < gridSize + 1; row++) {
    for (let col = 0; col < gridSize + 1; col++) {
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
  background: 'white',
  borderRadius: '1rem',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  border: '2px solid #f1f5f9',
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
  for (let row = 0; row < gridSize + 1; row++) {
    for (let col = 0; col < gridSize; col++) {
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
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize + 1; col++) {
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
  padding: 2rem;
  position: relative;
  margin: 0 auto;
}

.dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #374151, #1f2937);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
}

.dot:hover {
  background: linear-gradient(135deg, #1f2937, #111827);
  cursor: pointer;
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
  border-radius: 3px;
  transition: all 0.3s ease;
  opacity: 0.2;
}

.line-visual.line-hover {
  background: linear-gradient(90deg, #f97316, #ea580c);
  opacity: 0.8;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.line-drawn {
  background-color: #374151;
  opacity: 1;
}

.player1-line {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.player2-line {
  background: linear-gradient(90deg, #f97316, #ea580c);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.square {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.square:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.square-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* Line positioning for 6x6 grid (7x7 dots) */
/* Horizontal lines */
[id*="0-0-0-1"] { left: 80px; top: 0px; width: 80px; height: 4px; }
[id*="0-1-0-2"] { left: 160px; top: 0px; width: 80px; height: 4px; }
[id*="0-2-0-3"] { left: 240px; top: 0px; width: 80px; height: 4px; }
[id*="0-3-0-4"] { left: 320px; top: 0px; width: 80px; height: 4px; }
[id*="0-4-0-5"] { left: 400px; top: 0px; width: 80px; height: 4px; }
[id*="0-5-0-6"] { left: 480px; top: 0px; width: 80px; height: 4px; }

[id*="1-0-1-1"] { left: 80px; top: 80px; width: 80px; height: 4px; }
[id*="1-1-1-2"] { left: 160px; top: 80px; width: 80px; height: 4px; }
[id*="1-2-1-3"] { left: 240px; top: 80px; width: 80px; height: 4px; }
[id*="1-3-1-4"] { left: 320px; top: 80px; width: 80px; height: 4px; }
[id*="1-4-1-5"] { left: 400px; top: 80px; width: 80px; height: 4px; }
[id*="1-5-1-6"] { left: 480px; top: 80px; width: 80px; height: 4px; }

[id*="2-0-2-1"] { left: 80px; top: 160px; width: 80px; height: 4px; }
[id*="2-1-2-2"] { left: 160px; top: 160px; width: 80px; height: 4px; }
[id*="2-2-2-3"] { left: 240px; top: 160px; width: 80px; height: 4px; }
[id*="2-3-2-4"] { left: 320px; top: 160px; width: 80px; height: 4px; }
[id*="2-4-2-5"] { left: 400px; top: 160px; width: 80px; height: 4px; }
[id*="2-5-2-6"] { left: 480px; top: 160px; width: 80px; height: 4px; }

[id*="3-0-3-1"] { left: 80px; top: 240px; width: 80px; height: 4px; }
[id*="3-1-3-2"] { left: 160px; top: 240px; width: 80px; height: 4px; }
[id*="3-2-3-3"] { left: 240px; top: 240px; width: 80px; height: 4px; }
[id*="3-3-3-4"] { left: 320px; top: 240px; width: 80px; height: 4px; }
[id*="3-4-3-5"] { left: 400px; top: 240px; width: 80px; height: 4px; }
[id*="3-5-3-6"] { left: 480px; top: 240px; width: 80px; height: 4px; }

[id*="4-0-4-1"] { left: 80px; top: 320px; width: 80px; height: 4px; }
[id*="4-1-4-2"] { left: 160px; top: 320px; width: 80px; height: 4px; }
[id*="4-2-4-3"] { left: 240px; top: 320px; width: 80px; height: 4px; }
[id*="4-3-4-4"] { left: 320px; top: 320px; width: 80px; height: 4px; }
[id*="4-4-4-5"] { left: 400px; top: 320px; width: 80px; height: 4px; }
[id*="4-5-4-6"] { left: 480px; top: 320px; width: 80px; height: 4px; }

[id*="5-0-5-1"] { left: 80px; top: 400px; width: 80px; height: 4px; }
[id*="5-1-5-2"] { left: 160px; top: 400px; width: 80px; height: 4px; }
[id*="5-2-5-3"] { left: 240px; top: 400px; width: 80px; height: 4px; }
[id*="5-3-5-4"] { left: 320px; top: 400px; width: 80px; height: 4px; }
[id*="5-4-5-5"] { left: 400px; top: 400px; width: 80px; height: 4px; }
[id*="5-5-5-6"] { left: 480px; top: 400px; width: 80px; height: 4px; }

[id*="6-0-6-1"] { left: 80px; top: 480px; width: 80px; height: 4px; }
[id*="6-1-6-2"] { left: 160px; top: 480px; width: 80px; height: 4px; }
[id*="6-2-6-3"] { left: 240px; top: 480px; width: 80px; height: 4px; }
[id*="6-3-6-4"] { left: 320px; top: 480px; width: 80px; height: 4px; }
[id*="6-4-6-5"] { left: 400px; top: 480px; width: 80px; height: 4px; }
[id*="6-5-6-6"] { left: 480px; top: 480px; width: 80px; height: 4px; }

/* Vertical lines */
[id*="0-0-1-0"] { left: 0px; top: 80px; width: 4px; height: 80px; }
[id*="1-0-2-0"] { left: 0px; top: 160px; width: 4px; height: 80px; }
[id*="2-0-3-0"] { left: 0px; top: 240px; width: 4px; height: 80px; }
[id*="3-0-4-0"] { left: 0px; top: 320px; width: 4px; height: 80px; }
[id*="4-0-5-0"] { left: 0px; top: 400px; width: 4px; height: 80px; }
[id*="5-0-6-0"] { left: 0px; top: 480px; width: 4px; height: 80px; }

[id*="0-1-1-1"] { left: 80px; top: 80px; width: 4px; height: 80px; }
[id*="1-1-2-1"] { left: 80px; top: 160px; width: 4px; height: 80px; }
[id*="2-1-3-1"] { left: 80px; top: 240px; width: 4px; height: 80px; }
[id*="3-1-4-1"] { left: 80px; top: 320px; width: 4px; height: 80px; }
[id*="4-1-5-1"] { left: 80px; top: 400px; width: 4px; height: 80px; }
[id*="5-1-6-1"] { left: 80px; top: 480px; width: 4px; height: 80px; }

[id*="0-2-1-2"] { left: 160px; top: 80px; width: 4px; height: 80px; }
[id*="1-2-2-2"] { left: 160px; top: 160px; width: 4px; height: 80px; }
[id*="2-2-3-2"] { left: 160px; top: 240px; width: 4px; height: 80px; }
[id*="3-2-4-2"] { left: 160px; top: 320px; width: 4px; height: 80px; }
[id*="4-2-5-2"] { left: 160px; top: 400px; width: 4px; height: 80px; }
[id*="5-2-6-2"] { left: 160px; top: 480px; width: 4px; height: 80px; }

[id*="0-3-1-3"] { left: 240px; top: 80px; width: 4px; height: 80px; }
[id*="1-3-2-3"] { left: 240px; top: 160px; width: 4px; height: 80px; }
[id*="2-3-3-3"] { left: 240px; top: 240px; width: 4px; height: 80px; }
[id*="3-3-4-3"] { left: 240px; top: 320px; width: 4px; height: 80px; }
[id*="4-3-5-3"] { left: 240px; top: 400px; width: 4px; height: 80px; }
[id*="5-3-6-3"] { left: 240px; top: 480px; width: 4px; height: 80px; }

[id*="0-4-1-4"] { left: 320px; top: 80px; width: 4px; height: 80px; }
[id*="1-4-2-4"] { left: 320px; top: 160px; width: 4px; height: 80px; }
[id*="2-4-3-4"] { left: 320px; top: 240px; width: 4px; height: 80px; }
[id*="3-4-4-4"] { left: 320px; top: 320px; width: 4px; height: 80px; }
[id*="4-4-5-4"] { left: 320px; top: 400px; width: 4px; height: 80px; }
[id*="5-4-6-4"] { left: 320px; top: 480px; width: 4px; height: 80px; }

[id*="0-5-1-5"] { left: 400px; top: 80px; width: 4px; height: 80px; }
[id*="1-5-2-5"] { left: 400px; top: 160px; width: 4px; height: 80px; }
[id*="2-5-3-5"] { left: 400px; top: 240px; width: 4px; height: 80px; }
[id*="3-5-4-5"] { left: 400px; top: 320px; width: 4px; height: 80px; }
[id*="4-5-5-5"] { left: 400px; top: 400px; width: 4px; height: 80px; }
[id*="5-5-6-5"] { left: 400px; top: 480px; width: 4px; height: 80px; }

[id*="0-6-1-6"] { left: 480px; top: 80px; width: 4px; height: 80px; }
[id*="1-6-2-6"] { left: 480px; top: 160px; width: 4px; height: 80px; }
[id*="2-6-3-6"] { left: 480px; top: 240px; width: 4px; height: 80px; }
[id*="3-6-4-6"] { left: 480px; top: 320px; width: 4px; height: 80px; }
[id*="4-6-5-6"] { left: 480px; top: 400px; width: 4px; height: 80px; }
[id*="5-6-6-6"] { left: 480px; top: 480px; width: 4px; height: 80px; }

/* Mobile responsiveness */
@media (max-width: 768px) {
  .dot-grid-container {
    padding: 1rem;
  }
  
  .dot {
    width: 10px;
    height: 10px;
  }
  
  .square-icon {
    font-size: 1.25rem;
  }
}
</style> 