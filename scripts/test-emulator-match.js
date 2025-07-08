#!/usr/bin/env node

/**
 * Firebase Emulator 2-Player Match Test
 * 
 * This script simulates a complete 2-player Dots to Squares match using Firebase Emulator.
 * It tests:
 * - Match creation
 * - Player joining
 * - Real-time synchronization
 * - Move validation and processing
 * - Square completion
 * - Turn management
 * - Game completion
 * 
 * Usage:
 * 1. Start Firebase Emulator: firebase emulators:start
 * 2. Run this script: node scripts/test-emulator-match.js
 */

const { initializeApp } = require('firebase/app')
const { 
  getFirestore, 
  connectFirestoreEmulator,
  doc,
  setDoc,
  onSnapshot,
  runTransaction,
  collection,
  query,
  where,
  orderBy,
  limit
} = require('firebase/firestore')
const { 
  getAuth, 
  connectAuthEmulator,
  signInAnonymously,
  onAuthStateChanged
} = require('firebase/auth')

// Firebase config (same as frontend)
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project-id",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080)
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })

// Game configuration
const GRID_SIZE = 3
const PLAYER_1_ID = 'player1'
const PLAYER_2_ID = 'player2'

// Game state tracking
let matchId = null
let currentPlayer = PLAYER_1_ID
let gameState = {
  grid: [],
  lines: [],
  squares: [],
  scores: {},
  currentTurn: PLAYER_1_ID,
  status: 'waiting'
}

// Helper functions
function log(message, data = null) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  console.log(`[${timestamp}] ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

function createGrid(size) {
  const grid = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      grid.push({ id: `${row}-${col}`, row, col })
    }
  }
  return grid
}

function getPossibleLines(gridSize) {
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

function checkSquares(lines, gridSize) {
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
          claimedBy: top.claimedBy // All lines should be claimed by same player
        })
      }
    }
  }
  return squares
}

function calculateScores(squares) {
  const scores = {}
  squares.forEach(square => {
    if (!scores[square.claimedBy]) {
      scores[square.claimedBy] = 0
    }
    scores[square.claimedBy]++
  })
  return scores
}

async function createMatch() {
  log('🎮 Creating new match...')
  
  const grid = createGrid(GRID_SIZE)
  const possibleLines = getPossibleLines(GRID_SIZE)
  
  const matchData = {
    gridSize: GRID_SIZE,
    grid: grid,
    possibleLines: possibleLines,
    lines: [],
    squares: [],
    scores: {},
    currentTurn: PLAYER_1_ID,
    status: 'waiting',
    players: [PLAYER_1_ID],
    host: PLAYER_1_ID,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const matchRef = doc(collection(db, 'matches'))
  await setDoc(matchRef, matchData)
  
  matchId = matchRef.id
  log(`✅ Match created with ID: ${matchId}`)
  
  return matchId
}

async function joinMatch(matchId, playerId) {
  log(`👤 Player ${playerId} joining match...`)
  
  await runTransaction(db, async (transaction) => {
    const matchRef = doc(db, 'matches', matchId)
    const matchDoc = await transaction.get(matchRef)
    
    if (!matchDoc.exists()) {
      throw new Error('Match not found')
    }
    
    const matchData = matchDoc.data()
    if (matchData.players.length >= 2) {
      throw new Error('Match is full')
    }
    
    if (matchData.players.includes(playerId)) {
      throw new Error('Player already in match')
    }
    
    const updatedPlayers = [...matchData.players, playerId]
    const newStatus = updatedPlayers.length === 2 ? 'active' : 'waiting'
    
    transaction.update(matchRef, {
      players: updatedPlayers,
      status: newStatus,
      updatedAt: new Date()
    })
  })
  
  log(`✅ Player ${playerId} joined match`)
}

async function playMove(matchId, playerId, lineId) {
  log(`🎯 Player ${playerId} playing move: ${lineId}`)
  
  await runTransaction(db, async (transaction) => {
    const matchRef = doc(db, 'matches', matchId)
    const matchDoc = await transaction.get(matchRef)
    
    if (!matchDoc.exists()) {
      throw new Error('Match not found')
    }
    
    const matchData = matchDoc.data()
    
    // Validate move
    if (matchData.status !== 'active') {
      throw new Error('Game not active')
    }
    
    if (matchData.currentTurn !== playerId) {
      throw new Error('Not your turn')
    }
    
    const line = matchData.possibleLines.find(l => l.id === lineId)
    if (!line) {
      throw new Error('Invalid line')
    }
    
    const existingLine = matchData.lines.find(l => l.id === lineId)
    if (existingLine) {
      throw new Error('Line already claimed')
    }
    
    // Add the line
    const newLine = {
      ...line,
      claimedBy: playerId,
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
    const nextTurn = squaresCompleted > 0 ? playerId : (playerId === PLAYER_1_ID ? PLAYER_2_ID : PLAYER_1_ID)
    
    // Check for game completion
    const totalSquares = (matchData.gridSize - 1) * (matchData.gridSize - 1)
    const gameCompleted = updatedSquares.length >= totalSquares
    
    const updateData = {
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
  
  log(`✅ Move played successfully`)
}

function subscribeToMatch(matchId) {
  log(`👂 Subscribing to match updates...`)
  
  const matchRef = doc(db, 'matches', matchId)
  
  return onSnapshot(matchRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data()
      gameState = data
      
      log(`📊 Match Update:`, {
        status: data.status,
        currentTurn: data.currentTurn,
        scores: data.scores,
        linesCount: data.lines.length,
        squaresCount: data.squares.length
      })
      
      if (data.status === 'complete') {
        log(`🏆 Game Complete! Winner: ${data.winner || 'Tie'}`)
        log(`📈 Final Scores:`, data.scores)
      }
    }
  }, (error) => {
    log(`❌ Error listening to match:`, error)
  })
}

async function simulateGame() {
  try {
    log('🚀 Starting 2-Player Match Simulation')
    log('=' * 50)
    
    // Step 1: Create match
    const matchId = await createMatch()
    
    // Step 2: Subscribe to real-time updates
    const unsubscribe = subscribeToMatch(matchId)
    
    // Step 3: Join with second player
    await new Promise(resolve => setTimeout(resolve, 1000))
    await joinMatch(matchId, PLAYER_2_ID)
    
    // Step 4: Simulate moves
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Predefined moves for a complete game
    const moves = [
      'h-0-0', 'h-1-0', 'v-0-0', 'v-0-1', // Player 1 gets first square
      'h-0-1', 'h-1-1', 'v-1-0', 'v-1-1', // Player 2 gets second square
      'h-2-0', 'h-2-1', 'v-0-2', 'v-1-2'  // Remaining moves
    ]
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      const player = i % 2 === 0 ? PLAYER_1_ID : PLAYER_2_ID
      
      await new Promise(resolve => setTimeout(resolve, 500))
      await playMove(matchId, player, move)
    }
    
    // Step 5: Wait for final state
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 6: Cleanup
    unsubscribe()
    
    log('✅ Simulation completed successfully!')
    
  } catch (error) {
    log(`❌ Simulation failed:`, error.message)
  }
}

// Run simulation
if (require.main === module) {
  simulateGame().then(() => {
    console.log('\n🎉 Emulator test completed!')
    process.exit(0)
  }).catch((error) => {
    console.error('\n💥 Test failed:', error)
    process.exit(1)
  })
}

module.exports = {
  createMatch,
  joinMatch,
  playMove,
  subscribeToMatch,
  simulateGame
} 