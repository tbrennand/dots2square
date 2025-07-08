<template>
  <div class="matchlobby-example">
    <h2>MatchLobby Component Examples</h2>
    
    <!-- Example 1: Host View -->
    <div class="example-section">
      <h3>Host View - Waiting for Player</h3>
      <div class="example-container">
        <MatchLobby />
      </div>
      <div class="example-info">
        <p><strong>Scenario:</strong> Host created match, waiting for second player to join</p>
        <p><strong>Features:</strong> Host controls, player list, ready system</p>
      </div>
    </div>
    
    <!-- Example 2: Player View -->
    <div class="example-section">
      <h3>Player View - Joining Match</h3>
      <div class="example-container">
        <MatchLobby />
      </div>
      <div class="example-info">
        <p><strong>Scenario:</strong> Player joining an existing match</p>
        <p><strong>Features:</strong> Ready toggle, chat, leave match</p>
      </div>
    </div>
    
    <!-- Example 3: Both Players Ready -->
    <div class="example-section">
      <h3>Both Players Ready</h3>
      <div class="example-container">
        <MatchLobby />
      </div>
      <div class="example-info">
        <p><strong>Scenario:</strong> Both players marked as ready, host can start game</p>
        <p><strong>Features:</strong> Start game enabled, ready indicators</p>
      </div>
    </div>
    
    <!-- Example 4: Full Lobby -->
    <div class="example-section">
      <h3>Full Lobby (4 Players)</h3>
      <div class="example-container">
        <MatchLobby />
      </div>
      <div class="example-info">
        <p><strong>Scenario:</strong> 4-player match with all slots filled</p>
        <p><strong>Features:</strong> Multiple players, kick functionality</p>
      </div>
    </div>
    
    <!-- Navigation Examples -->
    <div class="navigation-examples">
      <h3>Navigation Examples</h3>
      <div class="nav-buttons">
        <button @click="navigateToHostView" class="nav-btn">
          Host View
        </button>
        <button @click="navigateToPlayerView" class="nav-btn">
          Player View
        </button>
        <button @click="navigateToReadyView" class="nav-btn">
          Ready View
        </button>
        <button @click="navigateToFullLobby" class="nav-btn">
          Full Lobby
        </button>
      </div>
    </div>
    
    <!-- Feature Demonstrations -->
    <div class="feature-demos">
      <h3>Feature Demonstrations</h3>
      
      <div class="feature-grid">
        <div class="feature-card">
          <h4>Player Management</h4>
          <ul>
            <li>Show joined players with avatars</li>
            <li>Host identification with crown icon</li>
            <li>Current player highlighting</li>
            <li>Empty slot indicators</li>
            <li>Player kicking (host only)</li>
          </ul>
        </div>
        
        <div class="feature-card">
          <h4>Ready System</h4>
          <ul>
            <li>Ready/Not Ready toggle</li>
            <li>Visual ready indicators</li>
            <li>Start game when all ready</li>
            <li>Real-time status updates</li>
            <li>Host controls</li>
          </ul>
        </div>
        
        <div class="feature-card">
          <h4>Firebase Presence</h4>
          <ul>
            <li>Online/Offline status</li>
            <li>Ready status tracking</li>
            <li>Real-time synchronization</li>
            <li>Presence indicators</li>
            <li>Connection management</li>
          </ul>
        </div>
        
        <div class="feature-card">
          <h4>Chat System</h4>
          <ul>
            <li>Real-time lobby chat</li>
            <li>Message history</li>
            <li>Timestamps</li>
            <li>Auto-scroll to new messages</li>
            <li>Player identification</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import MatchLobby from './MatchLobby.vue'

const router = useRouter()

// Navigation functions
const navigateToHostView = () => {
  router.push({
    name: 'MatchLobby',
    params: { id: 'host-example-123' }
  })
}

const navigateToPlayerView = () => {
  router.push({
    name: 'MatchLobby',
    params: { id: 'player-example-456' }
  })
}

const navigateToReadyView = () => {
  router.push({
    name: 'MatchLobby',
    params: { id: 'ready-example-789' }
  })
}

const navigateToFullLobby = () => {
  router.push({
    name: 'MatchLobby',
    params: { id: 'full-lobby-012' }
  })
}
</script>

<style scoped>
.matchlobby-example {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.matchlobby-example h2 {
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
  min-height: 400px;
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

.feature-demos {
  margin-top: 3rem;
}

.feature-demos h3 {
  color: #374151;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.feature-card h4 {
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.feature-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-card li {
  padding: 0.25rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  position: relative;
  padding-left: 1.5rem;
}

.feature-card li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

/* Responsive design */
@media (max-width: 768px) {
  .matchlobby-example {
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
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style> 