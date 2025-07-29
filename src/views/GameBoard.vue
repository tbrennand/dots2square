<template>
  <div class="game-container">
    <div class="game-header">
      <router-link to="/">
        <img src="@/assets/dots2squares-logo.png" alt="Dots2Squares" class="logo" />
      </router-link>

      <div class="player-panels">
        <div
          class="player-panel"
          :class="{
            'is-turn': currentPlayer === 1 && !isGameOver,
            'is-you': currentUserPlayerNumber === 1,
          }"
        >
          <div class="player-info">
            <div class="player-avatar player1-avatar">
              {{ player1Initial }}
            </div>
            <div class="player-details">
              <div class="player-name">{{ player1Name }}</div>
              <div class="player-score">{{ player1Score }} squares</div>
            </div>
          </div>
          <div v-if="isGameActive" class="player-status">
            <div v-if="currentPlayer === 1 && !isGameOver" class="turn-text">
              <span>{{ isMyTurn ? 'YOUR\nTURN' : 'THEIR\nTURN' }}</span>
              <div 
                v-if="isMultiplayer && isTimerActive" 
                class="timer-countdown"
                :class="{ 'timer-warning': timeRemaining <= 5 }"
              >
                {{ timeRemaining }}
              </div>
            </div>
            <div v-else class="waiting-text">WAITING...</div>
          </div>
        </div>

        <div
          class="player-panel"
          :class="{
            'is-turn': currentPlayer === 2 && !isGameOver,
            'is-you': currentUserPlayerNumber === 2,
          }"
        >
          <div class="player-info">
            <div class="player-avatar player2-avatar">
              {{ player2Initial }}
            </div>
            <div class="player-details">
              <div class="player-name">{{ player2Name }}</div>
              <div class="player-score">{{ player2Score }} squares</div>
            </div>
          </div>
          <div v-if="isGameActive" class="player-status">
            <div v-if="currentPlayer === 2 && !isGameOver" class="turn-text">
              <span>{{ isMyTurn ? 'YOUR\nTURN' : 'THEIR\nTURN' }}</span>
               <div 
                 v-if="isMultiplayer && isTimerActive" 
                 class="timer-countdown"
                 :class="{ 'timer-warning': timeRemaining <= 5 }"
                >
                {{ timeRemaining }}
              </div>
            </div>
            <div v-else-if="!isMultiplayer && currentPlayer === 2" class="turn-text">
              <span>THINKING...</span>
            </div>
            <div v-else class="waiting-text">WAITING...</div>
          </div>
        </div>
      </div>

      <div class="game-controls">
        <button @click="toggleMute" class="control-button audio-toggle">
          {{ isMuted ? '🔇' : '🔊' }}
        </button>
        <button v-if="isGameOver" @click="handleRestart" class="control-button restart-button">
          Restart
        </button>
        <template v-else>
          <button @click="quitGame" class="control-button quit-button">
            Quit
          </button>
        </template>
      </div>
    </div>

    <main class="game-main" :class="{ 'is-disabled': !canMakeMove }">
      <DotGrid
        :key="gridKey"
        :grid-size="finalGridSize"
        :drawn-lines="drawnLines"
        :claimed-squares="claimedSquares"
        :can-make-move="canMakeMove"
        :is-game-active="isGameActive"
        :current-player="currentPlayer"
        :player1-name="player1Name"
        :player2-name="player2Name"
        :player1-color="'#3b82f6'"
        :player2-color="'#f97316'"
        @line-selected="handleLineSelected"
      />
    </main>
    <!-- Use the existing overlay style to show the result on top -->
    <div v-if="isGameOver" class="game-over-overlay">
      <GameResult
        :is-multiplayer="isMultiplayer"
        :match-id="isMultiplayer ? route.params.id as string : undefined"
        :winner="isMultiplayer ? multiplayerWinner : aiWinner"
        :scores="isMultiplayer ? matchData?.scores : localScores"
        :grid-size="finalGridSize"
        :player1-name="player1Name"
        :player2-name="player2Name"
        :total-moves="drawnLines.length"
        @play-again="handleRestart"
      />
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, toRefs } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore'
import { useUserStore } from '@/store/userStore'
import { storeToRefs } from 'pinia'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

