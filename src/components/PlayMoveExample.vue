<template>
  <div class="play-move-example">
    <h3>Play Move Example</h3>
    
    <!-- Game Status -->
    <div class="status-section">
      <div class="status-indicator" :class="{ active: isActive, completed: isCompleted }">
        <span v-if="isActive">🎮 Game Active</span>
        <span v-else-if="isCompleted">🏁 Game Completed</span>
        <span v-else>⏳ Waiting</span>
      </div>
      
      <div v-if="currentPlayer" class="turn-indicator">
        Current Turn: Player {{ currentPlayer }}
      </div>
    </div>

    <!-- Game Board Preview -->
    <div v-if="match" class="game-board-preview">
      <h4>Game Board ({{ gridSize }}x{{ gridSize }})</h4>
      
      <!-- Simple grid representation -->
      <div class="grid-preview" :style="{ '--grid-size': gridSize }">
        <div 
          v-for="dot in dots" 
          :key="dot.id"
          class="dot"
          :style="{ 
            left: `${(dot.x / (gridSize - 1)) * 100}%`, 
            top: `${(dot.y / (gridSize - 1)) * 100}%` 
          }"
        ></div>
        
        <!-- Draw lines -->
        <svg class="lines-overlay">
          <line
            v-for="line in lines"
            :key="line.id"
            :x1="getLineX1(line)"
            :y1="getLineY1(line)"
            :x2="getLineX2(line)"
            :y2="getLineY2(line)"
            :stroke="getLineColor(line)"
            stroke-width="2"
          />
        </svg>
        
        <!-- Draw squares -->
        <div
          v-for="square in squares"
          :key="square.id"
          class="square"
          :class="{ claimed: square.player }"
          :style="getSquareStyle(square)"
        ></div>
      </div>
    </div>

    <!-- Move Input -->
    <div class="move-input-section">
      <h4>Make a Move</h4>
      
      <div class="input-group">
        <label for="startDot">Start Dot:</label>
        <select id="startDot" v-model="selectedStartDot">
          <option value="">Select start dot</option>
          <option v-for="dot in dots" :key="dot.id" :value="dot.id">
            ({{ dot.x }}, {{ dot.y }})
          </option>
        </select>
      </div>
      
      <div class="input-group">
        <label for="endDot">End Dot:</label>
        <select id="endDot" v-model="selectedEndDot">
          <option value="">Select end dot</option>
          <option v-for="dot in availableEndDots" :key="dot.id" :value="dot.id">
            ({{ dot.x }}, {{ dot.y }})
          </option>
        </select>
      </div>
      
      <div class="button-group">
        <button 
          @click="makeMove" 
          :disabled="!canMakeMove || isMakingMove"
          class="primary-button"
        >
          {{ isMakingMove ? 'Making Move...' : 'Make Move' }}
        </button>
        <button @click="clearSelection" class="secondary-button">
          Clear Selection
        </button>
      </div>
    </div>

    <!-- Move Result -->
    <div v-if="lastMoveResult" class="move-result">
      <h4>Last Move Result</h4>
      <div class="result-details" :class="{ success: lastMoveResult.success, error: !lastMoveResult.success }">
        <div v-if="lastMoveResult.success">
          <p>✅ Move successful!</p>
          <p v-if="lastMoveResult.squaresClaimed > 0">
            🎯 Claimed {{ lastMoveResult.squaresClaimed }} square(s)
          </p>
          <p v-if="lastMoveResult.gameCompleted">
            🏆 Game completed! Winner: {{ getWinnerText(lastMoveResult.winner) }}
          </p>
        </div>
        <div v-else>
          <p>❌ Move failed: {{ lastMoveResult.error }}</p>
        </div>
      </div>
    </div>

    <!-- Scores -->
    <div v-if="scores" class="scores-section">
      <h4>Scores</h4>
      <div class="scores-grid">
        <div class="score-item">
          <span class="player-name">Player 1</span>
          <span class="score">{{ scores[1] || 0 }}</span>
        </div>
        <div class="score-item">
          <span class="player-name">Player 2</span>
          <span class="score">{{ scores[2] || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Game Progress -->
    <div v-if="match" class="progress-section">
      <h4>Game Progress</h4>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${getMatchProgress()}%` }"
        ></div>
      </div>
      <p>{{ getClaimedSquares() }} / {{ getTotalSquares() }} squares claimed</p>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      Error: {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { playMove, type PlayMoveResult, type MoveLine } from '../firebase/matchHelpers'
import { useMatchSubscription } from '../composables/useMatchSubscription'

// Props
interface Props {
  matchId: string
  playerId: string
}

const props = defineProps<Props>()

// Component state
const selectedStartDot = ref('')
const selectedEndDot = ref('')
const isMakingMove = ref(false)
const lastMoveResult = ref<PlayMoveResult | null>(null)
const error = ref<string | null>(null)

// Use match subscription
const {
  match,
  isActive,
  isCompleted,
  currentPlayer,
  scores,
  dots,
  lines,
  squares,
  gridSize,
  getMatchProgress,
  getRemainingSquares,
  getClaimedSquaresByPlayer
} = useMatchSubscription(props.matchId, {
  onError: (errorMessage) => {
    error.value = errorMessage
  }
})

// Computed properties
const availableEndDots = computed(() => {
  if (!selectedStartDot.value || !dots.value) return []
  
  const startDot = dots.value.find(d => d.id === selectedStartDot.value)
  if (!startDot) return []
  
  // Find adjacent dots (horizontal or vertical)
  return dots.value.filter(dot => {
    const isHorizontal = dot.y === startDot.y && Math.abs(dot.x - startDot.x) === 1
    const isVertical = dot.x === startDot.x && Math.abs(dot.y - startDot.y) === 1
    return isHorizontal || isVertical
  })
})

const canMakeMove = computed(() => {
  return isActive.value && 
         selectedStartDot.value && 
         selectedEndDot.value && 
         !isMakingMove.value &&
         currentPlayer.value === getPlayerNumber()
})

// Helper functions
function getPlayerNumber(): number | null {
  if (!match.value) return null
  if (match.value.player1.id === props.playerId) return 1
  if (match.value.player2?.id === props.playerId) return 2
  return null
}

function getLineX1(line: any): number {
  const [x] = line.startDot.split('-').map(Number)
  return (x / (gridSize.value - 1)) * 100
}

function getLineY1(line: any): number {
  const [, y] = line.startDot.split('-').map(Number)
  return (y / (gridSize.value - 1)) * 100
}

function getLineX2(line: any): number {
  const [x] = line.endDot.split('-').map(Number)
  return (x / (gridSize.value - 1)) * 100
}

function getLineY2(line: any): number {
  const [, y] = line.endDot.split('-').map(Number)
  return (y / (gridSize.value - 1)) * 100
}

function getLineColor(line: any): string {
  return line.player === 1 ? '#3b82f6' : '#ef4444'
}

function getSquareStyle(square: any) {
  const x = (square.topLeftX / (gridSize.value - 1)) * 100
  const y = (square.topLeftY / (gridSize.value - 1)) * 100
  const size = 100 / (gridSize.value - 1)
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}%`,
    height: `${size}%`,
    backgroundColor: square.player === 1 ? '#dbeafe' : '#fecaca'
  }
}

