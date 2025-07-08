<template>
  <div class="scorecard-example">
    <h2>ScoreCard Component Examples</h2>
    
    <!-- Example 1: Basic Game in Progress -->
    <div class="example-section">
      <h3>Game in Progress</h3>
      <ScoreCard
        :scores="{ 1: 3, 2: 2 }"
        :game-over="false"
        :winner="null"
        :current-turn="1"
        :player1="{ id: 'user123456789', name: 'Alice', joinedAt: new Date() }"
        :player2="{ id: 'user987654321', name: 'Bob', joinedAt: new Date() }"
        :squares="exampleSquares.value"
        :grid-size="5"
        :status="'active'"
      />
    </div>
    
    <!-- Example 2: Game Completed -->
    <div class="example-section">
      <h3>Game Completed</h3>
      <ScoreCard
        :scores="{ 1: 6, 2: 4 }"
        :game-over="true"
        :winner="1"
        :current-turn="1"
        :player1="{ id: 'user123456789', name: 'Alice', joinedAt: new Date() }"
        :player2="{ id: 'user987654321', name: 'Bob', joinedAt: new Date() }"
        :squares="completedSquares.value"
        :grid-size="5"
        :status="'completed'"
      />
    </div>
    
    <!-- Example 3: Waiting for Players -->
    <div class="example-section">
      <h3>Waiting for Players</h3>
      <ScoreCard
        :scores="{ 1: 0, 2: 0 }"
        :game-over="false"
        :winner="null"
        :current-turn="1"
        :player1="{ id: 'user123456789', name: 'Alice', joinedAt: new Date() }"
        :squares="emptySquares.value"
        :grid-size="5"
        :status="'waiting'"
      />
    </div>
    
    <!-- Example 4: Tie Game -->
    <div class="example-section">
      <h3>Tie Game</h3>
      <ScoreCard
        :scores="{ 1: 5, 2: 5 }"
        :game-over="true"
        :winner="'tie'"
        :current-turn="1"
        :player1="{ id: 'user123456789', name: 'Alice', joinedAt: new Date() }"
        :player2="{ id: 'user987654321', name: 'Bob', joinedAt: new Date() }"
        :squares="tieSquares.value"
        :grid-size="5"
        :status="'completed'"
      />
    </div>
    
    <!-- Example 5: Game Cancelled -->
    <div class="example-section">
      <h3>Game Cancelled</h3>
      <ScoreCard
        :scores="{ 1: 2, 2: 1 }"
        :game-over="true"
        :winner="null"
        :current-turn="1"
        :player1="{ id: 'user123456789', name: 'Alice', joinedAt: new Date() }"
        :player2="{ id: 'user987654321', name: 'Bob', joinedAt: new Date() }"
        :squares="cancelledSquares.value"
        :grid-size="5"
        :status="'cancelled'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ScoreCard from './ScoreCard.vue'

// Example squares for different game states
const exampleSquares = ref([
  { id: '0-0', topLeftX: 0, topLeftY: 0, player: 1, lines: ['0-0-1-0', '0-0-0-1', '1-0-1-1', '0-1-1-1'] },
  { id: '0-1', topLeftX: 1, topLeftY: 0, player: 2, lines: ['1-0-2-0', '1-0-1-1', '2-0-2-1', '1-1-2-1'] },
  { id: '1-0', topLeftX: 0, topLeftY: 1, player: 1, lines: ['0-1-1-1', '0-1-0-2', '1-1-1-2', '0-2-1-2'] },
  { id: '1-1', topLeftX: 1, topLeftY: 1, player: 2, lines: ['1-1-2-1', '1-1-1-2', '2-1-2-2', '1-2-2-2'] },
  { id: '2-0', topLeftX: 0, topLeftY: 2, player: 1, lines: ['0-2-1-2', '0-2-0-3', '1-2-1-3', '0-3-1-3'] },
  { id: '2-1', topLeftX: 1, topLeftY: 2, player: undefined, lines: [] },
  { id: '0-2', topLeftX: 2, topLeftY: 0, player: undefined, lines: [] },
  { id: '1-2', topLeftX: 2, topLeftY: 1, player: undefined, lines: [] },
  { id: '2-2', topLeftX: 2, topLeftY: 2, player: undefined, lines: [] },
  { id: '0-3', topLeftX: 3, topLeftY: 0, player: undefined, lines: [] },
  { id: '1-3', topLeftX: 3, topLeftY: 1, player: undefined, lines: [] },
  { id: '2-3', topLeftX: 3, topLeftY: 2, player: undefined, lines: [] },
  { id: '3-0', topLeftX: 0, topLeftY: 3, player: undefined, lines: [] },
  { id: '3-1', topLeftX: 1, topLeftY: 3, player: undefined, lines: [] },
  { id: '3-2', topLeftX: 2, topLeftY: 3, player: undefined, lines: [] },
  { id: '3-3', topLeftX: 3, topLeftY: 3, player: undefined, lines: [] }
])

const completedSquares = ref(exampleSquares.value.map(square => ({
  ...square,
  player: square.id === '2-1' || square.id === '0-2' || square.id === '1-2' || square.id === '2-2' || square.id === '0-3' || square.id === '1-3' || square.id === '2-3' || square.id === '3-0' || square.id === '3-1' || square.id === '3-2' || square.id === '3-3' ? 1 : square.player
})))

const emptySquares = ref(exampleSquares.value.map(square => ({
  ...square,
  player: undefined,
  lines: []
})))

const tieSquares = ref(exampleSquares.value.map(square => ({
  ...square,
  player: ['0-0', '1-0', '2-0', '3-0', '0-1'].includes(square.id) ? 1 : 
          ['0-2', '1-1', '2-1', '1-2', '2-2'].includes(square.id) ? 2 : undefined
})))

const cancelledSquares = ref(exampleSquares.value.map(square => ({
  ...square,
  player: ['0-0', '1-0'].includes(square.id) ? 1 : 
          ['0-1'].includes(square.id) ? 2 : undefined
})))
</script>

<style scoped>
.scorecard-example {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.scorecard-example h2 {
  text-align: center;
  color: #1f2937;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 700;
}

.example-section {
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.example-section h3 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

/* Responsive grid for examples */
@media (min-width: 768px) {
  .scorecard-example {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .example-section {
    margin-bottom: 0;
  }
}
</style> 