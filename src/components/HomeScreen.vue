<template>
  <div class="home-screen min-h-screen flex flex-col items-center justify-center p-2">
    <div class="w-full max-w-lg mx-auto">
      <div class="text-center">
        <h1 v-if="playerName" class="text-3xl font-extrabold text-secondary tracking-tight mb-1">Welcome, {{ playerName }}!</h1>
        <h1 v-else class="text-3xl font-extrabold text-secondary tracking-tight mb-1">Welcome to</h1>
        <img src="@/assets/dots2squares-logo.png" alt="Dots 2 Squares Logo" class="mx-auto mb-2 w-64 sm:w-72 md:w-80 lg:w-96 h-auto" />
        <p class="text-base text-muted mb-4">The classic pencil-and-paper game, reimagined.</p>
     </div>
      
      <div class="card mt-4">
        <div class="space-y-4">
          <button @click="playWithFriend" class="btn btn-primary w-full text-lg py-3">
            👥 Play vs. a Friend
          </button>
          <button @click="playWithAI" class="btn btn-secondary w-full text-lg py-3">
            🤖 Practice vs. AI
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const playerName = ref<string | null>(null)

onMounted(() => {
  playerName.value = localStorage.getItem('dots2squares_playerName')
})

const playWithFriend = () => {
  router.push('/create-game')
}

const playWithAI = () => {
  router.push('/create-ai-game')
}
</script>

<style scoped>
/* Add any necessary styles back here */
.home-screen {
  background-color: #f0f2f5; /* Or your preferred background */
}

.text-secondary {
  color: #333;
}

.text-muted {
  color: #666;
}

.card {
  background-color: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #f97316; /* Orange */
  color: white;
}
.btn-primary:hover {
  background-color: #ea580c;
}

.btn-secondary {
  background-color: #e5e7eb; /* Light Gray */
  color: #374151;
}
.btn-secondary:hover {
  background-color: #d1d5db;
}
</style> 