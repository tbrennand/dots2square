import { ref, computed } from 'vue'

export interface TurnState {
  currentPlayer: number
  totalPlayers: number
  turnNumber: number
  lastMoveCompletedSquares: boolean
}

export interface TurnResult {
  nextPlayer: number
  turnChanged: boolean
  reason: string
}

export function useTurnManager(totalPlayers: number = 2, startingPlayer: number = 1) {
  // Turn state
  const currentPlayer = ref(startingPlayer)
  const turnNumber = ref(1)
  const lastMoveCompletedSquares = ref(false)
  const playerTurnHistory = ref<Array<{ player: number; completedSquares: number }>>([])

  // Initialize turn manager
  const initializeTurn = (startingPlayer: number = 1) => {
    currentPlayer.value = startingPlayer
    turnNumber.value = 1
    lastMoveCompletedSquares.value = false
    playerTurnHistory.value = []
  }

  // Determine whose turn it is after a move
  const processTurnAfterMove = (squaresCompleted: number): TurnResult => {
    const previousPlayer = currentPlayer.value
    const turnChanged = squaresCompleted === 0
    
    if (turnChanged) {
      // No squares completed, switch to next player
      currentPlayer.value = getNextPlayer(currentPlayer.value)
      turnNumber.value++
      lastMoveCompletedSquares.value = false
    } else {
      // Squares completed, same player goes again
      lastMoveCompletedSquares.value = true
    }

    // Record turn history
    playerTurnHistory.value.push({
      player: previousPlayer,
      completedSquares: squaresCompleted
    })

    return {
      nextPlayer: currentPlayer.value,
      turnChanged,
      reason: squaresCompleted > 0 
        ? `Player ${previousPlayer} completed ${squaresCompleted} square(s) - gets another turn`
        : `No squares completed - turn passes to Player ${currentPlayer.value}`
    }
  }

  // Get the next player in sequence
  const getNextPlayer = (currentPlayer: number): number => {
    return currentPlayer % totalPlayers + 1
  }

  // Get the previous player
  const getPreviousPlayer = (currentPlayer: number): number => {
    return currentPlayer === 1 ? totalPlayers : currentPlayer - 1
  }

  // Check if it's a specific player's turn
  const isPlayerTurn = (player: number): boolean => {
    return currentPlayer.value === player
  }

  // Get current turn state
  const getTurnState = (): TurnState => {
    return {
      currentPlayer: currentPlayer.value,
      totalPlayers,
      turnNumber: turnNumber.value,
      lastMoveCompletedSquares: lastMoveCompletedSquares.value
    }
  }

  // Get turn statistics
  const getTurnStats = () => {
    const stats = {
      totalTurns: turnNumber.value,
      playerTurns: {} as Record<number, number>,
      playerSquares: {} as Record<number, number>,
      consecutiveTurns: 0
    }

    // Initialize player stats
    for (let i = 1; i <= totalPlayers; i++) {
      stats.playerTurns[i] = 0
      stats.playerSquares[i] = 0
    }

    // Calculate stats from history
    playerTurnHistory.value.forEach(turn => {
      stats.playerTurns[turn.player]++
      stats.playerSquares[turn.player] += turn.completedSquares
    })

    // Count consecutive turns for current player
    let consecutive = 0
    for (let i = playerTurnHistory.value.length - 1; i >= 0; i--) {
      if (playerTurnHistory.value[i].player === currentPlayer.value) {
        consecutive++
      } else {
        break
      }
    }
    stats.consecutiveTurns = consecutive

    return stats
  }

  // Check if a player has had too many consecutive turns (for fairness)
  const hasExcessiveConsecutiveTurns = (maxConsecutive: number = 5): boolean => {
    const stats = getTurnStats()
    return stats.consecutiveTurns >= maxConsecutive
  }

  // Force switch turn (for special cases like timeouts, disconnections)
  const forceSwitchTurn = (): TurnResult => {
    const previousPlayer = currentPlayer.value
    currentPlayer.value = getNextPlayer(currentPlayer.value)
    turnNumber.value++
    lastMoveCompletedSquares.value = false

    return {
      nextPlayer: currentPlayer.value,
      turnChanged: true,
      reason: `Turn forced to switch from Player ${previousPlayer} to Player ${currentPlayer.value}`
    }
  }

  // Get turn history for analysis
  const getTurnHistory = () => {
    return [...playerTurnHistory.value]
  }

  // Check if it's the first turn of the game
  const isFirstTurn = computed(() => {
    return turnNumber.value === 1
  })

  // Check if the last move completed squares
  const didLastMoveCompleteSquares = computed(() => {
    return lastMoveCompletedSquares.value
  })

  // Get the player who should go next (without actually changing turn)
  const getNextPlayerToGo = computed(() => {
    return getNextPlayer(currentPlayer.value)
  })

  // Get turn summary for display
  const getTurnSummary = computed(() => {
    const stats = getTurnStats()
    return {
      currentPlayer: currentPlayer.value,
      turnNumber: turnNumber.value,
      nextPlayer: getNextPlayer(currentPlayer.value),
      consecutiveTurns: stats.consecutiveTurns,
      totalTurns: stats.totalTurns,
      playerStats: stats.playerTurns
    }
  })

  return {
    // State
    currentPlayer,
    turnNumber,
    lastMoveCompletedSquares,
    
    // Actions
    initializeTurn,
    processTurnAfterMove,
    forceSwitchTurn,
    
    // Getters
    getTurnState,
    getTurnStats,
    getTurnHistory,
    getNextPlayer,
    getPreviousPlayer,
    isPlayerTurn,
    hasExcessiveConsecutiveTurns,
    
    // Computed
    isFirstTurn,
    didLastMoveCompleteSquares,
    getNextPlayerToGo,
    getTurnSummary
  }
} 