import { ref, computed } from 'vue'
import { useSquareChecker } from './useSquareChecker'
import { useTurnManager } from './useTurnManager'
import { useVictoryCheck } from './useVictoryCheck'

export interface Dot {
  id: string
  x: number
  y: number
}

export interface Line {
  id: string
  from: string
  to: string
  player?: number
}

export interface Square {
  id: string
  lines: string[]
  player?: number
}

export function useGameBoard(gridSize = 5) {
  // Game state
  const dots = ref<Dot[]>([])
  const lines = ref<Line[]>([])
  const squares = ref<Square[]>([])
  const currentPlayer = ref(1)
  const scores = ref<Record<number, number>>({ 1: 0, 2: 0 })
  const gameOver = ref(false)
  
  // Initialize square checker, turn manager, and victory checker
  const squareChecker = useSquareChecker(gridSize)
  const turnManager = useTurnManager(2, 1) // 2 players, starting with player 1
  const victoryChecker = useVictoryCheck(gridSize)

  // Initialize the game board
  const initializeBoard = () => {
    dots.value = []
    lines.value = []
    squares.value = []
    scores.value = { 1: 0, 2: 0 }
    gameOver.value = false
    
    // Initialize turn manager
    turnManager.initializeTurn(1)
    currentPlayer.value = turnManager.currentPlayer.value

    // Create dots in a grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        dots.value.push({
          id: `${x}-${y}`,
          x,
          y
        })
      }
    }

    // Pre-calculate all possible squares
    for (let y = 0; y < gridSize - 1; y++) {
      for (let x = 0; x < gridSize - 1; x++) {
        const topLeft = `${x}-${y}`
        const topRight = `${x + 1}-${y}`
        const bottomLeft = `${x}-${y + 1}`
        const bottomRight = `${x + 1}-${y + 1}`

        squares.value.push({
          id: `${x}-${y}`,
          lines: [
            `${topLeft}-${topRight}`,
            `${topRight}-${bottomRight}`,
            `${bottomRight}-${bottomLeft}`,
            `${bottomLeft}-${topLeft}`
          ]
        })
      }
    }
  }

  // Check if a line can be drawn between two dots
  const canDrawLine = (from: string, to: string): boolean => {
    const existingLine = lines.value.find(
      line => (line.from === from && line.to === to) || (line.from === to && line.to === from)
    )
    return !existingLine
  }

  // Draw a line between two dots
  const drawLine = (from: string, to: string): boolean => {
    if (!canDrawLine(from, to)) return false

    const newLine: Line = {
      id: `${from}-${to}`,
      from,
      to,
      player: currentPlayer.value
    }

    lines.value.push(newLine)

    // Use square checker to find completed squares
    const completedSquares = squareChecker.checkForCompletedSquares(newLine, lines.value.slice(0, -1))
    
    // Process turn using turn manager
    const turnResult = turnManager.processTurnAfterMove(completedSquares.length)
    currentPlayer.value = turnResult.nextPlayer
    
    if (completedSquares.length > 0) {
      // Player gets points for completed squares
      scores.value[newLine.player!] += completedSquares.length
      
      // Update squares state
      completedSquares.forEach(completed => {
        const existingSquare = squares.value.find(s => s.id === `${completed.topLeftX}-${completed.topLeftY}`)
        if (existingSquare) {
          existingSquare.player = newLine.player
        }
      })
    }
    
    // Check for victory using victory checker
    const victoryResult = victoryChecker.checkVictory(squares.value, scores.value)
    gameOver.value = victoryResult.isGameOver

    return true
  }



  // Get winner using victory checker
  const winner = computed(() => {
    if (!gameOver.value) return null
    return victoryChecker.determineWinner(scores.value)
  })

  // Get all possible lines that can be drawn
  const possibleLines = computed(() => {
    const possible: Line[] = []
    
    // Horizontal lines
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize - 1; x++) {
        const from = `${x}-${y}`
        const to = `${x + 1}-${y}`
        if (canDrawLine(from, to)) {
          possible.push({ id: `${from}-${to}`, from, to })
        }
      }
    }
    
    // Vertical lines
    for (let y = 0; y < gridSize - 1; y++) {
      for (let x = 0; x < gridSize; x++) {
        const from = `${x}-${y}`
        const to = `${x}-${y + 1}`
        if (canDrawLine(from, to)) {
          possible.push({ id: `${from}-${to}`, from, to })
        }
      }
    }
    
    return possible
  })

  // Get moves that would complete squares (for AI/hints)
  const getCompletingMoves = () => {
    return possibleLines.value.filter(line => 
      squareChecker.wouldCompleteAnySquares(line, lines.value)
    )
  }

  return {
    // State
    dots,
    lines,
    squares,
    currentPlayer,
    scores,
    gameOver,
    winner,
    possibleLines,
    
    // Actions
    initializeBoard,
    drawLine,
    canDrawLine,
    getCompletingMoves,
    
    // Turn management
    turnManager,
    
    // Victory checking
    victoryChecker
  }
} 