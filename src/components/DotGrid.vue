<template>
  <div class="dot-grid-container" :style="gridStyle">
    <!-- Dots -->
    <div v-for="dot in dots" :key="dot.id" class="dot" :style="{ top: `${dot.y * spacing}px`, left: `${dot.x * spacing}px` }"></div>
    
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
      :style="getLineStyle(line)"
    >
      <div class="line-hitbox"></div>
      <div class="line-visual" :class="{ 'line-hover': hoverLine === line.id && canMakeMove }"></div>
    </div>

    <!-- Drawn Lines -->
    <div v-for="line in drawnLines" :key="line.id" :id="line.id" class="line-container drawn" :style="getLineStyle(line)">
      <div class="line-visual line-drawn" :class="{ 'player1-line': line.player === 1, 'player2-line': line.player === 2 }"></div>
    </div>
    
    <!-- Claimed Squares -->
    <div v-for="square in claimedSquares" :key="square.id" class="square" :style="squareStyle(square)">
      <div class="square-content" :class="{ 'player1-square': square.player === 1, 'player2-square': square.player === 2 }">
        <span class="square-initial">{{ getPlayerInitial(square.player) }}</span>
      </div>
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
const spacing = computed(() => {
  // Dynamic spacing based on grid size
  if (gridSize <= 6) return 80
  if (gridSize <= 8) return 70
  if (gridSize <= 10) return 60
  if (gridSize <= 12) return 50
  return 45 // For larger grids
})
const gridWidth = computed(() => (gridSize + 1) * spacing.value)
const gridHeight = computed(() => (gridSize + 1) * spacing.value)
const hoverLine = ref<string | null>(null)

// Generate dots based on grid size (n+1 x n+1 dots for n x n grid)
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
  width: `${gridWidth.value}px`,
  height: `${gridHeight.value}px`,
  position: 'relative' as const,
  background: 'transparent',
  borderRadius: '1rem',
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

// Get line position and style dynamically
const getLineStyle = (line: PossibleLine | Line) => {
  const startPos = getDotPosition(line.startDot)
  const endPos = getDotPosition(line.endDot)
  
  // Calculate line properties
  const isHorizontal = startPos.y === endPos.y
  const isVertical = startPos.x === endPos.x
  
  if (isHorizontal) {
    const width = Math.abs(endPos.x - startPos.x)
    const left = Math.min(startPos.x, endPos.x)
    const top = startPos.y - 2 // Center vertically
    
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: '4px',
      transform: 'none'
    }
  } else if (isVertical) {
    const height = Math.abs(endPos.y - startPos.y)
    const left = startPos.x - 2 // Center horizontally
    const top = Math.min(startPos.y, endPos.y)
    
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: '4px',
      height: `${height}px`,
      transform: 'none'
    }
  }
  
  return {}
}

// Get dot position for coordinates
const getDotPosition = (dotId: string) => {
  const [y, x] = dotId.split('-').map(Number)
  return { x: x * spacing.value, y: y * spacing.value }
}

// Square style method
const squareStyle = (square: Square) => {
  const x = square.topLeftX * spacing.value
  const y = square.topLeftY * spacing.value
  const size = spacing.value - 4 // Slightly smaller than spacing
  
  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`
  }
}

// Get player initial
const getPlayerInitial = (player?: number) => {
  return player === 1 ? 'P1' : 'P2'
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
  background: transparent;
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
  background-color: #f3f4f6; /* Very light grey for unclaimed lines */
  border-radius: 3px;
  transition: all 0.3s ease;
  opacity: 0.6;
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
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.square-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.player1-square {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-color: #3b82f6;
}

.player2-square {
  background: linear-gradient(135deg, #f97316, #ea580c);
  border-color: #f97316;
}

.square-initial {
  font-size: 1rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.square:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .dot-grid-container {
    padding: 1rem;
  }
  
  .dot {
    width: 10px;
    height: 10px;
  }
  
  .square-initial {
    font-size: 0.875rem;
  }
}
</style> 