import DotGrid from '@/components/DotGrid.vue'
import GameResult from '@/views/GameResult.vue'
import { useAIOpponent } from '@/composables/useAIOpponent'
import { useTurnTimer, turnTimerEvents } from '@/composables/useTurnTimer'
import { useAIScoreTracker } from '@/composables/useAIScoreTracker' // Import the new composable
import { useSound } from '@/composables/useSound' // Import the sound composable
import { getRandomFunnyName } from '@/utils/nameGenerator' // Import the name generator
import type { Line, Square } from '@/types'
import { db } from '@/firebase'
import { createMatch } from '@/firebase/matchHelpers'

const props = withDefaults(defineProps<{
  mode: 'ai' | 'multiplayer',
  playerName?: string,
  gridSize?: number
}>(), {
  mode: 'ai',
  playerName: '',
  gridSize: 8,
});

console.log('GameBoard props:', props)

const route = useRoute()
const router = useRouter()

// Initialize stores
const gameStore = useGameStore()
const userStore = useUserStore()

// --- STATE MANAGEMENT ---
const isMultiplayer = computed(() => props.mode === 'multiplayer')
const currentPlayerId = computed(() => userStore.user?.uid || route.query.playerId as string || '')
const matchId = computed(() => isMultiplayer.value ? (route.params.id as string) : '')

// Local state for AI mode
// Ensure gridSize is a number
const aiGridSize = computed(() => {
  const parsed = typeof props.gridSize === 'string' ? parseInt(props.gridSize, 10) : props.gridSize
  console.log('GameBoard: aiGridSize calculation - raw props.gridSize:', props.gridSize, 'parsed:', parsed)
  return parsed
})
const localDrawnLines = ref<Line[]>([])
const localClaimedSquares = ref<Square[]>([])
const localScores = ref<Record<number, number>>({ 1: 0, 2: 0 })
const localCurrentPlayer = ref(1)
const aiOpponentName = ref('AI Opponent') // Add a ref for the AI's name

// Shared state
const isMakingMove = ref(false)
const gridKey = ref(0) // Used to force re-render on restart


// --- SOUND ---
const { isMuted, playSound, toggleMute } = useSound()

// Firebase state for multiplayer mode
const { user: currentUser } = storeToRefs(userStore)
const { matchData, gameOver: firebaseGameOver } = storeToRefs(gameStore)

// --- UNIFIED COMPUTED PROPS ---
const finalGridSize = computed(() => {
  const size = isMultiplayer.value ? (matchData.value?.gridSize || 8) : (aiGridSize.value || 8)
  console.log('GameBoard: finalGridSize calculated:', size)
  return size
})
const totalSquares = computed(() => {
  const total = (finalGridSize.value - 1) * (finalGridSize.value - 1)
  console.log('GameBoard: totalSquares calculated:', total)
  return total
})

const drawnLines = computed(() => isMultiplayer.value ? (matchData.value?.lines || []) : localDrawnLines.value)
const claimedSquares = computed(() => {
  if (isMultiplayer.value) {
    const squares = matchData.value?.squares || []
    console.log('GameBoard: claimedSquares filtering for multiplayer:', {
      totalSquares: squares.length,
      squaresWithPlayer: squares.filter(square => square.player !== undefined).length,
      squaresWithUndefined: squares.filter(square => square.player === undefined).length,
      sampleSquares: squares.slice(0, 3)
    })
    // Only return squares that have a player assigned (not undefined)
    return squares.filter(square => square.player !== undefined)
  } else {
    return localClaimedSquares.value
  }
})
const scores = computed(() => isMultiplayer.value ? (matchData.value?.scores || { 1: 0, 2: 0 }) : localScores.value)
const currentPlayer = computed(() => isMultiplayer.value ? (matchData.value?.currentPlayer || 1) : localCurrentPlayer.value)

