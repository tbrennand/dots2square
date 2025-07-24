<template>
  <div class="game-board-view">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
      <div v-if="loadingProgress" class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
        </div>
        <span>{{ loadingProgress }}%</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h2>{{ getErrorTitle() }}</h2>
      <p class="error-message">{{ error }}</p>
      
      <!-- Error-specific actions -->
      <div class="error-actions">
        <button v-if="errorType === 'match-not-found'" @click="goHome" class="btn-primary">
          Go Home
        </button>
        <button v-else-if="errorType === 'opponent-disconnected'" @click="handleOpponentDisconnect" class="btn-primary">
          Wait for Reconnection
        </button>
        <button v-else-if="errorType === 'firestore-error'" @click="retryConnection" class="btn-primary">
          Retry Connection
        </button>
        <button @click="goHome" class="btn-secondary">
          Go Home
        </button>
      </div>
    </div>

    <!-- Connection Warning -->
    <div v-else-if="showConnectionWarning" class="connection-warning">
      <div class="warning-content">
        <div class="warning-icon">📡</div>
        <div class="warning-text">
          <h3>Connection Issue</h3>
          <p>{{ connectionWarningMessage }}</p>
        </div>
        <button @click="dismissConnectionWarning" class="btn-warning">
          Dismiss
        </button>
      </div>
    </div>

    <!-- Game Content -->
    <div v-else-if="matchData" class="game-content">
      <!-- Game Header -->
      <div class="game-header">
        <div class="header-left">
          <h1 class="game-title">Dots to Squares</h1>
          <p class="match-info">
            Match: {{ currentMatchId?.slice(0, 8) }}... | 
            Status: {{ getMatchStatus() }}
            <span v-if="!isConnected" class="connection-status disconnected">Disconnected</span>
            <span v-else class="connection-status connected">Connected</span>
          </p>
        </div>
        <div class="header-right">
          <button @click="goHome" class="btn-secondary">Home</button>
        </div>
      </div>

      <!-- Game Container -->
      <div class="game-container">
        <!-- Main Game Area -->
        <div class="game-main">
          <DotGrid
            :grid-size="gridSize"
            :drawn-lines="lines"
            :claimed-squares="squares"
            @line-selected="handleLineSelected"
          />
          
          <!-- Move Processing Overlay -->
          <div v-if="isProcessingMove" class="move-processing-overlay">
            <div class="processing-spinner"></div>
            <p>Processing move...</p>
          </div>
        </div>

        <!-- Side Panel -->
        <div class="side-panel">
          <!-- Turn Tracker -->
          <TurnTracker
            :current-player="currentPlayer"
            :game-over="gameOver"
          />

          <!-- Score Card -->
          <ScoreCard
            :scores="scores"
            :game-over="gameOver"
            :winner="winner"
            :current-turn="currentPlayer"
            :player1="matchData?.player1"
            :player2="matchData?.player2"
            :squares="squares"
            :grid-size="gridSize"
            :status="matchData?.status"
          />

          <!-- Game Controls -->
          <GameControls
            :can-move="canCurrentUserMove"
            :is-waiting="isWaiting"
            :is-active="isActive"
            :is-completed="isCompleted"
            @forfeit="handleForfeit"
            @rematch="handleRematch"
          />

          <!-- Match Info -->
          <div class="match-info-card">
            <h3>Match Info</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Progress:</span>
                <span class="value">{{ getMatchProgress().toFixed(1) }}%</span>
              </div>
              <div class="info-item">
                <span class="label">Remaining:</span>
                <span class="value">{{ getRemainingSquares() }} squares</span>
              </div>
              <div class="info-item">
                <span class="label">Player 1:</span>
                <span class="value">{{ getClaimedSquaresByPlayer(1) }} squares</span>
              </div>
              <div class="info-item">
                <span class="label">Player 2:</span>
                <span class="value">{{ getClaimedSquaresByPlayer(2) }} squares</span>
              </div>
            </div>
          </div>

          <!-- Connection Status -->
          <div class="connection-status-card">
            <h3>Connection Status</h3>
            <div class="status-grid">
              <div class="status-item">
                <span class="label">Firebase:</span>
                <span :class="['status-indicator', isConnected ? 'connected' : 'disconnected']">
                  {{ isConnected ? 'Connected' : 'Disconnected' }}
                </span>
              </div>
              <div class="status-item">
                <span class="label">Players:</span>
                <span class="value">{{ players.length }}/2</span>
              </div>
              <div class="status-item">
                <span class="label">Last Update:</span>
                <span class="value">{{ lastUpdateTime }}</span>
              </div>
            </div>
          </div>

          <!-- Chat -->
          <Chat 
            :matchId="currentMatchId" 
            :currentPlayerName="currentPlayerName"
          />
        </div>
      </div>
    </div>

    <!-- No Match State -->
    <div v-else class="no-match-container">
      <div class="no-match-icon">🎮</div>
      <h2>No Match Found</h2>
      <p>Please join a match to start playing.</p>
      <button @click="goHome" class="btn-primary">Go Home</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'
