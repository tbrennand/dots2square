<template>
  <div class="game-container">
    <div class="game-header">
      <!-- Logo on left -->
      <img src="/src/assets/dots2squares-logo.png" alt="Dots2Squares" class="logo" />
      
      <!-- Game Controls on right -->
      <div class="game-controls">
        <button 
          @click="toggleAudio" 
          class="audio-toggle"
          :class="{ 'audio-off': !audioEnabled }"
        >
          <span v-if="audioEnabled">🔊</span>
          <span v-else>🔇</span>
          <span class="audio-text">{{ audioEnabled ? 'Sound' : 'Mute' }}</span>
        </button>
        
        <button 
          @click="switchPlayer" 
          class="pass-button"
          :disabled="!canCurrentPlayerMove || gameOver"
        >
          Pass
        </button>
        
        <button 
          @click="quitGame" 
          class="quit-button"
          :disabled="gameOver"
        >
          Quit
        </button>
      </div>
    </div>
    
    <!-- Player Panels with padding -->
    <div class="player-panels">
      <div 
        class="player-panel" 
        :class="{ 'is-turn': currentPlayer === 1 && !gameOver }"
      >
        <div class="player-info">
          <div class="player-avatar player1-avatar">
            {{ getPlayerInitial(matchData?.player1?.name || 'Player A') }}
          </div>
          <div class="player-details">
            <div class="player-name">{{ matchData?.player1?.name || 'Player A' }}</div>
            <div class="player-score">{{ scores[1] }} squares</div>
          </div>
        </div>
        <div class="player-status">
          <div v-if="currentPlayer === 1 && !gameOver" class="turn-text">
            {{ matchData?.player1?.name || 'Player A' }}'S TURN
            <div class="timer-countdown" v-if="isTimerActive && timeRemaining > 0">
              {{ Math.ceil(timeRemaining) }}s
            </div>
            <div class="missed-turns" v-if="missedTurns[matchData?.player1?.id || '']">
              Missed: {{ missedTurns[matchData?.player1?.id || ''] }}/3
            </div>
          </div>
          <div v-else class="waiting-text">WAITING...</div>
        </div>
      </div>
      
      <div 
        class="player-panel" 
        :class="{ 'is-turn': currentPlayer === 2 && !gameOver }"
      >
        <div class="player-info">
          <div class="player-avatar player2-avatar">
            {{ getPlayerInitial(matchData?.player2?.name || 'Player B') }}
          </div>
          <div class="player-details">
            <div class="player-name">{{ matchData?.player2?.name || 'Player B' }}</div>
            <div class="player-score">{{ scores[2] }} squares</div>
          </div>
        </div>
        <div class="player-status">
          <div v-if="currentPlayer === 2 && !gameOver" class="turn-text">
            {{ matchData?.player2?.name || 'Player B' }}'S TURN
            <div class="timer-countdown" v-if="isTimerActive && timeRemaining > 0">
              {{ Math.ceil(timeRemaining) }}s
            </div>
            <div class="missed-turns" v-if="missedTurns[matchData?.player2?.id || '']">
              Missed: {{ missedTurns[matchData?.player2?.id || ''] }}/3
            </div>
          </div>
          <div v-else class="waiting-text">WAITING...</div>
        </div>
      </div>
    </div>

    <main class="game-main">
      <DotGrid 
        :grid-size="gridSize"
        :drawn-lines="drawnLines"
        :claimed-squares="claimedSquares"
        :can-make-move="canCurrentPlayerMove"
        :player1-name="matchData?.player1?.name || 'Player 1'"
        :player2-name="matchData?.player2?.name || 'Player 2'"
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
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMatchStore } from '@/stores/matchStore'
import { playMove } from '@/firebase/matchHelpers'
import DotGrid from '@/components/DotGrid.vue'
import { useTurnTimer } from '@/composables/useTurnTimer'

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
const gridSize = ref(8) // Changed to 8 to match Firebase
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

// Turn timer with forfeit tracking
const missedTurns = ref<{ [playerId: string]: number }>({})

const {
  timeRemaining,
  timeRemainingPercentage,
  isTimerActive,
  isExpired: timerIsExpired,
  startTimer,
  stopTimer
} = useTurnTimer(
  currentMatchId.value || '',
  currentUserId.value
)

