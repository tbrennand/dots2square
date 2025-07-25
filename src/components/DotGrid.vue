<template>
  <div class="dot-grid-container" :style="gridStyle">
    <!-- Dots -->
    <div v-for="dot in dots" :key="dot.id" class="dot" :style="{ top: `${dot.y * 100}px`, left: `${dot.x * 100}px` }"></div>
    
    <!-- Potential Lines (for hover effect) -->
    <div
      v-for="line in potentialLines"
      :key="line.id"
      class="line-container"
      @click="selectLine(line)"
      @mouseenter="hoverLine = line.id"
      @mouseleave="hoverLine = null"
      :class="{ 'disabled': !canMakeMove }"
      :style="getLineStyle(line)"
    >
      <div class="line-hitbox"></div>
      <div class="line-visual potential-line" :class="{ 'line-hover': hoverLine === line.id && canMakeMove }"></div>
    </div>

    <!-- Drawn Lines -->
    <div v-for="line in drawnLines" :key="line.id" class="line-container drawn" :style="getLineStyle(line)">
      <div class="line-visual line-drawn" :class="{ 'player1-line': line.player === 1, 'player2-line': line.player === 2 }"></div>
    </div>
    
    <!-- Claimed Squares -->
    <div v-for="square in claimedSquares" :key="square.id" class="square" :style="squareStyle(square)">
      <div class="square-content" :class="{ 'player1-square': square.player === 1, 'player2-square': square.player === 2 }">
        <span class="square-icon">{{ square.player === 1 ? '✏️' : (square.player === 2 ? '🎨' : '') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

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
const spacing = 100
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
const claimedSquares = computed(() => {
  console.log('DotGrid - All squares:', props.claimedSquares)
  const filtered = (props.claimedSquares || []).filter(square => square.player !== undefined && square.player !== null)
  console.log('DotGrid - Claimed squares:', filtered)
  return filtered
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
    position: 'absolute' as const,
    left: `${x + 2}px`,
    top: `${y + 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: getPlayerColor(square.player),
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  }
}

// Get player color
const getPlayerColor = (player?: number): string => {
  switch (player) {
    case 1:
      return '#3b82f6' // Blue
    case 2:
      return '#f97316' // Orange
    default:
      return '#9ca3af' // Gray
  }
}

// Get dot position for coordinates
const getDotPosition = (dotId: string) => {
  const [y, x] = dotId.split('-').map(Number)
  return { x: x * spacing, y: y * spacing }
}

// Calculate line position and style
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

// Handle grid clicks
const handleGridClick = (event: MouseEvent) => {
  const rect = (event.target as SVGElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Find closest dot
  const clickedDot = dots.value.find(dot => {
    const dotX = dot.x * spacing
    const dotY = dot.y * spacing
    const distance = Math.sqrt((x - dotX) ** 2 + (y - dotY) ** 2)
    return distance < 20
  })
  
  if (clickedDot) {
    // Find if there's a possible line from this dot
    const possibleLine = possibleLines.value.find(line => 
      line.startDot === clickedDot.id || line.endDot === clickedDot.id
    )
    
    if (possibleLine) {
      selectLine(possibleLine)
    }
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

.line-hitbox {
  position: absolute;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 1;
}

.line-container.drawn {
  pointer-events: none;
}

.line-visual {
  width: 100%;
  height: 100%;
  background-color: #d1d5db;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.potential-line {
  background-color: #e5e7eb;
  opacity: 0.3;
}

.potential-line.line-hover {
  background-color: #f97316;
  opacity: 0.8;
  transform: scale(1.05);
}

.line-container.disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.line-container.disabled .potential-line {
  opacity: 0.1;
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
}

.square-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid transparent;
}

.player1-square {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.player2-square {
  background: rgba(249, 115, 22, 0.1);
  border-color: #f97316;
}

.square-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.square:hover {
  transform: scale(1.05);
  opacity: 0.8;
}

/* Loading State */
.grid-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 