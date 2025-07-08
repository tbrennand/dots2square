<template>
  <div class="game-board">
    <DotGrid />
    <div class="side-panel">
      <TurnTracker />
      <ScoreCard />
    </div>
  </div>
</template>

<script setup>
import DotGrid from './DotGrid.vue'
// TurnTracker and ScoreCard will be created later
</script>

<style scoped>
.game-board {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  justify-content: center;
  margin-top: 2rem;
}
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style> 