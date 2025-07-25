<template>
  <div class="game-board-screen min-h-screen bg-background p-4 sm:p-6">
    <div v-if="isLoading" class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="mt-4 text-lg font-semibold text-secondary">Loading your game...</p>
      </div>
    </div>
    
    <div v-else-if="error" class="flex items-center justify-center h-full">
      <div class="card text-center">
        <h2 class="text-2xl font-bold text-accent mb-2">Oops! Something went wrong.</h2>
        <p class="text-muted">{{ error }}</p>
        <button @click="goHome" class="btn btn-primary mt-6">Return Home</button>
      </div>
    </div>

    <div v-else-if="matchData" class="game-layout">
      <!-- Beautiful Header with Big Logo -->
      <header class="game-header">
        <div class="header-content">
          <div class="logo-section">
            <img :src="logoImage" alt="Dots 2 Squares Logo" class="game-logo" />
            <div class="logo-text">
              <span class="dots">Dots</span>
              <span class="two">2</span>
              <span class="squares">Squares</span>
            </div>
          </div>
          <div class="header-actions">
            <button @click="goHome" class="end-game-btn">
              <span class="btn-icon">🏠</span>
              <span class="btn-text">End Game</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Game Area -->
      <div class="game-content">
        <!-- Left Side - Game Grid -->
        <main class="game-main">
          <!-- Debug Info -->
          <div v-if="isDev" class="debug-info">
            <div>Grid: {{ gridSize }}x{{ gridSize }} | Lines: {{ lines.length }} | Squares: {{ squares.length }}</div>
            <div>Turn: {{ currentPlayer }} | Can Move: {{ canCurrentUserMove }}</div>
          </div>
          
          <div class="grid-container">
            <DotGrid
              :grid-size="gridSize"
              :drawn-lines="lines"
              :claimed-squares="squares"
              @line-selected="handleLineSelected"
            />
          </div>
        </main>

        <!-- Right Side - Game Info -->
        <aside class="game-sidebar">
          <!-- Turn Info Card -->
          <div class="turn-info-card">
            <div class="card-header">
              <h3>🎮 Current Turn</h3>
              <div class="turn-indicator" :class="{ 'active': timerState.isActive }"></div>
            </div>
            <div class="turn-display">
              <div class="player-info">
                <div class="player-avatar">{{ getCurrentPlayerName().charAt(0).toUpperCase() }}</div>
                <div class="player-details">
                  <span class="player-name">{{ getCurrentPlayerName() }}</span>
                  <span class="player-status">{{ timerState.isActive ? 'Playing' : 'Waiting' }}</span>
                </div>
              </div>
              <div class="timer-display" v-if="timerState.isActive">
                <div class="timer-circle">
                  <svg class="timer-svg" viewBox="0 0 36 36">
                    <path class="timer-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="timer-progress" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          :stroke-dasharray="`${timerState.timeRemainingPercentage}, 100`"/>
                  </svg>
                  <span class="timer-text">{{ formatTime(timerState.timeRemaining) }}</span>
                </div>
              </div>
              <span class="timer-inactive" v-else>⏸️ Timer Paused</span>
            </div>
          </div>

          <!-- Scoreboard Card -->
          <div class="scoreboard-card">
            <div class="card-header">
              <h3>🏆 Scoreboard</h3>
            </div>
            <div class="scores">
              <div class="score-item" :class="{ 'current': currentPlayer === 1 }">
                <div class="player-info">
                  <div class="player-avatar player1">{{ matchData.player1?.name?.charAt(0).toUpperCase() || 'P' }}</div>
                  <div class="player-details">
                    <span class="player-name">{{ matchData.player1?.name || 'Player 1' }}</span>
                    <span class="player-role">{{ currentPlayer === 1 ? 'Current Turn' : 'Waiting' }}</span>
                  </div>
                </div>
                <div class="score-display">
                  <span class="score">{{ scores[1] || 0 }}</span>
                  <span class="score-label">squares</span>
                </div>
              </div>
              <div class="score-item" :class="{ 'current': currentPlayer === 2 }">
                <div class="player-info">
                  <div class="player-avatar player2">{{ matchData.player2?.name?.charAt(0).toUpperCase() || 'P' }}</div>
                  <div class="player-details">
                    <span class="player-name">{{ matchData.player2?.name || 'Player 2' }}</span>
                    <span class="player-role">{{ currentPlayer === 2 ? 'Current Turn' : 'Waiting' }}</span>
                  </div>
                </div>
                <div class="score-display">
                  <span class="score">{{ scores[2] || 0 }}</span>
                  <span class="score-label">squares</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Chat Section -->
          <div class="chat-section">
            <Chat 
              v-if="currentMatchId"
              :matchId="currentMatchId" 
              :currentPlayerName="currentPlayerName"
            />
          </div>

          <!-- Game Controls -->
          <div class="controls-section">
            <GameControls
              :can-move="canCurrentUserMove"
              @forfeit="handleForfeit"
            />
          </div>
        </aside>
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
import TurnTracker from '../components/TurnTracker.vue'
import TurnTimer from '../components/TurnTimer.vue'
import ScoreCard from '../components/ScoreCard.vue'
import GameControls from '../components/GameControls.vue'
import Chat from '../components/Chat.vue'
import { storeToRefs } from 'pinia'
import logoImage from '../assets/dots2squares-logo.png'

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

// Helper functions for the new layout
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
.game-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.game-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.game-logo {
  height: 4rem;
  width: auto;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}

.logo-text {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  font-weight: 700;
  font-size: 1.75rem;
  color: #1f2937;
}

.dots {
  color: #1f2937;
}

.two {
  color: #f97316;
  font-size: 1.25rem;
  margin: 0 0.25rem;
}

.squares {
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.end-game-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.end-game-btn:hover {
  background: #ea580c;
}

.btn-icon {
  font-size: 1.1rem;
}

.game-content {
  flex: 1;
  display: flex;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.grid-container {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.debug-info {
  position: absolute;
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

.game-sidebar {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.turn-info-card,
.scoreboard-card,
.chat-section,
.controls-section {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.turn-info-card:hover,
.scoreboard-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.turn-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #9ca3af;
  transition: all 0.3s ease;
}

.turn-indicator.active {
  background: #f97316;
  box-shadow: 0 0 8px rgba(249, 115, 22, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.turn-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.player-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  background: #6b7280;
}

.player-avatar.player1 {
  background: #3b82f6;
}

.player-avatar.player2 {
  background: #f97316;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.player-status,
.player-role {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.timer-display {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.timer-circle {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-svg {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 3;
}

.timer-progress {
  fill: none;
  stroke: #f97316;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.2s ease;
}

.timer-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.timer-inactive {
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
}

.scores {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.8);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.score-item.current {
  background: #fef3c7;
  border-color: #f59e0b;
}

.score-item:hover {
  background: #f8fafc;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.score {
  font-size: 2rem;
  font-weight: 800;
  color: #f97316;
  line-height: 1;
}

.score-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chat-section {
  flex: 1;
  min-height: 300px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .game-content {
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .game-sidebar {
    width: 340px;
  }
}

@media (max-width: 1024px) {
  .game-content {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .game-sidebar {
    width: 100%;
    order: -1;
  }
  
  .grid-container {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .game-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .game-logo {
    height: 3rem;
  }
  
  .logo-text {
    font-size: 1.5rem;
  }
  
  .game-content {
    padding: 1rem;
  }
  
  .grid-container {
    padding: 1rem;
  }
  
  .chat-section {
    min-height: 250px;
  }
}
</style> 