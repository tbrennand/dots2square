<template>
  <div class="match-lobby">
    <div class="lobby-header-section">
      <img src="@/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="lobby-logo" />
      <div class="lobby-header">
        <h2>{{ isHost ? 'Match Lobby' : 'Joining Match' }}</h2>
        <p class="subtitle">
          {{ isHost 
            ? (hasPlayer2 ? 'Both players joined! Ready to start.' : 'Waiting for second player to join...') 
            : (hasPlayer2 ? 'Waiting for host to start the game' : 'Waiting for second player to join...') 
          }}
        </p>
      </div>
    </div>

    <!-- Match Info -->
    <div class="match-info-card">
      <div class="match-details">
        <div class="detail-row">
          <span class="label">Match ID</span>
          <span class="value">{{ matchId }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Grid Size</span>
          <span class="value">{{ gridSize }}x{{ gridSize }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status</span>
          <span class="value status" :class="getStatusClass()">{{ getStatusText() }}</span>
        </div>
      </div>
    </div>

    <!-- Players List -->
    <div class="players-section">
      <h3 class="section-title">Players ({{ joinedPlayers.length }}/{{ maxPlayers }})</h3>
      
      <div class="players-list">
        <!-- Player 1 (Host) -->
        <div class="player-card player1" :class="{ 'current-player': isCurrentPlayer(1) }">
          <div class="player-avatar player1-avatar">
            <span v-if="isHost">👑</span>
            <span v-else>👤</span>
          </div>
          <div class="player-details">
            <div class="player-name">{{ getPlayerName(1) }}</div>
            <div class="player-status">
              <span class="status-indicator" :class="getPlayerStatusClass(1)"></span>
              Online
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
        <div v-if="hasPlayer2" class="player-card player2" :class="{ 'current-player': isCurrentPlayer(2) }">
          <div class="player-avatar player2-avatar">👤</div>
          <div class="player-details">
            <div class="player-name">{{ getPlayerName(2) }}</div>
            <div class="player-status">
              <span class="status-indicator" :class="getPlayerStatusClass(2)"></span>
              Online
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
            <div class="player-name">Waiting for player to join...</div>
            <div class="player-status">Share the link below to invite friends!</div>
            <div class="player-role">Empty</div>
          </div>
        </div>
      </div>
    </div>



    <!-- Lobby Actions -->
    <div class="lobby-actions" v-if="hasPlayer2">
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
        <button @click="leaveMatch" class="leave-btn">
          Leave Match
        </button>
      </div>
    </div>

          <!-- Share Section - Only show when waiting for second player -->
      <div v-if="!hasPlayer2" class="share-section">
        <h3 class="section-title">🎮 Invite Friends to Play</h3>
        <div class="share-options">
          <button @click="nativeShare" class="share-btn primary">
            📤 Share Game
          </button>
          <button @click="copyMatchLink" class="share-btn secondary">
            📋 Copy Link
          </button>
        </div>
        <div class="platform-share-options" v-if="!nativeShareSupported">
          <button @click="shareViaWhatsApp" class="platform-btn whatsapp">
            📱 WhatsApp
          </button>
          <button @click="shareViaTelegram" class="platform-btn telegram">
            💬 Telegram
          </button>
          <button @click="shareViaEmail" class="platform-btn email">
            📧 Email
          </button>
          <button @click="shareViaSMS" class="platform-btn sms">
            💬 SMS
          </button>
        </div>
        <div class="match-url-display">
          <input 
            :value="matchUrl" 
            readonly 
            class="url-input"
            @click="(event) => (event.target as HTMLInputElement)?.select()"
          />
        </div>
      </div>

    <!-- Chat/Message Area -->
    <Chat 
      v-if="matchId" 
      :matchId="matchId" 
      :currentPlayerName="getPlayerName(getCurrentPlayerNumber())"
      :hasSecondPlayer="hasPlayer2"
      :isHostChat="false"
    />

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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'
import { doc, updateDoc, serverTimestamp, Unsubscribe } from 'firebase/firestore'
import { db } from '../firebase/index'
import { joinMatch } from '../firebase/matchHelpers'
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
  if (playerNumber === 1 && matchData.value?.player1) return true
  if (playerNumber === 2 && matchData.value?.player2) return true
  return false
}

const isPlayerOnline = (playerNumber: number): boolean => {
  // This would check Firebase presence
  // For now, we'll assume all joined players are online
  if (playerNumber === 1 && matchData.value?.player1) return true
  if (playerNumber === 2 && matchData.value?.player2) return true
  return false
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
      turnStartedAt: serverTimestamp(),
      updatedAt: new Date()
    })

    // Navigate to game with playerId
    router.push(`/match/${matchId.value}?playerId=${currentPlayerId.value}`)
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

