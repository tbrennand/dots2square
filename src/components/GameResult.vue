<template>
  <div class="game-result">
    <!-- Winner Display -->
    <div class="winner-section">
      <h2 class="text-3xl font-bold mb-4">Game Over</h2>
      
      <div v-if="winner" class="winner-announcement">
        <div class="winner-avatar">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {{ winner.name.charAt(0).toUpperCase() }}
          </div>
        </div>
        <h3 class="text-xl font-semibold text-green-600 mt-2">{{ winner.name }} Wins!</h3>
      </div>
      
      <div v-else-if="isTie" class="tie-announcement">
        <div class="tie-icon text-4xl mb-2">🤝</div>
        <h3 class="text-xl font-semibold text-gray-600">It's a Tie!</h3>
      </div>
      
      <div v-else class="no-winner">
        <div class="no-winner-icon text-4xl mb-2">😐</div>
        <h3 class="text-xl font-semibold text-gray-600">No Winner</h3>
      </div>
    </div>

    <!-- Final Scores -->
    <div class="scores-section">
      <h4 class="text-lg font-semibold mb-3">Final Scores</h4>
      <div class="score-cards">
        <div class="score-card">
          <div class="player-info">
            <span class="player-name">{{ matchData?.player1.name }}</span>
            <span class="player-score">{{ finalScores[1] || 0 }}</span>
          </div>
        </div>
        <div class="score-card">
          <div class="player-info">
            <span class="player-name">{{ matchData?.player2?.name || 'Waiting...' }}</span>
            <span class="player-score">{{ finalScores[2] || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Statistics -->
    <div class="stats-section">
      <h4 class="text-lg font-semibold mb-3">Game Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total Moves</span>
          <span class="stat-value">{{ totalMoves }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Grid Size</span>
          <span class="stat-value">{{ matchData?.gridSize }}x{{ matchData?.gridSize }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Duration</span>
          <span class="stat-value">{{ gameDuration }}</span>
        </div>
      </div>
    </div>

    <!-- Rematch Section -->
    <div class="rematch-section">
      <div v-if="error" class="error-message">
        <p class="text-red-600 text-sm">{{ error }}</p>
      </div>

      <div class="rematch-buttons">
        <button
          @click="handleRematch"
          :disabled="!canCreateRematch || isCreating"
          class="rematch-button primary"
        >
          <span v-if="isCreating" class="loading-spinner"></span>
          <span v-else>🎮 Play Again</span>
        </button>

        <button
          v-if="newMatchId"
          @click="copyRematchLink"
          class="rematch-button secondary"
        >
          📋 Copy Link
        </button>

        <button
          @click="goHome"
          class="rematch-button secondary"
        >
          🏠 Back to Home
        </button>
      </div>

      <div v-if="newMatchId" class="rematch-info">
        <p class="text-sm text-gray-600">
          New match created! Share the link with your opponent.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRematch } from '@/composables/useRematch'
import type { MatchData } from '@/firebase/matchHelpers'

interface Props {
  matchData: MatchData
  currentUserId: string
  currentUserName: string
}

const props = defineProps<Props>()
const router = useRouter()

// Use rematch composable
const {
  isCreating,
  error,
  newMatchId,
  canCreateRematch,
  setOriginalMatch,
  navigateToRematch,
  copyRematchLink: copyLink,
  reset
} = useRematch()

// Computed properties
const winner = computed(() => {
  if (!props.matchData.winner || props.matchData.winner === 'tie') return null
  
  const winnerId = props.matchData.winner === 1 
    ? props.matchData.player1.id 
    : props.matchData.player2?.id
  
  if (winnerId === props.matchData.player1.id) {
    return props.matchData.player1
  } else if (winnerId === props.matchData.player2?.id) {
    return props.matchData.player2
  }
  
  return null
})

const isTie = computed(() => {
  return props.matchData.winner === 'tie'
})

const finalScores = computed(() => {
  return props.matchData.scores || { 1: 0, 2: 0 }
})

const totalMoves = computed(() => {
  return props.matchData.lines?.length || 0
})

const gameDuration = computed(() => {
  if (!props.matchData.createdAt || !props.matchData.updatedAt) {
    return 'Unknown'
  }
  
  const start = new Date(props.matchData.createdAt)
  const end = new Date(props.matchData.updatedAt)
  const duration = end.getTime() - start.getTime()
  
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)
  
  return `${minutes}m ${seconds}s`
})

// Methods
const handleRematch = async () => {
  try {
    await navigateToRematch({
      originalMatchId: props.matchData.id || '',
      currentUserId: props.currentUserId,
      currentUserName: props.currentUserName,
      gridSize: props.matchData.gridSize,
      isPublic: props.matchData.isPublic
    })
  } catch (err) {
    console.error('Failed to create rematch:', err)
  }
}

const copyRematchLink = async () => {
  if (newMatchId.value) {
    const success = await copyLink(newMatchId.value)
    if (success) {
      // Could show a toast notification here
      console.log('Rematch link copied to clipboard')
    }
  }
}

const goHome = () => {
  router.push('/')
}

// Lifecycle
onMounted(() => {
  // Set the original match data for rematch functionality
  setOriginalMatch(props.matchData)
})

// Cleanup on unmount
onUnmounted(() => {
  reset()
})
</script>

<style scoped>
.game-result {
  @apply max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg;
}

.winner-section {
  @apply text-center mb-8;
}

.winner-announcement {
  @apply flex flex-col items-center;
}

.winner-avatar {
  @apply mb-4;
}

.tie-announcement,
.no-winner {
  @apply flex flex-col items-center;
}

.scores-section {
  @apply mb-6;
}

.score-cards {
  @apply grid grid-cols-2 gap-4;
}

.score-card {
  @apply bg-gray-50 rounded-lg p-4 border;
}

.player-info {
  @apply flex justify-between items-center;
}

.player-name {
  @apply font-medium text-gray-700;
}

.player-score {
  @apply text-2xl font-bold text-blue-600;
}

.stats-section {
  @apply mb-8;
}

.stats-grid {
  @apply grid grid-cols-3 gap-4;
}

.stat-item {
  @apply bg-gray-50 rounded-lg p-3 text-center;
}

.stat-label {
  @apply block text-sm text-gray-600 mb-1;
}

.stat-value {
  @apply block text-lg font-semibold text-gray-800;
}

.rematch-section {
  @apply text-center;
}

.error-message {
  @apply mb-4 p-3 bg-red-50 border border-red-200 rounded-lg;
}

.rematch-buttons {
  @apply flex flex-col sm:flex-row gap-3 justify-center mb-4;
}

.rematch-button {
  @apply px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2;
}

.rematch-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed;
}

.rematch-button.secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin;
}

.rematch-info {
  @apply text-sm text-gray-600;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .stats-grid {
    @apply grid-cols-1;
  }
  
  .score-cards {
    @apply grid-cols-1;
  }
}
</style> 