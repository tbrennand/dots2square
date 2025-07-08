<template>
  <div class="dot-grid-example">
    <h2 class="text-2xl font-bold mb-4">DotGrid Component Example</h2>
    
    <!-- Game controls -->
    <div class="mb-4 space-y-2">
      <div class="flex items-center space-x-4">
        <label class="flex items-center space-x-2">
          <span>Grid Size:</span>
          <select v-model="gridSize" class="border rounded px-2 py-1">
            <option value="3">3x3</option>
            <option value="4">4x4</option>
            <option value="5">5x5</option>
            <option value="6">6x6</option>
          </select>
        </label>
        
        <button 
          @click="addRandomLine" 
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Random Line
        </button>
        
        <button 
          @click="addRandomSquare" 
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add Random Square
        </button>
        
        <button 
          @click="clearAll" 
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear All
        </button>
      </div>
      
      <div class="text-sm text-gray-600">
        <p>Lines: {{ drawnLines.length }} | Squares: {{ claimedSquares.length }}</p>
        <p>Last selected line: {{ lastSelectedLine ? `${lastSelectedLine.startDot} → ${lastSelectedLine.endDot}` : 'None' }}</p>
      </div>
    </div>
    
    <!-- DotGrid component -->
    <DotGrid
      :grid-size="gridSize"
      :drawn-lines="drawnLines"
      :claimed-squares="claimedSquares"
      @line-selected="handleLineSelected"
    />
    
    <!-- Game state display -->
    <div class="mt-4 p-4 bg-gray-100 rounded">
      <h3 class="font-semibold mb-2">Game State</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h4 class="font-medium">Drawn Lines:</h4>
          <ul class="list-disc list-inside">
            <li v-for="line in drawnLines" :key="line.id">
              {{ line.startDot }} → {{ line.endDot }} 
              <span v-if="line.player" class="text-blue-600">(Player {{ line.player }})</span>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium">Claimed Squares:</h4>
          <ul class="list-disc list-inside">
            <li v-for="square in claimedSquares" :key="square.id">
              Square {{ square.id }} 
              <span v-if="square.player" class="text-blue-600">(Player {{ square.player }})</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DotGrid from './DotGrid.vue'

// Game state
const gridSize = ref(5)
const drawnLines = ref<Array<{
  id: string
  startDot: string
  endDot: string
  player?: number
}>>([])
const claimedSquares = ref<Array<{
  id: string
  topLeftX: number
  topLeftY: number
  player?: number
}>>([])
const lastSelectedLine = ref<{ startDot: string; endDot: string } | null>(null)

// Handle line selection from DotGrid
const handleLineSelected = (line: { startDot: string; endDot: string }) => {
  lastSelectedLine.value = line
  
  // Add the line to drawn lines (simulating a move)
  const newLine = {
    id: `${line.startDot}-${line.endDot}`,
    startDot: line.startDot,
    endDot: line.endDot,
    player: Math.random() > 0.5 ? 1 : 2 // Random player for demo
  }
  
  // Check if line already exists
  const lineExists = drawnLines.value.some(l => 
    (l.startDot === line.startDot && l.endDot === line.endDot) ||
    (l.startDot === line.endDot && l.endDot === line.startDot)
  )
  
  if (!lineExists) {
    drawnLines.value.push(newLine)
    console.log('Line selected:', line)
  }
}

// Add a random line
const addRandomLine = () => {
  const maxCoord = gridSize.value - 1
  
  // Generate random horizontal or vertical line
  const isHorizontal = Math.random() > 0.5
  
  let startDot: string, endDot: string
  
  if (isHorizontal) {
    const row = Math.floor(Math.random() * gridSize.value)
    const col = Math.floor(Math.random() * maxCoord)
    startDot = `${row}-${col}`
    endDot = `${row}-${col + 1}`
  } else {
    const row = Math.floor(Math.random() * maxCoord)
    const col = Math.floor(Math.random() * gridSize.value)
    startDot = `${row}-${col}`
    endDot = `${row + 1}-${col}`
  }
  
  // Check if line already exists
  const lineExists = drawnLines.value.some(l => 
    (l.startDot === startDot && l.endDot === endDot) ||
    (l.startDot === endDot && l.endDot === startDot)
  )
  
  if (!lineExists) {
    drawnLines.value.push({
      id: `${startDot}-${endDot}`,
      startDot,
      endDot,
      player: Math.random() > 0.5 ? 1 : 2
    })
  }
}

// Add a random claimed square
const addRandomSquare = () => {
  const maxCoord = gridSize.value - 2 // Squares are smaller than grid
  
  const topLeftX = Math.floor(Math.random() * (maxCoord + 1))
  const topLeftY = Math.floor(Math.random() * (maxCoord + 1))
  const squareId = `${topLeftY}-${topLeftX}`
  
  // Check if square already exists
  const squareExists = claimedSquares.value.some(s => s.id === squareId)
  
  if (!squareExists) {
    claimedSquares.value.push({
      id: squareId,
      topLeftX,
      topLeftY,
      player: Math.random() > 0.5 ? 1 : 2
    })
  }
}

// Clear all game state
const clearAll = () => {
  drawnLines.value = []
  claimedSquares.value = []
  lastSelectedLine.value = null
}
</script>

<style scoped>
.dot-grid-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
</style> 