const matchUrl = computed(() => {
  // Use deployed URL in production, localhost in development
  const baseUrl = import.meta.env.VITE_PUBLIC_URL || 
    (import.meta.env.PROD ? 'https://dots2squarev2.vercel.app' : window.location.origin)
  return `${baseUrl}/invite/${matchId.value}`
})

const copyMatchLink = async () => {
  try {
    await navigator.clipboard.writeText(matchUrl.value)
    successMessage.value = '📋 Link copied! You can now paste it anywhere.'
    
    // Add visual feedback to the button
    const copyBtn = document.querySelector('.share-btn.secondary') as HTMLElement
    if (copyBtn) {
      copyBtn.style.transform = 'scale(0.95)'
      copyBtn.style.background = '#059669'
      copyBtn.textContent = 'Copied!'
      setTimeout(() => {
        copyBtn.style.transform = ''
        copyBtn.style.background = ''
        copyBtn.textContent = '📋 Copy Link'
      }, 2000)
    }
    
    setTimeout(() => {
      successMessage.value = ''
    }, 4000)
  } catch (error) {
    errorMessage.value = '❌ Failed to copy link - please try again'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// Check if native sharing is supported
const nativeShareSupported = ref('share' in navigator)

const nativeShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Dots 2 Squares Game',
        text: 'Join my Dots 2 Squares game!',
        url: matchUrl.value
      })
      successMessage.value = '✅ Shared successfully!'
      setTimeout(() => {
        successMessage.value = ''
      }, 2000)
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        errorMessage.value = '❌ Failed to share'
      }
    }
  }
}

const shareViaWhatsApp = () => {
  const text = `Join my Dots 2 Squares game! ${matchUrl.value}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(whatsappUrl, '_blank')
}

const shareViaTelegram = () => {
  const text = `Join my Dots 2 Squares game! ${matchUrl.value}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(matchUrl.value)}&text=${encodeURIComponent('Join my Dots 2 Squares game!')}`
  window.open(telegramUrl, '_blank')
}

const shareViaEmail = () => {
  const subject = 'Join my Dots 2 Squares game!'
  const body = `Hey! I'm playing Dots 2 Squares and want you to join me!\n\nClick this link to join: ${matchUrl.value}\n\nSee you in the game!`
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoUrl, '_blank')
}

const shareViaSMS = () => {
  const text = `Join my Dots 2 Squares game! ${matchUrl.value}`
  const smsUrl = `sms:?body=${encodeURIComponent(text)}`
  window.open(smsUrl, '_blank')
}

// Initialize
onMounted(async () => {
  try {
    console.log('MatchLobby onMounted called')
    matchId.value = route.params.id as string
    console.log('MatchId from route:', matchId.value)
    
    // Get player ID from query parameter (if coming from create game)
    const queryPlayerId = route.query.playerId as string
    console.log('Query playerId:', queryPlayerId)
    if (queryPlayerId) {
      currentPlayerId.value = queryPlayerId
      console.log('Set currentPlayerId from query:', currentPlayerId.value)
    }
    
    // Subscribe to match updates first
    if (matchId.value) {
      console.log('Subscribing to match:', matchId.value)
      matchStore.subscribeToMatchById(matchId.value)
    }
  } catch (error) {
    console.error('Error in MatchLobby onMounted:', error)
  }
})

