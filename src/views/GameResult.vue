<template>
  <div class="game-result">
    <div class="result-container">
      <!-- Header -->
      <div class="result-header">
        <h1 class="result-title">Game Complete!</h1>
        <div class="result-subtitle">Thanks for playing Dots to Squares</div>
      </div>

      <!-- Winner Display -->
      <div class="winner-section">
        <div v-if="winner === 'tie'" class="tie-result">
          <div class="tie-icon">🤝</div>
          <h2 class="winner-text">It's a Tie!</h2>
          <p class="winner-description">Both players played equally well!</p>
        </div>
        <div v-else-if="winner" class="winner-result">
          <div class="winner-icon">🏆</div>
          <h2 class="winner-text">{{ getWinnerName() }} Wins!</h2>
          <p class="winner-description">Congratulations on your victory!</p>
        </div>
        <div v-else class="no-winner">
          <div class="no-winner-icon">❓</div>
          <h2 class="winner-text">Game Ended</h2>
          <p class="winner-description">The game has concluded.</p>
        </div>
      </div>

      <!-- Final Score -->
      <div class="final-score-section">
        <h3 class="score-title">Final Score</h3>
        <div class="score-cards">
          <div class="player-score-card" :class="{ winner: winner === 1 }">
            <div class="player-info">
              <div class="player-name">{{ getPlayerName(1) }}</div>
              <div class="player-id">{{ getPlayerId(1) }}</div>
            </div>
            <div class="score-display">
              <div class="score-number">{{ finalScores[1] || 0 }}</div>
              <div class="score-label">squares</div>
            </div>
          </div>
          
          <div class="vs-divider">VS</div>
          
          <div class="player-score-card" :class="{ winner: winner === 2 }">
            <div class="player-info">
              <div class="player-name">{{ getPlayerName(2) }}</div>
              <div class="player-id">{{ getPlayerId(2) }}</div>
            </div>
            <div class="score-display">
              <div class="score-number">{{ finalScores[2] || 0 }}</div>
              <div class="score-label">squares</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Statistics -->
      <div class="game-stats">
        <h3 class="stats-title">Game Statistics</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ totalSquares }}</div>
            <div class="stat-label">Total Squares</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ claimedSquares }}</div>
            <div class="stat-label">Claimed</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ totalMoves }}</div>
            <div class="stat-label">Total Moves</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ gameDuration }}</div>
            <div class="stat-label">Duration</div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button 
          @click="handlePlayAgain" 
          :disabled="isCreatingMatch"
          class="btn-play-again"
        >
          <span v-if="isCreatingMatch" class="loading-spinner"></span>
          {{ isCreatingMatch ? 'Creating Match...' : 'Play Again' }}
        </button>
        
        <button @click="handleGoHome" class="btn-go-home">
          Back to Home
        </button>
      </div>

      <!-- Match Info -->
      <div class="match-info">
        <div class="info-item">
          <span class="info-label">Match ID:</span>
          <span class="info-value">{{ matchId }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Grid Size:</span>
          <span class="info-value">{{ gridSize }}x{{ gridSize }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Completed:</span>
          <span class="info-value">{{ formatDate(completedAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createMatch } from '../firebase/matchHelpers'
import { useMatchStore } from '../stores/matchStore'

// Router and route
const route = useRoute()
const router = useRouter()

// Match store
const matchStore = useMatchStore()

// Local state
const isCreatingMatch = ref(false)
const matchData = ref<any>(null)

// Get data from route query params
const matchId = computed(() => route.query.matchId as string || '')
const winnerParam = computed(() => route.query.winner as string || '')

// Parse winner from route
const winner = computed(() => {
  if (winnerParam.value === 'tie') return 'tie'
  const winnerNum = parseInt(winnerParam.value)
  return isNaN(winnerNum) ? null : winnerNum
})

// Get match data from store or route
const finalScores = computed(() => {
  if (matchData.value?.scores) {
    return matchData.value.scores
  }
  // Fallback to store data
  return matchStore.scores
})

const gridSize = computed(() => {
  return matchData.value?.gridSize || matchStore.gridSize || 5
})

const totalSquares = computed(() => {
  const size = gridSize.value
  return (size - 1) * (size - 1)
})

const claimedSquares = computed(() => {
  if (matchData.value?.squares) {
    return matchData.value.squares.filter((s: any) => s.player !== undefined).length
  }
  return matchStore.squares?.filter(s => s.player !== undefined).length || 0
})

const totalMoves = computed(() => {
  if (matchData.value?.lines) {
    return matchData.value.lines.length
  }
  return matchStore.lines?.length || 0
})

const gameDuration = computed(() => {
  if (!matchData.value?.createdAt || !matchData.value?.updatedAt) {
    return 'Unknown'
  }
  
  const start = new Date(matchData.value.createdAt.seconds * 1000)
  const end = new Date(matchData.value.updatedAt.seconds * 1000)
  const duration = end.getTime() - start.getTime()
  
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)
  
  return `${minutes}m ${seconds}s`
})

const completedAt = computed(() => {
  return matchData.value?.updatedAt || new Date()
})

// Helper functions
const getPlayerName = (playerNumber: number): string => {
  if (playerNumber === 1 && matchData.value?.player1) {
    return matchData.value.player1.name
  }
  if (playerNumber === 2 && matchData.value?.player2) {
    return matchData.value.player2.name
  }
  return `Player ${playerNumber}`
}

const getPlayerId = (playerNumber: number): string => {
  if (playerNumber === 1 && matchData.value?.player1) {
    return matchData.value.player1.id.slice(0, 8) + '...'
  }
  if (playerNumber === 2 && matchData.value?.player2) {
    return matchData.value.player2.id.slice(0, 8) + '...'
  }
  return 'Unknown'
}

const getWinnerName = (): string => {
  if (winner.value === 'tie') return 'Both Players'
  if (winner.value) return getPlayerName(winner.value)
  return 'Unknown'
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Event handlers
const handlePlayAgain = async () => {
  if (!matchData.value) {
    console.error('No match data available for rematch')
    return
  }

  isCreatingMatch.value = true

  try {
    // Create new match with same players
    const newMatchId = await createMatch({
      player1Id: matchData.value.player1.id,
      player1Name: matchData.value.player1.name,
      gridSize: matchData.value.gridSize || 5,
      isPublic: matchData.value.isPublic || true,
      maxPlayers: matchData.value.maxPlayers || 2
    })

    console.log('New match created:', newMatchId)
    
    // Navigate to the new match
    router.push(`/match/${newMatchId}`)
  } catch (error) {
    console.error('Error creating rematch:', error)
    // TODO: Show error message to user
  } finally {
    isCreatingMatch.value = false
  }
}

const handleGoHome = () => {
  matchStore.unsubscribeFromMatch()
  router.push('/')
}

// Load match data on mount
onMounted(async () => {
  if (matchId.value) {
    // Try to get match data from store first
    if (matchStore.currentMatchId === matchId.value) {
      matchData.value = matchStore.matchData
    } else {
      // Subscribe to match to get data
      matchStore.subscribeToMatchById(matchId.value)
      
      // Wait a bit for data to load
      setTimeout(() => {
        matchData.value = matchStore.matchData
      }, 1000)
    }
  }
})
</script>

<style scoped>
.game-result {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.result-container {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

/* Header */
.result-header {
  margin-bottom: 2rem;
}

.result-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.result-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
}

/* Winner Section */
.winner-section {
  margin-bottom: 2.5rem;
}

.winner-result, .tie-result, .no-winner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.winner-icon, .tie-icon, .no-winner-icon {
  font-size: 4rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
}

.winner-text {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.winner-description {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
}

/* Final Score */
.final-score-section {
  margin-bottom: 2.5rem;
}

.score-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1.5rem;
}

.score-cards {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.player-score-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  min-width: 150px;
  transition: all 0.3s ease;
}

.player-score-card.winner {
  border-color: #22c55e;
  background: #f0fdf4;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.player-info {
  margin-bottom: 1rem;
}

.player-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.player-id {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: monospace;
}

.score-display {
  text-align: center;
}

.score-number {
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
  line-height: 1;
}

.score-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
}

.vs-divider {
  font-weight: 700;
  color: #6b7280;
  font-size: 1.2rem;
}

/* Game Statistics */
.game-stats {
  margin-bottom: 2.5rem;
}

.stats-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.btn-play-again, .btn-go-home {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-play-again {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.btn-play-again:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

.btn-play-again:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-go-home {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-go-home:hover {
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

/* Match Info */
.match-info {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
}

.info-value {
  font-weight: 600;
  color: #1f2937;
  font-family: monospace;
}

/* Responsive Design */
@media (max-width: 640px) {
  .game-result {
    padding: 1rem;
  }
  
  .result-container {
    padding: 2rem;
  }
  
  .result-title {
    font-size: 2rem;
  }
  
  .score-cards {
    flex-direction: column;
    gap: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style> 