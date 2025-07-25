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
              <div class="player-name">{{ getPlayerName(1) }}</div>
              <div class="player-score">{{ scores[1] }} squares</div>
            </div>
            <div class="turn-status">
              <div v-if="currentPlayer === 1" class="active-turn">
                <span class="turn-text">{{ currentUserPlayerNumber === 1 ? 'Your Turn' : `${getPlayerName(1)}'s Turn` }}</span>
              </div>
              <div v-else class="waiting-turn">
                <span class="waiting-text">{{ currentUserPlayerNumber === 1 ? 'Waiting...' : 'Waiting for turn' }}</span>
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
              <div class="player-name">{{ getPlayerName(2) }}</div>
              <div class="player-score">{{ scores[2] }} squares</div>
            </div>
            <div class="turn-status">
              <div v-if="currentPlayer === 2" class="active-turn">
                <span class="turn-text">{{ currentUserPlayerNumber === 2 ? 'Your Turn' : `${getPlayerName(2)}'s Turn` }}</span>
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
        :can-make-move="canCurrentPlayerMove"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'
import { playMove } from '../firebase/matchHelpers'
import { storeToRefs } from 'pinia'
import DotGrid from '../components/DotGrid.vue'

const route = useRoute()
const router = useRouter()
const matchStore = useMatchStore()

// Get current user ID from route query parameter
const currentUserId = ref((route.query.playerId as string) || (route.query.userId as string) || 'user-' + Date.now())

// Get match store data
const { 
  currentMatchId, 
  matchData, 
  lines: firebaseLines, 
  squares: firebaseSquares, 
  gridSize: firebaseGridSize, 
  currentPlayer: firebaseCurrentPlayer,
  scores: firebaseScores,
  gameOver: firebaseGameOver
} = storeToRefs(matchStore)

// Local game state for immediate UI updates (synced with Firebase)
const gridSize = ref(5)
const currentPlayer = ref(1)
const drawnLines = ref<Array<{id: string, startDot: string, endDot: string, player: number}>>([])
const claimedSquares = ref<Array<{id: string, topLeftX: number, topLeftY: number, player: number}>>([])
const scores = ref({ 1: 0, 2: 0 })

// Audio state for mobile-compatible sound
const countdownAudio = ref<HTMLAudioElement | null>(null)
const audioEnabled = ref(false) // Start disabled for mobile compatibility
const audioInitialized = ref(false)

// Initialize audio (mobile-friendly)
const initializeAudio = () => {
  try {
    countdownAudio.value = new Audio('/sounds/countdown.mp3')
    countdownAudio.value.volume = 0.7
    countdownAudio.value.preload = 'none' // Don't preload on mobile
    audioInitialized.value = true
  } catch (error) {
    console.log('Audio initialization failed:', error)
  }
}

// Enable audio with user interaction (required for mobile)
const enableAudio = async () => {
  if (!audioInitialized.value) {
    initializeAudio()
  }
  
  if (countdownAudio.value) {
    try {
      // Test if audio can play (mobile requirement)
      const playPromise = countdownAudio.value.play()
      if (playPromise) {
        await playPromise
        countdownAudio.value.pause()
        countdownAudio.value.currentTime = 0
      }
      audioEnabled.value = true
    } catch (error) {
      console.log('Audio enable failed:', error)
      audioEnabled.value = false
    }
  }
}

// Toggle audio with mobile compatibility
const toggleAudio = async () => {
  if (!audioEnabled.value && !audioInitialized.value) {
    await enableAudio()
  } else {
    audioEnabled.value = !audioEnabled.value
  }
}

// Play countdown sound (mobile-compatible)
const playCountdownSound = () => {
  if (countdownAudio.value && audioEnabled.value) {
    try {
      countdownAudio.value.currentTime = 0
      const playPromise = countdownAudio.value.play()
      if (playPromise) {
        playPromise.catch(error => {
          console.log('Audio play failed:', error)
        })
      }
    } catch (error) {
      console.log('Audio play error:', error)
    }
  }
}

// Get current user's player number
const currentUserPlayerNumber = computed(() => {
  if (!matchData.value) return 1
  if (matchData.value.player1?.id === currentUserId.value) return 1
  if (matchData.value.player2?.id === currentUserId.value) return 2
  return 1
})

// Check if current user can make moves
const canCurrentPlayerMove = computed(() => {
  // Must be active game, correct turn, and current user's turn
  return matchData.value?.status === 'active' && 
         currentPlayer.value === currentUserPlayerNumber.value
})

