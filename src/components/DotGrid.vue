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
      :class="{ 
        'disabled': !canMakeMove,
        'horizontal': line.startDot.split('-')[0] === line.endDot.split('-')[0],
        'vertical': line.startDot.split('-')[1] === line.endDot.split('-')[1]
      }"
      :style="getLineStyle(line)"
    >
      <div class="line-hitbox"></div>
      <div class="line-visual" :class="{ 'line-hover': hoverLine === line.id && canMakeMove }"></div>
    </div>

    <!-- Drawn Lines -->
    <div v-for="line in drawnLines" :key="line.id" :id="line.id" class="line-container drawn" :style="getLineStyle(line, false)">
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
  topLeftX?: number
  topLeftY?: number
  x?: number
  y?: number
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
const drawnLines = computed(() => {
  const lines = props.drawnLines || []
  console.log('🎯 DotGrid: Drawn lines received:', lines)
  return lines
})

// Get claimed squares from props
const claimedSquares = computed(() => {
  const squares = props.claimedSquares || []
  console.log('🎯 DotGrid: Claimed squares received:', squares)
  return squares
})

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
const getLineStyle = (line: PossibleLine | Line, isHitbox = true) => {
  const [startY, startX] = line.startDot.split('-').map(Number)
  const [endY, endX] = line.endDot.split('-').map(Number)

  const isHorizontal = startY === endY
  const thickness = isHitbox ? 20 : 4 // 20px for hitbox, 4px for visual line

  if (isHorizontal) {
    const width = Math.abs(endX - startX) * spacing.value
    const left = Math.min(startX, endX) * spacing.value
    const top = startY * spacing.value - (thickness / 2) // Center hitbox or line

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${thickness}px`,
    }
  } else { // isVertical
    const height = Math.abs(endY - startY) * spacing.value
    const left = startX * spacing.value - (thickness / 2) // Center hitbox or line
    const top = Math.min(startY, endY) * spacing.value

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${thickness}px`,
      height: `${height}px`,
    }
  }
}

// Square style method
const squareStyle = (square: Square) => {
  // Handle both Firebase format (x,y) and local format (topLeftX, topLeftY)
  const x = (square.x ?? square.topLeftX ?? 0) * spacing.value
  const y = (square.y ?? square.topLeftY ?? 0) * spacing.value
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
  if (player === 1) return 'A'
  if (player === 2) return 'B'
  return ''
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
  background: #1f2937;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
}

.dot:hover {
  background: #111827;
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
  position: absolute;
  background-color: transparent; /* Lines are invisible by default */
  border-radius: 3px;
  transition: all 0.3s ease;
  opacity: 0; /* Make lines invisible */
  
  /* Centering logic */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.line-container.horizontal .line-visual {
  width: 100%;
  height: 4px;
}

.line-container.vertical .line-visual {
  width: 4px;
  height: 100%;
}

.line-container.drawn .line-visual {
  width: 100%;
  height: 100%;
}

.line-visual.line-hover {
  background: #f97316;
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.line-drawn {
  background-color: #374151;
  opacity: 1;
}

.player1-line {
  background: #1f2937;
  box-shadow: 0 2px 8px rgba(31, 41, 55, 0.3);
}

.player2-line {
  background: #f97316;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.square {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.square-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  transition: all 0.3s ease;
}

.player1-square {
  background: #1f2937;
  border-color: #1f2937;
  box-shadow: 0 6px 20px rgba(31, 41, 55, 0.4);
}

.player2-square {
  background: #f97316;
  border-color: #f97316;
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
}

.square-initial {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
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