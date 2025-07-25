<template>
  <div class="score-card text-center">
    <h3 class="text-xl font-bold text-secondary mb-4">Scoreboard</h3>
    <div class="flex justify-around items-center">
      <!-- Player 1 Score -->
      <div class="player-score" :class="{ 'is-turn': isPlayer1Turn }">
        <span class="text-2xl">✏️</span>
        <p class="font-bold text-lg text-secondary mt-1">{{ player1.name }}</p>
        <p class="text-4xl font-extrabold text-primary">{{ scores[1] || 0 }}</p>
      </div>
      
      <!-- Player 2 Score -->
      <div class="player-score" :class="{ 'is-turn': !isPlayer1Turn }">
        <span class="text-2xl">🎨</span>
        <p class="font-bold text-lg text-secondary mt-1">{{ player2 ? player2.name : 'Waiting...' }}</p>
        <p class="text-4xl font-extrabold text-primary">{{ scores[2] || 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  scores: Record<number, number>
  player1: { name: string }
  player2: { name: string } | null
  currentTurn: number
}>()

const isPlayer1Turn = computed(() => props.currentTurn === 1)
</script>

<style scoped>
.player-score {
  @apply p-4 rounded-xl transition-all duration-300;
}
.player-score.is-turn {
  @apply bg-primary bg-opacity-10 scale-110;
}
</style> 