const player1Name = computed(() => isMultiplayer.value ? (matchData.value?.player1?.name || 'Player 1') : (props.playerName || 'You'))
const player2Name = computed(() => isMultiplayer.value ? (matchData.value?.player2?.name || 'Player 2') : aiOpponentName.value)
const player1Initial = computed(() => player1Name.value.charAt(0).toUpperCase())
const player2Initial = computed(() => player2Name.value.charAt(0).toUpperCase())
const player1Score = computed(() => scores.value[1] || 0)
const player2Score = computed(() => scores.value[2] || 0)

const currentUserPlayerNumber = computed(() => {
  if (!isMultiplayer.value || !matchData.value?.player1 || !currentPlayerId.value) {
    // Default to 1 in non-multiplayer or if data is missing
    return 1
  }
  if (matchData.value.player1.id === currentPlayerId.value) {
    return 1
  }
  if (matchData.value.player2?.id === currentPlayerId.value) {
    return 2
  }
  // If not found, they might be a spectator or there's an issue.
  // Defaulting to 0 would block them from playing, which is safe.
  return 0
})

const isMyTurn = computed(() => {
  const result = currentPlayer.value === currentUserPlayerNumber.value
  console.log('GameBoard: isMyTurn calculation:', {
    currentPlayer: currentPlayer.value,
    currentUserPlayerNumber: currentUserPlayerNumber.value,
    result
  })
  return result
})

const isGameActive = computed(() => {
  const result = isMultiplayer.value ? matchData.value?.status === 'active' : !isGameOver.value
  console.log('GameBoard: isGameActive calculation:', {
    isMultiplayer: isMultiplayer.value,
    matchStatus: matchData.value?.status,
    isGameOver: isGameOver.value,
    result
  })
  return result
})
// ----------------------------------------------------------------
// Game Over Logic
// ----------------------------------------------------------------
const localGameOver = computed(() => {
  const over = claimedSquares.value.length >= totalSquares.value
  console.log(`localGameOver check: claimed=${claimedSquares.value.length}, total=${totalSquares.value}, over=${over}`)
  return over
})
const isGameOver = computed(() => isMultiplayer.value ? firebaseGameOver.value : localGameOver.value)
const canMakeMove = computed(() => {
  const result = isGameActive.value && isMyTurn.value && !isMakingMove.value && !isGameOver.value
  console.log('GameBoard: canMakeMove calculation:', {
    isGameActive: isGameActive.value,
    isMyTurn: isMyTurn.value,
    isMakingMove: isMakingMove.value,
    isGameOver: isGameOver.value,
    result
  })
  return result
})

// --- NEW: AI Winner Calculation ---
const aiWinner = computed(() => {
  if (!localGameOver.value) return null
  if (localScores.value[1] > localScores.value[2]) return 1
  if (localScores.value[2] > localScores.value[1]) return 2
  return 'tie'
})

const multiplayerWinner = computed(() => {
  if (!firebaseGameOver.value) return null
  const mpScores = matchData.value?.scores
  if (!mpScores) return null
  if (mpScores[1] > mpScores[2]) return 1
  if (mpScores[2] > mpScores[1]) return 2
  return 'tie'
})

// --- SCORE TRACKING ---
const { updateScore } = useAIScoreTracker()
watch(aiWinner, (newWinner) => {
  if (newWinner === null) return
  if (newWinner === 1) updateScore('win')
  if (newWinner === 2) updateScore('loss')
  if (newWinner === 'tie') updateScore('draw')
})

// --- COMPOSABLES ---
const { isThinking: isAIThinking, playMove: getAIMove } = useAIOpponent(
  finalGridSize,
  drawnLines,
  computed(() => !isMultiplayer.value && currentPlayer.value === 2 && !isMakingMove.value)
)

