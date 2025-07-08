<template>
  <div class="victory-display">
    <!-- Game Progress -->
    <div class="game-progress">
      <h4>Game Progress</h4>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${gameProgress}%` }"
          :class="{ 'near-completion': isNearCompletion }"
        ></div>
      </div>
      <div class="progress-text">
        {{ claimedSquares }}/{{ totalSquares }} squares claimed ({{ Math.round(gameProgress) }}%)
      </div>
    </div>

    <!-- Victory Status -->
    <div v-if="victoryResult.isGameOver" class="victory-status">
      <div class="victory-header">
        <h3>🎉 Game Over! 🎉</h3>
      </div>
      
      <div class="winner-announcement" :class="winnerClass">
        <div v-if="victoryResult.winner === 'tie'" class="tie-result">
          <span class="tie-icon">🤝</span>
          <span class="tie-text">It's a tie!</span>
        </div>
        <div v-else class="winner-result">
          <span class="winner-icon">🏆</span>
          <span class="winner-text">Player {{ victoryResult.winner }} wins!</span>
        </div>
      </div>
      
      <div class="final-scores">
        <div class="score-item" :class="{ winner: victoryResult.winner === 1 }">
          <span class="player-label">Player 1</span>
          <span class="score">{{ victoryResult.playerStats.player1.score }} points</span>
          <span class="squares">({{ victoryResult.playerStats.player1.squares }} squares)</span>
        </div>
        <div class="score-item" :class="{ winner: victoryResult.winner === 2 }">
          <span class="player-label">Player 2</span>
          <span class="score">{{ victoryResult.playerStats.player2.score }} points</span>
          <span class="squares">({{ victoryResult.playerStats.player2.squares }} squares)</span>
        </div>
      </div>
    </div>

    <!-- Game in Progress -->
    <div v-else class="game-status">
      <div class="current-scores">
        <div class="score-item" :class="{ leading: isPlayerWinning(1) }">
          <span class="player-label">Player 1</span>
          <span class="score">{{ victoryResult.playerStats.player1.score }} points</span>
          <span class="squares">({{ victoryResult.playerStats.player1.squares }} squares)</span>
        </div>
        <div class="score-item" :class="{ leading: isPlayerWinning(2) }">
          <span class="player-label">Player 2</span>
          <span class="score">{{ victoryResult.playerStats.player2.score }} points</span>
          <span class="squares">({{ victoryResult.playerStats.player2.squares }} squares)</span>
        </div>
      </div>

      <!-- Victory Prediction -->
      <div v-if="showPrediction && prediction.predictedWinner" class="victory-prediction">
        <div class="prediction-header">
          <span class="prediction-icon">🔮</span>
          <span class="prediction-text">Victory Prediction</span>
        </div>
        <div class="prediction-result">
          <span class="predicted-winner">Player {{ prediction.predictedWinner }}</span>
          <span class="confidence">({{ Math.round(prediction.confidence * 100) }}% confidence)</span>
        </div>
      </div>

      <!-- Decisive Game Warning -->
      <div v-if="isGameDecisive" class="decisive-warning">
        <span class="warning-icon">⚡</span>
        <span class="warning-text">Game is decisive - one player has a clear advantage</span>
      </div>
    </div>

    <!-- Remaining Squares -->
    <div class="remaining-info">
      <span class="remaining-text">{{ remainingSquares }} squares remaining</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  squares: Array<{ player?: number }>
  scores: Record<number, number>
  showPrediction?: boolean
  gridSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  showPrediction: true,
  gridSize: 5
})

// Import victory checker (in a real app, this would be passed from parent)
// For now, we'll simulate the victory checker logic
const getTotalSquares = () => (props.gridSize - 1) * (props.gridSize - 1)
const getClaimedSquares = () => props.squares.filter(s => s.player !== undefined).length
const getClaimedByPlayer = (player: number) => props.squares.filter(s => s.player === player).length

// Computed properties
const totalSquares = computed(() => getTotalSquares())
const claimedSquares = computed(() => getClaimedSquares())
const gameProgress = computed(() => (claimedSquares.value / totalSquares.value) * 100)
const remainingSquares = computed(() => totalSquares.value - claimedSquares.value)
const isNearCompletion = computed(() => gameProgress.value >= 80)

// Victory result
const victoryResult = computed(() => {
  const isGameOver = claimedSquares.value === totalSquares.value
  const player1Score = props.scores[1] || 0
  const player2Score = props.scores[2] || 0
  
  if (!isGameOver) {
    return {
      isGameOver: false,
      winner: null,
      reason: `Game in progress - ${claimedSquares.value}/${totalSquares.value} squares claimed`,
      playerStats: {
        player1: { score: player1Score, squares: getClaimedByPlayer(1) },
        player2: { score: player2Score, squares: getClaimedByPlayer(2) }
      }
    }
  }
  
  const winner = player1Score > player2Score ? 1 : player2Score > player1Score ? 2 : 'tie'
  
  return {
    isGameOver: true,
    winner,
    reason: winner === 'tie' ? "It's a tie!" : `Player ${winner} wins!`,
    playerStats: {
      player1: { score: player1Score, squares: getClaimedByPlayer(1) },
      player2: { score: player2Score, squares: getClaimedByPlayer(2) }
    }
  }
})

// Victory prediction
const prediction = computed(() => {
  const advantage = (props.scores[1] || 0) - (props.scores[2] || 0)
  
  if (remainingSquares.value === 0) {
    return {
      predictedWinner: victoryResult.value.winner,
      confidence: 1.0
    }
  }
  
  if (Math.abs(advantage) > remainingSquares.value) {
    return {
      predictedWinner: advantage > 0 ? 1 : 2,
      confidence: 1.0
    }
  }
  
  return {
    predictedWinner: null,
    confidence: Math.max(0.1, 1 - (remainingSquares.value / 10))
  }
})

// Helper functions
const isPlayerWinning = (player: number) => {
  const player1Score = props.scores[1] || 0
  const player2Score = props.scores[2] || 0
  return player === 1 ? player1Score > player2Score : player2Score > player1Score
}

const isGameDecisive = computed(() => {
  const advantage = Math.abs((props.scores[1] || 0) - (props.scores[2] || 0))
  return advantage > remainingSquares.value
})

const winnerClass = computed(() => {
  if (victoryResult.value.winner === 'tie') return 'tie'
  return `winner-${victoryResult.value.winner}`
})
</script>

<style scoped>
.victory-display {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  min-width: 300px;
}

.game-progress {
  margin-bottom: 1rem;
}

.game-progress h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.progress-fill.near-completion {
  background: #f59e0b;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

.victory-status {
  margin-bottom: 1rem;
}

.victory-header h3 {
  margin: 0 0 1rem 0;
  text-align: center;
  color: #059669;
  font-size: 1.25rem;
}

.winner-announcement {
  text-align: center;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.winner-announcement.tie {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

.winner-announcement.winner-1 {
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.winner-announcement.winner-2 {
  background: #fecaca;
  border: 2px solid #ef4444;
}

.tie-result, .winner-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.tie-icon, .winner-icon {
  font-size: 1.5rem;
}

.final-scores, .current-scores {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.score-item.winner {
  background: #dcfce7;
  border: 2px solid #22c55e;
}

.score-item.leading {
  background: #e0f2fe;
  border: 1px solid #0284c7;
}

.player-label {
  font-weight: 600;
  color: #374151;
}

.score {
  font-weight: 700;
  color: #1f2937;
}

.squares {
  font-size: 0.75rem;
  color: #6b7280;
}

.victory-prediction {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f3e8ff;
  border: 1px solid #a855f7;
  border-radius: 0.5rem;
}

.prediction-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.prediction-icon {
  font-size: 1.2rem;
}

.prediction-text {
  font-weight: 600;
  color: #7c3aed;
}

.prediction-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.predicted-winner {
  font-weight: 600;
  color: #581c87;
}

.confidence {
  font-size: 0.875rem;
  color: #6b7280;
}

.decisive-warning {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #92400e;
}

.warning-icon {
  font-size: 1rem;
}

.remaining-info {
  margin-top: 1rem;
  text-align: center;
  padding: 0.5rem;
  background: #f1f5f9;
  border-radius: 0.25rem;
}

.remaining-text {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}
</style> 