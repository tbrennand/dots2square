<template>
  <div class="gameresult-example">
    <h2>GameResult Component Examples</h2>
    
    <!-- Example 1: Player 1 Wins -->
    <div class="example-section">
      <h3>Player 1 Wins</h3>
      <div class="example-container">
        <GameResult />
      </div>
      <div class="example-info">
        <p><strong>URL:</strong> <code>/result?matchId=abc123&winner=1</code></p>
        <p><strong>Scenario:</strong> Player 1 wins with 6 squares vs Player 2 with 4 squares</p>
      </div>
    </div>
    
    <!-- Example 2: Tie Game -->
    <div class="example-section">
      <h3>Tie Game</h3>
      <div class="example-container">
        <GameResult />
      </div>
      <div class="example-info">
        <p><strong>URL:</strong> <code>/result?matchId=def456&winner=tie</code></p>
        <p><strong>Scenario:</strong> Both players end with 5 squares each</p>
      </div>
    </div>
    
    <!-- Example 3: Player 2 Wins -->
    <div class="example-section">
      <h3>Player 2 Wins</h3>
      <div class="example-container">
        <GameResult />
      </div>
      <div class="example-info">
        <p><strong>URL:</strong> <code>/result?matchId=ghi789&winner=2</code></p>
        <p><strong>Scenario:</strong> Player 2 wins with 7 squares vs Player 1 with 3 squares</p>
      </div>
    </div>
    
    <!-- Example 4: No Winner -->
    <div class="example-section">
      <h3>No Winner (Game Cancelled)</h3>
      <div class="example-container">
        <GameResult />
      </div>
      <div class="example-info">
        <p><strong>URL:</strong> <code>/result?matchId=jkl012</code></p>
        <p><strong>Scenario:</strong> Game was cancelled or ended without a clear winner</p>
      </div>
    </div>
    
    <!-- Navigation Examples -->
    <div class="navigation-examples">
      <h3>Navigation Examples</h3>
      <div class="nav-buttons">
        <button @click="navigateToWinner" class="nav-btn">
          Navigate to Winner Example
        </button>
        <button @click="navigateToTie" class="nav-btn">
          Navigate to Tie Example
        </button>
        <button @click="navigateToNoWinner" class="nav-btn">
          Navigate to No Winner Example
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import GameResult from '../views/GameResult.vue'

const router = useRouter()

// Navigation functions
const navigateToWinner = () => {
  router.push({
    name: 'GameResult',
    query: {
      matchId: 'example-winner-123',
      winner: '1'
    }
  })
}

const navigateToTie = () => {
  router.push({
    name: 'GameResult',
    query: {
      matchId: 'example-tie-456',
      winner: 'tie'
    }
  })
}

const navigateToNoWinner = () => {
  router.push({
    name: 'GameResult',
    query: {
      matchId: 'example-no-winner-789'
    }
  })
}
</script>

<style scoped>
.gameresult-example {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.gameresult-example h2 {
  text-align: center;
  color: #1f2937;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 700;
}

.example-section {
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.example-section h3 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.example-container {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f9fafb;
}

.example-info {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #3b82f6;
}

.example-info p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.example-info code {
  background: #e5e7eb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.8rem;
}

.navigation-examples {
  margin-top: 3rem;
  padding: 2rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

.navigation-examples h3 {
  color: #374151;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Responsive design */
@media (max-width: 768px) {
  .gameresult-example {
    padding: 1rem;
  }
  
  .nav-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .nav-btn {
    width: 100%;
    max-width: 300px;
  }
}
</style> 