const { timeRemaining, isTimerActive, syncTimerWithServer } = useTurnTimer(
  matchId,
  currentPlayerId,
  matchData
);

// --- WATCHERS & LIFECYCLE ---
watch(timeRemaining, (newTime) => {
  // Play countdown sound every second in the last 5 seconds
  if (isMultiplayer.value && newTime <= 5 && newTime > 0 && Math.ceil(newTime) === Math.floor(newTime)) {
    console.log('Playing countdown sound at:', Math.ceil(newTime), 'seconds remaining')
    playSound('countdown')
  }
})

watch(matchData, (newData, oldData) => {
  if (!isMultiplayer.value || !newData) return

  // Sync timer when the turn starts or current player changes
  if (newData.turnStartedAt !== oldData?.turnStartedAt || newData.currentPlayer !== oldData?.currentPlayer) {
    console.log('Timer sync triggered:', {
      turnStartedAt: newData.turnStartedAt,
      currentPlayer: newData.currentPlayer,
      oldTurnStartedAt: oldData?.turnStartedAt,
      oldCurrentPlayer: oldData?.currentPlayer
    })
    
    if (newData.turnStartedAt?.toDate) {
      syncTimerWithServer(
        newData.turnStartedAt.toDate(), 
        newData.turnDuration || 30,
        newData.consecutiveMissedTurns
      )
    }
  }

  // Also, release the move lock when data changes (as before)
  if (isMakingMove.value) {
    isMakingMove.value = false
  }
})

watch(currentPlayer, (newPlayer, oldPlayer) => {
  console.log('GameBoard: currentPlayer changed to:', newPlayer, {
    oldPlayer,
    isMultiplayer: isMultiplayer.value,
    isGameOver: isGameOver.value,
    isMakingMove: isMakingMove.value
  })
  
  // Only trigger AI move if we're in AI mode, it's player 2's turn, 
  // the game isn't over, and the turn actually switched (not player 1 keeping their turn)
  if (!isMultiplayer.value && newPlayer === 2 && !isGameOver.value && oldPlayer === 1) {
    console.log('GameBoard: Triggering AI move (turn switched from player 1 to player 2)...')
    setTimeout(async () => {
      console.log('GameBoard: AI making move...')
      const move = await getAIMove()
      console.log('GameBoard: AI move result:', move)
      if (move) await handleLineSelected(move)
    }, 1000) // AI "thinking" time
  }
})

