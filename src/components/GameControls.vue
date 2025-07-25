<template>
  <div class="game-controls text-center">
    <button @click="onForfeit" :disabled="!canMove" class="btn btn-danger w-full">
      Forfeit Match
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  canMove: boolean
}>()

const emit = defineEmits(['forfeit'])

const onForfeit = () => {
  if (confirm('Are you sure you want to forfeit the match?')) {
    emit('forfeit')
  }
}
</script>

<style scoped>
.game-controls {
  padding: 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  min-width: 200px;
}

.controls-title {
  text-align: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.waiting-state {
  text-align: center;
}

.waiting-text {
  color: #6b7280;
  font-style: italic;
}

.active-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.move-status {
  text-align: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.can-move {
  color: #059669;
  font-weight: 600;
  background: #d1fae5;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.waiting-turn {
  color: #6b7280;
  font-style: italic;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-forfeit {
  padding: 0.75rem 1rem;
  background: #dc2626;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-forfeit:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
}

.btn-forfeit:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.completed-controls {
  text-align: center;
}

.game-complete {
  color: #059669;
  font-weight: 600;
  margin-bottom: 1rem;
}

.btn-rematch {
  padding: 0.75rem 1rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-rematch:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.default-controls {
  text-align: center;
}

.no-controls {
  color: #6b7280;
  font-style: italic;
}
</style> 