<template>
  <div class="home-screen min-h-screen flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md mx-auto">
      <div class="text-center">
        <img src="@/assets/dots2squares-logo.png" alt="Dots 2 Squares Logo" class="mx-auto mb-6 w-64" />
        <h1 class="text-5xl font-extrabold text-secondary tracking-tight">Welcome to</h1>
        <h2 class="text-6xl font-extrabold text-primary">Dots 2 Squares</h2>
        <p class="mt-4 text-lg text-muted">The classic pencil-and-paper game, reimagined.</p>
      </div>

      <div class="card mt-10">
        <div class="space-y-4">
          <div>
            <label for="playerName" class="block text-sm font-bold text-secondary">Enter your name</label>
            <input id="playerName" v-model="playerName" type="text" placeholder="Pencil Warrior" class="input-field mt-1" />
          </div>
          <button @click="createMatch" class="btn btn-primary w-full">
            Create a New Game
          </button>
        </div>
        
        <div class="mt-6 text-center">
          <span class="text-muted">or</span>
          <button @click="joinMatch" class="text-primary font-bold hover:underline ml-2">join an existing game</button>
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
import { createMatch as createMatchHelper } from '@/firebase/matchHelpers'

const router = useRouter()
const showJoinModal = ref(false)
const matchCode = ref('')
const playerName = ref('')

const createMatch = async () => {
  const player1Id = 'player1-' + Math.random().toString(36).substring(2, 8)
  const player1Name = playerName.value.trim() || 'Pencil Warrior' // Fun default name
  const matchId = await createMatchHelper({ player1Id, player1Name })
  router.push(`/lobby/${matchId}`)
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