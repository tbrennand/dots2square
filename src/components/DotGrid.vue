<template>
  <div class="dot-grid-container">
    <svg 
      class="dot-grid" 
      :width="gridWidth" 
      :height="gridHeight" 
      @click="handleGridClick"
    >
      <!-- Draw claimed squares with player colors -->
      <rect
        v-for="square in claimedSquares"
        :key="square.id"
        :x="square.topLeftX * spacing + 5"
        :y="square.topLeftY * spacing + 5"
        :width="spacing - 10"
        :height="spacing - 10"
        :fill="getPlayerColor(square.player)"
        :opacity="0.3"
        class="claimed-square"
      />
      
      <!-- Draw lines -->
      <line
        v-for="line in drawnLines"
        :key="line.id"
        :x1="getDotPosition(line.startDot).x"
        :y1="getDotPosition(line.startDot).y"
        :x2="getDotPosition(line.endDot).x"
        :y2="getDotPosition(line.endDot).y"
        :stroke="getPlayerColor(line.player)"
        stroke-width="3"
        stroke-linecap="round"
        class="drawn-line"
      />
      
      <!-- Draw dots -->
      <circle
        v-for="dot in dots"
        :key="dot.id"
        :cx="dot.x * spacing"
        :cy="dot.y * spacing"
        r="4"
        fill="#374151"
        stroke="#6b7280"
        stroke-width="1"
        class="dot"
      />
      
      <!-- Draw hover lines for possible moves -->
      <line
        v-for="possibleLine in possibleLines"
        :key="`hover-${possibleLine.id}`"
        :x1="getDotPosition(possibleLine.startDot).x"
        :y1="getDotPosition(possibleLine.startDot).y"
        :x2="getDotPosition(possibleLine.endDot).x"
        :y2="getDotPosition(possibleLine.endDot).y"
        stroke="#9ca3af"
        stroke-width="2"
        stroke-dasharray="5,5"
        opacity="0.5"
        class="hover-line"
        @click.stop="selectLine(possibleLine)"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
}>()

// Emits
const emit = defineEmits<{
  'line-selected': [line: { startDot: string; endDot: string }]
}>()

// Component state
const gridSize = props.gridSize || 5
const spacing = 60
const gridWidth = gridSize * spacing
const gridHeight = gridSize * spacing

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

// Get player color
const getPlayerColor = (player?: number): string => {
  switch (player) {
    case 1:
      return '#3b82f6' // Blue
    case 2:
      return '#ef4444' // Red
    default:
      return '#9ca3af' // Gray
  }
}

// Get dot position for SVG coordinates
const getDotPosition = (dotId: string) => {
  const [y, x] = dotId.split('-').map(Number)
  return { x: x * spacing, y: y * spacing }
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

.dot-grid {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: crosshair;
  user-select: none;
}

.dot {
  transition: fill 0.2s ease;
}

.dot:hover {
  fill: #1f2937;
  cursor: pointer;
}

.drawn-line {
  transition: stroke-width 0.2s ease;
}

.drawn-line:hover {
  stroke-width: 4;
}

.claimed-square {
  transition: opacity 0.2s ease;
}

.claimed-square:hover {
  opacity: 0.5;
}

.hover-line {
  cursor: pointer;
  transition: all 0.2s ease;
}

.hover-line:hover {
  opacity: 0.8 !important;
  stroke-width: 3;
  stroke: #6b7280;
}
</style> 