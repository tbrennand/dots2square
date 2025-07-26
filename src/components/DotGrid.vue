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
      @mouseenter="hoveredLine = line"
      @mouseleave="hoveredLine = null"
      :class="{ 
        'disabled': !canMakeMove,
        'horizontal': line.startDot.split('-')[0] === line.endDot.split('-')[0],
        'vertical': line.startDot.split('-')[1] === line.endDot.split('-')[1]
      }"
      :style="getLineStyle(line)"
    >
      <div class="line-hitbox"></div>
      <!-- Hovered Line Visual -->
      <div 
        v-if="hoveredLine && drawnLines.length > 0" 
        class="line-visual" 
        :style="getLineStyle(hoveredLine)"
      ></div>
    </div>

    <!-- Drawn Lines -->
    <div v-for="line in drawnLines" :key="line.id">
      <div 
        class="line-visual"
        :style="getLineStyle(line)"
      ></div>
    </div>
    
    <!-- Claimed Squares -->
    <div v-for="square in claimedSquares" :key="square.id" class="square" :style="squareStyle(square)" :class="{ 'player1-claimed': square.player === 1, 'player2-claimed': square.player === 2 }">
      <div class="square-content">
        <div class="initial-circle">
          <span class="square-initial">{{ getPlayerInitial(square.player) }}</span>
        </div>
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
const props = withDefaults(defineProps<{
  gridSize?: number
  drawnLines?: Line[]
  claimedSquares?: Square[]
  canMakeMove: boolean
  player1Name?: string
  player2Name?: string
  player1Color?: string
  player2Color?: string
  isGameActive: boolean // Add this prop
}>(), {
  gridSize: 8,
  drawnLines: () => [],
  claimedSquares: () => [],
  canMakeMove: true,
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  player1Color: '#3b82f6',
  player2Color: '#f97316',
  isGameActive: false // Default to false
})

// Emits
const emit = defineEmits(['line-selected'])

const hoveredLine = ref<PossibleLine | null>(null)

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

// Grid dimensions
const gridContainer = ref<HTMLElement | null>(null)

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
  console.log('🎯 DotGrid received drawnLines:', lines.length, 'lines:', lines)
  return lines
})

// Get claimed squares from props
const claimedSquares = computed(() => {
  const squares = props.claimedSquares || []
  console.log('🎯 DotGrid received claimedSquares:', squares.length, 'squares:', squares)
  return squares
})

// Generate potential lines for clicking
const potentialLines = computed<PossibleLine[]>(() => {
  // Only show potential lines when it's the player's turn
  if (props.drawnLines.length === 0 && props.isGameActive === false) {
    return []
  }
  
  const lines: PossibleLine[] = []
  const gridSize = props.gridSize
  // Horizontal lines
  for (let y = 0; y <= gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const line = {
        id: `h-${y}-${x}`,
        startDot: `${y}-${x}`,
        endDot: `${y}-${x + 1}`
      }
      lines.push(line)
    }
  }
  // Vertical lines
  for (let x = 0; x <= gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const line = {
        id: `v-${y}-${x}`,
        startDot: `${y}-${x}`,
        endDot: `${y + 1}-${x}`
      }
      lines.push(line)
    }
  }
  return lines.filter(l => !drawnLines.value.some(dl => dl.id === l.id))
})

// Get line position and style dynamically
const getLineStyle = (line: Line | PossibleLine) => {
  const { startDot, endDot } = line
  const [y1, x1] = startDot.split('-').map(Number)
  const [y2, x2] = endDot.split('-').map(Number)
  const thickness = 4 // px
  
  const style: any = {
    position: 'absolute',
    zIndex: 5,
    borderRadius: '2px'
  }

  if (y1 === y2) { // Horizontal line
    style.left = `${Math.min(x1, x2) * spacing.value}px`
    style.top = `${y1 * spacing.value - (thickness / 2)}px`
    style.width = `${spacing.value}px`
    style.height = `${thickness}px`
  } else { // Vertical line
    style.left = `${x1 * spacing.value - (thickness / 2)}px`
    style.top = `${Math.min(y1, y2) * spacing.value}px`
    style.width = `${thickness}px`
    style.height = `${spacing.value}px`
  }
  
  // Set color for drawn or hovered lines
  if ('player' in line && line.player) {
    style.backgroundColor = line.player === 1 ? props.player1Color : props.player2Color
  } else {
    style.backgroundColor = '#f97316' // Hover color
    style.opacity = 0.6
  }

  return style
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

// Get player initial from actual player names
const getPlayerInitial = (player?: number) => {
  if (player === 1 && props.player1Name) {
    return props.player1Name.charAt(0).toUpperCase()
  }
  if (player === 2 && props.player2Name) {
    return props.player2Name.charAt(0).toUpperCase()
  }
  // Fallback to A/B if no names provided
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

// Get line class for coloring
const getLineClass = (line: Line) => {
  if (!line.player) return '' // No player assigned yet

  // Check if the line is part of a completed square
  const isPartOfCompletedSquare = claimedSquares.value.some(square => {
    const topLeftX = square.topLeftX ?? square.x ?? 0
    const topLeftY = square.topLeftY ?? square.y ?? 0
    
    const squareDots = [
      `${topLeftY}-${topLeftX}`,
      `${topLeftY}-${topLeftX + 1}`,
      `${topLeftY + 1}-${topLeftX}`,
      `${topLeftY + 1}-${topLeftX + 1}`
    ]
    return squareDots.includes(line.startDot) && squareDots.includes(line.endDot)
  })

  if (isPartOfCompletedSquare) {
    // If line is part of a completed square, use the square owner's color
    const relevantSquare = claimedSquares.value.find(square => {
      const topLeftX = square.topLeftX ?? square.x ?? 0
      const topLeftY = square.topLeftY ?? square.y ?? 0
      
      const squareDots = [
        `${topLeftY}-${topLeftX}`,
        `${topLeftY}-${topLeftX + 1}`,
        `${topLeftY + 1}-${topLeftX}`,
        `${topLeftY + 1}-${topLeftX + 1}`
      ]
      return squareDots.includes(line.startDot) && squareDots.includes(line.endDot)
    })
    
    if (relevantSquare?.player) {
      return `player${relevantSquare.player}-line`
    }
  }
  
  // Default to line player color
  return `player${line.player}-line`
}
</script>

<style scoped>
.dot-grid-container {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* Maintain aspect ratio */
  max-width: 600px;
  margin: 0 auto;
}

.grid-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #1f2937;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.line-hitbox {
  position: absolute;
  cursor: pointer;
  z-index: 10;
  /* background: rgba(255, 0, 0, 0.2); */ /* Uncomment to debug hitboxes */
}

.line-visual {
  position: absolute;
  background-color: #9ca3af;
  opacity: 1 !important;
  transition: all 0.2s ease;
  transform-origin: center;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  pointer-events: none; /* Make sure it doesn't block clicks */
  z-index: 5;
}

.line-visual.line-hover {
  background-color: #f97316 !important; /* Orange on hover */
}

.player1-line {
  background-color: #3b82f6 !important;
}

.player2-line {
  background-color: #f97316 !important;
}

.square {
  position: absolute;
  background-size: cover;
  background-position: center;
  border: 3px solid;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1;
}

.square.player1-claimed {
  background-color: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
}

.square.player2-claimed {
  background-color: rgba(249, 115, 22, 0.3);
  border-color: #f97316;
}

.square-initial {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dot-grid-container {
    max-width: 95vw; /* Ensure grid fits within the screen width */
    max-height: 95vw;
  }
  
  .dot {
    width: 8px;
    height: 8px;
  }
}
</style> 