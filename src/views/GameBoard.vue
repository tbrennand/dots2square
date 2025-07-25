<template>
  <div class="game-board-container">
    <div v-if="isLoading" class="loading-state">Loading Game...</div>
    <div v-else-if="error" class="error-state">Error: {{ error }}</div>

    <div v-else-if="matchData" class="game-layout">
      <header class="game-header">
        <img src="/src/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="logo" />
        
        <div class="player-panels">
          <!-- Player 1 Panel -->
          <div :class="['player-panel', { 'is-turn': currentPlayer === 1 }]">
            <div class="panel-header">
              <span class="player-name">{{ matchData.player1?.name || 'Player 1' }}</span>
              <span class="player-score">Score: {{ scores[1] || 0 }}</span>
            </div>
            <div v-if="currentPlayer === 1" class="turn-indicator">
              <span>Your Turn</span>
              <span class="timer">{{ formatTime(timerState.timeRemaining) }}</span>
            </div>
          </div>

          <!-- Player 2 Panel -->
          <div :class="['player-panel', { 'is-turn': currentPlayer === 2 }]">
            <div class="panel-header">
              <span class="player-name">{{ matchData.player2?.name || 'Player 2' }}</span>
              <span class="player-score">Score: {{ scores[2] || 0 }}</span>
            </div>
            <div v-if="currentPlayer === 2" class="turn-indicator">
              <span>Your Turn</span>
              <span class="timer">{{ formatTime(timerState.timeRemaining) }}</span>
            </div>
          </div>
        </div>

        <button @click="handleForfeit" class="forfeit-button">Forfeit Game</button>
      </header>

      <main class="game-main">
        <DotGrid
          :grid-size="gridSize"
          :drawn-lines="lines"
          :claimed-squares="squares"
          :can-make-move="canCurrentUserMove"
          @line-selected="handleLineSelected"
        />
      </main>

      <aside class="game-chat">
        <Chat 
          v-if="currentMatchId"
          :matchId="currentMatchId" 
          :currentPlayerName="currentPlayerName"
          :hasSecondPlayer="true"
        />
      </aside>
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
import Chat from '../components/Chat.vue'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const matchStore = useMatchStore()

const currentUserId = ref('user-123') // TODO: Replace with actual user auth

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

const turnTimer = useTurnTimer(currentMatchId.value || '', currentUserId.value)
const timerState = computed(() => turnTimer.getTimerState())

const canCurrentUserMove = computed(() => matchStore.canPlayerMove(currentUserId.value))
const currentPlayerName = computed(() => {
  const playerNum = matchStore.getPlayerNumber(currentUserId.value) ?? 1
  return (playerNum === 1 ? matchData.value?.player1?.name : matchData.value?.player2?.name) || 'Player'
})

const handleLineSelected = async (line: { startDot: string; endDot: string }) => {
  if (!currentMatchId.value || !canCurrentUserMove.value) return
  await playMove(currentMatchId.value, currentUserId.value, line)
}

const handleForfeit = () => {
  console.log('Forfeit game requested by', currentUserId.value)
  // TODO: Implement forfeit logic
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

watch(matchData, (newMatchData) => {
  if (newMatchData?.status === 'active') {
    const turnStartTime = newMatchData.turnStartedAt?.toDate() || null
    const turnDuration = newMatchData.turnDuration || 30
    turnTimer.syncTimerWithServer(turnStartTime, turnDuration)
  }
}, { immediate: true, deep: true })

onUnmounted(() => {
  matchStore.unsubscribeFromMatch()
})

watch(gameOver, (isOver) => {
  if (isOver && currentMatchId.value) {
    router.push({ name: 'GameResult', query: { matchId: currentMatchId.value } })
  }
})
</script>

<style scoped>
.game-board-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8fafc;
  padding: 2rem;
}

.loading-state, .error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.5rem;
  color: #4b5563;
}

.game-layout {
  display: grid;
  grid-template-columns: 1fr 350px; /* Main game area and chat sidebar */
  grid-template-rows: auto 1fr; /* Header and main content */
  grid-template-areas:
    "header header"
    "main chat";
  gap: 2rem;
  height: 100%;
}

.game-header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.logo {
  height: 50px;
  width: auto;
}

.player-panels {
  display: flex;
  gap: 2rem;
}

.player-panel {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  width: 250px;
  background-color: #f1f5f9;
  transition: all 0.3s ease;
}

.player-panel.is-turn {
  border-color: #f97316;
  background-color: #fff7ed;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  color: #374151;
}

.player-score {
  font-weight: 700;
  color: #f97316;
}

.turn-indicator {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #16a34a;
  font-weight: 600;
}

.timer {
  font-family: 'monospace';
  font-size: 1.125rem;
  color: #dc2626;
}

.forfeit-button {
  padding: 0.75rem 1.5rem;
  background-color: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.forfeit-button:hover {
  background-color: #fecaca;
}

.game-main {
  grid-area: main;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-chat {
  grid-area: chat;
  width: 100%; /* Take up full width of the grid column */
  flex-shrink: 0;
  /* This would ideally be a slide-out panel, but for now, it's fixed */
}
</style> 