import { playMove } from '../firebase/matchHelpers'
import DotGrid from '../components/DotGrid.vue'
import TurnTracker from '../components/TurnTracker.vue'
import ScoreCard from '../components/ScoreCard.vue'
import GameControls from '../components/GameControls.vue'
import Chat from '../components/Chat.vue'

// Router and route
const route = useRoute()
const router = useRouter()

// Match store
const matchStore = useMatchStore()

// Local state
const currentUserId = ref<string>('user-123') // TODO: Get from auth
const isProcessingMove = ref(false)
const showConnectionWarning = ref(false)
const connectionWarningMessage = ref('')
const lastUpdateTime = ref('Just now')
const loadingProgress = ref(0)
const loadingMessage = ref('Loading game...')
const errorType = ref<'match-not-found' | 'opponent-disconnected' | 'firestore-error' | 'unknown'>('unknown')

// Computed properties from store
const {
  currentMatchId,
  matchData,
  isLoading,
  error,
  isConnected,
  isWaiting,
  isActive,
  isCompleted,
  isCancelled,
  currentPlayer,
  scores,
  gameOver,
  winner,
  lines,
  squares,
  gridSize,
  players,
  getMatchStatus,
  getMatchProgress,
  getRemainingSquares,
  getClaimedSquaresByPlayer,
  getPlayerNumber,
  isPlayerInMatch,
  canPlayerMove
} = matchStore

// Check if current user can move
const canCurrentUserMove = computed(() => {
  return matchStore.canPlayerMove(currentUserId.value)
})

// Get current user's player number
const currentUserPlayerNumber = computed(() => {
  return matchStore.getPlayerNumber(currentUserId.value)
})

const currentPlayerName = computed(() => {
  const playerNum = currentUserPlayerNumber.value ?? 1
  return matchData.value?.[`player${playerNum}`]?.name || 'Player'
})

// Error handling functions
const getErrorTitle = () => {
  switch (errorType.value) {
    case 'match-not-found':
      return 'Match Not Found'
    case 'opponent-disconnected':
      return 'Opponent Disconnected'
    case 'firestore-error':
      return 'Connection Error'
    default:
      return 'Error'
  }
}

const handleOpponentDisconnect = () => {
  // Wait for opponent to reconnect
  showConnectionWarning.value = true
  connectionWarningMessage.value = 'Waiting for opponent to reconnect...'
  
  // Set up a timeout to show reconnection attempt
  setTimeout(() => {
    if (showConnectionWarning.value) {
      connectionWarningMessage.value = 'Still waiting for opponent... You can continue waiting or go home.'
    }
  }, 10000)
}

const retryConnection = () => {
  if (currentMatchId.value) {
    matchStore.clearError()
    matchStore.subscribeToMatchById(currentMatchId.value)
  }
}

const dismissConnectionWarning = () => {
  showConnectionWarning.value = false
  connectionWarningMessage.value = ''
}

// Handle line selection from DotGrid
const handleLineSelected = async (line: { startDot: string; endDot: string }) => {
  if (!currentMatchId.value || isProcessingMove.value) return
  
  // Check if user can make a move
  if (!canPlayerMove.value) {
    console.log('Not your turn or game not active')
    return
  }

  // Check connection before making move
  if (!isConnected.value) {
    showConnectionWarning.value = true
    connectionWarningMessage.value = 'No connection to server. Please check your internet connection.'
    return
  }

  isProcessingMove.value = true

  try {
    const result = await playMove(currentMatchId.value, currentUserId.value, line)
    
    if (result.success) {
      console.log('Move played successfully:', result)
      lastUpdateTime.value = 'Just now'
    } else {
      console.error('Move failed:', result.error)
      
      // Handle specific error types
      if (result.error?.includes('permission') || result.error?.includes('write')) {
        errorType.value = 'firestore-error'
        matchStore.error = 'Failed to save move. Please check your connection and try again.'
      } else if (result.error?.includes('not found')) {
        errorType.value = 'match-not-found'
        matchStore.error = 'Match not found or has been deleted.'
      } else {
        errorType.value = 'unknown'
        matchStore.error = result.error || 'An unexpected error occurred.'
      }
    }
  } catch (error) {
    console.error('Error playing move:', error)
    
    // Determine error type based on error message
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    if (errorMessage.includes('permission') || errorMessage.includes('write')) {
      errorType.value = 'firestore-error'
      matchStore.error = 'Failed to save move due to connection issues. Please try again.'
    } else if (errorMessage.includes('not found')) {
      errorType.value = 'match-not-found'
      matchStore.error = 'Match not found or has been deleted.'
    } else {
      errorType.value = 'unknown'
      matchStore.error = 'An unexpected error occurred while playing your move.'
    }
  } finally {
    isProcessingMove.value = false
  }
}

// Handle forfeit
const handleForfeit = () => {
  // TODO: Implement forfeit logic
  console.log('Forfeit requested')
}

// Handle rematch
const handleRematch = () => {
  // TODO: Implement rematch logic
  console.log('Rematch requested')
}

