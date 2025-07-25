<template>
  <div class="game-container">
    <header class="game-header">
      <img src="/src/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="logo" />
      
      <div class="player-panels">
        <!-- Player A Panel -->
        <div :class="['player-panel', { 'is-turn': currentPlayer === 1 }]">
          <div class="player-info">
            <div class="player-avatar player1-avatar">
              <span class="player-initial">A</span>
            </div>
            <div class="player-details">
              <div class="player-name">Player A</div>
              <div class="player-score">{{ scores[1] }} squares</div>
            </div>
            <div class="turn-status">
              <div v-if="currentPlayer === 1" class="active-turn">
                <span class="turn-text">Player A's Turn</span>
              </div>
              <div v-else class="waiting-turn">
                <span class="waiting-text">Waiting...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Player B Panel -->
        <div :class="['player-panel', { 'is-turn': currentPlayer === 2 }]">
          <div class="player-info">
            <div class="player-avatar player2-avatar">
              <span class="player-initial">B</span>
            </div>
            <div class="player-details">
              <div class="player-name">Player B</div>
              <div class="player-score">{{ scores[2] }} squares</div>
            </div>
            <div class="turn-status">
              <div v-if="currentPlayer === 2" class="active-turn">
                <span class="turn-text">Player B's Turn</span>
              </div>
              <div v-else class="waiting-turn">
                <span class="waiting-text">Waiting...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="game-controls">
        <button @click="switchPlayer" class="pass-button">
          Pass Turn
        </button>
        <button @click="resetGame" class="quit-button">
          New Game
        </button>
      </div>
    </header>

    <main class="game-main">
      <DotGrid
        :grid-size="gridSize"
        :drawn-lines="drawnLines"
        :claimed-squares="claimedSquares"
        :can-make-move="true"
        @line-selected="handleLineSelected"
      />
      
      <div v-if="gameOver" class="game-over-overlay">
        <div class="game-over-content">
          <div class="winner-avatar" :class="winner === 1 ? 'player1-avatar' : winner === 2 ? 'player2-avatar' : 'tie-avatar'">
            <span v-if="winner !== 'tie' && winner !== null" class="winner-initial">{{ winner === 1 ? 'A' : 'B' }}</span>
            <span v-else class="tie-icon">🤝</span>
          </div>
          <h2 v-if="winner === 1">Player A Wins!</h2>
          <h2 v-else-if="winner === 2">Player B Wins!</h2>
          <h2 v-else>It's a Tie!</h2>
          
          <div class="final-scores">
            <div class="score-row">
              <div class="player-avatar player1-avatar small">
                <span class="player-initial">A</span>
              </div>
              <span class="score-text">Player A: {{ scores[1] }} squares</span>
            </div>
            <div class="score-row">
              <div class="player-avatar player2-avatar small">
                <span class="player-initial">B</span>
              </div>
              <span class="score-text">Player B: {{ scores[2] }} squares</span>
            </div>
          </div>
          
          <button @click="resetGame" class="play-again-button">Play Again</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DotGrid from '../components/DotGrid.vue'

// Simple local game state
const gridSize = ref(5)
const currentPlayer = ref(1)
const drawnLines = ref<Array<{id: string, startDot: string, endDot: string, player: number}>>([])
const claimedSquares = ref<Array<{id: string, topLeftX: number, topLeftY: number, player: number}>>([])
const scores = ref({ 1: 0, 2: 0 })

// Game status
const gameOver = computed(() => {
  const totalSquares = (gridSize.value - 1) * (gridSize.value - 1)
  const claimedCount = claimedSquares.value.length
  return claimedCount >= totalSquares
})

const winner = computed(() => {
  if (!gameOver.value) return null
  if (scores.value[1] > scores.value[2]) return 1
  if (scores.value[2] > scores.value[1]) return 2
  return 'tie'
})

// Handle line selection
const handleLineSelected = (line: { startDot: string; endDot: string }) => {
  // Check if line already exists
  const lineExists = drawnLines.value.some(l => 
    (l.startDot === line.startDot && l.endDot === line.endDot) ||
    (l.startDot === line.endDot && l.endDot === line.startDot)
  )
  
  if (lineExists) return
  
  // Add the line
  const newLine = {
    id: `${line.startDot}-${line.endDot}`,
    startDot: line.startDot,
    endDot: line.endDot,
    player: currentPlayer.value
  }
  drawnLines.value.push(newLine)
  
  // Check for completed squares
  const newSquares = checkForCompletedSquares()
  let squaresClaimed = 0
  
  newSquares.forEach(square => {
    if (!claimedSquares.value.some(s => s.id === square.id)) {
      claimedSquares.value.push({
        ...square,
        player: currentPlayer.value
      })
      squaresClaimed++
    }
  })
  
  // Update scores
  scores.value[currentPlayer.value as 1 | 2] += squaresClaimed
  
  // Switch turns (unless squares were claimed)
  if (squaresClaimed === 0) {
    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
  }
}

