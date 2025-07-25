<template>
  <div class="game-board-screen">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading your game...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <h2 class="error-title">Oops! Something went wrong.</h2>
      <p class="error-message">{{ error }}</p>
      <button @click="goHome" class="btn btn-primary">Return Home</button>
    </div>

    <!-- Game Content -->
    <div v-else-if="matchData" class="game-container">
      <!-- Header -->
      <header class="game-header">
        <div class="header-content">
          <img src="/src/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="header-logo" />
          <button @click="handleForfeit" class="forfeit-btn" :disabled="!canCurrentUserMove">
            🏳️ Forfeit Game
          </button>
        </div>
      </header>

      <!-- Scoreboard -->
      <div class="scoreboard">
        <div class="score-item" :class="{ 'current': currentPlayer === 1 }">
          <div class="player-avatar player1">{{ matchData.player1?.name?.charAt(0).toUpperCase() || 'P' }}</div>
          <div class="player-info">
            <span class="player-name">{{ matchData.player1?.name || 'Player 1' }}</span>
            <span class="player-score">{{ scores[1] || 0 }} squares</span>
            <span v-if="currentPlayer === 1" class="turn-status">
              <span class="turn-text">Your Turn</span>
              <span v-if="timerState.isActive" class="timer-text">{{ formatTime(timerState.timeRemaining) }}</span>
            </span>
          </div>
        </div>
        <div class="score-item" :class="{ 'current': currentPlayer === 2 }">
          <div class="player-avatar player2">{{ matchData.player2?.name?.charAt(0).toUpperCase() || 'P' }}</div>
          <div class="player-info">
            <span class="player-name">{{ matchData.player2?.name || 'Player 2' }}</span>
            <span class="player-score">{{ scores[2] || 0 }} squares</span>
            <span v-if="currentPlayer === 2" class="turn-status">
              <span class="turn-text">Your Turn</span>
              <span v-if="timerState.isActive" class="timer-text">{{ formatTime(timerState.timeRemaining) }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Game Grid -->
      <div class="game-grid-container">
        <DotGrid
          :grid-size="gridSize"
          :drawn-lines="lines"
          :claimed-squares="squares"
          @line-selected="handleLineSelected"
        />
      </div>



      <!-- Chat -->
      <div class="chat-container">
        <Chat 
          v-if="currentMatchId"
          :matchId="currentMatchId" 
          :currentPlayerName="currentPlayerName"
          :hasSecondPlayer="true"
          :isHostChat="false"
        />
      </div>

      <!-- Debug Info (Development Only) -->
      <div v-if="isDev" class="debug-info">
        <div>Grid: {{ gridSize }}x{{ gridSize }} | Lines: {{ lines.length }} | Squares: {{ squares.length }}</div>
        <div>Turn: {{ currentPlayer }} | Can Move: {{ canCurrentUserMove }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'
import { playMove } from '../firebase/matchHelpers'
import { useTurnTimer } from '../composables/useTurnTimer'
import DotGrid from '../components/DotGrid.vue'
import GameControls from '../components/GameControls.vue'
import Chat from '../components/Chat.vue'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const matchStore = useMatchStore()

const currentUserId = ref('user-123') // TODO: Get from auth

// Development mode check
const isDev = computed(() => import.meta.env.DEV)

// Using store state directly
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
} = storeToRefs(useMatchStore())

// Initialize turn timer
const turnTimer = useTurnTimer(currentMatchId.value || '', currentUserId.value)
const timerState = computed(() => turnTimer.getTimerState())

const canCurrentUserMove = computed(() => matchStore.canPlayerMove(currentUserId.value))
const currentUserPlayerNumber = computed(() => matchStore.getPlayerNumber(currentUserId.value))
const currentPlayerName = computed(() => {
  const playerNum = currentUserPlayerNumber.value ?? 1
  const player = playerNum === 1 ? matchData.value?.player1 : matchData.value?.player2
  return player?.name || 'Player'
})

const handleLineSelected = async (line: { startDot: string; endDot: string }) => {
  if (!currentMatchId.value || !canCurrentUserMove.value) return
  
  // Reset timer for current player when they make a move
  turnTimer.resetTimerForPlayer(currentUserId.value)
  
  await playMove(currentMatchId.value, currentUserId.value, line)
}

const handleForfeit = () => {
  // TODO: Implement forfeit logic
  console.log('Forfeit requested')
}

const goHome = () => router.push('/')

// Helper functions
const getCurrentPlayerName = () => {
  const playerNum = currentPlayer.value
  const player = playerNum === 1 ? matchData.value?.player1 : matchData.value?.player2
  return player?.name || `Player ${playerNum}`
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  const matchId = route.params.id as string
  if (matchId) {
    matchStore.subscribeToMatchById(matchId)
  } else {
    router.push('/')
  }
})

