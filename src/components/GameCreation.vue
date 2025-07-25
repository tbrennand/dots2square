<template>
  <div class="game-creation min-h-screen flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-lg mx-auto">
      <div class="text-center">
        <img src="/src/assets/dots2squares-logo.png" alt="Dots 2 Squares Logo" class="mx-auto mb-2 w-64 sm:w-72 md:w-80 lg:w-96 h-auto" />
        <h1 class="text-3xl font-extrabold text-secondary tracking-tight">Create Your Game</h1>
        <p class="mt-2 text-lg text-muted">Choose your settings and invite friends to play!</p>
      </div>

      <div class="card mt-8">
        <div class="space-y-6">
          <!-- Player Name -->
          <div>
            <label for="playerName" class="block text-sm font-bold text-secondary mb-2">Your Name</label>
            <input 
              id="playerName" 
              v-model="playerName" 
              type="text" 
              placeholder="Enter your name..." 
              class="input-field w-full"
              :class="{ 'border-red-500': showNameError }"
              @keyup.enter="createMatch"
              @input="clearNameError"
            />
            <div v-if="showNameError" class="text-red-500 text-sm mt-1">
              ⚠️ Please enter your name to continue
            </div>
          </div>

          <!-- Grid Size Selection -->
          <div>
            <label class="block text-sm font-bold text-secondary mb-3">Grid Size</label>
            <div class="grid grid-cols-3 gap-3">
              <button 
                v-for="size in gridSizes" 
                :key="size"
                @click="selectedGridSize = size"
                class="grid-size-btn"
                :class="{ 'selected': selectedGridSize === size }"
              >
                <div class="text-lg font-bold">{{ size }}x{{ size }}</div>
                <div class="text-xs text-muted">{{ getGridDescription(size) }}</div>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="text-red-500 text-center p-3 bg-red-50 border border-red-200 rounded-lg">
            {{ errorMessage }}
          </div>

          <!-- Create Button -->
          <button 
            @click="createMatch" 
            :disabled="isCreating"
            class="btn btn-primary w-full text-lg py-4"
          >
            <span v-if="isCreating" class="loading-spinner mr-2"></span>
            {{ isCreating ? 'Creating Game...' : 'Create Game & Generate Links' }}
          </button>

          <!-- Back Button -->
          <button @click="goBack" class="btn btn-primary w-full">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createMatch as createMatchHelper } from '@/firebase/matchHelpers'

const router = useRouter()
const playerName = ref('')
const selectedGridSize = ref(8)
const isCreating = ref(false)
const errorMessage = ref('')
const showNameError = ref(false)

const gridSizes = [4, 6, 8, 10, 12, 15]

const canCreate = computed(() => {
  return playerName.value.trim().length > 0 && selectedGridSize.value > 0
})

const getGridDescription = (size: number): string => {
  switch (size) {
    case 4: return 'Quick'
    case 6: return 'Fast'
    case 8: return 'Classic'
    case 10: return 'Extended'
    case 12: return 'Large'
    case 15: return 'Epic'
    default: return 'Custom'
  }
}

const clearNameError = () => {
  showNameError.value = false
  errorMessage.value = ''
}

const createMatch = async () => {
  // Clear previous errors
  clearNameError()
  
  // Validate name
  if (!playerName.value.trim()) {
    showNameError.value = true
    return
  }
  
  if (isCreating.value) return

  isCreating.value = true

  try {
    const player1Id = 'player1-' + Math.random().toString(36).substring(2, 8)
    const player1Name = playerName.value.trim()
    
    const matchId = await createMatchHelper({ 
      player1Id, 
      player1Name,
      gridSize: selectedGridSize.value
    })
    
    router.push(`/lobby/${matchId}?playerId=${player1Id}`)
  } catch (error) {
    console.error('Failed to create match:', error)
    errorMessage.value = '❌ Failed to create game. Please try again.'
  } finally {
    isCreating.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.grid-size-btn {
  @apply p-4 border-2 border-gray-200 rounded-lg text-center transition-all duration-200 cursor-pointer;
}

.grid-size-btn:hover {
  @apply border-primary bg-primary bg-opacity-5;
}

.grid-size-btn.selected {
  @apply border-primary bg-primary text-white;
}

.grid-size-btn.selected .text-muted {
  @apply text-white text-opacity-80;
}

.loading-spinner {
  @apply inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin;
}
</style> 