// Navigation
const goHome = () => {
  matchStore.unsubscribeFromMatch()
  router.push('/')
}

// Watch for match completion and route to result
watch(isCompleted, (completed) => {
  if (completed && currentMatchId.value) {
    // Route to result screen with match data
    router.push({
      name: 'GameResult',
      query: {
        matchId: currentMatchId.value,
        winner: winner.value?.toString() || 'tie'
      }
    })
  }
})

// Watch for match cancellation
watch(isCancelled, (cancelled) => {
  if (cancelled) {
    // Route to home or show cancellation message
    router.push('/')
  }
})

// Watch for connection changes
watch(isConnected, (connected) => {
  if (!connected && matchData.value) {
    showConnectionWarning.value = true
    connectionWarningMessage.value = 'Lost connection to server. Attempting to reconnect...'
  } else if (connected) {
    showConnectionWarning.value = false
    connectionWarningMessage.value = ''
  }
})

// Watch for error changes
watch(error, (newError) => {
  if (newError) {
    // Determine error type based on error message
    if (newError.includes('not found') || newError.includes('Match not found')) {
      errorType.value = 'match-not-found'
    } else if (newError.includes('disconnected') || newError.includes('opponent')) {
      errorType.value = 'opponent-disconnected'
    } else if (newError.includes('permission') || newError.includes('write') || newError.includes('connection')) {
      errorType.value = 'firestore-error'
    } else {
      errorType.value = 'unknown'
    }
  }
})

// Watch for player count changes (opponent disconnect detection)
watch(players, (newPlayers, oldPlayers) => {
  if (oldPlayers && newPlayers.length < oldPlayers.length) {
    // A player disconnected
    showConnectionWarning.value = true
    connectionWarningMessage.value = 'Opponent has disconnected. Waiting for reconnection...'
    
    // Set timeout to show reconnection attempt
    setTimeout(() => {
      if (showConnectionWarning.value) {
        connectionWarningMessage.value = 'Opponent is still disconnected. You can wait or go home.'
      }
    }, 5000)
  }
})

// Initialize match subscription
onMounted(() => {
  const matchId = route.params.id as string
  if (matchId) {
    // Simulate loading progress
    loadingProgress.value = 0
    const progressInterval = setInterval(() => {
      if (loadingProgress.value < 90) {
        loadingProgress.value += 10
      }
    }, 200)

    // Update loading messages
    const messageInterval = setInterval(() => {
      if (loadingProgress.value < 30) {
        loadingMessage.value = 'Connecting to game...'
      } else if (loadingProgress.value < 60) {
        loadingMessage.value = 'Loading match data...'
      } else if (loadingProgress.value < 90) {
        loadingMessage.value = 'Setting up game board...'
      }
    }, 600)

    matchStore.subscribeToMatchById(matchId)
    
    // Clear intervals when loading is complete
    watch(isLoading, (loading) => {
      if (!loading) {
        clearInterval(progressInterval)
        clearInterval(messageInterval)
        loadingProgress.value = 100
        setTimeout(() => {
          loadingProgress.value = 0
        }, 500)
      }
    })
  } else {
    // No match ID provided, redirect to home
    router.push('/')
  }
})

// Cleanup on unmount
onUnmounted(() => {
  matchStore.unsubscribeFromMatch()
})
</script>

<style scoped>
.game-board-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  position: relative;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-message {
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 500px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Connection Warning */
.connection-warning {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #f59e0b;
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 300px;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.warning-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.warning-text h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.warning-text p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.btn-warning {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 0.25rem;
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-warning:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* No Match State */
.no-match-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
  gap: 1rem;
  text-align: center;
}

.no-match-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Game Content */
.game-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* Game Header */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  color: white;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.game-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
}

.match-info {
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.connection-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.connection-status.connected {
  background: #10b981;
  color: white;
}

.connection-status.disconnected {
  background: #ef4444;
  color: white;
}

.header-right {
  display: flex;
  gap: 1rem;
}

/* Game Container */
.game-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 3rem;
}

.game-main {
  flex-shrink: 0;
  position: relative;
}

/* Move Processing Overlay */
.move-processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 0.5rem;
  z-index: 10;
}

.processing-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.5rem;
}

/* Side Panel */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 280px;
  max-width: 320px;
}

/* Match Info Card */
.match-info-card,
.connection-status-card {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: white;
}

.match-info-card h3,
.connection-status-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.info-grid,
.status-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item,
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.value {
  font-weight: 600;
}

.status-indicator {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-indicator.connected {
  background: #10b981;
  color: white;
}

.status-indicator.disconnected {
  background: #ef4444;
  color: white;
}

/* Buttons */
.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .game-container {
    flex-direction: column;
    align-items: center;
  }
  
  .side-panel {
    order: -1;
    width: 100%;
    max-width: 500px;
  }
  
  .connection-warning {
    position: static;
    margin-bottom: 1rem;
    max-width: none;
  }
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .warning-content {
    flex-direction: column;
    text-align: center;
  }
}
</style> 