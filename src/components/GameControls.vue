<template>
  <div class="game-controls">
    <h3 class="controls-title">Game Controls</h3>
    
    <!-- Waiting State -->
    <div v-if="isWaiting" class="waiting-state">
      <p class="waiting-text">Waiting for players...</p>
    </div>
    
    <!-- Active Game Controls -->
    <div v-else-if="isActive" class="active-controls">
      <div class="move-status">
        <p v-if="canMove" class="can-move">Your turn!</p>
        <p v-else class="waiting-turn">Waiting for opponent...</p>
      </div>
      
      <div class="control-buttons">
        <button 
          @click="$emit('forfeit')" 
          class="btn-forfeit"
          :disabled="!canMove"
        >
          Forfeit
        </button>
      </div>
    </div>
    
    <!-- Completed Game Controls -->
    <div v-else-if="isCompleted" class="completed-controls">
      <p class="game-complete">Game Complete!</p>
      <div class="control-buttons">
        <button 
          @click="$emit('rematch')" 
          class="btn-rematch"
          :disabled="isCreating"
        >
          <span v-if="isCreating">Creating...</span>
          <span v-else>Rematch</span>
        </button>
      </div>
    </div>
    
    <!-- Default State -->
    <div v-else class="default-controls">
      <p class="no-controls">No controls available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canMove: boolean
  isWaiting: boolean
  isActive: boolean
  isCompleted: boolean
  isCreating?: boolean
}>()

defineEmits<{
  forfeit: []
  rematch: []
}>()
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