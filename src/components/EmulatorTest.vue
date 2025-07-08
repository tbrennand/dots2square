<template>
  <div class="emulator-test p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Firebase Emulator Test</h1>
    
    <!-- Connection Status -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-2">
        <div :class="connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'" 
             class="w-3 h-3 rounded-full"></div>
        <span class="font-semibold">Emulator Status: {{ connectionStatus }}</span>
      </div>
      <p class="text-sm text-gray-600">
        Firebase Emulator should be running on localhost:8080 (Firestore) and localhost:9099 (Auth)
      </p>
    </div>

    <!-- Test Controls -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Match Management -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Match Management</h2>
        
        <div class="space-y-3">
          <button 
            @click="createTestMatch"
            :disabled="loading"
            class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
            {{ loading ? 'Creating...' : 'Create Test Match' }}
          </button>
          
          <div v-if="matchId" class="text-sm">
            <strong>Match ID:</strong> {{ matchId }}
          </div>
          
          <button 
            @click="joinAsPlayer2"
            :disabled="!matchId || loading"
            class="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50">
            Join as Player 2
          </button>
        </div>
      </div>

      <!-- Game Actions -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Game Actions</h2>
        
        <div class="space-y-3">
          <div class="flex gap-2">
            <select v-model="selectedPlayer" class="flex-1 px-3 py-2 border rounded">
              <option value="player1">Player 1</option>
              <option value="player2">Player 2</option>
            </select>
            <select v-model="selectedMove" class="flex-1 px-3 py-2 border rounded">
              <option value="">Select Move</option>
              <option v-for="move in availableMoves" :key="move.id" :value="move.id">
                {{ move.id }}
              </option>
            </select>
          </div>
          
          <button 
            @click="playMove"
            :disabled="!selectedMove || loading"
            class="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50">
            Play Move
          </button>
          
          <button 
            @click="runFullSimulation"
            :disabled="loading"
            class="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50">
            Run Full Simulation
          </button>
        </div>
      </div>
    </div>

    <!-- Game State Display -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Current State -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-3">Current State</h3>
        <div class="space-y-2 text-sm">
          <div><strong>Status:</strong> {{ gameState.status }}</div>
          <div><strong>Current Turn:</strong> {{ gameState.currentTurn }}</div>
          <div><strong>Lines Drawn:</strong> {{ gameState.lines?.length || 0 }}</div>
          <div><strong>Squares Completed:</strong> {{ gameState.squares?.length || 0 }}</div>
          <div v-if="gameState.winner"><strong>Winner:</strong> {{ gameState.winner }}</div>
        </div>
      </div>

      <!-- Scores -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-3">Scores</h3>
        <div class="space-y-2">
          <div v-for="(score, player) in gameState.scores" :key="player" 
               class="flex justify-between">
            <span>{{ player }}:</span>
            <span class="font-semibold">{{ score }}</span>
          </div>
          <div v-if="!gameState.scores || Object.keys(gameState.scores).length === 0" 
               class="text-gray-500">
            No scores yet
          </div>
        </div>
      </div>

      <!-- Recent Moves -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-3">Recent Moves</h3>
        <div class="space-y-1 text-sm max-h-32 overflow-y-auto">
          <div v-for="move in recentMoves" :key="move.id" 
               class="flex justify-between">
            <span>{{ move.player }}:</span>
            <span class="font-mono">{{ move.lineId }}</span>
          </div>
          <div v-if="recentMoves.length === 0" class="text-gray-500">
            No moves yet
          </div>
        </div>
      </div>
    </div>

    <!-- Log Output -->
    <div class="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
      <div v-for="(log, index) in logs" :key="index" class="mb-1">
        <span class="text-gray-500">[{{ log.timestamp }}]</span> {{ log.message }}
      </div>
      <div v-if="logs.length === 0" class="text-gray-600">
        No logs yet...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { db } from '@/firebase'
import { doc, setDoc, onSnapshot, runTransaction, collection } from 'firebase/firestore'

// Reactive state
const connectionStatus = ref('checking')
const loading = ref(false)
const matchId = ref('')
const selectedPlayer = ref('player1')
const selectedMove = ref('')
interface GameState {
  status: string
  currentTurn: string
  lines: any[]
  squares: any[]
  scores: Record<string, number>
  winner?: string | null
}

const gameState = ref<GameState>({
  status: 'waiting',
  currentTurn: 'player1',
  lines: [],
  squares: [],
  scores: {},
  winner: null
})
const recentMoves = ref<Array<{id: string, player: string, lineId: string}>>([])
const logs = ref<Array<{timestamp: string, message: string}>>([])