// Handle timer expiration and missed turns
const handleTimerExpired = async () => {
  console.log('⏰ Turn timer expired')
  
  if (!matchData.value || !currentMatchId.value) return
  
  const currentPlayerId = currentPlayer.value === 1 ? matchData.value.player1.id : matchData.value.player2?.id
  if (!currentPlayerId) return
  
  // Track missed turn
  if (!missedTurns.value[currentPlayerId]) {
    missedTurns.value[currentPlayerId] = 0
  }
  missedTurns.value[currentPlayerId]++
  
  console.log(`📊 Player ${currentPlayer.value} missed turns: ${missedTurns.value[currentPlayerId]}`)
  
  // Check for forfeit (3 missed turns)
  if (missedTurns.value[currentPlayerId] >= 3) {
    console.log(`🚫 Player ${currentPlayer.value} forfeits after 3 missed turns`)
    
    // Force game end with opponent as winner
    try {
      await playMove(currentMatchId.value, currentUserId.value, {
        startDot: '0-0', // Dummy move to trigger forfeit
        endDot: '0-1',
        forfeit: true,
        winner: currentPlayer.value === 1 ? 2 : 1
      })
    } catch (error) {
      console.error('Error handling forfeit:', error)
    }
    return
  }
  
  // Switch to other player
  await switchPlayer()
}

// Watch for timer warnings and play sound
watch(timeRemaining, (newTime, oldTime) => {
  // Play sound every second for last 5 seconds
  if (newTime <= 5 && newTime > 0) {
    const newSecond = Math.ceil(newTime)
    const oldSecond = Math.ceil(oldTime || 0)
    
    // Only play sound when we cross to a new second
    if (newSecond !== oldSecond && newSecond <= 5) {
      console.log(`🔊 Playing countdown sound: ${newSecond}s remaining`)
      playCountdownSound()
    }
  }
  
  // Handle timer expiration
  if (newTime <= 0 && (oldTime || 0) > 0) {
    handleTimerExpired()
  }
}, { immediate: false })

// Sync Firebase state to local state
const syncFromFirebase = () => {
  if (!matchData.value) return
  
  console.log('🔄 syncFromFirebase - Match status:', matchData.value.status)
  
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
  gridSize.value = firebaseGridSize.value || 8 // Ensure gridSize is 8 for active games
  currentPlayer.value = firebaseCurrentPlayer.value || 1
  scores.value = { 
    1: firebaseScores.value?.[1] || 0, 
    2: firebaseScores.value?.[2] || 0 
  }
  
  // Sync lines
  if (firebaseLines.value) {
    console.log('🔄 Syncing lines from Firebase:', firebaseLines.value.length, 'lines')
    console.log('🔄 Current local lines:', drawnLines.value.length, 'lines')
    
    // Only sync if Firebase has more lines than local (to preserve optimistic updates)
    if (firebaseLines.value.length >= drawnLines.value.length) {
      drawnLines.value = firebaseLines.value.map(line => ({
        id: line.id,
        startDot: line.startDot,
        endDot: line.endDot,
        player: line.player || 1
      }))
      console.log('🔄 Updated local lines to:', drawnLines.value.length, 'lines')
    } else {
      console.log('🔄 Keeping local optimistic updates, Firebase has fewer lines')
    }
  }
  
  // Sync squares - only claimed ones
  if (firebaseSquares.value) {
    // Filter for squares that have actual numeric player values
    const claimedFirebaseSquares = firebaseSquares.value.filter(square => 
      square.player !== undefined && 
      square.player !== null && 
      typeof square.player === 'number' &&
      (square.player === 1 || square.player === 2)
    )
    
    console.log('🔄 Syncing squares from Firebase:', claimedFirebaseSquares.length, 'squares')
    console.log('🔄 Current local squares:', claimedSquares.value.length, 'squares')
    
    // Only sync if Firebase has more squares than local
    if (claimedFirebaseSquares.length >= claimedSquares.value.length) {
      claimedSquares.value = claimedFirebaseSquares.map(square => ({
        id: square.id,
        topLeftX: square.topLeftX || 0,
        topLeftY: square.topLeftY || 0,
        player: square.player as number
      }))
      console.log('🔄 Updated local squares to:', claimedSquares.value.length, 'squares')
    } else {
      console.log('🔄 Keeping local optimistic updates, Firebase has fewer squares')
    }
  } else {
    claimedSquares.value = []
  }
}

