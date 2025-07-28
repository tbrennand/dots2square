<template>
  <div
    class="dot-grid-container"
    :class="{ 'is-disabled': !canMakeMove }"
    :style="gridStyle"
    ref="gridContainer"
  >
    <!-- Dots -->
    <div v-for="dot in dots" :key="dot.id" class="dot" :style="{ top: `${dot.y * spacing + padding}px`, left: `${dot.x * spacing + padding}px` }"></div>
    
    <!-- Potential Lines for Hovering -->
    <div
      v-for="line in potentialLines"
      :key="line.id"
      class="line-hitbox"
      :class="{
        'horizontal': line.startDot.split('-')[0] === line.endDot.split('-')[0],
        'vertical': line.startDot.split('-')[1] === line.endDot.split('-')[1]
      }"
      :style="getLineHitboxStyle(line)"
      @click="selectLine(line)"
    ></div>

    <!-- Drawn Lines -->
    <div v-for="line in drawnLines" :key="line.id">
      <div 
        class="line-visual"
        :style="getLineStyle(line)"
      ></div>
    </div>
    
    <!-- Claimed Squares -->
    <div
      v-for="square in claimedSquares"
      :key="square.id"
      class="claimed-square"
      :style="getSquareStyle(square)"
    >
      <div class="player-initial-wrapper">
        <span class="player-initial">{{ getPlayerInitial(square.player) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Line, Square, PossibleLine, Dot } from '@/types'

// Props
const props = withDefaults(defineProps<{
  gridSize: number
  drawnLines: Line[]
  claimedSquares: Square[]
  canMakeMove: boolean
  player1Name: string
  player2Name: string
  player1Color: string
  player2Color: string
  isGameActive: boolean
  currentPlayer: number // Add this prop
}>(), {
  gridSize: 8,
  drawnLines: () => [],
  claimedSquares: () => [],
  canMakeMove: true,
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  player1Color: '#3b82f6',
  player2Color: '#f97316',
  isGameActive: false, // Default to false
  currentPlayer: 1,
})

// Emits
const emit = defineEmits(['line-selected'])

// --- New Responsive and Padding Logic ---
const padding = 16 // 16px of padding inside the grid container
const windowWidth = ref(window.innerWidth)
const handleResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

const spacing = computed(() => {
  if (windowWidth.value <= 768) { // Mobile devices
    // Calculate spacing to fit 95% of screen width with padding
    return (windowWidth.value * 0.95 - padding * 2) / props.gridSize
  }
  // Desktop fixed spacing
  if (props.gridSize <= 8) return 70
  if (props.gridSize <= 10) return 60
  return 50
})

const gridWidth = computed(() => (props.gridSize * spacing.value) + (padding * 2))
const gridHeight = computed(() => (props.gridSize * spacing.value) + (padding * 2))
// --- End of New Logic ---

const gridContainer = ref<HTMLElement | null>(null)

// Generate dots based on grid size (n x n dots for (n-1) x (n-1) squares)
const dots = computed(() => {
  const dotsArray: Dot[] = []
  for (let row = 0; row < props.gridSize; row++) {
    for (let col = 0; col < props.gridSize; col++) {
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
  '--hover-color': props.currentPlayer === 1 ? props.player1Color : props.player2Color,
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
  // Only show potential lines if the game is active and player can make a move
  if (!props.isGameActive || !props.canMakeMove) {
    return []
  }
  
  const lines: PossibleLine[] = []
  // Horizontal lines
  for (let y = 0; y < props.gridSize; y++) {
    for (let x = 0; x < props.gridSize - 1; x++) {
      const line = {
        id: `h-${y}-${x}`,
        startDot: `${y}-${x}`,
        endDot: `${y}-${x + 1}`
      }
      lines.push(line)
    }
  }
  // Vertical lines
  for (let x = 0; x < props.gridSize; x++) {
    for (let y = 0; y < props.gridSize - 1; y++) {
      const line = {
        id: `v-${y}-${x}`,
        startDot: `${y}-${x}`,
        endDot: `${y + 1}-${x}`
      }
      lines.push(line)
    }
  }
  return lines.filter(l => !drawnLines.value.some(dl => dl.id === [l.startDot, l.endDot].sort().join('-')))
})

// Get line position and style dynamically
const getLineStyle = (line: Line | PossibleLine) => {
  const isHorizontal = line.startDot.split('-')[0] === line.endDot.split('-')[0]
  const startY = Number(line.startDot.split('-')[0])
  const startX = Number(line.startDot.split('-')[1])

  const style: any = {
    position: 'absolute',
    left: `${startX * spacing.value + padding + (isHorizontal ? 2 : -2)}px`,
    top: `${startY * spacing.value + padding + (isHorizontal ? -2 : 2)}px`,
    height: isHorizontal ? '4px' : `${spacing.value - 4}px`,
    width: isHorizontal ? `${spacing.value - 4}px` : '4px',
    borderRadius: '2px',
    transformOrigin: 'center',
    transition: 'all 0.2s ease',
  }

  // Set color for drawn or hovered lines
  if ('player' in line) { // This is a drawn line
    // Check if this is the most recent line (last in the array)
    const isMostRecent = drawnLines.value.length > 0 && 
                        drawnLines.value[drawnLines.value.length - 1].id === line.id
    
    if (isMostRecent) {
      // Show player color for the most recent line
      const playerColor = line.player === 1 ? props.player1Color : props.player2Color
      style.backgroundColor = playerColor
      style.opacity = 1
    } else {
      // Show black for older lines
      style.backgroundColor = '#000000'
      style.opacity = 1
    }
  } else { // This is a potential (hover) line
    style.backgroundColor = '#f97316' // Hover color
    style.opacity = 0.6
  }

  return style
}

// Get line hitbox style
const getLineHitboxStyle = (line: PossibleLine) => {
  const [startY, startX] = line.startDot.split('-').map(Number)
  const [endY, endX] = line.endDot.split('-').map(Number)
  const isHorizontal = startY === endY
  const thickness = 20 // Hitbox thickness

  if (isHorizontal) {
    return {
      left: `${Math.min(startX, endX) * spacing.value + padding}px`,
      top: `${startY * spacing.value - (thickness / 2) + padding}px`,
      width: `${spacing.value}px`,
      height: `${thickness}px`,
    }
  } else { // Vertical
    return {
      left: `${startX * spacing.value - (thickness / 2) + padding}px`,
      top: `${Math.min(startY, endY) * spacing.value + padding}px`,
      width: `${thickness}px`,
      height: `${spacing.value}px`, // Corrected from thickness
    }
  }
}

// Get player initial from actual player names
const getPlayerInitial = (playerNumber: number) => {
  if (playerNumber === 1 && props.player1Name) {
    return props.player1Name.charAt(0).toUpperCase()
  }
  if (playerNumber === 2 && props.player2Name) {
    return props.player2Name.charAt(0).toUpperCase()
  }
  return ''
}

const getSquareStyle = (square: Square) => {
  const squareSize = spacing.value - 4; // Slightly smaller than spacing
  const color = square.player === 1 ? props.player1Color : props.player2Color;

  return {
    position: 'absolute' as const,
    left: `${square.topLeftX * spacing.value + padding + 2}px`,
    top: `${square.topLeftY * spacing.value + padding + 2}px`,
    width: `${squareSize}px`,
    height: `${squareSize}px`,
    backgroundColor: color,
    opacity: 0.8,
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
};

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
    const topLeftX = square.topLeftX
    const topLeftY = square.topLeftY
    
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
      const topLeftX = square.topLeftX
      const topLeftY = square.topLeftY
      
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
}

.line-hitbox::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--hover-color); /* Use the CSS variable */
  opacity: 0;
  transition: opacity 0.1s ease; /* Faster transition */
  border-radius: 2px;
}

.line-hitbox:hover::before {
  opacity: 1;
}

/* Size the ::before pseudo-element based on orientation */
.line-hitbox.horizontal::before {
  width: 100%;
  height: 4px;
}

.line-hitbox.vertical::before {
  width: 4px;
  height: 100%;
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
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s ease;
  z-index: 2; /* Below lines but above grid */
}

.square.player1-claimed {
  background-color: #3b82f6; /* Blue */
}

.square.player2-claimed {
  background-color: #f97316; /* Orange */
}

.square-initial {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.dot-grid-container.is-disabled {
  pointer-events: none;
  opacity: 0.8;
}

.claimed-square {
  transition: all 0.3s ease;
  z-index: 5;
}

.player-initial-wrapper {
  background-color: white;
  border-radius: 50%;
  width: 50%;
  height: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.player-initial {
  font-weight: 700;
  font-size: 1.2rem;
  color: #333;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dot-grid-container {
    padding-bottom: 95vw; /* Use viewport width for aspect ratio */
    max-width: 95vw;
    max-height: 95vw;
  }
  .dot {
    width: 8px;
    height: 8px;
  }
}
</style> 