// Watch for match data changes to handle joining
watch(matchData, async (newMatchData) => {
  try {
    console.log('MatchLobby watch triggered with:', newMatchData ? 'data' : 'no data')
    
    if (!newMatchData || !matchId.value) {
      console.log('No match data or matchId, returning')
      return
    }
  
  // If we don't have a currentPlayerId yet, generate one (for people joining via link)
  if (!currentPlayerId.value) {
    currentPlayerId.value = 'user-' + Math.random().toString(36).substring(2, 8)
    console.log('Generated new currentPlayerId:', currentPlayerId.value)
  }
  
  // Determine if current user is host
  if (newMatchData.player1?.id === currentPlayerId.value) {
    isHost.value = true
    console.log('Identified as host')
  }
  
  console.log('MatchLobby Debug:', {
    currentPlayerId: currentPlayerId.value,
    isHost: isHost.value,
    player1Id: newMatchData.player1?.id,
    player2Id: newMatchData.player2?.id,
    status: newMatchData.status,
    hasPlayer2: !!newMatchData.player2
  })
  
  // Auto-join logic: if we're not the host, not already player2, and there's no player2 yet
  if (!isHost.value && 
      newMatchData.status === 'waiting' && 
      !newMatchData.player2) {
    
    console.log('Attempting to auto-join as player 2...')
    
    try {
      const playerName = `Player ${Math.floor(Math.random() * 1000)}`
      await joinMatch(matchId.value, currentPlayerId.value, playerName)
      console.log('Successfully auto-joined match as player 2')
    } catch (error) {
      console.error('Failed to auto-join match:', error)
    }
  } else {
    console.log('Auto-join conditions not met:', {
      isHost: isHost.value,
      status: newMatchData.status,
      hasPlayer2: !!newMatchData.player2
    })
  }
  
  // Navigate to game when it becomes active
  if (newMatchData.status === 'active') {
    router.push(`/match/${matchId.value}?playerId=${currentPlayerId.value}`)
  }
  
  // Auto-start the game when both players join
  if (isHost.value && 
      newMatchData.status === 'waiting' && 
      newMatchData.player2 && 
      !isStarting.value) {
    console.log('Auto-starting game with both players joined')
    startGame()
  }
  } catch (error) {
    console.error('Error in MatchLobby watch:', error)
  }
}, { immediate: true })

onUnmounted(() => {
  matchStore.unsubscribeFromMatch()
})
</script>

<style scoped>
.match-lobby {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  max-height: 100vh;
  overflow-y: auto;
}

.lobby-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.lobby-header h2 {
  font-size: 2rem;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #6b7280;
  font-size: 1.125rem;
  margin: 0;
}

/* Match Info Card */
.match-info-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.match-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row:last-child {
  border-bottom: none;
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
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.players-list {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex-wrap: wrap;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 220px;
}

.player-card.player1 {
  border-left: 4px solid #3b82f6;
}

.player-card.player2 {
  border-left: 4px solid #f97316;
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
  font-size: 1.25rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 50%;
}

.player-avatar.player1-avatar {
  background: #3b82f6;
  color: white;
}

.player-avatar.player2-avatar {
  background: #f97316;
  color: white;
}

.player-details {
  flex: 1;
}

.player-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.125rem;
  font-size: 0.875rem;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.125rem;
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
  margin-bottom: 1rem;
}

