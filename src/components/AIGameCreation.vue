<template>
  <div class="game-creation min-h-screen flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-lg mx-auto">
      <div class="text-center">
        <router-link to="/">
          <img src="@/assets/dots2squares-logo.png" alt="Dots 2 Squares Logo" class="mx-auto w-64 sm:w-72 md:w-80 lg:w-96 h-auto" />
        </router-link>
        <h1 class="text-3xl font-extrabold text-secondary tracking-tight">Practice vs. AI</h1>
        <p class="mt-2 text-lg text-muted">Choose your settings and challenge the AI!</p>
      </div>

      <div class="card mt-8">
        <div class="space-y-6">
          <!-- Score Tracker Display -->
          <div>
            <label class="block text-sm font-bold text-secondary mb-3">Your Record vs. AI</label>
            <div class="flex justify-around text-center p-3 bg-gray-100 rounded-lg">
              <div>
                <p class="text-2xl font-bold text-green-500">{{ score.wins }}</p>
                <p class="text-xs text-muted">WINS</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-red-500">{{ score.losses }}</p>
                <p class="text-xs text-muted">LOSSES</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-500">{{ score.draws }}</p>
                <p class="text-xs text-muted">DRAWS</p>
              </div>
            </div>
          </div>
          
          <!-- Player Name -->
          <div>
            <label for="playerName" class="block text-sm font-bold text-secondary mb-2">Your Name</label>
            <input 
              id="playerName" 
              v-model="playerName" 
              type="text" 
              placeholder="Enter your name..." 
              class="input-field w-full"
              @keyup.enter="startGame"
            />
          </div>

          <!-- Grid Size Selection -->
          <div>
            <label class="block text-sm font-bold text-secondary mb-3">Grid Size</label>
            <div class="grid grid-cols-3 gap-3">
              <button 
                v-for="size in gridSizes" 
                :key="size"
                @click="gridSize = size"
                class="grid-size-btn"
                :class="{ 'selected': gridSize === size }"
              >
                <div class="text-lg font-bold">{{ size - 1 }}x{{ size - 1 }}</div>
                <div class="text-xs text-muted">{{ getGridDescription(size) }}</div>
              </button>
            </div>
          </div>

          <!-- Start Button -->
          <div class="mt-8">
            <button
              @click="startGame"
              class="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105"
            >
              Start AI Match
            </button>
          </div>

          <!-- Back Button -->
          <button @click="goBack" class="btn btn-secondary w-full">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRandomFunnyName } from '@/utils/nameGenerator'
import { useAIScoreTracker } from '@/composables/useAIScoreTracker'

const router = useRouter()
const playerName = ref('')
const gridSize = ref(9) // default to 8x8 squares (9 dots = 8x8 squares)
const gridSizes = [5, 7, 9, 11, 13, 16] // dots per side needed for the desired squares

// --- AI Score Tracking ---
const { score } = useAIScoreTracker()

const getGridDescription = (size: number): string => {
  // size is dots per side, so squares = size - 1
  const squares = size - 1
  switch (squares) {
    case 4: return 'Quick'    // 5x5 dots -> 4x4 squares
    case 6: return 'Fast'     // 7x7 dots -> 6x6 squares
    case 8: return 'Classic'  // 9x9 dots -> 8x8 squares
    case 10: return 'Extended' // 11x11 dots -> 10x10 squares
    case 12: return 'Large'    // 13x13 dots -> 12x12 squares
    case 15: return 'Epic'     // 16x16 dots -> 15x15 squares
    default: return 'Custom'
  }
}

onMounted(() => {
  const savedName = localStorage.getItem('dots2squares_playerName')
  if (savedName) {
    playerName.value = savedName
  }
})

const startGame = () => {
  let finalPlayerName = playerName.value.trim()

  if (!finalPlayerName) {
    finalPlayerName = getRandomFunnyName()
    playerName.value = finalPlayerName
  }

  localStorage.setItem('dots2squares_playerName', finalPlayerName)

  if (playerName.value && gridSize.value) {
    // gridSize.value is already the correct number of dots per side
    console.log('AIGameCreation: User selected squares:', gridSize.value - 1, 'Dots per side sent:', gridSize.value)
    router.push({
      name: 'AIGame',
      query: {
        playerName: playerName.value,
        gridSize: gridSize.value, // Send dots per side directly
      },
    })
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
/* Scoped styles can be copied from GameCreation.vue or customized */
.grid-size-btn {
  @apply p-4 border-2 border-gray-200 rounded-lg text-center transition-all duration-200 cursor-pointer;
}

.grid-size-btn:hover {
  @apply border-primary bg-primary bg-opacity-5;
}

.grid-size-btn.selected {
  @apply border-primary bg-primary text-white;
}
</style> 