<template>
  <div class="square-hint" v-if="showHints">
    <h4>Square Completion Hints</h4>
    <div v-if="completingMoves.length > 0" class="hints">
      <div 
        v-for="move in completingMoves" 
        :key="move.id"
        class="hint-item"
        @click="highlightMove(move)"
      >
        <span class="hint-text">Complete square with line {{ move.from }} → {{ move.to }}</span>
        <span class="hint-count">{{ getSquaresCompletedByMove(move).length }} square(s)</span>
      </div>
    </div>
    <div v-else class="no-hints">
      No squares can be completed with current moves
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSquareChecker } from '../composables/useSquareChecker'

interface Props {
  lines: Array<{ id: string; from: string; to: string; player?: number }>
  possibleLines: Array<{ id: string; from: string; to: string }>
  showHints: boolean
  gridSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  gridSize: 5
})

const emit = defineEmits<{
  highlightMove: [move: { from: string; to: string }]
}>()

// Initialize square checker
const squareChecker = useSquareChecker(props.gridSize)

// Get moves that would complete squares
const completingMoves = computed(() => {
  return props.possibleLines.filter(line => 
    squareChecker.wouldCompleteAnySquares(line, props.lines)
  )
})

// Get squares that would be completed by a specific move
const getSquaresCompletedByMove = (move: { from: string; to: string }) => {
  return squareChecker.getSquaresCompletedByMove(move, props.lines)
}

// Highlight a move when clicked
const highlightMove = (move: { from: string; to: string }) => {
  emit('highlightMove', move)
}
</script>

<style scoped>
.square-hint {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 1rem;
}

.square-hint h4 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
}

.hints {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hint-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #e0f2fe;
  border: 1px solid #0284c7;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.hint-item:hover {
  background: #bae6fd;
  transform: translateY(-1px);
}

.hint-text {
  font-size: 0.875rem;
  color: #0c4a6e;
}

.hint-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0369a1;
  background: #0ea5e9;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.no-hints {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 1rem;
}
</style> 