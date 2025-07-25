import { db } from './index'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export interface MatchData {
  player1: {
    id: string
    name: string
    joinedAt: Date
  }
  player2?: {
    id: string
    name: string
    joinedAt: Date
  }
  gridSize?: number
  status: 'waiting' | 'active' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  currentTurn?: number
  currentPlayerId?: string
  scores?: Record<number, number>
  gameOver?: boolean
  winner?: number | 'tie' | null
  // Additional metadata
  isPublic?: boolean
  maxPlayers?: number
  // Game state
  dots?: Array<{
    id: string
    x: number
    y: number
    connected: boolean
  }>
  squares?: Array<{
    id: string
    topLeftX: number
    topLeftY: number
    player?: number
    lines: string[]
  }>
  lines?: Array<{
    id: string
    startDot: string
    endDot: string
    player?: number
    drawnAt?: Date
  }>
  // Match settings
  settings?: {
    gridSize: number
    allowSpectators: boolean
    autoStart: boolean
    timeLimit: number | null
  }
  turnStartedAt?: any; // For Firebase serverTimestamp
  turnDuration?: number; // In seconds
  consecutiveMissedTurns?: { [key: string]: number };
  winnerId?: string | null;
  gameEndReason?: string | null;
}

export interface CreateMatchOptions {
  player1Id: string
  player1Name: string
  gridSize?: number
  isPublic?: boolean
  maxPlayers?: number
}

// Helper to remove undefined fields from an object (shallow)
function removeUndefined(obj: any) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

// Deep version to handle nested objects and arrays
function deepRemoveUndefined(value: any): any {
  if (value === undefined) return null;
  if (Array.isArray(value)) {
    return value.map(deepRemoveUndefined).filter(v => v !== undefined);
  }
  if (typeof value === 'object' && value !== null) {
    const cleaned: any = {};
    for (const [k, v] of Object.entries(value)) {
      const cleanedV = deepRemoveUndefined(v);
      if (cleanedV !== undefined) {
        cleaned[k] = cleanedV;
      }
    }
    return cleaned;
  }
  return value;
}

