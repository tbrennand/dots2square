<template>
  <div class="turn-tracker text-center">
    <div v-if="!gameOver">
      <h3 class="text-xl font-bold text-secondary">Current Turn</h3>
      <p class="text-4xl font-extrabold text-primary mt-2">{{ currentPlayer === 1 ? 'Player 1' : 'Player 2' }}</p>
    </div>
    <div v-else>
      <h3 class="text-3xl font-extrabold text-primary">Game Over!</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentPlayer: number
  gameOver: boolean
}>()
</script>

<style scoped>
.turn-tracker {
  padding: 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  text-align: center;
  min-width: 200px;
}

.current-turn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.player-indicator {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

.player-indicator.active {
  background: #3b82f6;
  color: white;
}

.player-indicator:not(.active) {
  background: #e5e7eb;
  color: #6b7280;
}

.vs {
  font-weight: 600;
  color: #6b7280;
}

.game-over {
  font-weight: 600;
  color: #dc2626;
  font-size: 1.1rem;
}
</style> 