// Watch for match data changes to sync timer
watch(matchData, (newMatchData) => {
  if (newMatchData && newMatchData.status === 'active') {
    // Sync timer with server data
    const turnStartTime = newMatchData.turnStartedAt?.toDate() || null
    const turnDuration = newMatchData.turnDuration || 30
    
    turnTimer.syncTimerWithServer(turnStartTime, turnDuration)
    
    // Start timer for current player if it's their turn
    if (newMatchData.currentPlayerId === currentUserId.value) {
      turnTimer.startTimer(currentUserId.value, turnDuration)
    } else {
      // Stop timer if it's not this player's turn
      turnTimer.stopTimer()
    }
  }
}, { immediate: true })

onUnmounted(() => matchStore.unsubscribeFromMatch())

watch(gameOver, (isOver) => {
  if (isOver) {
    // Navigate to a results screen, for example
    console.log('Game has ended!')
  }
})
</script>

<style scoped>
.game-board-screen {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #f97316;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.125rem;
  color: #6b7280;
  font-weight: 500;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 2rem;
  text-align: center;
  gap: 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.error-message {
  color: #6b7280;
  margin-bottom: 1rem;
}

/* Game Container */
.game-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 1rem;
}

/* Header */
.game-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
}

.header-logo {
  height: 5rem;
  width: auto;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}

.forfeit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.forfeit-btn:hover:not(:disabled) {
  background: #fecaca;
  transform: translateY(-1px);
}

.forfeit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}



/* Scoreboard */
.scoreboard {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.score-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.score-item.current {
  border-color: #f97316;
  background: #fef3c7;
}

.player-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: white;
}

.player-avatar.player1 {
  background: #3b82f6;
}

.player-avatar.player2 {
  background: #f97316;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.player-score {
  font-weight: 700;
  color: #f97316;
  font-size: 1rem;
}

.turn-status {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.turn-text {
  font-weight: 600;
  color: #f97316;
  font-size: 0.875rem;
}

.timer-text {
  font-weight: 700;
  color: #dc2626;
  font-size: 0.875rem;
}

/* Game Grid Container */
.game-grid-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  min-height: 400px;
  overflow: visible;
}



/* Chat Container */
.chat-container {
  height: 300px;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Debug Info */
.debug-info {
  position: fixed;
  top: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  z-index: 10;
  backdrop-filter: blur(10px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .game-container {
    padding: 0.75rem;
  }
  
  .game-header {
    padding: 0.75rem 0;
  }
  
  .header-logo {
    height: 4rem;
  }
  
  .forfeit-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
  
  .scoreboard {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .score-item {
    padding: 0.75rem;
  }
  
  .player-avatar {
    width: 2rem;
    height: 2rem;
    font-size: 0.875rem;
  }
  
  .player-name {
    font-size: 0.8rem;
  }
  
  .player-score {
    font-size: 0.9rem;
  }
  
  .game-grid-container {
    padding: 1.5rem;
    min-height: 350px;
  }
  
  .chat-container {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .game-container {
    padding: 0.5rem;
  }
  
  .game-header {
    padding: 0.5rem 0;
  }
  
  .header-logo {
    height: 3.5rem;
  }
  
  .forfeit-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
  
  .score-item {
    padding: 0.5rem;
  }
  
  .player-avatar {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }
  
  .player-name {
    font-size: 0.75rem;
  }
  
  .player-score {
    font-size: 0.8rem;
  }
  
  .game-grid-container {
    padding: 1rem;
    min-height: 300px;
  }
  
  .chat-container {
    height: 200px;
  }
}
</style> 