// Available moves for 3x3 grid
const availableMoves = computed(() => {
  const moves = []
  // Horizontal lines
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      moves.push({
        id: `h-${row}-${col}`,
        type: 'horizontal',
        start: `${row}-${col}`,
        end: `${row}-${col + 1}`
      })
    }
  }
  // Vertical lines
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      moves.push({
        id: `v-${row}-${col}`,
        type: 'vertical',
        start: `${row}-${col}`,
        end: `${row + 1}-${col}`
      })
    }
  }
  return moves.filter(move => 
    !gameState.value.lines?.some(line => line.id === move.id)
  )
})

// Helper functions
function addLog(message: string) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  logs.value.push({ timestamp, message })
  if (logs.value.length > 100) {
    logs.value.shift()
  }
}

function createGrid(size: number) {
  const grid = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      grid.push({ id: `${row}-${col}`, row, col })
    }
  }
  return grid
}

function getPossibleLines(gridSize: number) {
  const lines = []
  // Horizontal lines
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize - 1; col++) {
      lines.push({
        id: `h-${row}-${col}`,
        type: 'horizontal',
        start: `${row}-${col}`,
        end: `${row}-${col + 1}`,
        row,
        col
      })
    }
  }
  // Vertical lines
  for (let row = 0; row < gridSize - 1; row++) {
    for (let col = 0; col < gridSize; col++) {
      lines.push({
        id: `v-${row}-${col}`,
        type: 'vertical',
        start: `${row}-${col}`,
        end: `${row + 1}-${col}`,
        row,
        col
      })
    }
  }
  return lines
}

function checkSquares(lines: any[], gridSize: number) {
  const squares = []
  for (let row = 0; row < gridSize - 1; row++) {
    for (let col = 0; col < gridSize - 1; col++) {
      const top = lines.find(l => l.id === `h-${row}-${col}` && l.claimedBy)
      const bottom = lines.find(l => l.id === `h-${row + 1}-${col}` && l.claimedBy)
      const left = lines.find(l => l.id === `v-${row}-${col}` && l.claimedBy)
      const right = lines.find(l => l.id === `v-${row}-${col + 1}` && l.claimedBy)
      
      if (top && bottom && left && right) {
        squares.push({
          id: `${row}-${col}`,
          row,
          col,
          lines: [top.id, bottom.id, left.id, right.id],
          claimedBy: top.claimedBy
        })
      }
    }
  }
  return squares
}

function calculateScores(squares: any[]) {
  const scores: Record<string, number> = {}
  squares.forEach(square => {
    if (!scores[square.claimedBy]) {
      scores[square.claimedBy] = 0
    }
    scores[square.claimedBy]++
  })
  return scores
}