// Handle line selection with Firebase sync
const handleLineSelected = async (line: { startDot: string; endDot: string }) => {
  console.log('🎯 Line selected:', line)
  console.log('🎮 Line selection debug:', {
    canCurrentPlayerMove: canCurrentPlayerMove.value,
    currentMatchId: currentMatchId.value,
    currentPlayer: currentPlayer.value,
    userPlayerNumber: currentUserPlayerNumber.value,
    matchStatus: matchData.value?.status
  })
  
  // Only allow moves if it's the player's turn and they're in the match
  if (!canCurrentPlayerMove.value || !currentMatchId.value) {
    console.log('❌ Move blocked - not your turn or not in match')
    return
  }
  
  // Check if line already exists locally (immediate feedback)
  const lineExists = drawnLines.value.some(l => 
    (l.startDot === line.startDot && l.endDot === line.endDot) ||
    (l.startDot === line.endDot && l.endDot === line.startDot)
  )
  
  if (lineExists) {
    console.log('❌ Line already exists:', line)
    return
  }
  
  console.log('✅ Adding line locally for immediate UI update')
  
  // Add line locally for immediate UI update
  const newLine = {
    id: `${line.startDot}-${line.endDot}`,
    startDot: line.startDot,
    endDot: line.endDot,
    player: currentPlayer.value
  }
  drawnLines.value.push(newLine)
  
  console.log('✅ Line added locally. Total lines:', drawnLines.value.length)
  
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
  
  console.log('✅ Squares claimed:', squaresClaimed)
  
  // Update scores locally
  scores.value[currentPlayer.value as 1 | 2] += squaresClaimed
  
  // Switch turns locally (unless squares were claimed)
  if (squaresClaimed === 0) {
    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
    console.log('🔄 Switched to player:', currentPlayer.value)
  } else {
    console.log('🎯 Extra turn for claiming square!')
  }
  
  // Send move to Firebase (will sync back to other players)
  try {
    console.log('📡 Sending move to Firebase...')
    await playMove(currentMatchId.value, currentUserId.value, {
      startDot: line.startDot,
      endDot: line.endDot
    })
    console.log('✅ Move sent to Firebase successfully')
  } catch (error) {
    console.error('❌ Error syncing move to Firebase:', error)
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

// Get player initial from name
const getPlayerInitial = (name: string) => {
  if (!name) return 'A'
  return name.charAt(0).toUpperCase()
}

// Switch player turn (Pass turn)
const switchPlayer = async () => {
  if (!currentMatchId.value || !matchData.value) return
  
  console.log('🔄 Manually switching turn')
  
  // Update local state optimistically
  currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
  
  // Send pass turn to Firebase
  try {
    await playMove(currentMatchId.value, currentUserId.value, {
      startDot: '0-0', // Dummy move to indicate pass
      endDot: '0-1',
      pass: true
    })
  } catch (error) {
    console.error('Error passing turn:', error)
    // Revert local change
    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
  }
}

// Reset game
const resetGame = () => {
  currentPlayer.value = 1
  drawnLines.value = []
  claimedSquares.value = []
  scores.value = { 1: 0, 2: 0 }
}

// Quit game (redirect to home)
const quitGame = () => {
  if (currentMatchId.value) {
    router.push({ name: 'GameResult', query: { matchId: currentMatchId.value } })
  } else {
    router.push('/')
  }
}

// Watch for Firebase changes and sync to local state
watch([firebaseLines, firebaseSquares, firebaseCurrentPlayer, firebaseScores], () => {
  console.log('🔄 Firebase data changed - triggering sync:', {
    lines: firebaseLines.value?.length || 0,
    squares: firebaseSquares.value?.length || 0,
    currentPlayer: firebaseCurrentPlayer.value,
    scores: firebaseScores.value
  })
  syncFromFirebase()
}, { deep: true, immediate: true })

// Watch for turn changes to start/stop timer
watch(currentPlayer, (newPlayer) => {
  console.log('🔄 Current player changed to:', newPlayer)
  if (matchData.value?.status === 'active' && isTimerActive) {
    startTimer(newPlayer === 1 ? matchData.value.player1.id : matchData.value.player2?.id || '', 30)
  }
}, { immediate: true })

// Watch for game status changes
watch(() => matchData.value?.status, (newStatus) => {
  console.log('🔄 Match status changed to:', newStatus)
  if (newStatus === 'active' && currentPlayer.value) {
    startTimer(currentPlayer.value === 1 ? matchData.value?.player1.id || '' : matchData.value?.player2?.id || '', 30)
  }
}, { immediate: true })

// Debug current game state
watch([currentPlayer, canCurrentPlayerMove, gameOver], () => {
  console.log('🎮 Game State Debug:', {
    currentPlayer: currentPlayer.value,
    canMove: canCurrentPlayerMove.value,
    gameOver: gameOver.value,
    matchStatus: matchData.value?.status,
    userPlayerNumber: currentUserPlayerNumber.value,
    drawnLines: drawnLines.value.length,
    claimedSquares: claimedSquares.value.length
  })
}, { immediate: true })

// Watch for timer warnings and play sound
watch(timeRemaining, (newTime) => {
  if (newTime <= 5 && newTime > 0 && Math.ceil(newTime) !== Math.ceil(newTime + 0.1)) {
    // Play sound every second for last 5 seconds
    playCountdownSound()
  }
}, { immediate: false })

// Debug computed properties to track data flow
const debugDotGridData = computed(() => ({
  gridSize: gridSize.value,
  drawnLinesCount: drawnLines.value.length,
  claimedSquaresCount: claimedSquares.value.length,
  canMakeMove: canCurrentPlayerMove.value,
  player1Name: matchData.value?.player1?.name || 'Player 1',
  player2Name: matchData.value?.player2?.name || 'Player 2'
}))

// Watch for DotGrid data changes
watch(debugDotGridData, (newData) => {
  console.log('🎯 DotGrid data updated:', newData)
  console.log('🧪 TEST: Changes are being loaded! Grid size is:', newData.gridSize)
  console.log('🎮 GAME DEBUG: Current state:', {
    gridSize: newData.gridSize,
    drawnLines: newData.drawnLinesCount,
    claimedSquares: newData.claimedSquaresCount,
    canMakeMove: newData.canMakeMove,
    currentPlayer: currentPlayer.value,
    matchStatus: matchData.value?.status
  })
}, { deep: true, immediate: true })

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
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  min-height: 80px;
  gap: 1rem;
}

.logo {
  height: 60px;
  flex: 0 0 auto;
}

.game-controls {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 0;
  flex: 0 0 auto;
}

.audio-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  min-height: 44px;
}

