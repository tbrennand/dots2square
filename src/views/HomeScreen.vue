<template>
  <div class="home-screen">
    <div class="hero-section">
      <h1 class="title">Dots to Squares</h1>
      <p class="subtitle">The classic strategy game, reimagined for the web</p>
    </div>
    
    <div class="action-buttons">
      <button @click="startGame" class="btn btn-primary">
        <span class="btn-icon">🎮</span>
        Play Game
      </button>
      <button @click="joinGame" class="btn btn-secondary">
        <span class="btn-icon">👥</span>
        Join Game
      </button>
    </div>
    
    <div class="game-info">
      <h3>How to Play</h3>
      <ul>
        <li>Click on dots to draw lines between them</li>
        <li>Complete squares to score points</li>
        <li>Get an extra turn when you complete a square</li>
        <li>Player with the most squares wins!</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const startGame = () => {
  router.push('/game')
}

const joinGame = () => {
  // For now, just start a new game
  // Later this will navigate to lobby
  router.push('/game')
}
</script>

<style scoped>
.home-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.hero-section {
  margin-bottom: 3rem;
}

.title {
  font-size: 4rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary {
  background: #22c55e;
  color: white;
}

.btn-primary:hover {
  background: #16a34a;
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(255, 255, 255, 0.2);
}

.btn-icon {
  font-size: 1.2rem;
}

.game-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 500px;
}

.game-info h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.game-info ul {
  text-align: left;
  margin: 0;
  padding-left: 1.5rem;
}

.game-info li {
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .title {
    font-size: 2.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 