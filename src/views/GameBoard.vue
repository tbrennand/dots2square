<template>
  <div class="game-board-container">
    <div class="game-layout">
      <header class="game-header">
        <img src="/src/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="logo" />
        
        <div class="player-panels">
          <!-- Player 1 Panel -->
          <div :class="['player-panel', { 'is-turn': currentPlayer === 1 }]">
            <div class="panel-header">
              <span class="player-name">Player 1</span>
              <span class="player-score">Score: {{ scores[1] }}</span>
            </div>
            <div v-if="currentPlayer === 1" class="turn-indicator">
              <span>Your Turn</span>
            </div>
          </div>

          <!-- Player 2 Panel -->
          <div :class="['player-panel', { 'is-turn': currentPlayer === 2 }]">
            <div class="panel-header">
              <span class="player-name">Player 2</span>
              <span class="player-score">Score: {{ scores[2] }}</span>
            </div>
            <div v-if="currentPlayer === 2" class="turn-indicator">
              <span>Your Turn</span>
            </div>
          </div>
        </div>

        <button @click="resetGame" class="reset-button">New Game</button>
      </header>

      <main class="game-main">
        <DotGrid
          :grid-size="gridSize"
          :drawn-lines="drawnLines"
          :claimed-squares="claimedSquares"
          :can-make-move="!gameOver"
          @line-selected="handleLineSelected"
        />
        
        <div v-if="gameOver" class="game-over-overlay">
          <div class="game-over-content">
            <h2 v-if="winner">{{ winner === 'tie' ? "It's a Tie!" : `Player ${winner} Wins!` }}</h2>
            <div class="final-scores">
              <p>Player 1: {{ scores[1] }} squares</p>
              <p>Player 2: {{ scores[2] }} squares</p>
            </div>
            <button @click="resetGame" class="play-again-button">Play Again</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DotGrid from '../components/DotGrid.vue'

// Game state
const gridSize = ref(5) // 5x5 grid of squares (6x6 dots)
const drawnLines = ref<Array<{id: string, startDot: string, endDot: string, player: number}>>([])
const claimedSquares = ref<Array<{id: string, topLeftX: number, topLeftY: number, player: number}>>([])
const currentPlayer = ref(1)
const scores = ref({ 1: 0, 2: 0 })
const gameOver = ref(false)

// Computed properties
const winner = computed(() => {
  if (!gameOver.value) return null
  if (scores.value[1] > scores.value[2]) return 1
  if (scores.value[2] > scores.value[1]) return 2
  return 'tie'
})

// Check if a line already exists
const lineExists = (startDot: string, endDot: string) => {
  return drawnLines.value.some(line => 
    (line.startDot === startDot && line.endDot === endDot) ||
    (line.startDot === endDot && line.endDot === startDot)
  )
}

// Check if a square is completed by having all 4 sides drawn
const checkSquareCompletion = (x: number, y: number) => {
  const topLeft = `${y}-${x}`
  const topRight = `${y}-${x + 1}`
  const bottomLeft = `${y + 1}-${x}`
  const bottomRight = `${y + 1}-${x + 1}`
  
  const sides = [
    `${topLeft}-${topRight}`,      // top
    `${topRight}-${bottomRight}`,  // right
    `${bottomRight}-${bottomLeft}`, // bottom
    `${bottomLeft}-${topLeft}`     // left
  ]
  
  return sides.every(side => {
    const [start, end] = side.split('-').map(dot => dot)
    return lineExists(start, end)
  })
}

// Find all newly completed squares after drawing a line
const findCompletedSquares = () => {
  const newSquares = []
  
  for (let y = 0; y < gridSize.value; y++) {
    for (let x = 0; x < gridSize.value; x++) {
      // Check if this square is already claimed
      const existingSquare = claimedSquares.value.find(s => s.topLeftX === x && s.topLeftY === y)
      if (existingSquare) continue
      
      // Check if this square is now complete
      if (checkSquareCompletion(x, y)) {
        newSquares.push({
          id: `${x}-${y}`,
          topLeftX: x,
          topLeftY: y,
          player: currentPlayer.value
        })
      }
    }
  }
  
  return newSquares
}

// Handle line selection from DotGrid
const handleLineSelected = (line: { startDot: string; endDot: string }) => {
  if (gameOver.value || lineExists(line.startDot, line.endDot)) return
  
  // Add the new line
  const newLine = {
    id: `${line.startDot}-${line.endDot}`,
    startDot: line.startDot,
    endDot: line.endDot,
    player: currentPlayer.value
  }
  drawnLines.value.push(newLine)
  
  // Check for completed squares
  const newSquares = findCompletedSquares()
  const squaresCompleted = newSquares.length
  
  if (squaresCompleted > 0) {
    // Add completed squares
    claimedSquares.value.push(...newSquares)
    
    // Update scores
    scores.value[currentPlayer.value as 1 | 2] += squaresCompleted
    
    // Player gets another turn if they completed squares
    // (currentPlayer stays the same)
  } else {
    // Switch to other player
    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
  }
  
  // Check if game is over (all squares claimed)
  const totalSquares = gridSize.value * gridSize.value
  if (claimedSquares.value.length >= totalSquares) {
    gameOver.value = true
  }
}

// Reset game
const resetGame = () => {
  drawnLines.value = []
  claimedSquares.value = []
  currentPlayer.value = 1
  scores.value = { 1: 0, 2: 0 }
  gameOver.value = false
}

// Initialize game on mount
onMounted(() => {
  resetGame()
})
</script>

<style scoped>
.game-board-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8fafc;
  padding: 2rem;
}

.game-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: 100%;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.logo {
  height: 100px;
  width: auto;
  flex-shrink: 0;
}

.player-panels {
  display: flex;
  gap: 2rem;
  flex-grow: 1;
  justify-content: center;
}

.player-panel {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  width: 250px;
  background-color: #f1f5f9;
  transition: all 0.3s ease;
}

.player-panel.is-turn {
  border-color: #f97316;
  background-color: #fff7ed;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  color: #374151;
}

.player-score {
  font-weight: 700;
  color: #f97316;
}

.turn-indicator {
  margin-top: 0.5rem;
  color: #16a34a;
  font-weight: 600;
}

.reset-button {
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.reset-button:hover {
  background-color: #2563eb;
}

.game-main {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.game-over-content {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.game-over-content h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.final-scores {
  margin: 1.5rem 0;
}

.final-scores p {
  font-size: 1.125rem;
  margin: 0.5rem 0;
  color: #4b5563;
}

.play-again-button {
  padding: 0.75rem 2rem;
  background-color: #16a34a;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 1.125rem;
  transition: background-color 0.3s ease;
}

.play-again-button:hover {
  background-color: #15803d;
}
</style> 