.audio-toggle:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

.audio-toggle.audio-off {
  background: #dc2626;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
}

.audio-toggle.audio-off:hover {
  background: #b91c1c;
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.4);
}

.audio-text {
  font-size: 0.75rem;
  font-weight: 600;
}

.pass-button {
  padding: 0.75rem 1.5rem;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);
  min-height: 44px;
}

.pass-button:hover:not(:disabled) {
  background: #ea580c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(249, 115, 22, 0.4);
}

.pass-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quit-button {
  padding: 0.75rem 1.5rem;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);
  min-height: 44px;
}

.quit-button:hover:not(:disabled) {
  background: #ea580c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(249, 115, 22, 0.4);
}

.quit-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.player-panels {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: stretch;
  flex: 1;
  margin: 0 2rem;
  min-width: 0;
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

.timer-display {
  margin-top: 0.25rem;
}

.timer-countdown {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #10b981;
  color: white;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timer-countdown.timer-warning {
  background: #f59e0b;
  transform: scale(1.05);
}

.timer-countdown.timer-critical {
  background: #ef4444;
  animation: pulse-critical 1s infinite;
  transform: scale(1.1);
}

@keyframes pulse-critical {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.missed-turns {
  font-size: 0.625rem;
  color: #dc2626;
  font-weight: 600;
  text-align: center;
  margin-top: 0.125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

/* Mobile Optimizations - Comprehensive Overhaul */
@media (max-width: 768px) {
  .game-container {
    padding: 0.5rem;
    min-height: 100vh;
  }

  .game-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    min-height: auto;
  }

  .logo {
    height: 80px;
    order: 1;
    flex: 0 0 auto;
  }

  .game-controls {
    order: 2;
    flex: 0 0 auto;
    gap: 0.5rem;
    margin-bottom: 0;
  }

  .game-controls button {
    min-height: 44px;
    min-width: 44px;
    font-size: 0.75rem;
    padding: 0.5rem 0.75rem;
    flex: 0 0 auto;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    color: white;
  }

  .audio-toggle {
    background: #f97316 !important;
    box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3) !important;
  }

  .audio-toggle:hover {
    background: #ea580c !important;
    box-shadow: 0 4px 8px rgba(249, 115, 22, 0.4) !important;
    transform: translateY(-1px);
  }

  .audio-toggle.audio-off {
    background: #dc2626 !important;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3) !important;
  }

  .audio-toggle.audio-off:hover {
    background: #b91c1c !important;
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.4) !important;
    transform: translateY(-1px);
  }

  .pass-button {
    background: #3b82f6 !important;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
  }

  .pass-button:hover:not(:disabled) {
    background: #2563eb !important;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4) !important;
    transform: translateY(-1px);
  }

  .pass-button:disabled {
    background: #9ca3af !important;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .quit-button {
    background: #dc2626 !important;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3) !important;
  }

  .quit-button:hover:not(:disabled) {
    background: #b91c1c !important;
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.4) !important;
    transform: translateY(-1px);
  }

  .quit-button:disabled {
    background: #9ca3af !important;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .audio-text {
    font-size: 0.625rem;
  }

  .player-panels {
    order: 3;
    width: 100%;
    gap: 0.5rem;
    flex-direction: row;
    margin-bottom: 1rem;
  }

  .player-panel {
    min-width: 0;
    flex: 1;
    padding: 0.5rem;
    max-height: 50px;
  }

  .player-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  .player-name {
    font-size: 0.75rem;
  }

  .player-score {
    font-size: 0.625rem;
  }

  .turn-text {
    font-size: 0.625rem;
  }

  .waiting-text {
    font-size: 0.625rem;
  }

  .timer-countdown {
    font-size: 0.625rem;
    padding: 0.125rem 0.25rem;
  }

  .missed-turns {
    font-size: 0.5rem;
  }

  .game-main {
    padding: 1rem 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
  }
}