function getWinnerText(winner: number | 'tie' | null): string {
  if (winner === 'tie') return 'Tie'
  if (winner === 1) return 'Player 1'
  if (winner === 2) return 'Player 2'
  return 'Unknown'
}

function getClaimedSquares(): number {
  if (!squares.value) return 0
  return squares.value.filter(s => s.player !== undefined).length
}

function getTotalSquares(): number {
  if (!gridSize.value) return 0
  return (gridSize.value - 1) * (gridSize.value - 1)
}

// Actions
async function makeMove() {
  if (!canMakeMove.value) return
  
  isMakingMove.value = true
  error.value = null
  
  try {
    const move: MoveLine = {
      startDot: selectedStartDot.value,
      endDot: selectedEndDot.value
    }
    
    const result = await playMove(props.matchId, props.playerId, move)
    lastMoveResult.value = result
    
    if (result.success) {
      // Clear selection on successful move
      clearSelection()
    } else {
      error.value = result.error || 'Move failed'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    isMakingMove.value = false
  }
}

function clearSelection() {
  selectedStartDot.value = ''
  selectedEndDot.value = ''
  lastMoveResult.value = null
  error.value = null
}

// Watch for changes
watch([selectedStartDot, selectedEndDot], () => {
  // Clear last result when selection changes
  lastMoveResult.value = null
})
</script>

<style scoped>
.play-move-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.status-section {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
}

.status-indicator.active {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-indicator.completed {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.status-indicator:not(.active):not(.completed) {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.turn-indicator {
  font-weight: 600;
  color: #374151;
}

.game-board-preview {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.grid-preview {
  position: relative;
  width: 300px;
  height: 300px;
  border: 2px solid #374151;
  margin: 1rem auto;
}

.dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #374151;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.lines-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.square {
  position: absolute;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.square.claimed {
  border-color: #374151;
}

.move-input-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.input-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.primary-button {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-button:hover:not(:disabled) {
  background: #2563eb;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-button:hover {
  background: #e5e7eb;
}

.move-result {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.result-details {
  padding: 1rem;
  border-radius: 0.5rem;
}

.result-details.success {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.result-details.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.scores-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.scores-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.player-name {
  font-weight: 600;
  color: #374151;
}

.score {
  font-size: 1.25rem;
  font-weight: 700;
  color: #3b82f6;
}

.progress-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.progress-bar {
  width: 100%;
  height: 1rem;
  background: #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-weight: 500;
}

@media (max-width: 640px) {
  .play-move-example {
    padding: 1rem;
  }
  
  .status-section {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .scores-grid {
    grid-template-columns: 1fr;
  }
}
</style> 