// Game status - only show game over if Firebase says so OR local calculation AND Firebase game is active
const gameOver = computed(() => {
  // Don't show game over if no match data yet
  if (!matchData.value) {
    console.log('🎮 Game Over: NO - No match data')
    return false
  }
  
  // If Firebase explicitly says game is over, respect that
  if (firebaseGameOver.value) {
    console.log('🎮 Game Over: YES - Firebase says complete')
    return true
  }
  
  // If Firebase game isn't active, don't show local game over
  if (matchData.value?.status !== 'active') {
    console.log('🎮 Game Over: NO - Match not active, status:', matchData.value?.status)
    return false
  }
  
  // Only calculate local game over for active games
  const totalSquares = (gridSize.value - 1) * (gridSize.value - 1)
  const claimedCount = claimedSquares.value.length
  
  console.log('🎮 Game Over Check:', {
    totalSquares,
    claimedCount,
    claimedSquares: claimedSquares.value.map(s => ({ id: s.id, player: s.player })),
    isComplete: claimedCount >= totalSquares
  })
  
  if (claimedCount >= totalSquares) {
    console.log('🎮 Game Over: YES - All squares claimed locally')
    return true
  }
  
  console.log('🎮 Game Over: NO - Game continues')
  return false
})

const winner = computed(() => {
  // Use Firebase winner if available
  if (matchData.value?.winner) return matchData.value.winner
  
  // Otherwise calculate locally if game is over
  if (!gameOver.value) return null
  if (scores.value[1] > scores.value[2]) return 1
  if (scores.value[2] > scores.value[1]) return 2
  return 'tie'
})

// Sync Firebase state to local state
const syncFromFirebase = () => {
  if (!matchData.value) return
  
  // Only sync game state for active games
  if (matchData.value.status !== 'active') {
    // For non-active games, reset to initial state
    if (matchData.value.status === 'waiting') {
      drawnLines.value = []
      claimedSquares.value = []
      scores.value = { 1: 0, 2: 0 }
      currentPlayer.value = 1
    }
    return
  }
  
  // Update local state from Firebase for active games
  gridSize.value = firebaseGridSize.value || 5
  currentPlayer.value = firebaseCurrentPlayer.value || 1
  scores.value = { 
    1: firebaseScores.value?.[1] || 0, 
    2: firebaseScores.value?.[2] || 0 
  }
  
  // Sync lines
  if (firebaseLines.value) {
    drawnLines.value = firebaseLines.value.map(line => ({
      id: line.id,
      startDot: line.startDot,
      endDot: line.endDot,
      player: line.player || 1
    }))
  }
  
  // Sync squares - only claimed ones
  if (firebaseSquares.value) {
    const claimedFirebaseSquares = firebaseSquares.value.filter(square => square.player !== undefined)
    console.log('🔄 Firebase Squares Debug:', {
      totalFirebaseSquares: firebaseSquares.value.length,
      claimedFirebaseSquares: claimedFirebaseSquares.length,
      allSquares: firebaseSquares.value.map(s => ({ id: s.id, player: s.player })),
      claimedOnly: claimedFirebaseSquares.map(s => ({ id: s.id, player: s.player }))
    })
    
    claimedSquares.value = claimedFirebaseSquares.map(square => ({
      id: square.id,
      topLeftX: square.topLeftX || 0,
      topLeftY: square.topLeftY || 0,
      player: square.player as number
    }))
  } else {
    console.log('🔄 No Firebase squares to sync')
  }
}

// Handle line selection with Firebase sync
const handleLineSelected = async (line: { startDot: string; endDot: string }) => {
  // Only allow moves if it's the player's turn and they're in the match
  if (!canCurrentPlayerMove.value || !currentMatchId.value) {
    console.log('Move blocked - not your turn or not in match')
    return
  }
  
  // Check if line already exists locally (immediate feedback)
  const lineExists = drawnLines.value.some(l => 
    (l.startDot === line.startDot && l.endDot === line.endDot) ||
    (l.startDot === line.endDot && l.endDot === line.startDot)
  )
  
  if (lineExists) return
  
  // Add line locally for immediate UI update
  const newLine = {
    id: `${line.startDot}-${line.endDot}`,
    startDot: line.startDot,
    endDot: line.endDot,
    player: currentPlayer.value
  }
  drawnLines.value.push(newLine)
  
  // Check for completed squares locally
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
  
  // Update scores locally
  scores.value[currentPlayer.value as 1 | 2] += squaresClaimed
  
  // Switch turns locally (unless squares were claimed)
  if (squaresClaimed === 0) {
    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
  }
  
  // Send move to Firebase (will sync back to other players)
  try {
    await playMove(currentMatchId.value, currentUserId.value, {
      startDot: line.startDot,
      endDot: line.endDot
    })
  } catch (error) {
    console.error('Error syncing move to Firebase:', error)
    // Revert local changes if Firebase sync fails
    drawnLines.value = drawnLines.value.filter(l => l.id !== newLine.id)
    // Could also revert squares and scores here, but for simplicity keeping the optimistic update
  }
}