export async function createMatch(options: CreateMatchOptions): Promise<string> {
  console.log('createMatch called with options:', options); // Debug log
  try {
    const {
      player1Id,
      player1Name,
      gridSize = 5,
      isPublic = true,
      maxPlayers = 2
    } = options

    // Create initial grid state
    const totalDots = gridSize * gridSize
    const totalSquares = (gridSize - 1) * (gridSize - 1)
    
    // Initialize dots array
    const dots = []
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        dots.push({
          id: `${row}-${col}`,
          x: col,
          y: row,
          connected: false
        })
      }
    }

    // Initialize squares array
    const squares = []
    for (let row = 0; row < gridSize - 1; row++) {
      for (let col = 0; col < gridSize - 1; col++) {
        squares.push({
          id: `${row}-${col}`,
          topLeftX: col,
          topLeftY: row,
          player: undefined,
          lines: []
        })
      }
    }

    // Create match document
    const matchData: MatchData = {
      player1: {
        id: player1Id,
        name: player1Name,
        joinedAt: new Date()
      },
      gridSize,
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
      currentTurn: 1,
      currentPlayerId: player1Id,
      scores: { 1: 0, 2: 0 },
      gameOver: false,
      winner: null,
      // Additional metadata
      isPublic,
      maxPlayers,
      // Game state
      dots,
      squares,
      lines: [],
      // Match settings
      settings: {
        gridSize,
        allowSpectators: isPublic,
        autoStart: false,
        timeLimit: null // No time limit by default
      },
      // New fields for timer and forfeits
      turnStartedAt: serverTimestamp(),
      turnDuration: 30, // Default 30 seconds
      consecutiveMissedTurns: {
        [player1Id]: 0,
      },
      winnerId: null,
      gameEndReason: null,
    }

    // Add to Firestore
    const matchesRef = collection(db, 'matches')
    const cleanedData = deepRemoveUndefined(matchData);
    console.log('Cleaned match data:', cleanedData);
    const docRef = await addDoc(matchesRef, {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Match created successfully:', docRef.id); // Debug log
    return docRef.id
  } catch (error) {
    console.error('Error creating match:', error)
    throw new Error(`Failed to create match: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

import { doc, onSnapshot, Unsubscribe, runTransaction, writeBatch, increment } from 'firebase/firestore'

export function subscribeToMatch(
  matchId: string, 
  callback: (match: MatchData | null) => void
): Unsubscribe {
  try {
    console.log('Subscribing to match:', matchId)
    
    const matchRef = doc(db, 'matches', matchId)
    
    const unsubscribe = onSnapshot(
      matchRef,
      (doc) => {
        if (doc.exists()) {
          const matchData = doc.data() as MatchData
          console.log('Match updated:', matchData)
          callback(matchData)
        } else {
          console.log('Match not found:', matchId)
          callback(null)
        }
      },
      (error) => {
        console.error('Error listening to match:', error)
        callback(null)
      }
    )
    
    return unsubscribe
  } catch (error) {
    console.error('Error setting up match subscription:', error)
    callback(null)
    // Return a no-op unsubscribe function
    return () => {}
  }
}

export async function joinMatch(matchId: string, playerId: string, playerName: string): Promise<void> {
  try {
    console.log('Joining match:', { matchId, playerId, playerName })
    
    const matchRef = doc(db, 'matches', matchId)
    
    await runTransaction(db, async (transaction) => {
      const matchDoc = await transaction.get(matchRef)
      if (!matchDoc.exists()) {
        throw new Error('Match not found')
      }
      
      const matchData = matchDoc.data() as MatchData
      
      // Check if match is waiting for players
      if (matchData.status !== 'waiting') {
        throw new Error('Match is not waiting for players')
      }
      
      // Check if player is already in the match
      if (matchData.player1.id === playerId || matchData.player2?.id === playerId) {
        throw new Error('Player is already in the match')
      }
      
      // Check if match is full
      if (matchData.player2) {
        throw new Error('Match is full')
      }
      
      // Add player2 (keep status as 'waiting' for manual start)
      const updatedMatchData = {
        ...matchData,
        player2: {
          id: playerId,
          name: playerName,
          joinedAt: new Date()
        },
        status: 'waiting', // Keep waiting until host starts
        currentPlayerId: matchData.player1.id, // Set current player but don't start yet
        updatedAt: new Date()
      }
      
      transaction.update(matchRef, updatedMatchData)
    })
    
    console.log('Successfully joined match')
  } catch (error) {
    console.error('Error joining match:', error)
    throw new Error(`Failed to join match: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Line interface for move input (using dot IDs)
export interface MoveLine {
  startDot: string
  endDot: string
}

export interface PlayMoveResult {
  success: boolean
  squaresClaimed: number
  gameCompleted: boolean
  winner?: number | 'tie' | null
  error?: string
}

export async function playMove(
  matchId: string,
  playerId: string,
  line: MoveLine
): Promise<PlayMoveResult> {
  try {
    console.log('Playing move:', { matchId, playerId, line })
    
    const matchRef = doc(db, 'matches', matchId)
    
    const result = await runTransaction(db, async (transaction) => {
      // Get current match data
      const matchDoc = await transaction.get(matchRef)
      if (!matchDoc.exists()) {
        throw new Error('Match not found')
      }
      
      const matchData = matchDoc.data() as MatchData
      
      // Validate move
      const validationResult = validateMove(matchData, playerId, line)
      if (!validationResult.valid) {
        throw new Error(validationResult.error)
      }
      
      // Get player number
      const playerNumber = getPlayerNumber(matchData, playerId)
      if (!playerNumber) {
        throw new Error('Player not found in match')
      }
      
      // Check if it's player's turn
      if (matchData.currentTurn !== playerNumber) {
        throw new Error('Not your turn')
      }
      
      // Check if game is active
      if (matchData.status !== 'active') {
        throw new Error('Game is not active')
      }
      
      // Check if game is over
      if (matchData.gameOver) {
        throw new Error('Game is already completed')
      }
      
      // Check if line is already drawn
      const lineExists = matchData.lines?.some(l => 
        (l.startDot === line.startDot && l.endDot === line.endDot) ||
        (l.startDot === line.endDot && l.endDot === line.startDot)
      )
      if (lineExists) {
        throw new Error('Line already exists')
      }
      
      // Add the new line
      const newLine = {
        id: `${line.startDot}-${line.endDot}`,
        startDot: line.startDot,
        endDot: line.endDot,
        player: playerNumber,
        drawnAt: new Date()
      }
      const updatedLines = [...(matchData.lines || []), newLine]
      
      // Check for completed squares
      const squareCheckResult = checkForCompletedSquares(
        matchData.dots || [],
        updatedLines,
        matchData.squares || []
      )
      
      // Update squares
      const updatedSquares = [...(matchData.squares || [])]
      let squaresClaimed = 0
      
      squareCheckResult.completedSquares.forEach(square => {
        const existingSquareIndex = updatedSquares.findIndex(s => s.id === square.id)
        if (existingSquareIndex >= 0) {
          // Only count as claimed if it wasn't already claimed
          if (updatedSquares[existingSquareIndex].player === undefined) {
            squaresClaimed++
          }
          // Update existing square
          updatedSquares[existingSquareIndex] = {
            ...updatedSquares[existingSquareIndex],
            player: playerNumber,
            lines: square.lines
          }
        } else {
          // Add new square (shouldn't happen with pre-populated squares)
          updatedSquares.push({
            ...square,
            player: playerNumber
          })
          squaresClaimed++
        }
      })
      
      // Update scores
      const updatedScores = { ...(matchData.scores || { 1: 0, 2: 0 }) }
      updatedScores[playerNumber] = (updatedScores[playerNumber] || 0) + squaresClaimed
      
      // Determine if game is complete
      const gridSize = matchData.gridSize || 5
      const totalSquares = (gridSize - 1) * (gridSize - 1)
      const claimedSquares = updatedSquares.filter(s => s.player !== undefined).length
      const gameCompleted = claimedSquares >= totalSquares
      
      // Determine winner
      let winner: number | 'tie' | null = null
      if (gameCompleted) {
        if (updatedScores[1] > updatedScores[2]) {
          winner = 1
        } else if (updatedScores[2] > updatedScores[1]) {
          winner = 2
        } else {
          winner = 'tie'
        }
      }
      
      // Determine next turn
      let nextTurn = matchData.currentTurn || 1
      let nextPlayerId = matchData.currentPlayerId || matchData.player1.id
      
      if (squaresClaimed === 0) {
        // No squares claimed, switch turns
        nextTurn = nextTurn === 1 ? 2 : 1
        nextPlayerId = nextTurn === 1 ? matchData.player1.id : (matchData.player2?.id || matchData.player1.id)
      }
      // If squares were claimed, player gets another turn (keep same playerId)
      
      // Update match data
      const updatedMatchData = {
        ...matchData,
        lines: updatedLines,
        squares: updatedSquares,
        scores: updatedScores,
        currentTurn: nextTurn,
        currentPlayerId: nextPlayerId,
        turnStartedAt: serverTimestamp(), // Reset turn timer
        gameOver: gameCompleted,
        winner: winner,
        status: gameCompleted ? 'completed' : 'active',
        updatedAt: new Date()
      }
      
      // Write the transaction
      transaction.update(matchRef, updatedMatchData)
      
      return {
        success: true,
        squaresClaimed,
        gameCompleted,
        winner,
        error: undefined
      }
    })
    
    console.log('Move played successfully:', result)
    return result
    
  } catch (error) {
    console.error('Error playing move:', error)
    return {
      success: false,
      squaresClaimed: 0,
      gameCompleted: false,
      winner: undefined,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Helper functions for move validation and square checking
function validateMove(matchData: MatchData, playerId: string, line: MoveLine): { valid: boolean; error?: string } {
  // Parse dot coordinates from dot IDs
  const startCoords = parseDotId(line.startDot)
  const endCoords = parseDotId(line.endDot)
  
  if (!startCoords || !endCoords) {
    return { valid: false, error: 'Invalid dot IDs' }
  }
  
  // Check if line coordinates are valid
  const gridSize = matchData.gridSize || 5
  const maxCoord = gridSize - 1
  
  if (startCoords.x < 0 || startCoords.x > maxCoord || 
      startCoords.y < 0 || startCoords.y > maxCoord ||
      endCoords.x < 0 || endCoords.x > maxCoord || 
      endCoords.y < 0 || endCoords.y > maxCoord) {
    return { valid: false, error: 'Line coordinates are out of bounds' }
  }
  
  // Check if line is horizontal or vertical
  const isHorizontal = startCoords.y === endCoords.y
  const isVertical = startCoords.x === endCoords.x
  
  if (!isHorizontal && !isVertical) {
    return { valid: false, error: 'Line must be horizontal or vertical' }
  }
  
  // Check if line connects adjacent dots
  if (isHorizontal) {
    if (Math.abs(endCoords.x - startCoords.x) !== 1) {
      return { valid: false, error: 'Horizontal line must connect adjacent dots' }
    }
  } else {
    if (Math.abs(endCoords.y - startCoords.y) !== 1) {
      return { valid: false, error: 'Vertical line must connect adjacent dots' }
    }
  }
  
  // Check if player is in the match
  const player1Id = matchData.player1.id
  const player2Id = matchData.player2?.id
  
  if (playerId !== player1Id && playerId !== player2Id) {
    return { valid: false, error: 'Player is not in this match' }
  }
  
  return { valid: true }
}

function parseDotId(dotId: string): { x: number; y: number } | null {
  const parts = dotId.split('-')
  if (parts.length !== 2) return null
  
  const x = parseInt(parts[0])
  const y = parseInt(parts[1])
  
  if (isNaN(x) || isNaN(y)) return null
  
  return { x, y }
}

function getPlayerNumber(matchData: MatchData, playerId: string): number | null {
  if (matchData.player1.id === playerId) return 1
  if (matchData.player2?.id === playerId) return 2
  return null
}

function checkForCompletedSquares(
  dots: MatchData['dots'], 
  lines: MatchData['lines'], 
  existingSquares: MatchData['squares']
): {
  completedSquares: Array<{
    id: string
    topLeftX: number
    topLeftY: number
    player?: number
    lines: string[]
  }>
} {
  const completedSquares: Array<{
    id: string
    topLeftX: number
    topLeftY: number
    player?: number
    lines: string[]
  }> = []
  
  const gridSize = Math.sqrt(dots?.length || 25)
  
  // Check each potential square
  for (let x = 0; x < gridSize - 1; x++) {
    for (let y = 0; y < gridSize - 1; y++) {
      const squareId = `${x}-${y}`
      
      // Skip if square is already claimed by a player
      if (existingSquares?.some(s => s.id === squareId && s.player !== undefined)) {
        continue
      }
      
      // Define the four lines that make up this square (using dot IDs "row-col")
      const topDot = `${y}-${x}`
      const rightDot = `${y}-${x + 1}`
      const bottomDot = `${y + 1}-${x}`
      const bottomRightDot = `${y + 1}-${x + 1}`

      const squareLines = [
        // Top line
        { startDot: topDot, endDot: rightDot },
        // Bottom line
        { startDot: bottomDot, endDot: bottomRightDot },
        // Left line
        { startDot: topDot, endDot: bottomDot },
        // Right line
        { startDot: rightDot, endDot: bottomRightDot }
      ]
      
      // Check if all four lines exist
      const allLinesExist = squareLines.every(squareLine => 
        lines?.some(line => 
          (line.startDot === squareLine.startDot && line.endDot === squareLine.endDot) ||
          (line.startDot === squareLine.endDot && line.endDot === squareLine.startDot)
        )
      )
      
      if (allLinesExist) {
        completedSquares.push({
          id: squareId,
          topLeftX: x,
          topLeftY: y,
          player: undefined, // Will be set by the calling function
          lines: squareLines.map(l => `${l.startDot}-${l.endDot}`)
        })
      }
    }
  }
  
  return { completedSquares }
} 