<template>
  <div class="turn-info">
    <div class="turn-header">
      <h3>Turn Information</h3>
      <div class="turn-number">Turn {{ turnSummary.turnNumber }}</div>
    </div>
    
    <div class="current-turn">
      <div class="player-indicator" :class="{ active: true }">
        Player {{ turnSummary.currentPlayer }}
      </div>
      <div class="turn-status">
        <span v-if="didLastMoveCompleteSquares" class="bonus-turn">
          Bonus Turn! 🎉
        </span>
        <span v-else class="next-player">
          Next: Player {{ turnSummary.nextPlayer }}
        </span>
      </div>
    </div>
    
    <div class="turn-stats">
      <div class="stat-item">
        <span class="stat-label">Consecutive Turns:</span>
        <span class="stat-value">{{ turnSummary.consecutiveTurns }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Turns:</span>
        <span class="stat-value">{{ turnSummary.totalTurns }}</span>
      </div>
    </div>
    
    <div v-if="showHistory" class="turn-history">
      <h4>Recent Turns</h4>
      <div class="history-list">
        <div 
          v-for="(turn, index) in recentHistory" 
          :key="index"
          class="history-item"
          :class="{ 'completed-squares': turn.completedSquares > 0 }"
        >
          <span class="player">Player {{ turn.player }}</span>
          <span class="squares">
            {{ turn.completedSquares > 0 ? `+${turn.completedSquares} square(s)` : 'No squares' }}
          </span>
        </div>
      </div>
    </div>
    
    <div v-if="hasExcessiveTurns" class="excessive-turns-warning">
      ⚠️ Player {{ turnSummary.currentPlayer }} has had many consecutive turns
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  turnSummary: {
    currentPlayer: number
    turnNumber: number
    nextPlayer: number
    consecutiveTurns: number
    totalTurns: number
    playerStats: Record<number, number>
  }
  didLastMoveCompleteSquares: boolean
  turnHistory: Array<{ player: number; completedSquares: number }>
  showHistory?: boolean
  maxHistoryItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  showHistory: true,
  maxHistoryItems: 5
})

// Get recent turn history
const recentHistory = computed(() => {
  return props.turnHistory.slice(-props.maxHistoryItems).reverse()
})

// Check for excessive consecutive turns
const hasExcessiveTurns = computed(() => {
  return props.turnSummary.consecutiveTurns >= 3
})
</script>

<style scoped>
.turn-info {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  min-width: 250px;
}

.turn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.turn-header h3 {
  margin: 0;
  color: #374151;
  font-size: 1.1rem;
}

.turn-number {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.current-turn {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.player-indicator {
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.5rem;
  font-weight: 600;
  text-align: center;
}

.turn-status {
  text-align: center;
  font-size: 0.875rem;
}

.bonus-turn {
  color: #059669;
  font-weight: 600;
}

.next-player {
  color: #6b7280;
}

.turn-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f1f5f9;
  border-radius: 0.25rem;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
}

.stat-value {
  font-weight: 600;
  color: #1e293b;
}

.turn-history {
  margin-top: 1rem;
}

.turn-history h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 0.875rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: #f1f5f9;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.history-item.completed-squares {
  background: #dcfce7;
  border-left: 3px solid #22c55e;
}

.player {
  font-weight: 600;
  color: #374151;
}

.squares {
  color: #64748b;
}

.excessive-turns-warning {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  color: #92400e;
  font-size: 0.875rem;
  text-align: center;
}
</style> 