<template>
  <div class="home-screen min-h-screen flex flex-col items-center justify-center p-2">
    <div class="w-full max-w-lg mx-auto">
      <div class="text-center">
        <h1 class="text-3xl font-extrabold text-secondary tracking-tight mb-1">Welcome to</h1>
        <img src="@/assets/dots2squares-logo.png" alt="Dots 2 Squares Logo" class="mx-auto mb-2 w-64 sm:w-72 md:w-80 lg:w-96 h-auto" />
        <p class="text-base text-muted mb-4">The classic pencil-and-paper game, reimagined.</p>
      </div>

      <div class="card mt-4">
        <div class="space-y-4">
          <button @click="goToCreateGame" class="btn btn-primary w-full text-lg py-3">
            🎮 Create a New Game
          </button>
        </div>
        
        <div class="mt-4 text-center">
          <span class="text-muted">or</span>
          <button @click="joinMatch" class="text-primary font-bold hover:underline ml-2">Join an Existing Game</button>
        </div>
      </div>
    </div>
    
    <!-- Join Match Modal -->
    <div v-if="showJoinModal" class="fixed inset-0 bg-secondary bg-opacity-60 flex items-center justify-center z-50">
      <div class="card w-full max-w-sm">
        <h3 class="text-2xl font-bold text-secondary mb-4">Join a Match</h3>
        <div class="space-y-4">
          <div>
            <label for="matchCode" class="block text-sm font-bold text-secondary">Match Code</label>
            <input id="matchCode" v-model="matchCode" type="text" placeholder="Enter match code..." @keyup.enter="submitJoinMatch" class="input-field mt-1"/>
          </div>
          <div class="flex space-x-4">
            <button @click="submitJoinMatch" :disabled="!matchCode" class="btn btn-primary w-full">
              Join Game
            </button>
            <button @click="closeJoinModal" class="btn btn-secondary w-full">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showJoinModal = ref(false)
const matchCode = ref('')

const goToCreateGame = () => {
  router.push('/create')
}

const joinMatch = () => {
  showJoinModal.value = true
}

const closeJoinModal = () => {
  showJoinModal.value = false
  matchCode.value = ''
}

const submitJoinMatch = () => {
  if (matchCode.value.trim()) {
    router.push(`/lobby/${matchCode.value.trim()}`)
  }
}
</script>

<style scoped>
/* Scoped styles can be added here if needed, but we're relying on Tailwind */
</style> 