// Check for completed squares
const checkForCompletedSquares = () => {
  const newSquares: Array<{id: string, topLeftX: number, topLeftY: number}> = []
  
  for (let x = 0; x < gridSize.value - 1; x++) {
    for (let y = 0; y < gridSize.value - 1; y++) {
      const squareId = `${x}-${y}`
      
      // Skip if square already claimed
      if (claimedSquares.value.some(s => s.id === squareId)) continue
      
      // Check if all four lines exist
      const topLine = lineExists(`${y}-${x}`, `${y}-${x + 1}`)
      const bottomLine = lineExists(`${y + 1}-${x}`, `${y + 1}-${x + 1}`)
      const leftLine = lineExists(`${y}-${x}`, `${y + 1}-${x}`)
      const rightLine = lineExists(`${y}-${x + 1}`, `${y + 1}-${x + 1}`)
      
      if (topLine && bottomLine && leftLine && rightLine) {
        newSquares.push({
          id: squareId,
          topLeftX: x,
          topLeftY: y
        })
      }
    }
  }
  
  return newSquares
}

// Helper to check if line exists
const lineExists = (dot1: string, dot2: string) => {
  return drawnLines.value.some(line => 
    (line.startDot === dot1 && line.endDot === dot2) ||
    (line.startDot === dot2 && line.endDot === dot1)
  )
}

// Switch player manually
const switchPlayer = () => {
  currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
}

// Reset game
const resetGame = () => {
  currentPlayer.value = 1
  drawnLines.value = []
  claimedSquares.value = []
  scores.value = { 1: 0, 2: 0 }
}
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  background: #ffffff;
  padding: 1rem;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  min-height: 80px;
}

.logo {
  height: 120px;
  width: auto;
  flex-shrink: 0;
}

.player-panels {
  display: flex;
  gap: 1rem;
  flex-grow: 1;
  justify-content: center;
}

.player-panel {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 3px solid #e5e7eb;
  min-width: 220px;
  max-height: 60px;
  background: #f9fafb;
  transition: all 0.3s ease;
  position: relative;
}

.player-panel.is-turn {
  border-color: #f97316;
  background: #fff7ed;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
  transform: scale(1.02);
}

.player-panel.is-you::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #1f2937;
  border-radius: 0.75rem 0 0 0.75rem;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 100%;
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 2px solid white;
  flex-shrink: 0;
}

.player-avatar.small {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}

.player1-avatar {
  background: #3b82f6;
}

.player2-avatar {
  background: #f97316;
}

.tie-avatar {
  background: #6b7280;
}

.player-initial {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.player-details {
  flex: 1;
  min-width: 0;
}

.player-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.125rem;
}

.you-badge {
  background: #f97316;
  color: white;
  font-size: 0.625rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.player-score {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.turn-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(249, 115, 22, 0.1);
  border-radius: 0.5rem;
  border: 1px solid rgba(249, 115, 22, 0.2);
  flex-shrink: 0;
}

.turn-text {
  font-weight: 600;
  color: #ea580c;
  font-size: 0.75rem;
  white-space: nowrap;
}

.turn-status {
  margin-top: 0.25rem;
}

.active-turn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.turn-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #f97316;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.waiting-turn {
  display: flex;
  align-items: center;
}

.waiting-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timer-container {
  display: flex;
  align-items: center;
}

.timer {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  background: #ffffff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  min-width: 35px;
  text-align: center;
}

.timer.timer-warning {
  color: #dc2626;
  background: #fef2f2;
  border-color: #fecaca;
  animation: pulse 1s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.05);
  }
}

.game-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.audio-toggle {
  padding: 0.5rem 0.75rem;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.audio-toggle:hover {
  background: #ea580c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(249, 115, 22, 0.4);
}

.audio-toggle.audio-disabled {
  background: #6b7280;
  box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3);
}

.audio-toggle.audio-disabled:hover {
  background: #4b5563;
  box-shadow: 0 4px 8px rgba(107, 114, 128, 0.4);
}

.audio-icon {
  font-size: 1rem;
}

.audio-text {
  font-size: 0.75rem;
  font-weight: 600;
}

.pass-button {
  padding: 0.5rem 0.75rem;
  background: #1f2937;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(31, 41, 55, 0.3);
}

.pass-button:hover {
  background: #111827;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(31, 41, 55, 0.4);
}

.quit-button {
  padding: 0.5rem 0.75rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
}

.quit-button:hover {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.4);
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
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.game-over-content {
  background: #ffffff;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  max-width: 400px;
}

.winner-avatar {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 3px solid white;
}

.winner-initial, .tie-icon {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.game-over-content h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.final-scores {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.score-text {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.play-again-button {
  padding: 0.75rem 1.5rem;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);
}

.play-again-button:hover {
  background: #ea580c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(249, 115, 22, 0.4);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    min-height: auto;
  }
  
  .logo {
    height: 80px;
  }
  
  .player-panels {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }
  
  .player-panel {
    min-width: 280px;
    width: 100%;
    max-width: 320px;
    max-height: none;
  }
  
  .game-controls {
    width: 100%;
    max-width: 160px;
    flex-direction: row;
    justify-content: center;
  }
}
</style>