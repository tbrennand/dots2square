<template>
  <div class="score-card">
    <h3 class="score-title">Score</h3>
    
    <!-- Player Scores -->
    <div class="scores">
      <!-- Player 1 -->
      <div class="player-score" :class="{ 
        winner: winner === 1, 
        current: currentTurn === 1 && !gameOver 
      }">
        <div class="player-info">
          <div class="player-name">
            {{ getPlayerName(1) }}
            <span v-if="currentTurn === 1 && !gameOver" class="turn-indicator">←</span>
          </div>
          <div class="player-id">{{ getPlayerId(1) }}</div>
        </div>
        <div class="score-info">
          <div class="score">{{ scores[1] || 0 }}</div>
          <div class="score-label">squares</div>
        </div>
      </div>
      
      <!-- Player 2 -->
      <div class="player-score" :class="{ 
        winner: winner === 2, 
        current: currentTurn === 2 && !gameOver 
      }">
        <div class="player-info">
          <div class="player-name">
            {{ getPlayerName(2) }}
            <span v-if="currentTurn === 2 && !gameOver" class="turn-indicator">←</span>
          </div>
          <div class="player-id">{{ getPlayerId(2) }}</div>
        </div>
        <div class="score-info">
          <div class="score">{{ scores[2] || 0 }}</div>
          <div class="score-label">squares</div>
        </div>
      </div>
    </div>
    
    <!-- Game Progress -->
    <div class="game-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${getProgressPercentage()}%` }"
        ></div>
      </div>
      <div class="progress-text">
        {{ getClaimedSquares() }} / {{ getTotalSquares() }} squares claimed
      </div>
    </div>
    
    <!-- Winner Announcement -->
    <div v-if="gameOver && winner" class="winner-announcement">
      <div class="winner-icon">🏆</div>
      <div class="winner-text">
        {{ winner === 'tie' ? "It's a tie!" : `${getPlayerName(winner)} wins!` }}
      </div>
    </div>
    
    <!-- Game Status -->
    <div v-else-if="!gameOver" class="game-status">
      <div class="status-indicator" :class="getStatusClass()">
        {{ getStatusText() }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Player {
  id: string
  name: string
  joinedAt: Date
}

interface Square {
  id: string
  topLeftX: number
  topLeftY: number
  player?: number
  lines: string[]
}

const props = defineProps<{
  scores: Record<number, number>
  gameOver: boolean
  winner: number | 'tie' | null
  currentTurn?: number
  player1?: Player
  player2?: Player
  squares?: Square[]
  gridSize?: number
  status?: 'waiting' | 'active' | 'completed' | 'cancelled'
}>()

// Get player name by player number
const getPlayerName = (playerNumber: number): string => {
  if (playerNumber === 1 && props.player1) {
    return props.player1.name
  }
  if (playerNumber === 2 && props.player2) {
    return props.player2.name
  }
  return `Player ${playerNumber}`
}

// Get player ID by player number
const getPlayerId = (playerNumber: number): string => {
  if (playerNumber === 1 && props.player1) {
    return props.player1.id.slice(0, 8) + '...'
  }
  if (playerNumber === 2 && props.player2) {
    return props.player2.id.slice(0, 8) + '...'
  }
  return 'Unknown'
}

// Get total number of squares
const getTotalSquares = (): number => {
  if (!props.gridSize) return 0
  return (props.gridSize - 1) * (props.gridSize - 1)
}

// Get number of claimed squares
const getClaimedSquares = (): number => {
  if (!props.squares) return 0
  return props.squares.filter(square => square.player !== undefined).length
}

// Get progress percentage
const getProgressPercentage = (): number => {
  const total = getTotalSquares()
  const claimed = getClaimedSquares()
  return total > 0 ? (claimed / total) * 100 : 0
}

// Get status class for styling
const getStatusClass = (): string => {
  switch (props.status) {
    case 'waiting':
      return 'status-waiting'
    case 'active':
      return 'status-active'
    case 'completed':
      return 'status-completed'
    case 'cancelled':
      return 'status-cancelled'
    default:
      return 'status-unknown'
  }
}

// Get status text
const getStatusText = (): string => {
  switch (props.status) {
    case 'waiting':
      return 'Waiting for players...'
    case 'active':
      return 'Game in progress'
    case 'completed':
      return 'Game completed'
    case 'cancelled':
      return 'Game cancelled'
    default:
      return 'Unknown status'
  }
}
</script>

<style scoped>
.score-card {
  padding: 1.5rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  min-width: 280px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.score-title {
  text-align: center;
  font-weight: 700;
  color: #374151;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

.scores {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.player-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  background: #ffffff;
}

.player-score.current {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.player-score.winner {
  border-color: #22c55e;
  background: #f0fdf4;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.turn-indicator {
  color: #3b82f6;
  font-weight: 700;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.player-id {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: monospace;
}

.score-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.score {
  font-weight: 800;
  font-size: 1.5rem;
  color: #1f2937;
  line-height: 1;
}

.score-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Game Progress */
.game-progress {
  margin-bottom: 1.5rem;
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
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Winner Announcement */
.winner-announcement {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border: 2px solid #22c55e;
  border-radius: 0.75rem;
  text-align: center;
}

.winner-icon {
  font-size: 2rem;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.winner-text {
  font-weight: 700;
  color: #059669;
  font-size: 1.1rem;
}

/* Game Status */
.game-status {
  margin-top: 1rem;
}

.status-indicator {
  text-align: center;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-waiting {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #f59e0b;
}

.status-active {
  background: #dbeafe;
  color: #2563eb;
  border: 1px solid #3b82f6;
}

.status-completed {
  background: #dcfce7;
  color: #059669;
  border: 1px solid #22c55e;
}

.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #ef4444;
}

.status-unknown {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

/* Responsive Design */
@media (max-width: 640px) {
  .score-card {
    padding: 1rem;
    min-width: auto;
  }
  
  .player-score {
    padding: 0.75rem;
  }
  
  .player-name {
    font-size: 1rem;
  }
  
  .score {
    font-size: 1.25rem;
  }
}
</style> 