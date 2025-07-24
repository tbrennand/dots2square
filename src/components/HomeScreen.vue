<template>
  <div class="home-screen">
    <div class="hero-section">
      <img src="@/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="game-logo" />
      <h1 class="game-title">🎮 Dots to Squares</h1>
      <p class="game-description">
        Connect the dots, claim the squares, and outsmart your opponent in this classic strategy game!
      </p>
    </div>

    <div class="action-buttons">
      <div class="name-input">
        <label for="playerName">Your Name:</label>
        <input id="playerName" v-model="playerName" type="text" placeholder="Enter your name..." />
      </div>
      <button @click="createMatch" class="action-btn create-btn">
        <span class="btn-icon">🎯</span>
        <span class="btn-text">Create Match</span>
        <span class="btn-subtitle">Start a new game</span>
      </button>
      
      <button @click="joinMatch" class="action-btn join-btn">
        <span class="btn-icon">🔗</span>
        <span class="btn-text">Join Match</span>
        <span class="btn-subtitle">Enter match code</span>
      </button>
      
      <button @click="playLocal" class="action-btn local-btn">
        <span class="btn-icon">🏠</span>
        <span class="btn-text">Local Game</span>
        <span class="btn-subtitle">Play offline</span>
      </button>
    </div>

    <div class="game-info">
      <h3>How to Play</h3>
      <div class="rules">
        <div class="rule">
          <span class="rule-number">1</span>
          <span class="rule-text">Players take turns connecting adjacent dots with lines</span>
        </div>
        <div class="rule">
          <span class="rule-number">2</span>
          <span class="rule-text">Complete a square to claim it and earn a point</span>
        </div>
        <div class="rule">
          <span class="rule-number">3</span>
          <span class="rule-text">When you complete a square, you get another turn</span>
        </div>
        <div class="rule">
          <span class="rule-number">4</span>
          <span class="rule-text">The player with the most squares wins!</span>
        </div>
      </div>
    </div>

    <!-- Join Match Modal -->
    <div v-if="showJoinModal" class="modal-overlay" @click="closeJoinModal">
      <div class="modal" @click.stop>
        <h3>Join a Match</h3>
        <div class="input-group">
          <label for="matchCode">Match Code:</label>
          <input 
            id="matchCode" 
            v-model="matchCode" 
            type="text" 
            placeholder="Enter match code..."
            @keyup.enter="submitJoinMatch"
          />
        </div>
        <div class="modal-actions">
          <button @click="submitJoinMatch" :disabled="!matchCode" class="submit-btn">
            Join Match
          </button>
          <button @click="closeJoinModal" class="cancel-btn">
            Cancel
          </button>
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
  // Replace with actual user info as needed
  const player1Id = 'player1-' + Math.random().toString(36).substring(2, 8)
  const player1Name = playerName.value.trim() || 'Player 1'

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
    router.push(`/match/${matchCode.value.trim()}`)
  }
}

const playLocal = () => {
  router.push('/game')
}
</script>

<style scoped>
.home-screen {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.hero-section {
  margin-bottom: 3rem;
}

.game-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: primary;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.game-description {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.game-logo {
  max-width: 300px;
  margin: 0 auto 1.5rem auto;
  display: block;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.btn-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.btn-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.btn-subtitle {
  font-size: 0.9rem;
  color: #6b7280;
}

.create-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.create-btn .btn-text,
.create-btn .btn-subtitle {
  color: white;
}

.join-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.join-btn .btn-text,
.join-btn .btn-subtitle {
  color: white;
}

.local-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.local-btn .btn-text,
.local-btn .btn-subtitle {
  color: white;
}

.game-info {
  background: #f8fafc;
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid #e2e8f0;
}

.game-info h3 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

.rules {
  display: grid;
  gap: 1rem;
}

.rule {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.rule-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.9rem;
}

.rule-text {
  color: #374151;
  font-size: 1rem;
}

.name-input {
  margin-bottom: 1rem;
}

.name-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.name-input input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.submit-btn, .cancel-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn {
  background: #3b82f6;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

@media (max-width: 640px) {
  .home-screen {
    padding: 1rem;
  }
  
  .game-title {
    font-size: 2.5rem;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style> 