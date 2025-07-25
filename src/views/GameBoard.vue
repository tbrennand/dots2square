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

    <div v-else-if="matchData" class="game-layout max-w-7xl mx-auto">
      <!-- Header -->
      <header class="game-header col-span-2 flex justify-between items-center mb-6">
        <img src="@/assets/dots2squares-logo.png" alt="Dots 2 Squares Logo" class="h-12" />
        <button @click="goHome" class="btn btn-secondary">End Game</button>
      </header>

      <!-- Main Game Area -->
      <main class="game-main flex items-center justify-center">
        <DotGrid
          :grid-size="gridSize"
          :drawn-lines="lines"
          :claimed-squares="squares"
          @line-selected="handleLineSelected"
        />
      </main>

      <!-- Side Panel -->
      <aside class="side-panel space-y-6">
        <div class="card">
          <TurnTracker :current-player="currentPlayer" :game-over="gameOver" />
        </div>
        <div class="card">
          <ScoreCard
            :scores="scores"
            :player1="matchData.player1"
            :player2="matchData.player2"
          />
        </div>
        <div class="card">
          <GameControls
            :can-move="canCurrentUserMove"
            @forfeit="handleForfeit"
          />
        </div>
        <div class="card">
           <Chat 
            v-if="currentMatchId"
            :matchId="currentMatchId" 
            :currentPlayerName="currentPlayerName"
          />
        </div>
      </aside>
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
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const matchStore = useMatchStore()

const currentUserId = ref('user-123') // TODO: Get from auth

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

const canCurrentUserMove = computed(() => matchStore.canPlayerMove(currentUserId.value))
const currentUserPlayerNumber = computed(() => matchStore.getPlayerNumber(currentUserId.value))
const currentPlayerName = computed(() => {
  const playerNum = currentUserPlayerNumber.value ?? 1
  const player = playerNum === 1 ? matchData.value?.player1 : matchData.value?.player2
  return player?.name || 'Player'
})

const handleLineSelected = async (line: { startDot: string; endDot: string }) => {
  if (!currentMatchId.value || !canCurrentUserMove.value) return
  await playMove(currentMatchId.value, currentUserId.value, line)
}

const handleForfeit = () => {
  // TODO: Implement forfeit logic
  console.log('Forfeit requested')
}

const goHome = () => router.push('/')

onMounted(() => {
  const matchId = route.params.id as string
  if (matchId) {
    matchStore.subscribeToMatchById(matchId)
  } else {
    router.push('/')
  }
})

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
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .game-layout {
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto 1fr;
  }
  .game-header {
    grid-column: 1 / 3;
  }
  .game-main {
    grid-column: 1 / 2;
  }
  .side-panel {
    grid-column: 2 / 3;
  }
}
</style> 