// --- CORE GAME LOGIC ---
const handleLineSelected = async (line: { startDot: string; endDot: string }) => {
  console.log('GameBoard: handleLineSelected called with:', line, {
    canMakeMove: canMakeMove.value,
    currentPlayer: currentPlayer.value,
    isMultiplayer: isMultiplayer.value
  })
  
  // Allow AI moves even when canMakeMove is false (for AI mode)
  const isAIMove = !isMultiplayer.value && currentPlayer.value === 2
  if (!canMakeMove.value && !isAIMove) {
    console.log('GameBoard: Move rejected - not AI move and canMakeMove is false')
    return
  }
  
  isMakingMove.value = true

  const lineId = [line.startDot, line.endDot].sort().join('-')
  if (drawnLines.value.some(l => l.id === lineId)) {
    isMakingMove.value = false
    return
  }

  const player = currentPlayer.value
  const tempLines = [...drawnLines.value, { ...line, id: lineId, player }]
  const newSquares = checkForCompletedSquares({ ...line, id: lineId, player }, tempLines)

  const turnSwitch = newSquares.length === 0
  const nextPlayer = turnSwitch ? (player === 1 ? 2 : 1) : player
  
  console.log('GameBoard: Turn logic - player:', player)
  console.log('GameBoard: Turn logic - newSquares.length:', newSquares.length)
  console.log('GameBoard: Turn logic - turnSwitch:', turnSwitch)
  console.log('GameBoard: Turn logic - nextPlayer:', nextPlayer)
  console.log('GameBoard: Turn logic - isAIMove:', isAIMove)
  console.log('GameBoard: Turn logic - should keep turn:', newSquares.length > 0)
  
  console.log('GameBoard: Turn logic:', {
    player,
    newSquares: newSquares.length,
    turnSwitch,
    nextPlayer,
    isAIMove,
    extraTurn: newSquares.length > 0 ? 'YES - Square claimed, keeping turn' : 'NO - No square claimed, switching turn',
    squaresDetails: newSquares.map(sq => sq.id),
    currentPlayerBefore: currentPlayer.value,
    willSwitchTo: nextPlayer,
    shouldKeepTurn: newSquares.length > 0,
    actualNextPlayer: nextPlayer
  })

  const newScores = { ...scores.value }
  newScores[player] = (newScores[player] || 0) + newSquares.length
  
  const newClaimedSquares = [...claimedSquares.value, ...newSquares.map(sq => ({ ...sq, player }))]

  if (isMultiplayer.value) {
    try {
      const player = currentPlayer.value
      const playerId = player === 1 ? matchData.value?.player1?.id : matchData.value?.player2?.id
      
      const updatePayload: any = {
        lines: tempLines,
        squares: newClaimedSquares,
        scores: newScores,
        currentPlayer: nextPlayer,
        turnStartedAt: serverTimestamp(), // Always reset the timer on a valid move
        updatedAt: serverTimestamp(),
      }

      // Reset consecutive missed turns for the player who just made a move
      if (playerId) {
        updatePayload.consecutiveMissedTurns = {
          ...(matchData.value?.consecutiveMissedTurns || {}),
          [playerId]: 0
        }
      }

      await updateDoc(doc(db, 'matches', route.params.id as string), updatePayload)
    } finally {
      await nextTick()
      // Firebase watch will release the lock, but we wait for UI to update
    }
  } else {
    // AI Mode: Update local state directly
    console.log('GameBoard: Updating AI local state:', {
      nextPlayer,
      newScores,
      newClaimedSquares: newClaimedSquares.length
    })
    localDrawnLines.value = tempLines
    localClaimedSquares.value = newClaimedSquares
    localScores.value = newScores
    localCurrentPlayer.value = nextPlayer
    
    await nextTick()
    isMakingMove.value = false

    // If AI keeps the turn, trigger another move
    if (!isMultiplayer.value && nextPlayer === 2 && !turnSwitch && !isGameOver.value) {
        console.log('GameBoard: AI keeps turn, triggering another move...')
        setTimeout(async () => {
            console.log('GameBoard: AI making extra move...')
            const move = await getAIMove()
            if (move) await handleLineSelected(move)
        }, 1000)
    }
  }
}