// Check for completed squares (same logic as before)
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

// Get player names
const getPlayerName = (playerNumber: number) => {
  if (playerNumber === 1) return matchData.value?.player1?.name || 'Player A'
  if (playerNumber === 2) return matchData.value?.player2?.name || 'Player B'
  return `Player ${playerNumber}`
}

// Switch player manually (for testing)
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

// Watch for Firebase changes and sync to local state
watch([firebaseLines, firebaseSquares, firebaseCurrentPlayer, firebaseScores], () => {
  syncFromFirebase()
}, { deep: true })

// Initialize game on mount
onMounted(() => {
  // Initialize audio for mobile compatibility
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
  if (countdownAudio.value) {
    countdownAudio.value.pause()
    countdownAudio.value = null
  }
  matchStore.unsubscribeFromMatch()
})

// Watch for game over and redirect
watch(gameOver, (isOver) => {
  if (isOver && currentMatchId.value) {
    setTimeout(() => {
      router.push({ name: 'GameResult', query: { matchId: currentMatchId.value } })
    }, 3000) // Show final state for 3 seconds
  }
})
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

/* Mobile and touch device optimizations */
@media (max-width: 768px) {
  .game-container {
    padding: 0.5rem;
    font-size: 14px;
  }

  .game-header {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    min-height: auto;
  }
  
  .logo {
    height: 60px;
    max-width: 200px;
  }
  
  .player-panels {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
  
  .player-panel {
    min-width: auto;
    width: 100%;
    max-width: none;
    padding: 0.5rem 0.75rem;
    max-height: 50px;
  }
  
  .player-info {
    gap: 0.5rem;
  }
  
  .player-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
  
  .player-name {
    font-size: 0.875rem;
  }
  
  .player-score {
    font-size: 0.75rem;
  }
  
  .turn-text, .waiting-text {
    font-size: 0.625rem;
  }
  
  .game-controls {
    flex-direction: row;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .audio-toggle, .pass-button, .quit-button {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    min-height: 44px; /* iOS recommended touch target */
    flex: 1;
    min-width: 120px;
  }
  
  .audio-text {
    display: none; /* Hide text on very small screens */
  }
  
  .game-main {
    padding: 0.5rem;
  }
  
  .game-over-overlay {
    padding: 1rem;
  }
  
  .game-over-content {
    padding: 1.5rem;
    max-width: 90vw;
  }
  
  .winner-avatar {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }
  
  .game-over-content h2 {
    font-size: 1.25rem;
  }
  
  .score-text {
    font-size: 0.875rem;
  }
  
  .play-again-button {
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
    min-height: 44px;
  }
}

@media (max-width: 480px) {
  .game-container {
    padding: 0.25rem;
  }
  
  .game-header {
    padding: 0.5rem;
  }
  
  .logo {
    height: 50px;
  }
  
  .player-panel {
    max-height: 45px;
    padding: 0.375rem 0.5rem;
  }
  
  .player-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  
  .audio-toggle {
    min-width: 60px;
  }
  
  .audio-text {
    display: none;
  }
  
  .pass-button, .quit-button {
    min-width: 80px;
    font-size: 0.75rem;
  }
}

/* Touch-specific optimizations */
@media (hover: none) {
  .player-panel:hover {
    transform: none;
  }
  
  .audio-toggle:hover,
  .pass-button:hover,
  .quit-button:hover,
  .play-again-button:hover {
    transform: none;
  }
  
  /* Add touch feedback instead */
  .audio-toggle:active,
  .pass-button:active,
  .quit-button:active,
  .play-again-button:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
}

/* Landscape orientation on mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .game-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
  }
  
  .player-panels {
    flex-direction: row;
    gap: 1rem;
    flex: 1;
    justify-content: center;
  }
  
  .player-panel {
    width: auto;
    min-width: 180px;
  }
  
  .logo {
    height: 40px;
  }
  
  .game-controls {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .audio-toggle, .pass-button, .quit-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    min-width: 80px;
  }
}
</style>