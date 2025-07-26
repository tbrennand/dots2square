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
      <div class="line-visual line-drawn" :class="getLineClass(line)"></div>
    </div>
    
    <!-- Claimed Squares -->
    <div v-for="square in claimedSquares" :key="square.id" class="square" :style="squareStyle(square)">
      <div class="square-content" :class="{ 'player1-square': square.player === 1, 'player2-square': square.player === 2 }">
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
const props = defineProps<{
  gridSize?: number
  drawnLines?: Line[]
  claimedSquares?: Square[]
  canMakeMove?: boolean
  player1Name?: string
  player2Name?: string
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
  console.log('🎯 DotGrid received drawnLines:', lines.length, 'lines:', lines)
  return lines
})

// Get claimed squares from props
const claimedSquares = computed(() => {
  const squares = props.claimedSquares || []
  console.log('🎯 DotGrid received claimedSquares:', squares.length, 'squares:', squares)
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: transparent;
  border-radius: 2px;
  transition: all 0.2s ease;
  opacity: 0;
  z-index: 5;
}

.line-visual.horizontal {
  width: 100%;
  height: 4px; /* Much thicker for visibility */
}

.line-visual.vertical {
  width: 4px; /* Much thicker for visibility */
  height: 100%;
}

.line-visual.line-hover {
  background: #f97316;
  opacity: 0.6;
  transform: translate(-50%, -50%) scale(1.2);
}

.line-visual.line-drawn {
  opacity: 1;
}

.player1-line {
  background: #3b82f6 !important;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
}

.player2-line {
  background: #f97316 !important;
  box-shadow: 0 1px 3px rgba(249, 115, 22, 0.3);
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
  z-index: 10; /* Ensure squares appear above lines */
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
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
}

.player2-square {
  background: #f97316 !important;
  border-color: #f97316 !important;
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4) !important;
}

.square-initial {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937 !important;
  text-shadow: none;
  filter: none;
  z-index: 12;
}

.initial-circle {
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.square:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* Mobile Optimizations - Complete Overhaul */
@media (max-width: 768px) {
  .dot-grid-container {
    width: 100% !important;
    height: auto !important;
    max-width: min(90vw, 400px);
    max-height: min(90vw, 400px);
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  .dot {
    width: 10px;
    height: 10px;
    border-width: 1.5px;
    transition: all 0.2s ease;
  }
  
  .dot:active {
    transform: translate(-50%, -50%) scale(1.4);
    background: #f97316;
  }
  
  .line-container {
    /* Larger touch targets for mobile */
    min-width: 32px;
    min-height: 32px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .line-hitbox {
    /* Even larger touch area */
    min-width: 40px;
    min-height: 40px;
    margin: -20px 0 0 -20px;
    border-radius: 6px;
  }
  
  .line-container:active .line-visual {
    background: #f97316 !important;
    opacity: 0.9 !important;
    transform: translate(-50%, -50%) scale(1.3) !important;
  }
  
  .line-visual.line-hover {
    transform: translate(-50%, -50%) scale(1.3);
    background: #f97316;
    opacity: 0.8;
  }
  
  .line-visual.line-drawn {
    opacity: 1;
  }
  
  /* Much thinner lines for mobile */
  .line-visual.horizontal {
    height: 3px; /* Still visible on mobile */
  }
  
  .line-visual.vertical {
    width: 3px; /* Still visible on mobile */
  }
  
  .player1-line {
    background: #3b82f6 !important;
    box-shadow: 0 1px 2px rgba(59, 130, 246, 0.4);
  }
  
  .player2-line {
    background: #f97316 !important;
    box-shadow: 0 1px 2px rgba(249, 115, 22, 0.4);
  }
  
  .square {
    border-width: 2.5px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }
  
  .square-content {
    border-radius: 6px;
  }
  
  .initial-circle {
    width: 20px;
    height: 20px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    border-width: 1.5px;
  }
  
  .square-initial {
    font-size: 0.875rem;
    font-weight: 800;
  }
  
  .square:active {
    transform: scale(1.05);
  }
}

/* Extra small mobile devices */
@media (max-width: 480px) {
  .dot-grid-container {
    max-width: min(95vw, 320px);
    max-height: min(95vw, 320px);
    padding: 0.75rem;
    border-radius: 10px;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-width: 1px;
  }
  
  .line-container {
    min-width: 28px;
    min-height: 28px;
  }
  
  .line-hitbox {
    min-width: 36px;
    min-height: 36px;
    margin: -18px 0 0 -18px;
  }
  
  .square {
    border-width: 2px;
    border-radius: 6px;
  }
  
  .initial-circle {
    width: 18px;
    height: 18px;
    border-width: 1px;
  }
  
  .square-initial {
    font-size: 0.75rem;
  }
}

/* Landscape mobile optimization */
@media (max-height: 600px) and (orientation: landscape) {
  .dot-grid-container {
    max-width: min(70vh, 350px);
    max-height: min(70vh, 350px);
    padding: 0.5rem;
  }
  
  .dot {
    width: 7px;
    height: 7px;
  }
  
  .line-container {
    min-width: 24px;
    min-height: 24px;
  }
  
  .line-hitbox {
    min-width: 32px;
    min-height: 32px;
    margin: -16px 0 0 -16px;
  }
  
  .initial-circle {
    width: 16px;
    height: 16px;
  }
  
  .square-initial {
    font-size: 0.675rem;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .dot:hover {
    transform: translate(-50%, -50%);
    background: #1f2937;
  }
  
  .line-visual:hover {
    transform: translate(-50%, -50%);
    background: transparent;
    opacity: 0;
  }
  
  .line-container.potential:active .line-visual {
    background: #f97316 !important;
    opacity: 0.9 !important;
    transform: translate(-50%, -50%) scale(1.2) !important;
  }
  
  .square:hover {
    transform: none;
  }
  
  .square:active {
    transform: scale(1.03);
  }
}

/* High DPI mobile displays */
@media (-webkit-min-device-pixel-ratio: 2) and (max-width: 768px) {
  .dot {
    border-width: 0.75px;
  }
  
  .line-visual {
    border-radius: 1.5px;
  }
  
  .square {
    border-width: 1.25px;
  }
  
  .initial-circle {
    border-width: 0.75px;
  }
}

/* Very large mobile screens (like iPad Mini) */
@media (min-width: 769px) and (max-width: 1024px) and (pointer: coarse) {
  .dot-grid-container {
    max-width: min(80vw, 500px);
    max-height: min(80vw, 500px);
    padding: 1.5rem;
  }
  
  .dot {
    width: 12px;
    height: 12px;
    border-width: 2px;
  }
  
  .line-container {
    min-width: 36px;
    min-height: 36px;
  }
  
  .line-hitbox {
    min-width: 44px;
    min-height: 44px;
    margin: -22px 0 0 -22px;
  }
  
  .initial-circle {
    width: 24px;
    height: 24px;
  }
  
  .square-initial {
    font-size: 1rem;
  }
}
</style> 