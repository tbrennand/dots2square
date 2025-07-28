<template>
  <div class="game-invite-container">
    <div class="invite-card">
      <img src="@/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="logo" />
      <h1 class="title">You're Invited to Play!</h1>
      <p class="subtitle">Enter your name to join the match hosted by {{ hostName }}.</p>

      <div class="input-group">
        <input 
          v-model="playerName" 
          placeholder="Your Name" 
          class="name-input"
          @keyup.enter="acceptInvite"
        />
      </div>

      <div class="actions">
        <button 
          @click="acceptInvite" 
          :disabled="!canAccept"
          class="btn-accept"
        >
          <span v-if="isJoining" class="spinner"></span>
          {{ isJoining ? 'Joining...' : 'Accept & Join' }}
        </button>
        <button @click="declineInvite" class="btn-decline">
          Decline
        </button>
      </div>

      <div class="chat-section">
        <h3 class="chat-title">Chat with Host</h3>
        <Chat 
          v-if="matchId" 
          :matchId="matchId" 
          :currentPlayerName="playerName || 'Guest'"
          :isHostChat="true"
        />
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

const matchId = ref('')
const playerName = ref('')
const isJoining = ref(false)

const matchData = computed(() => matchStore.matchData)
const hostName = computed(() => matchData.value?.player1?.name || 'the host')
const canAccept = computed(() => playerName.value.trim().length > 2 && !isJoining.value)

const acceptInvite = async () => {
  if (!canAccept.value) return
  isJoining.value = true
  try {
    const playerId = 'user-' + Math.random().toString(36).substring(2, 8)
    await joinMatch(matchId.value, playerId, playerName.value.trim())
    router.push(`/lobby/${matchId.value}?playerId=${playerId}`)
  } catch (error) {
    console.error('Failed to join match:', error)
    // Here you could show an error message to the user
  } finally {
    isJoining.value = false
  }
}

const declineInvite = () => {
  router.push('/')
}

onMounted(() => {
  matchId.value = route.params.id as string
  if (matchId.value) {
    matchStore.subscribeToMatchById(matchId.value)
  }
})
</script>

<style scoped>
.game-invite-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f3f4f6;
  padding: 1rem;
}

.invite-card {
  width: 100%;
  max-width: 400px;
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.logo {
  width: 120px;
  margin: 0 auto 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.subtitle {
  color: #6b7280;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.name-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-accept, .btn-decline {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
  border: none;
}

.btn-accept {
  background-color: #f97316;
  color: white;
}

.btn-accept:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-decline {
  background-color: #e5e7eb;
  color: #374151;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

.chat-section {
  text-align: left;
}

.chat-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 