// Actions
async function createTestMatch() {
  loading.value = true
  addLog('🎮 Creating test match...')
  
  try {
    const grid = createGrid(3)
    const possibleLines = getPossibleLines(3)
    
    const matchData = {
      gridSize: 3,
      grid: grid,
      possibleLines: possibleLines,
      lines: [],
      squares: [],
      scores: {},
      currentTurn: 'player1',
      status: 'waiting',
      players: ['player1'],
      host: 'player1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const matchRef = doc(collection(db, 'matches'))
    await setDoc(matchRef, matchData)
    
    matchId.value = matchRef.id
    addLog(`✅ Match created with ID: ${matchId.value}`)
    
  } catch (error) {
    addLog(`❌ Failed to create match: ${error}`)
  } finally {
    loading.value = false
  }
}

async function joinAsPlayer2() {
  if (!matchId.value) return
  
  loading.value = true
  addLog('👤 Player 2 joining match...')
  
  try {
    await runTransaction(db, async (transaction) => {
      const matchRef = doc(db, 'matches', matchId.value)
      const matchDoc = await transaction.get(matchRef)
      
      if (!matchDoc.exists()) {
        throw new Error('Match not found')
      }
      
      const matchData = matchDoc.data()
      if (matchData.players.length >= 2) {
        throw new Error('Match is full')
      }
      
      const updatedPlayers = [...matchData.players, 'player2']
      const newStatus = updatedPlayers.length === 2 ? 'active' : 'waiting'
      
      transaction.update(matchRef, {
        players: updatedPlayers,
        status: newStatus,
        updatedAt: new Date()
      })
    })
    
    addLog('✅ Player 2 joined match')
    
  } catch (error) {
    addLog(`❌ Failed to join match: ${error}`)
  } finally {
    loading.value = false
  }
}

async function playMove() {
  if (!matchId.value || !selectedMove.value) return
  
  loading.value = true
  addLog(`🎯 ${selectedPlayer.value} playing move: ${selectedMove.value}`)
  
  try {
    await runTransaction(db, async (transaction) => {
      const matchRef = doc(db, 'matches', matchId.value)
      const matchDoc = await transaction.get(matchRef)
      
      if (!matchDoc.exists()) {
        throw new Error('Match not found')
      }
      
      const matchData = matchDoc.data()
      
      // Validate move
      if (matchData.status !== 'active') {
        throw new Error('Game not active')
      }
      
      if (matchData.currentTurn !== selectedPlayer.value) {
        throw new Error('Not your turn')
      }
      
      const line = matchData.possibleLines.find((l: any) => l.id === selectedMove.value)
      if (!line) {
        throw new Error('Invalid line')
      }
      
      const existingLine = matchData.lines.find((l: any) => l.id === selectedMove.value)
      if (existingLine) {
        throw new Error('Line already claimed')
      }
      
      // Add the line
      const newLine = {
        ...line,
        claimedBy: selectedPlayer.value,
        claimedAt: new Date()
      }
      
      const updatedLines = [...matchData.lines, newLine]
      
      // Check for squares
      const newSquares = checkSquares(updatedLines, matchData.gridSize)
      const updatedSquares = [...matchData.squares, ...newSquares]
      
      // Calculate scores
      const updatedScores = calculateScores(updatedSquares)
      
      // Determine next turn
      const squaresCompleted = newSquares.length
      const nextTurn = squaresCompleted > 0 ? selectedPlayer.value : 
        (selectedPlayer.value === 'player1' ? 'player2' : 'player1')
      
      // Check for game completion
      const totalSquares = (matchData.gridSize - 1) * (matchData.gridSize - 1)
      const gameCompleted = updatedSquares.length >= totalSquares
      
      const updateData: any = {
        lines: updatedLines,
        squares: updatedSquares,
        scores: updatedScores,
        currentTurn: nextTurn,
        updatedAt: new Date()
      }
      
      if (gameCompleted) {
        updateData.status = 'complete'
        updateData.winner = Object.keys(updatedScores).reduce((a, b) => 
          updatedScores[a] > updatedScores[b] ? a : b
        )
      }
      
      transaction.update(matchRef, updateData)
    })
    
    // Add to recent moves
    recentMoves.value.unshift({
      id: Date.now().toString(),
      player: selectedPlayer.value,
      lineId: selectedMove.value
    })
    if (recentMoves.value.length > 10) {
      recentMoves.value.pop()
    }
    
    selectedMove.value = ''
    addLog('✅ Move played successfully')
    
  } catch (error) {
    addLog(`❌ Failed to play move: ${error}`)
  } finally {
    loading.value = false
  }
}

async function runFullSimulation() {
  loading.value = true
  addLog('🚀 Starting full simulation...')
  
  try {
    // Create match
    await createTestMatch()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Join as player 2
    await joinAsPlayer2()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Predefined moves for complete game
    const moves = [
      'h-0-0', 'h-1-0', 'v-0-0', 'v-0-1', // Player 1 gets first square
      'h-0-1', 'h-1-1', 'v-1-0', 'v-1-1', // Player 2 gets second square
      'h-2-0', 'h-2-1', 'v-0-2', 'v-1-2'  // Remaining moves
    ]
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      const player = i % 2 === 0 ? 'player1' : 'player2'
      
      selectedPlayer.value = player
      selectedMove.value = move
      
      await new Promise(resolve => setTimeout(resolve, 300))
      await playMove()
    }
    
    addLog('✅ Full simulation completed!')
    
  } catch (error) {
    addLog(`❌ Simulation failed: ${error}`)
  } finally {
    loading.value = false
  }
}

// Subscription management
let unsubscribe: (() => void) | null = null

function subscribeToMatch() {
  if (!matchId.value) return
  
  addLog('👂 Subscribing to match updates...')
  
  const matchRef = doc(db, 'matches', matchId.value)
  unsubscribe = onSnapshot(matchRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data() as GameState
      gameState.value = data
      
      addLog(`📊 Match Update: Status=${data.status}, Turn=${data.currentTurn}, Lines=${data.lines?.length || 0}, Squares=${data.squares?.length || 0}`)
      
      if (data.status === 'complete') {
        addLog(`🏆 Game Complete! Winner: ${data.winner || 'Tie'}`)
      }
    }
  }, (error) => {
    addLog(`❌ Error listening to match: ${error}`)
  })
}

// Lifecycle
onMounted(() => {
  // Check emulator connection
  addLog('🔍 Checking Firebase Emulator connection...')
  
  // Simple connection test
  const testRef = doc(db, 'test', 'connection')
  setDoc(testRef, { timestamp: new Date() })
    .then(() => {
      connectionStatus.value = 'connected'
      addLog('✅ Connected to Firebase Emulator')
    })
    .catch((error) => {
      connectionStatus.value = 'disconnected'
      addLog(`❌ Failed to connect to Firebase Emulator: ${error}`)
    })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// Watch for matchId changes to subscribe
watch(matchId, (newMatchId) => {
  if (newMatchId) {
    subscribeToMatch()
  }
})
</script>

<style scoped>
.emulator-test {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style> 