.ready-indicators {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.ready-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.ready-indicator.ready {
  background: #dcfce7;
  border-color: #22c55e;
}

.ready-indicator.player1-ready {
  border-left: 4px solid #3b82f6;
}

.ready-indicator.player2-ready {
  border-left: 4px solid #f97316;
}

.ready-indicator.player1-ready.ready {
  background: #eff6ff;
  border-color: #3b82f6;
}

.ready-indicator.player2-ready.ready {
  background: #fef3c7;
  border-color: #f97316;
}

.ready-icon {
  font-size: 1rem;
}

.ready-text {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

/* Lobby Actions */
.lobby-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
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
  font-size: 1rem;
}

.start-btn {
  background: #f97316;
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: #ea580c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.start-btn.can-start {
  background: #f97316;
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

/* Chat Section - Styling handled by Chat component */

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
  background: #ecfdf5;
  border: 2px solid #10b981;
  color: #065f46;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  padding: 1.25rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  animation: fadeInOut 4s ease-in-out;
  position: relative;
}

.success-message::before {
  content: '📋';
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  10% { opacity: 1; transform: translateY(0); }
  85% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .match-lobby {
    padding: 0.75rem;
    margin: 0.25rem;
    max-width: 100%;
  }

  .lobby-header h2 {
    font-size: 1.25rem;
  }

  .subtitle {
    font-size: 0.875rem;
  }

  .players-list {
    flex-direction: column;
    gap: 0.5rem;
  }

  .player-card {
    min-width: auto;
    padding: 0.375rem;
  }

  .player-avatar {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.875rem;
  }

  .ready-indicators {
    flex-direction: column;
    gap: 0.375rem;
  }

  .host-actions, .player-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .share-options {
    flex-direction: column;
    gap: 0.5rem;
  }

  .platform-share-options {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.375rem;
  }

  .platform-btn {
    padding: 0.375rem 0.5rem;
    font-size: 0.8rem;
  }

  .share-section {
    padding: 0.75rem;
    margin-top: 0.75rem;
  }

  .chat-messages {
    height: 100px;
  }

  .section-title {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .match-lobby {
    padding: 0.5rem;
    margin: 0.125rem;
  }

  .lobby-header h2 {
    font-size: 1.125rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .player-name {
    font-size: 0.75rem;
  }

  .player-status {
    font-size: 0.65rem;
  }

  .chat-messages {
    height: 80px;
    padding: 0.375rem;
  }

  .chat-input {
    padding: 0.375rem;
  }

  .message-input {
    padding: 0.25rem;
  }

  .send-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }

  .share-btn {
    padding: 0.375rem 0.5rem;
    font-size: 0.8rem;
  }

  .platform-share-options {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }

  .platform-btn {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
  }

  .url-input {
    padding: 0.375rem;
    font-size: 0.7rem;
  }
}

.lobby-header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.lobby-logo {
  width: 256px;
  height: auto;
  margin: 0 auto 1rem auto;
  display: block;
}

@media (min-width: 640px) {
  .lobby-logo {
    width: 288px;
  }
}

@media (min-width: 768px) {
  .lobby-logo {
    width: 320px;
  }
}

@media (min-width: 1024px) {
  .lobby-logo {
    width: 384px;
  }
}

/* Share Section */
.share-section {
  margin-top: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

.share-options {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.share-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  font-size: 1rem;
}

.share-btn.primary {
  background: #f97316;
  color: white;
}

.share-btn.primary:hover {
  background: #ea580c;
  transform: translateY(-1px);
}

.share-btn.secondary {
  background: #6b7280;
  color: white;
}

.share-btn.secondary:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.platform-share-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.platform-btn {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.platform-btn.whatsapp {
  background: #25d366;
  color: white;
}

.platform-btn.whatsapp:hover {
  background: #128c7e;
  transform: translateY(-1px);
}

.platform-btn.telegram {
  background: #0088cc;
  color: white;
}

.platform-btn.telegram:hover {
  background: #006699;
  transform: translateY(-1px);
}

.platform-btn.email {
  background: #ea4335;
  color: white;
}

.platform-btn.email:hover {
  background: #d32f2f;
  transform: translateY(-1px);
}

.platform-btn.sms {
  background: #34a853;
  color: white;
}

.platform-btn.sms:hover {
  background: #2e7d32;
  transform: translateY(-1px);
}

.match-url-display {
  margin-top: 1rem;
}

.url-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-family: monospace;
  font-size: 0.875rem;
  color: #374151;
  cursor: text;
}

.url-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style> 