<template>
  <div class="turn-timer">
    <div class="timer-header">
      <span class="timer-label">Turn Timer</span>
      <span v-if="isActive" class="timer-status" :class="timerStatusClass">
        {{ timerStatusText }}
      </span>
    </div>
    
    <div v-if="isActive" class="timer-display">
      <div class="time-remaining">
        <span class="time-value">{{ formatTime(timeRemaining) }}</span>
        <span class="time-unit">seconds</span>
      </div>
      
      <div class="progress-container">
        <div 
          class="progress-bar" 
          :class="progressBarClass"
          :style="{ width: `${timeRemainingPercentage}%` }"
        ></div>
      </div>
    </div>
    
    <div v-else class="timer-inactive">
      <span class="inactive-text">Timer inactive</span>
    </div>
    
    <!-- Missed turns indicator -->
    <div v-if="hasMissedTurns" class="missed-turns">
      <span class="missed-label">Missed turns:</span>
      <span class="missed-count">{{ totalMissedTurns }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  timeRemaining: number
  timeRemainingPercentage: number
  isActive: boolean
  isExpired: boolean
  consecutiveMissedTurns: Record<string, number>
  currentPlayerId?: string
}

const props = defineProps<Props>()

// Computed properties
const timerStatusClass = computed(() => {
  if (props.isExpired) return 'expired'
  if (props.timeRemaining <= 10) return 'warning'
  if (props.timeRemaining <= 5) return 'critical'
  return 'normal'
})

const timerStatusText = computed(() => {
  if (props.isExpired) return 'EXPIRED'
  if (props.timeRemaining <= 5) return 'CRITICAL'
  if (props.timeRemaining <= 10) return 'WARNING'
  return 'ACTIVE'
})

const progressBarClass = computed(() => {
  if (props.isExpired) return 'progress-expired'
  if (props.timeRemaining <= 5) return 'progress-critical'
  if (props.timeRemaining <= 10) return 'progress-warning'
  return 'progress-normal'
})

const hasMissedTurns = computed(() => {
  return Object.values(props.consecutiveMissedTurns).some(count => count > 0)
})

const totalMissedTurns = computed(() => {
  return Object.values(props.consecutiveMissedTurns).reduce((sum, count) => sum + count, 0)
})

// Format time display
const formatTime = (seconds: number): string => {
  if (seconds <= 0) return '0'
  return Math.ceil(seconds).toString()
}
</script>

<style scoped>
.turn-timer {
  @apply bg-surface rounded-lg p-4 border border-muted;
}

.timer-header {
  @apply flex justify-between items-center mb-3;
}

.timer-label {
  @apply text-sm font-medium text-muted;
}

.timer-status {
  @apply text-xs font-bold px-2 py-1 rounded;
}

.timer-status.normal {
  @apply bg-green-100 text-green-800;
}

.timer-status.warning {
  @apply bg-yellow-100 text-yellow-800;
}

.timer-status.critical {
  @apply bg-red-100 text-red-800;
}

.timer-status.expired {
  @apply bg-red-200 text-red-900;
}

.timer-display {
  @apply space-y-3;
}

.time-remaining {
  @apply flex items-baseline justify-center space-x-1;
}

.time-value {
  @apply text-2xl font-bold text-primary;
}

.time-unit {
  @apply text-sm text-muted;
}

.progress-container {
  @apply w-full h-2 bg-muted rounded-full overflow-hidden;
}

.progress-bar {
  @apply h-full transition-all duration-100 ease-out;
}

.progress-normal {
  @apply bg-green-500;
}

.progress-warning {
  @apply bg-yellow-500;
}

.progress-critical {
  @apply bg-red-500;
}

.progress-expired {
  @apply bg-red-600;
}

.timer-inactive {
  @apply text-center py-4;
}

.inactive-text {
  @apply text-sm text-muted;
}

.missed-turns {
  @apply flex justify-between items-center mt-3 pt-3 border-t border-muted;
}

.missed-label {
  @apply text-xs text-muted;
}

.missed-count {
  @apply text-xs font-bold text-red-600;
}
</style> 