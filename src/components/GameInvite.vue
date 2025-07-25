<template>
  <div class="game-invite min-h-screen flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md mx-auto">
      <div class="text-center">
        <img src="@/assets/dots2squares-logo.png" alt="Dots 2 Squares Logo" class="mx-auto mb-6 w-48" />
        <h1 class="text-3xl font-extrabold text-secondary tracking-tight">Game Invitation</h1>
        <p class="mt-2 text-lg text-muted">You've been invited to play!</p>
      </div>

      <div class="card mt-8">
        <div class="space-y-6">
          <!-- Game Info -->
          <div class="game-info">
            <h3 class="text-lg font-semibold text-secondary mb-3">Game Details</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-muted">Host:</span>
                <span class="font-medium">{{ hostName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Grid Size:</span>
                <span class="font-medium">{{ gridSize }}x{{ gridSize }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Status:</span>
                <span class="font-medium text-green-600">Waiting for players</span>
              </div>
            </div>
          </div>

          <!-- Player Name Input -->
          <div>
            <label for="playerName" class="block text-sm font-bold text-secondary mb-2">Your Name</label>
            <input 
              id="playerName" 
              v-model="playerName" 
              type="text" 
              placeholder="Enter your name..." 
              class="input-field w-full"
              @keyup.enter="acceptInvite"
            />
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <button 
              @click="acceptInvite" 
              :disabled="!canAccept"
              class="btn btn-primary w-full text-lg py-4"
            >
              <span v-if="isJoining" class="loading-spinner mr-2"></span>
              {{ isJoining ? 'Joining Game...' : '🎮 Accept & Join Game' }}
            </button>

            <button @click="declineInvite" class="btn btn-secondary w-full">
              ❌ Decline Invitation
            </button>
          </div>

          <!-- Chat with Host -->
          <div class="chat-host-section">
            <Chat 
              v-if="matchId" 
              :matchId="matchId" 
              :currentPlayerName="playerName || 'Guest'"
              :hasSecondPlayer="true"
              :isHostChat="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'
import { joinMatch } from '../firebase/matchHelpers'
import Chat from './Chat.vue'

const route = useRoute()
const router = useRouter()
const matchStore = useMatchStore()

// Local state
const matchId = ref('')
const playerName = ref('')
const isJoining = ref(false)

// Computed properties
const matchData = computed(() => matchStore.matchData)
const hostName = computed(() => matchData.value?.player1?.name || 'Unknown Host')
const gridSize = computed(() => matchData.value?.gridSize || 5)

const canAccept = computed(() => {
  return playerName.value.trim().length > 0 && !isJoining.value
})

// Methods
const acceptInvite = async () => {
  if (!canAccept.value) return

  isJoining.value = true

  try {
    const playerId = 'user-' + Math.random().toString(36).substring(2, 8)
    const name = playerName.value.trim()
    
    await joinMatch(matchId.value, playerId, name)
    console.log('Successfully joined match')
    
    // Navigate to lobby
    router.push(`/lobby/${matchId.value}?playerId=${playerId}`)
  } catch (error) {
    console.error('Failed to join match:', error)
    // TODO: Show error message to user
  } finally {
    isJoining.value = false
  }
}

const declineInvite = () => {
  router.push('/')
}

// Initialize
onMounted(async () => {
  try {
    console.log('GameInvite onMounted called')
    matchId.value = route.params.id as string
    console.log('MatchId from route:', matchId.value)
    
    // Subscribe to match updates to get game details
    if (matchId.value) {
      console.log('Subscribing to match:', matchId.value)
      matchStore.subscribeToMatchById(matchId.value)
    }
  } catch (error) {
    console.error('Error in GameInvite onMounted:', error)
  }
})
</script>

<style scoped>
.game-info {
  @apply bg-gray-50 p-4 rounded-lg;
}

.chat-host-section {
  @apply mt-4;
}

.loading-spinner {
  @apply inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin;
}
</style> 