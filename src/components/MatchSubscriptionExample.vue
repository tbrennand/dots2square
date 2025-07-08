<template>
  <div class="match-subscription-example">
    <h3>Match Subscription Example</h3>
    
    <!-- Connection Status -->
    <div class="status-section">
      <div class="status-indicator" :class="{ connected: isConnected, loading: isLoading }">
        <span v-if="isLoading">⏳ Connecting...</span>
        <span v-else-if="isConnected">✅ Connected</span>
        <span v-else>❌ Disconnected</span>
      </div>
      
      <div v-if="error" class="error-message">
        Error: {{ error }}
      </div>
    </div>

    <!-- Match Info -->
    <div v-if="match" class="match-info">
      <h4>Match Details</h4>
      <div class="info-grid">
        <div class="info-item">
          <strong>Status:</strong> {{ getMatchStatus() }}
        </div>
        <div class="info-item">
          <strong>Grid Size:</strong> {{ gridSize }}x{{ gridSize }}
        </div>
        <div class="info-item">
          <strong>Current Turn:</strong> Player {{ currentPlayer }}
        </div>
        <div class="info-item">
          <strong>Progress:</strong> {{ Math.round(getMatchProgress()) }}%
        </div>
      </div>

      <!-- Players -->
      <div class="players-section">
        <h5>Players</h5>
        <div class="players-list">
          <div 
            v-for="player in players" 
            :key="player.id"
            class="player-item"
            :class="{ 'current-turn': isCurrentPlayerTurn(player.id) }"
          >
            <span class="player-name">{{ player.name }}</span>
            <span class="player-score">{{ scores[getPlayerNumber(player.id) || 1] || 0 }} points</span>
          </div>
        </div>
      </div>

      <!-- Game State -->
      <div v-if="isActive" class="game-state">
        <h5>Game State</h5>
        <div class="state-info">
          <div>Remaining Squares: {{ getRemainingSquares() }}</div>
          <div v-if="gameOver" class="game-over">
            Game Over! Winner: {{ winner === 'tie' ? 'Tie' : `Player ${winner}` }}
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <div class="input-group">
        <label for="matchId">Match ID:</label>
        <input 
          id="matchId" 
          v-model="inputMatchId" 
          type="text" 
          placeholder="Enter match ID..."
          @keyup.enter="subscribeToMatch"
        />
      </div>
      
      <div class="button-group">
        <button @click="subscribeToMatch" :disabled="!inputMatchId || isSubscribing">
          {{ isSubscribing ? 'Subscribing...' : 'Subscribe' }}
        </button>
        <button @click="unsubscribe" :disabled="!isConnected">
          Unsubscribe
        </button>
        <button @click="clearError" :disabled="!error">
          Clear Error
        </button>
      </div>
    </div>

    <!-- Event Log -->
    <div class="event-log">
      <h5>Event Log</h5>
      <div class="log-entries">
        <div 
          v-for="(entry, index) in eventLog" 
          :key="index"
          class="log-entry"
          :class="entry.type"
        >
          <span class="timestamp">{{ entry.timestamp }}</span>
          <span class="message">{{ entry.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMatchSubscription } from '../composables/useMatchSubscription'

// Component state
const inputMatchId = ref('')
const eventLog = ref<Array<{ timestamp: string; message: string; type: string }>>([])

// Add log entry
const addLogEntry = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift({ timestamp, message, type })
  
  // Keep only last 10 entries
  if (eventLog.value.length > 10) {
    eventLog.value = eventLog.value.slice(0, 10)
  }
}

// Use the match subscription composable
const {
  matchId,
  isSubscribing,
  isLoading,
  error,
  match,
  isConnected,
  isWaiting,
  isActive,
  isCompleted,
  isCancelled,
  players,
  currentPlayer,
  scores,
  gameOver,
  winner,
  dots,
  squares,
  lines,
  gridSize,
  subscribe,
  unsubscribe,
  updateMatchId,
  clearError,
  getPlayerById,
  isPlayerInMatch,
  getPlayerNumber,
  isCurrentPlayerTurn,
  canPlayerMove,
  getMatchStatus,
  getMatchProgress,
  getRemainingSquares,
  getClaimedSquaresByPlayer
} = useMatchSubscription(null, {
  autoSubscribe: false,
  onMatchUpdate: (matchData) => {
    if (matchData) {
      addLogEntry(`Match updated: ${matchData.status}`, 'success')
    } else {
      addLogEntry('Match not found or disconnected', 'error')
    }
  },
  onError: (errorMessage) => {
    addLogEntry(`Error: ${errorMessage}`, 'error')
  },
  onStatusChange: (status) => {
    addLogEntry(`Status changed to: ${status}`, 'info')
  }
})

// Subscribe to a specific match
const subscribeToMatch = () => {
  if (!inputMatchId.value.trim()) return
  
  addLogEntry(`Subscribing to match: ${inputMatchId.value}`, 'info')
  subscribe(inputMatchId.value.trim())
}

// Unsubscribe from current match
const unsubscribeFromMatch = () => {
  addLogEntry('Unsubscribing from match', 'info')
  unsubscribe()
}

// Clear error messages
const clearErrorMessage = () => {
  clearError()
  addLogEntry('Error cleared', 'info')
}

// Initialize component
onMounted(() => {
  addLogEntry('Component mounted', 'info')
})
</script>

<style scoped>
.match-subscription-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.status-section {
  margin-bottom: 2rem;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.status-indicator.connected {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-indicator.loading {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.status-indicator:not(.connected):not(.loading) {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-weight: 500;
}

.match-info {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  padding: 0.5rem;
  background: white;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
}

.players-section {
  margin-bottom: 1.5rem;
}

.players-section h5 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.player-item.current-turn {
  background: #dbeafe;
  border-color: #3b82f6;
}

.player-name {
  font-weight: 600;
  color: #374151;
}

.player-score {
  color: #6b7280;
  font-weight: 500;
}

.game-state {
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.game-state h5 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.state-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.game-over {
  font-weight: 600;
  color: #059669;
  padding: 0.5rem;
  background: #dcfce7;
  border-radius: 0.25rem;
}

.controls {
  margin-bottom: 2rem;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.button-group button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.button-group button:first-child {
  background: #3b82f6;
  color: white;
}

.button-group button:first-child:hover:not(:disabled) {
  background: #2563eb;
}

.button-group button:nth-child(2) {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.button-group button:nth-child(2):hover:not(:disabled) {
  background: #e5e7eb;
}

.button-group button:last-child {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.button-group button:last-child:hover:not(:disabled) {
  background: #fde68a;
}

.button-group button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.event-log {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
}

.event-log h5 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.log-entries {
  max-height: 300px;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
}

.log-entry {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.log-entry.info {
  background: #dbeafe;
  color: #1e40af;
}

.log-entry.error {
  background: #fecaca;
  color: #dc2626;
}

.log-entry.success {
  background: #bbf7d0;
  color: #166534;
}

.timestamp {
  font-weight: 600;
  min-width: 80px;
}

.message {
  flex: 1;
}

@media (max-width: 640px) {
  .match-subscription-example {
    padding: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .button-group {
    flex-direction: column;
  }
}
</style> 