/* Extra small mobile devices */
@media (max-width: 480px) {
  .game-container {
    padding: 0.25rem;
  }

  .game-header {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .logo {
    height: 60px;
  }

  .game-controls {
    gap: 0.25rem;
  }

  .game-controls button {
    min-height: 40px;
    font-size: 0.625rem;
    padding: 0.375rem 0.5rem;
  }

  .audio-text {
    display: none; /* Hide text on very small screens */
  }

  .player-panels {
    margin-bottom: 0.75rem;
  }

  .player-panel {
    padding: 0.375rem;
    max-height: 45px;
  }

  .player-avatar {
    width: 24px;
    height: 24px;
    font-size: 0.625rem;
  }

  .player-name {
    font-size: 0.625rem;
  }

  .player-score {
    font-size: 0.5rem;
  }

  .turn-text, .waiting-text {
    font-size: 0.5rem;
  }

  .timer-countdown {
    font-size: 0.5rem;
    padding: 0.125rem 0.25rem;
  }

  .game-main {
    padding: 0.75rem 0.25rem;
  }
}

/* Landscape mobile optimization */
@media (max-height: 600px) and (orientation: landscape) {
  .game-container {
    padding: 0.25rem;
  }

  .game-header {
    flex-direction: row;
    min-height: 60px;
    padding: 0.5rem;
  }

  .logo {
    height: 40px;
    order: 1;
    flex: 0 0 auto;
  }

  .player-panels {
    order: 2;
    flex: 1;
    gap: 0.5rem;
  }

  .player-panel {
    max-height: 40px;
    padding: 0.25rem 0.5rem;
  }

  .player-avatar {
    width: 24px;
    height: 24px;
    font-size: 0.625rem;
  }

  .game-controls {
    order: 3;
    flex: 0 0 auto;
    width: auto;
    gap: 0.25rem;
  }

  .game-controls button {
    min-height: 36px;
    min-width: 36px;
    font-size: 0.625rem;
    padding: 0.25rem 0.5rem;
  }

  .audio-text {
    display: none;
  }

  .game-main {
    padding: 0.5rem;
    flex: 1;
    overflow: hidden;
  }
}

/* Touch-specific optimizations */
@media (hover: none) and (pointer: coarse) {
  .game-controls button:hover {
    transform: none;
  }

  .game-controls button:active {
    transform: scale(0.95);
    background: rgba(249, 115, 22, 0.1);
  }

  .player-panel:hover {
    transform: none;
  }

  .player-panel.is-turn:active {
    transform: scale(0.98);
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .game-header {
    border-width: 0.5px;
  }
  
  .player-panel {
    border-width: 1.5px;
  }
}

/* Very tall screens (like iPhone Pro Max) */
@media (min-height: 800px) and (max-width: 480px) {
  .game-main {
    padding: 2rem 0.5rem;
  }
  
  .logo {
    height: 70px;
  }
}
</style>