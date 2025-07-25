<template>
  <div class="game-board-container">
    <div class="game-layout">
      <header class="game-header">
        <img src="/src/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="logo" />
        
        <div class="player-panels">
          <!-- Player 1 Panel -->
          <div :class="['player-panel', { 'is-turn': currentPlayer === 1, 'is-you': activePlayer === 1 }]">
            <div class="player-info">
              <div class="player-avatar player1-avatar">
                <span class="player-initial">{{ getPlayerInitial(1) }}</span>
              </div>
              <div class="player-details">
                <div class="player-name">
                  {{ getPlayerName(1) }}
                  <span v-if="activePlayer === 1" class="you-badge">(You)</span>
                </div>
                <div class="player-score">{{ scores[1] }} squares</div>
              </div>
            </div>
            <div v-if="currentPlayer === 1" class="turn-indicator">
              <span class="turn-text">{{ activePlayer === 1 ? 'Your Turn' : `${getPlayerName(1)}'s Turn` }}</span>
              <div class="timer-container">
                <span class="timer" :class="{ 'timer-warning': timeRemaining <= 10 }">
                  {{ formatTime(timeRemaining) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Player 2 Panel -->
          <div :class="['player-panel', { 'is-turn': currentPlayer === 2, 'is-you': activePlayer === 2 }]">
            <div class="player-info">
              <div class="player-avatar player2-avatar">
                <span class="player-initial">{{ getPlayerInitial(2) }}</span>
              </div>
              <div class="player-details">
                <div class="player-name">
                  {{ getPlayerName(2) }}
                  <span v-if="activePlayer === 2" class="you-badge">(You)</span>
                </div>
                <div class="player-score">{{ scores[2] }} squares</div>
              </div>
            </div>
            <div v-if="currentPlayer === 2" class="turn-indicator">
              <span class="turn-text">{{ activePlayer === 2 ? 'Your Turn' : `${getPlayerName(2)}'s Turn` }}</span>
              <div class="timer-container">
                <span class="timer" :class="{ 'timer-warning': timeRemaining <= 10 }">
                  {{ formatTime(timeRemaining) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="game-controls">
          <button @click="toggleAudio" :class="['audio-button', { 'audio-disabled': !audioEnabled }]">
            {{ audioEnabled ? '🔊' : '🔇' }}
          </button>
          <button @click="switchPlayer" class="switch-player-button">
            Switch to {{ getPlayerName(activePlayer === 1 ? 2 : 1) }}
          </button>
          <button @click="resetGame" class="reset-button">New Game</button>
        </div>
      </header>

      <main class="game-main">
        <DotGrid
          :grid-size="gridSize"
          :drawn-lines="drawnLines"
          :claimed-squares="claimedSquares"
          :can-make-move="canCurrentPlayerMove"
          @line-selected="handleLineSelected"
        />
        
        <div v-if="gameOver" class="game-over-overlay">
          <div class="game-over-content">
            <div class="winner-avatar" :class="winner === 1 ? 'player1-avatar' : winner === 2 ? 'player2-avatar' : 'tie-avatar'">
              <span v-if="winner !== 'tie' && winner !== null" class="winner-initial">{{ getPlayerInitial(winner) }}</span>
              <span v-else class="tie-icon">🤝</span>
            </div>
            <h2 v-if="winner">{{ winner === 'tie' ? "It's a Tie!" : `${getPlayerName(winner as number)} Wins!` }}</h2>
            <div class="final-scores">
              <div class="score-row">
                <div class="player-avatar player1-avatar small">
                  <span class="player-initial">{{ getPlayerInitial(1) }}</span>
                </div>
                <span class="score-text">{{ getPlayerName(1) }}: {{ scores[1] }} squares</span>
              </div>
              <div class="score-row">
                <div class="player-avatar player2-avatar small">
                  <span class="player-initial">{{ getPlayerInitial(2) }}</span>
                </div>
                <span class="score-text">{{ getPlayerName(2) }}: {{ scores[2] }} squares</span>
              </div>
            </div>
            <button @click="resetGame" class="play-again-button">Play Again</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DotGrid from '../components/DotGrid.vue'

// Game state
const gridSize = ref(5) // 5x5 grid of squares (6x6 dots)
const drawnLines = ref<Array<{id: string, startDot: string, endDot: string, player: number}>>([])
const claimedSquares = ref<Array<{id: string, topLeftX: number, topLeftY: number, player: number}>>([])
const currentPlayer = ref(1) // Whose turn it is in the game
const activePlayer = ref(1)  // Which player is actively playing (local player identification)
const scores = ref({ 1: 0, 2: 0 })
const gameOver = ref(false)

// Player data
const players = ref({
  1: { name: 'Alice', initial: 'A' },
  2: { name: 'Bob', initial: 'B' }
})

// Timer state
const timeRemaining = ref(30)
const turnTimer = ref<number | null>(null)
const TURN_DURATION = 30 // seconds

// Audio state
const countdownAudio = ref<HTMLAudioElement | null>(null)
const audioPlaying = ref(false)
const audioEnabled = ref(true)

// Computed properties
const winner = computed(() => {
  if (!gameOver.value) return null
  if (scores.value[1] > scores.value[2]) return 1
  if (scores.value[2] > scores.value[1]) return 2
  return 'tie'
})

const canCurrentPlayerMove = computed(() => {
  return !gameOver.value && currentPlayer.value === activePlayer.value && timeRemaining.value > 0
})

// Helper functions
const getPlayerName = (playerNumber: number) => {
  return players.value[playerNumber as 1 | 2]?.name || `Player ${playerNumber}`
}

const getPlayerInitial = (playerNumber: number) => {
  return players.value[playerNumber as 1 | 2]?.initial || playerNumber.toString()
}

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

// Initialize audio
const initializeAudio = () => {
  countdownAudio.value = new Audio('/sounds/countdown.mp3')
  countdownAudio.value.volume = 0.6
  countdownAudio.value.preload = 'auto'
}

// Play countdown sound
const playCountdownSound = () => {
  if (countdownAudio.value && !audioPlaying.value && audioEnabled.value) {
    audioPlaying.value = true
    countdownAudio.value.currentTime = 0
    countdownAudio.value.play().catch(error => {
      console.log('Audio play failed:', error)
    })
  }
}

// Toggle audio on/off
const toggleAudio = () => {
  audioEnabled.value = !audioEnabled.value
  if (!audioEnabled.value) {
    stopCountdownSound()
  }
}

// Stop countdown sound
const stopCountdownSound = () => {
  if (countdownAudio.value && audioPlaying.value) {
    countdownAudio.value.pause()
    countdownAudio.value.currentTime = 0
    audioPlaying.value = false
  }
}

// Start turn timer
const startTurnTimer = () => {
  clearTurnTimer()
  stopCountdownSound()
  timeRemaining.value = TURN_DURATION
  
  turnTimer.value = window.setInterval(() => {
    timeRemaining.value--
    
    // Play countdown sound during last 5 seconds
    if (timeRemaining.value === 5) {
      playCountdownSound()
    }
    
    if (timeRemaining.value <= 0) {
      stopCountdownSound()
      // Time's up - switch to next player
      nextTurn()
    }
  }, 1000)
}

// Clear turn timer
const clearTurnTimer = () => {
  if (turnTimer.value) {
    clearInterval(turnTimer.value)
    turnTimer.value = null
  }
  stopCountdownSound()
}

// Switch to next turn
const nextTurn = () => {
  currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
  startTurnTimer()
}

// Handle line selection from DotGrid
const handleLineSelected = (line: { startDot: string; endDot: string }) => {
  if (!canCurrentPlayerMove.value || lineExists(line.startDot, line.endDot)) return
  
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
    // Reset timer but keep same player
    startTurnTimer()
  } else {
    // Switch to other player
    nextTurn()
  }
  
  // Check if game is over (all squares claimed)
  const totalSquares = gridSize.value * gridSize.value
  if (claimedSquares.value.length >= totalSquares) {
    gameOver.value = true
    clearTurnTimer()
  }
}

// Switch active player (for local play)
const switchPlayer = () => {
  activePlayer.value = activePlayer.value === 1 ? 2 : 1
}

// Format time display
const formatTime = (seconds: number) => {
  return `${seconds}s`
}

// Reset game
const resetGame = () => {
  drawnLines.value = []
  claimedSquares.value = []
  currentPlayer.value = 1
  activePlayer.value = 1
  scores.value = { 1: 0, 2: 0 }
  gameOver.value = false
  startTurnTimer()
}

// Initialize game on mount
onMounted(() => {
  initializeAudio()
  resetGame()
})

// Cleanup on unmount
onUnmounted(() => {
  clearTurnTimer()
})
</script>

<style scoped>
.game-board-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.game-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1.5rem 2rem;
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logo {
  height: 80px;
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
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid transparent;
  min-width: 280px;
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  position: relative;
}

.player-panel.is-turn {
  border-color: #f59e0b;
  background: rgba(255, 251, 235, 0.9);
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.2);
  transform: translateY(-2px);
}

.player-panel.is-you::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 1rem 0 0 1rem;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.player-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
}

.player-avatar.small {
  width: 32px;
  height: 32px;
  font-size: 0.875rem;
}

.player1-avatar {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.player2-avatar {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.tie-avatar {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.player-initial {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.player-details {
  flex: 1;
}

.player-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.you-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  text-shadow: none;
}

.player-score {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.turn-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 0.75rem;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.turn-text {
  font-weight: 600;
  color: #059669;
  font-size: 0.875rem;
}

.timer-container {
  display: flex;
  align-items: center;
}

.timer {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #dc2626;
  background: rgba(254, 226, 226, 0.8);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  min-width: 3.5rem;
  text-align: center;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.timer-warning {
  background: #dc2626;
  color: white;
  animation: pulse 1s infinite;
  border-color: #dc2626;
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.8; 
    transform: scale(1.05);
  }
}

.game-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.audio-button {
  padding: 0.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-button:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.audio-button.audio-disabled {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.audio-button.audio-disabled:hover {
  background: linear-gradient(135deg, #4b5563, #374151);
  box-shadow: 0 6px 16px rgba(107, 114, 128, 0.4);
}

.switch-player-button {
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.switch-player-button:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.reset-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.reset-button:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.game-main {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 1rem;
}

.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.game-over-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 3rem;
  border-radius: 1.5rem;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 400px;
}

.winner-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 2rem;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 4px solid white;
}

.winner-initial, .tie-icon {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.game-over-content h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.final-scores {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(248, 250, 252, 0.5);
  border-radius: 0.75rem;
}

.score-text {
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}

.play-again-button {
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 1.125rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.play-again-button:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.25rem;
  }
  
  .player-panels {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .player-panel {
    min-width: 260px;
    width: 100%;
    max-width: 300px;
  }
  
  .game-controls {
    width: 100%;
    max-width: 200px;
  }
}
</style>