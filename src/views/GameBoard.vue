<template>
  <div class="game-board-container">
    <div class="game-layout">
      <header class="game-header">
        <img src="/src/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="logo" />
        
        <div class="player-panels">
          <!-- Player 1 Panel -->
          <div :class="['player-panel', { 'is-turn': currentPlayer === 1, 'is-you': currentUserPlayerNumber === 1 }]">
            <div class="player-info">
              <div class="player-avatar player1-avatar">
                <span class="player-initial">{{ getPlayerInitial(1) }}</span>
              </div>
              <div class="player-details">
                <div class="player-name">
                  {{ getPlayerName(1) }}
                  <span v-if="currentUserPlayerNumber === 1" class="you-badge">(You)</span>
                </div>
                <div class="player-score">{{ scores[1] }} squares</div>
              </div>
              <div class="turn-status">
                <div v-if="currentPlayer === 1" class="active-turn">
                  <span class="turn-text">{{ currentUserPlayerNumber === 1 ? 'Your Turn' : `${getPlayerName(1)}'s Turn` }}</span>
                  <div class="timer-container">
                    <span class="timer" :class="{ 'timer-warning': timeRemaining <= 10 }">
                      {{ formatTime(timeRemaining) }}
                    </span>
                  </div>
                </div>
                <div v-else class="waiting-turn">
                  <span class="waiting-text">{{ currentUserPlayerNumber === 1 ? 'Waiting...' : 'Waiting for turn' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Player 2 Panel -->
          <div :class="['player-panel', { 'is-turn': currentPlayer === 2, 'is-you': currentUserPlayerNumber === 2 }]">
            <div class="player-info">
              <div class="player-avatar player2-avatar">
                <span class="player-initial">{{ getPlayerInitial(2) }}</span>
              </div>
              <div class="player-details">
                <div class="player-name">
                  {{ getPlayerName(2) }}
                  <span v-if="currentUserPlayerNumber === 2" class="you-badge">(You)</span>
                </div>
                <div class="player-score">{{ scores[2] }} squares</div>
              </div>
              <div class="turn-status">
                <div v-if="currentPlayer === 2" class="active-turn">
                  <span class="turn-text">{{ currentUserPlayerNumber === 2 ? 'Your Turn' : `${getPlayerName(2)}'s Turn` }}</span>
                  <div class="timer-container">
                    <span class="timer" :class="{ 'timer-warning': timeRemaining <= 10 }">
                      {{ formatTime(timeRemaining) }}
                    </span>
                  </div>
                </div>
                <div v-else class="waiting-turn">
                  <span class="waiting-text">{{ currentUserPlayerNumber === 2 ? 'Waiting...' : 'Waiting for turn' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="game-controls">
          <button @click="toggleAudio" :class="['audio-toggle', { 'audio-disabled': !audioEnabled }]">
            <span class="audio-icon">{{ audioEnabled ? '🔊' : '🔇' }}</span>
            <span class="audio-text">{{ audioEnabled ? 'Sound ON' : 'Sound OFF' }}</span>
          </button>
          <button @click="switchPlayer" class="pass-button">
            Pass
          </button>
          <button @click="forfeitMatch" class="quit-button">
            Quit
          </button>
        </div>
      </header>

      <main class="game-main">
        <DotGrid
          :grid-size="gameGridSize"
          :drawn-lines="gameLines"
          :claimed-squares="gameSquares"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'
import { playMove } from '../firebase/matchHelpers'
import { storeToRefs } from 'pinia'
import DotGrid from '../components/DotGrid.vue'

const route = useRoute()
const router = useRouter()
const matchStore = useMatchStore()

// Get current user ID from route query parameter - this is critical for multiplayer sync
const currentUserId = ref((route.query.playerId as string) || (route.query.userId as string) || 'user-' + Date.now())

const { 
  currentMatchId, 
  matchData, 
  isLoading, 
  error,
  lines, 
  squares, 
  gridSize, 
  currentPlayer,
  scores,
  gameOver
} = storeToRefs(matchStore)

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
  if (!matchData.value?.winner) return null
  return matchData.value.winner
})

const canCurrentPlayerMove = computed(() => {
  return matchStore.canPlayerMove(currentUserId.value) && timeRemaining.value > 0
})

const currentUserPlayerNumber = computed(() => {
  return matchStore.getPlayerNumber(currentUserId.value)
})

// Computed data for DotGrid - ensure fresh reactive data
const gameLines = computed(() => lines.value || [])
const gameSquares = computed(() => squares.value || [])
const gameGridSize = computed(() => gridSize.value || 5)

// Helper functions
const getPlayerName = (playerNumber: number) => {
  if (playerNumber === 1) return matchData.value?.player1?.name || 'Alice'
  if (playerNumber === 2) return matchData.value?.player2?.name || 'Bob'
  return `Player ${playerNumber}`
}

const getPlayerInitial = (playerNumber: number) => {
  const name = getPlayerName(playerNumber)
  return name.charAt(0).toUpperCase()
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
      // Time's up - turn will be handled by server
      clearTurnTimer()
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

// Removed periodic refresh - Firebase real-time updates are sufficient

// Handle line selection from DotGrid
const handleLineSelected = async (line: { startDot: string; endDot: string }) => {
  if (!canCurrentPlayerMove.value || !currentMatchId.value) return
  
  try {
    await playMove(currentMatchId.value, currentUserId.value, {
      startDot: line.startDot,
      endDot: line.endDot
    })
  } catch (error) {
    console.error('Error playing move:', error)
  }
}

// Switch active player (for testing - normally players join on different devices)
const switchPlayer = () => {
  // This is for local testing - cycle between player IDs
  if (currentUserId.value === matchData.value?.player1?.id) {
    currentUserId.value = matchData.value?.player2?.id || 'user-456'
  } else {
    currentUserId.value = matchData.value?.player1?.id || 'user-123'
  }
}

// Forfeit match
const forfeitMatch = () => {
  // TODO: Implement forfeit functionality
  console.log('Forfeit match requested by', currentUserId.value)
  router.push('/')
}

// Format time display
const formatTime = (seconds: number) => {
  return `${seconds}s`
}

// Reset game
const resetGame = () => {
  // This function is not directly used in the current Firebase flow,
  // but keeping it for consistency if a new game is initiated.
  // For Firebase, a new match would be created.
  console.log('Reset game requested')
}

// Watch for turn changes and restart timer
watch([currentPlayer, matchData], ([newPlayer, newMatchData]) => {
  if (newMatchData?.status === 'active' && !gameOver.value) {
    startTurnTimer()
  } else {
    clearTurnTimer()
  }
}, { immediate: true })

// Initialize game on mount
onMounted(() => {
  initializeAudio()
  
  const matchId = route.params.id as string
  if (matchId) {
    matchStore.subscribeToMatchById(matchId)
  } else {
    router.push('/')
  }
})

// Cleanup on unmount
onUnmounted(() => {
  clearTurnTimer()
  matchStore.unsubscribeFromMatch()
})

// Watch for game over and redirect
watch(gameOver, (isOver) => {
  if (isOver && currentMatchId.value) {
    clearTurnTimer()
    setTimeout(() => {
      router.push({ name: 'GameResult', query: { matchId: currentMatchId.value } })
    }, 2000) // Delay to show final state
  }
})
</script>

<style scoped>
.game-board-container {
  min-height: 100vh;
  background: #ffffff;
  padding: 1rem;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.game-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
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
  background: #1f2937;
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