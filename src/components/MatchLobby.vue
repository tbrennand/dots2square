<template>
  <div class="match-lobby card">
    <img src="@/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="lobby-logo" />
    <div class="lobby-header">
      <h2>{{ isHost ? 'Match Lobby' : 'Joining Match' }}</h2>
      <p class="subtitle">{{ isHost ? 'Waiting for players to join' : 'Waiting for host to start' }}</p>
    </div>

    <!-- Match Info -->
    <div class="match-info-card">
      <div class="match-details">
        <div class="detail-item">
          <span class="label">Match ID:</span>
          <span class="value">{{ matchId }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Grid Size:</span>
          <span class="value">{{ gridSize }}x{{ gridSize }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Status:</span>
          <span class="value status" :class="getStatusClass()">{{ getStatusText() }}</span>
        </div>
      </div>
    </div>

    <!-- Players List -->
    <div class="players-section">
      <h3 class="section-title">Players ({{ joinedPlayers.length }}/{{ maxPlayers }})</h3>
      
      <div class="players-list">
        <!-- Player 1 (Host) -->
        <div class="player-card" :class="{ 'current-player': isCurrentPlayer(1) }">
          <div class="player-avatar">
            <span v-if="isHost">👑</span>
            <span v-else>👤</span>
          </div>
          <div class="player-details">
            <div class="player-name">{{ getPlayerName(1) }}</div>
            <div class="player-status">
              <span class="status-indicator" :class="getPlayerStatusClass(1)"></span>
              {{ getPlayerStatusText(1) }}
            </div>
            <div class="player-role">{{ isHost ? 'Host' : 'Player' }}</div>
          </div>
          <div class="player-actions" v-if="isHost && !isCurrentPlayer(1)">
            <button @click="kickPlayer(1)" class="kick-btn" title="Kick player">
              🚫
            </button>
          </div>
        </div>

        <!-- Player 2 -->
        <div v-if="hasPlayer2" class="player-card" :class="{ 'current-player': isCurrentPlayer(2) }">
          <div class="player-avatar">👤</div>
          <div class="player-details">
            <div class="player-name">{{ getPlayerName(2) }}</div>
            <div class="player-status">
              <span class="status-indicator" :class="getPlayerStatusClass(2)"></span>
              {{ getPlayerStatusText(2) }}
            </div>
            <div class="player-role">Player</div>
          </div>
          <div class="player-actions" v-if="isHost && !isCurrentPlayer(2)">
            <button @click="kickPlayer(2)" class="kick-btn" title="Kick player">
              🚫
            </button>
          </div>
        </div>

        <!-- Empty Slots -->
        <div v-for="slot in emptySlots" :key="`empty-${slot}`" class="player-card empty-slot">
          <div class="player-avatar">⏳</div>
          <div class="player-details">
            <div class="player-name">Waiting for player...</div>
            <div class="player-status">Not joined</div>
            <div class="player-role">Empty</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ready Status -->
    <div class="ready-section" v-if="hasPlayer2">
      <h3 class="section-title">Ready Status</h3>
      <div class="ready-indicators">
        <div class="ready-indicator" :class="{ ready: isPlayerReady(1) }">
          <span class="ready-icon">{{ isPlayerReady(1) ? '✅' : '⏳' }}</span>
          <span class="ready-text">{{ getPlayerName(1) }}</span>
        </div>
        <div class="ready-indicator" :class="{ ready: isPlayerReady(2) }">
          <span class="ready-icon">{{ isPlayerReady(2) ? '✅' : '⏳' }}</span>
          <span class="ready-text">{{ getPlayerName(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Lobby Actions -->
    <div class="lobby-actions">
      <!-- Host Actions -->
      <div v-if="isHost" class="host-actions">
        <button 
          @click="startGame" 
          :disabled="!canStartGame || isStarting"
          class="start-btn"
          :class="{ 'can-start': canStartGame }"
        >
          <span v-if="isStarting" class="loading-spinner"></span>
          {{ isStarting ? 'Starting Game...' : 'Start Game' }}
        </button>
        
        <button @click="cancelMatch" class="cancel-btn">
          Cancel Match
        </button>
      </div>

      <!-- Player Actions -->
      <div v-else class="player-actions">
        <button 
          @click="toggleReady" 
          :disabled="isUpdatingReady"
          class="ready-btn"
          :class="{ 'is-ready': isCurrentPlayerReady }"
        >
          <span v-if="isUpdatingReady" class="loading-spinner"></span>
          {{ isCurrentPlayerReady ? 'Not Ready' : 'Ready' }}
        </button>
        
        <button @click="leaveMatch" class="leave-btn">
          Leave Match
        </button>
      </div>

      <!-- Copy Link Button -->
      <button @click="copyMatchLink" class="copy-btn">
        📋 Copy Match Link
      </button>
    </div>

    <!-- Chat/Message Area -->
    <Chat :matchId="matchId" :currentPlayerName="getPlayerName(getCurrentPlayerNumber())" />

    <!-- Error/Success Messages -->
    <div v-if="errorMessage" class="error-message">
      ❌ {{ errorMessage }}
    </div>
    
    <div v-if="successMessage" class="success-message">
      ✅ {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'
import { doc, updateDoc, Unsubscribe } from 'firebase/firestore'
import { db } from '../firebase/index'
import Chat from './Chat.vue'

// Router and route
const route = useRoute()
const router = useRouter()

// Match store
const matchStore = useMatchStore()

// Local state
const matchId = ref('')
const isHost = ref(false)
const currentPlayerId = ref('')
const isStarting = ref(false)
const isUpdatingReady = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Computed properties
const matchData = computed(() => matchStore.matchData)
const gridSize = computed(() => matchData.value?.gridSize || 5)
const maxPlayers = computed(() => matchData.value?.maxPlayers || 2)
const joinedPlayers = computed(() => {
  const players = []
  if (matchData.value?.player1) players.push(matchData.value.player1)
  if (matchData.value?.player2) players.push(matchData.value.player2)
  return players
})

const hasPlayer2 = computed(() => !!matchData.value?.player2)
const emptySlots = computed(() => {
  const filled = joinedPlayers.value.length
  return Array.from({ length: maxPlayers.value - filled }, (_, i) => filled + i + 1)
})

const canStartGame = computed(() => {
  return isHost.value && 
         hasPlayer2.value && 
         isPlayerReady(1) && 
         isPlayerReady(2) &&
         matchData.value?.status === 'waiting'
})

const isCurrentPlayerReady = computed(() => {
  const playerNumber = getCurrentPlayerNumber()
  return isPlayerReady(playerNumber)
})

// Helper functions
const getCurrentPlayerNumber = (): number => {
  if (matchData.value?.player1?.id === currentPlayerId.value) return 1
  if (matchData.value?.player2?.id === currentPlayerId.value) return 2
  return 0
}

const isCurrentPlayer = (playerNumber: number): boolean => {
  return getCurrentPlayerNumber() === playerNumber
}

const getPlayerName = (playerNumber: number): string => {
  if (playerNumber === 1 && matchData.value?.player1) {
    return matchData.value.player1.name
  }
  if (playerNumber === 2 && matchData.value?.player2) {
    return matchData.value.player2.name
  }
  return `Player ${playerNumber}`
}

const getPlayerStatusText = (playerNumber: number): string => {
  if (isPlayerReady(playerNumber)) return 'Ready'
  if (isPlayerOnline(playerNumber)) return 'Online'
  return 'Offline'
}

const getPlayerStatusClass = (playerNumber: number): string => {
  if (isPlayerReady(playerNumber)) return 'status-ready'
  if (isPlayerOnline(playerNumber)) return 'status-online'
  return 'status-offline'
}

const isPlayerReady = (playerNumber: number): boolean => {
  // This would check against Firebase presence/ready status
  // For now, we'll assume all joined players are ready
  return playerNumber <= joinedPlayers.value.length
}

const isPlayerOnline = (playerNumber: number): boolean => {
  // This would check Firebase presence
  // For now, we'll assume all joined players are online
  return playerNumber <= joinedPlayers.value.length
}

const getStatusClass = (): string => {
  switch (matchData.value?.status) {
    case 'waiting': return 'status-waiting'
    case 'active': return 'status-active'
    case 'completed': return 'status-completed'
    case 'cancelled': return 'status-cancelled'
    default: return 'status-unknown'
  }
}

const getStatusText = (): string => {
  switch (matchData.value?.status) {
    case 'waiting': return 'Waiting for players'
    case 'active': return 'Game in progress'
    case 'completed': return 'Game completed'
    case 'cancelled': return 'Match cancelled'
    default: return 'Unknown status'
  }
}

// Event handlers
const startGame = async () => {
  if (!canStartGame.value) return

  isStarting.value = true
  errorMessage.value = ''

  try {
    const matchRef = doc(db, 'matches', matchId.value)
    await updateDoc(matchRef, {
      status: 'active',
      updatedAt: new Date()
    })

    // Navigate to game
    router.push(`/match/${matchId.value}`)
  } catch (error) {
    errorMessage.value = 'Failed to start game'
    console.error('Error starting game:', error)
  } finally {
    isStarting.value = false
  }
}

const toggleReady = async () => {
  isUpdatingReady.value = true
  errorMessage.value = ''

  try {
    // This would update Firebase presence/ready status
    // For now, we'll just show a success message
    successMessage.value = isCurrentPlayerReady.value ? 'Marked as not ready' : 'Marked as ready'
    
    // Clear success message after 2 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 2000)
  } catch (error) {
    errorMessage.value = 'Failed to update ready status'
    console.error('Error updating ready status:', error)
  } finally {
    isUpdatingReady.value = false
  }
}

const cancelMatch = async () => {
  if (!isHost.value) return

  try {
    const matchRef = doc(db, 'matches', matchId.value)
    await updateDoc(matchRef, {
      status: 'cancelled',
      updatedAt: new Date()
    })

    router.push('/')
  } catch (error) {
    errorMessage.value = 'Failed to cancel match'
    console.error('Error cancelling match:', error)
  }
}

const leaveMatch = () => {
  // This would update Firebase to remove player
  router.push('/')
}

const kickPlayer = async (playerNumber: number) => {
  if (!isHost.value) return

  try {
    const matchRef = doc(db, 'matches', matchId.value)
    const updateData: any = {
      updatedAt: new Date()
    }

    if (playerNumber === 2) {
      updateData.player2 = null
    }

    await updateDoc(matchRef, updateData)
    successMessage.value = `Player ${playerNumber} has been kicked`
  } catch (error) {
    errorMessage.value = 'Failed to kick player'
    console.error('Error kicking player:', error)
  }
}

const copyMatchLink = async () => {
  const matchUrl = `${window.location.origin}/match/${matchId.value}`
  
  try {
    await navigator.clipboard.writeText(matchUrl)
    successMessage.value = 'Match link copied to clipboard!'
    setTimeout(() => {
      successMessage.value = ''
    }, 2000)
  } catch (error) {
    errorMessage.value = 'Failed to copy link'
  }
}

// Initialize
onMounted(() => {
  matchId.value = route.params.id as string
  currentPlayerId.value = 'user-123' // TODO: Get from auth
  
  // Determine if current user is host
  if (matchData.value?.player1?.id === currentPlayerId.value) {
    isHost.value = true
  }

  // Subscribe to match updates
  if (matchId.value) {
    matchStore.subscribeToMatchById(matchId.value)
  }

  // Watch for status changes
  if (matchData.value?.status === 'active') {
    router.push(`/match/${matchId.value}`)
  }
})

onUnmounted(() => {
  matchStore.unsubscribeFromMatch()
})
</script>

<style scoped>
.match-lobby {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.lobby-header {
  text-align: center;
  margin-bottom: 2rem;
}

.lobby-header h2 {
  font-size: 2rem;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

/* Match Info Card */
.match-info-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.match-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-weight: 600;
  color: #374151;
}

.value {
  font-weight: 500;
  color: #1f2937;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-waiting {
  background: #fef3c7;
  color: #d97706;
}

.status-active {
  background: #dbeafe;
  color: #2563eb;
}

.status-completed {
  background: #dcfce7;
  color: #059669;
}

.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

/* Players Section */
.players-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.player-card.current-player {
  border-color: #3b82f6;
  background: #eff6ff;
}

.player-card.empty-slot {
  opacity: 0.6;
  border-style: dashed;
}

.player-avatar {
  font-size: 1.5rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 50%;
}

.player-details {
  flex: 1;
}

.player-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-online {
  background: #10b981;
}

.status-ready {
  background: #3b82f6;
}

.status-offline {
  background: #6b7280;
}

.player-role {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.player-actions {
  display: flex;
  gap: 0.5rem;
}

.kick-btn {
  padding: 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.kick-btn:hover {
  background: #fecaca;
  transform: scale(1.05);
}

/* Ready Section */
.ready-section {
  margin-bottom: 2rem;
}

.ready-indicators {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.ready-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.ready-indicator.ready {
  background: #dcfce7;
  border-color: #22c55e;
}

.ready-icon {
  font-size: 1.2rem;
}

.ready-text {
  font-weight: 500;
  color: #374151;
}

/* Lobby Actions */
.lobby-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.host-actions, .player-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.start-btn, .ready-btn, .cancel-btn, .leave-btn, .copy-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.start-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.start-btn.can-start {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.ready-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #d1d5db;
}

.ready-btn.is-ready {
  background: #dcfce7;
  color: #059669;
  border-color: #22c55e;
}

.ready-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.cancel-btn, .leave-btn {
  background: #fee2e2;
  color: #dc2626;
}

.cancel-btn:hover, .leave-btn:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

.copy-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  align-self: center;
}

.copy-btn:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Chat Section */
.chat-section {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.chat-messages {
  height: 200px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8fafc;
}

.chat-message {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.message-time {
  color: #9ca3af;
  font-size: 0.75rem;
  margin-right: 0.5rem;
}

.message-author {
  font-weight: 600;
  color: #374151;
  margin-right: 0.5rem;
}

.message-text {
  color: #1f2937;
}

.chat-input {
  display: flex;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.message-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  margin-right: 0.5rem;
}

.send-btn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Messages */
.error-message, .success-message {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

/* Responsive Design */
@media (max-width: 640px) {
  .match-lobby {
    padding: 1rem;
    margin: 1rem;
  }
  
  .match-details {
    grid-template-columns: 1fr;
  }
  
  .host-actions, .player-actions {
    flex-direction: column;
  }
  
  .ready-indicators {
    flex-direction: column;
  }
  
  .chat-input {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .message-input {
    margin-right: 0;
  }
}

.lobby-logo {
  max-width: 200px;
  margin: 0 auto 1rem auto;
  display: block;
}
</style> 