const checkForCompletedSquares = (newLine: Line, allLines: Line[]): Omit<Square, 'player'>[] => {
    const foundSquares: Omit<Square, 'player'>[] = []
    const [y1, x1] = newLine.startDot.split('-').map(Number)
    const [y2, x2] = newLine.endDot.split('-').map(Number)

    const lineExists = (dot1: string, dot2: string) => allLines.some((l: Line) => l.id === [dot1, dot2].sort().join('-'))

    if (y1 === y2) { // Horizontal
        if (y1 > 0) { // Check above
            const c1 = `${y1 - 1}-${x1}`, c2 = `${y1 - 1}-${x2}`
            if (lineExists(c1, newLine.startDot) && lineExists(c2, newLine.endDot) && lineExists(c1, c2)) {
                foundSquares.push({ id: [c1, c2, newLine.startDot, newLine.endDot].sort().join('_'), corners: [c1, c2, newLine.startDot, newLine.endDot], topLeftX: Math.min(x1, x2), topLeftY: y1 - 1 })
            }
        }
        if (y1 < finalGridSize.value - 1) { // Check below
            const c3 = `${y1 + 1}-${x1}`, c4 = `${y1 + 1}-${x2}`
            if (lineExists(c3, newLine.startDot) && lineExists(c4, newLine.endDot) && lineExists(c3, c4)) {
                foundSquares.push({ id: [c3, c4, newLine.startDot, newLine.endDot].sort().join('_'), corners: [c3, c4, newLine.startDot, newLine.endDot], topLeftX: Math.min(x1, x2), topLeftY: y1 })
            }
        }
    } else { // Vertical
        if (x1 > 0) { // Check left
            const c1 = `${y1}-${x1 - 1}`, c2 = `${y2}-${x1 - 1}`
            if (lineExists(c1, newLine.startDot) && lineExists(c2, newLine.endDot) && lineExists(c1, c2)) {
                foundSquares.push({ id: [c1, c2, newLine.startDot, newLine.endDot].sort().join('_'), corners: [c1, c2, newLine.startDot, newLine.endDot], topLeftX: x1 - 1, topLeftY: Math.min(y1, y2) })
            }
        }
        if (x1 < finalGridSize.value - 1) { // Check right
            const c3 = `${y1}-${x1 + 1}`, c4 = `${y2}-${x1 + 1}`
            if (lineExists(c3, newLine.startDot) && lineExists(c4, newLine.endDot) && lineExists(c3, c4)) {
                foundSquares.push({ id: [c3, c4, newLine.startDot, newLine.endDot].sort().join('_'), corners: [c3, c4, newLine.startDot, newLine.endDot], topLeftX: x1, topLeftY: Math.min(y1, y2) })
            }
        }
    }
    return foundSquares
}

// ----------------------------------------------------------------
// Lifecycle Hooks
// ----------------------------------------------------------------
onMounted(async () => {
  console.log('GameBoard onMounted')
  if (isMultiplayer.value) {
    if (route.params.id) {
      await gameStore.subscribeToMatch(route.params.id as string)
      console.log('Subscribed to match:', route.params.id)
    }
  } else {
    // AI Game Setup
    aiOpponentName.value = getRandomFunnyName() // Assign a random name to the AI
    console.log('Setting up AI game with gridSize:', props.gridSize)
    // resetBoardState() // Ensure clean state for AI game - This function is not defined in the original file
    // players.value = [ // players.value is not defined in the original file
    //   { id: 'player1', name: props.playerName, score: 0 },
    //   { id: 'player2', name: 'Super AI', score: 0 },
    // ]
    // console.log('AI game players:', players.value)
  }

  // No warning events needed - timer just switches turns
})

onUnmounted(() => {
  if (isMultiplayer.value) {
    gameStore.unsubscribeFromMatch()
  }
})

// --- ACTIONS ---
const handleRestart = async () => {
    if (isMultiplayer.value) {
        // For multiplayer, create a new match with the same opponent
        if (matchData.value?.player1 && matchData.value?.player2) {
            const newMatchId = await createMatch({
                player1Id: matchData.value.player1.id,
                player1Name: matchData.value.player1.name,
                gridSize: finalGridSize.value,
            });
            // The creator of the new match navigates to the new lobby
            router.push(`/lobby/${newMatchId}`);
        } else {
            console.error("Cannot restart multiplayer game: player data is missing.");
            // Fallback to home if player data is incomplete
            router.push('/');
        }
    } else {
        // For AI mode, just reset the local state
        localDrawnLines.value = []
        localClaimedSquares.value = []
        localScores.value = { 1: 0, 2: 0 }
        localCurrentPlayer.value = 1
        gridKey.value++ // Force re-render of the DotGrid
    }
}

const quitGame = () => {
    router.push('/')
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
  align-items: center; /* This is the key for vertical alignment */
  justify-content: space-between;
  padding: 1rem;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.logo {
  height: 70px; /* Increased from 50px */
  width: auto;
}

.player-panels {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex: 1 1 auto; /* Allow panels to take up space */
}

.game-controls {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
}

.control-item {
  display: flex;
  flex-direction: column; /* Stack button over label */
  align-items: center;
  gap: 0.25rem;
}

.control-button {
  width: 40px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6; /* Subtle grey background */
  color: #4b5563; /* Dark grey text */
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.control-button:disabled {
  background: #f9fafb;
  color: #d1d5db;
  cursor: not-allowed;
}

.control-button.is-active {
  background: #f97316; /* Active state is orange */
  color: white;
  border-color: #f97316;
}

.control-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
}

.player-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 3px solid #e5e7eb;
  background: #f9fafb;
  transition: all 0.3s ease;
  min-width: 240px;
  position: relative; /* This is the fix */
}

.player-panel.is-turn {
  border-color: #f97316;
  background: #fff7ed;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
  transform: scale(1.02);
}

.player-panel.is-you::before {
  /* Removed black indicator - box highlight is sufficient */
  display: none;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.player-status {
  text-align: right;
}

.turn-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #f97316;
  text-transform: uppercase;
}

.turn-text span {
  white-space: pre-line;
  line-height: 1.2;
  text-align: center;
}
.timer-countdown {
  background: #10b981;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.waiting-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
  text-transform: uppercase;
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
  background: #ef4444; /* Red for warning */
  animation: pulse-warning 1s infinite;
}

@keyframes pulse-warning {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
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
  z-index: 10; /* Ensure grid is above the header */
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



@keyframes modal-fade-in {
  from { 
    opacity: 0; 
    transform: translate(-50%, -60%);
  }
  to { 
    opacity: 1; 
    transform: translate(-50%, -50%);
  }
}

/* Remove the old screen flash styles */
.timeout-warning-overlay {
  display: none;
}

.timeout-warning-overlay.flash-active {
  display: none;
}

@keyframes screen-flash {
  /* Remove this animation */
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

  .player-panels {
    order: 2;
    width: 100%;
    gap: 0.5rem;
    flex-direction: row;
    margin-bottom: 1rem;
  }

  .game-controls {
    order: 3;
    flex: 0 0 auto;
    gap: 0.5rem;
    margin-bottom: 0;
  }

  .game-controls .control-item {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
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

  .turn-text span {
    white-space: pre-line;
    line-height: 1.1;
    text-align: center;
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

  .game-controls .control-item {
    flex-direction: row;
    align-items: center;
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

  .turn-text span {
    white-space: pre-line;
    line-height: 1.1;
    text-align: center;
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

  .game-controls .control-item {
    flex-direction: row;
    align-items: center;
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

/* Mobile layout - stack controls above player panels */
@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .game-controls {
    order: 2;
    margin-bottom: 0;
  }

  .player-panels {
    order: 3;
    margin: 0;
  }
}

/* --- Mobile-Specific Styles --- */
@media (max-width: 768px) {
  .game-header {
    flex-wrap: wrap; /* Allow items to wrap to the next line */
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem;
  }

  .logo {
    height: 40px; /* Smaller logo on mobile */
    width: auto;
    flex-basis: auto; /* Allow natural width */
    object-fit: contain; /* Prevent stretching */
  }

  .player-panels {
    order: 3; /* Move panels to the bottom of the header */
    width: 100%;
    gap: 0.5rem;
  }

  .game-controls {
    order: 2; /* Keep controls in the top row */
    gap: 0.75rem;
  }

  .control-button {
    width: 36px; /* Elegant, smaller buttons */
    height: 36px;
    font-size: 1rem;
  }

  .control-label {
    font-size: 0.625rem; /* Smaller labels */
  }

  .mobile-hidden {
    display: none; /* Hide text labels on mobile */
  }
}

.game-main.is-disabled {
  pointer-events: none;
  opacity: 0.8;
}

.restart-button {
  border-color: #10b981; /* Green */
  color: #10b981;
}
</style>