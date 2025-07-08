import { computed } from 'vue'

export interface VictoryState {
  isGameOver: boolean
  winner: number | 'tie' | null
  reason: string
  finalScores: Record<number, number>
  totalSquares: number
  claimedSquares: number
}

export interface VictoryResult {
  isGameOver: boolean
  winner: number | 'tie' | null
  reason: string
  playerStats: {
    player1: { score: number; squares: number }
    player2: { score: number; squares: number }
  }
}

export function useVictoryCheck(gridSize: number = 5) {
  // Calculate total possible squares in the grid
  const getTotalSquares = (): number => {
    return (gridSize - 1) * (gridSize - 1)
  }

  // Check if all squares are claimed
  const areAllSquaresClaimed = (squares: Array<{ player?: number }>): boolean => {
    return squares.every(square => square.player !== undefined)
  }

  // Count squares claimed by each player
  const getClaimedSquaresByPlayer = (squares: Array<{ player?: number }>): Record<number, number> => {
    const claimed: Record<number, number> = {}
    
    squares.forEach(square => {
      if (square.player) {
        claimed[square.player] = (claimed[square.player] || 0) + 1
      }
    })
    
    return claimed
  }

  // Get total claimed squares
  const getTotalClaimedSquares = (squares: Array<{ player?: number }>): number => {
    return squares.filter(square => square.player !== undefined).length
  }

  // Determine winner based on scores
  const determineWinner = (scores: Record<number, number>): number | 'tie' | null => {
    const player1Score = scores[1] || 0
    const player2Score = scores[2] || 0
    
    if (player1Score > player2Score) {
      return 1
    } else if (player2Score > player1Score) {
      return 2
    } else {
      return 'tie'
    }
  }

  // Main victory check function
  const checkVictory = (
    squares: Array<{ player?: number }>,
    scores: Record<number, number>
  ): VictoryResult => {
    const totalSquares = getTotalSquares()
    const claimedSquares = getTotalClaimedSquares(squares)
    const isGameOver = areAllSquaresClaimed(squares)
    
    if (!isGameOver) {
      return {
        isGameOver: false,
        winner: null,
        reason: `Game in progress - ${claimedSquares}/${totalSquares} squares claimed`,
        playerStats: {
          player1: { score: scores[1] || 0, squares: getClaimedSquaresByPlayer(squares)[1] || 0 },
          player2: { score: scores[2] || 0, squares: getClaimedSquaresByPlayer(squares)[2] || 0 }
        }
      }
    }
    
    const winner = determineWinner(scores)
    const claimedByPlayer = getClaimedSquaresByPlayer(squares)
    
    let reason: string
    if (winner === 'tie') {
      reason = `Game over - It's a tie! Both players scored ${scores[1]} points`
    } else {
      const winnerScore = scores[winner]
      const loserScore = scores[winner === 1 ? 2 : 1]
      reason = `Game over - Player ${winner} wins with ${winnerScore} points vs ${loserScore} points`
    }
    
    return {
      isGameOver: true,
      winner,
      reason,
      playerStats: {
        player1: { score: scores[1] || 0, squares: claimedByPlayer[1] || 0 },
        player2: { score: scores[2] || 0, squares: claimedByPlayer[2] || 0 }
      }
    }
  }

  // Get victory state for reactive updates
  const getVictoryState = (
    squares: Array<{ player?: number }>,
    scores: Record<number, number>
  ): VictoryState => {
    const totalSquares = getTotalSquares()
    const claimedSquares = getTotalClaimedSquares(squares)
    const isGameOver = areAllSquaresClaimed(squares)
    const winner = isGameOver ? determineWinner(scores) : null
    
    let reason: string
    if (!isGameOver) {
      reason = `Game in progress - ${claimedSquares}/${totalSquares} squares claimed`
    } else if (winner === 'tie') {
      reason = `Game over - It's a tie! Both players scored ${scores[1]} points`
    } else {
      const winnerScore = scores[winner!]
      const loserScore = scores[winner === 1 ? 2 : 1]
      reason = `Game over - Player ${winner} wins with ${winnerScore} points vs ${loserScore} points`
    }
    
    return {
      isGameOver,
      winner,
      reason,
      finalScores: { ...scores },
      totalSquares,
      claimedSquares
    }
  }

  // Check if game is near completion (for UI hints)
  const isGameNearCompletion = (
    squares: Array<{ player?: number }>,
    threshold: number = 0.8
  ): boolean => {
    const totalSquares = getTotalSquares()
    const claimedSquares = getTotalClaimedSquares(squares)
    return claimedSquares / totalSquares >= threshold
  }

  // Get remaining squares count
  const getRemainingSquares = (squares: Array<{ player?: number }>): number => {
    const totalSquares = getTotalSquares()
    const claimedSquares = getTotalClaimedSquares(squares)
    return totalSquares - claimedSquares
  }

  // Get game progress percentage
  const getGameProgress = (squares: Array<{ player?: number }>): number => {
    const totalSquares = getTotalSquares()
    const claimedSquares = getTotalClaimedSquares(squares)
    return (claimedSquares / totalSquares) * 100
  }

  // Check if a specific player is winning
  const isPlayerWinning = (
    squares: Array<{ player?: number }>,
    scores: Record<number, number>,
    player: number
  ): boolean => {
    const winner = determineWinner(scores)
    return winner === player
  }

  // Get player advantage (positive = player 1 winning, negative = player 2 winning)
  const getPlayerAdvantage = (scores: Record<number, number>): number => {
    const player1Score = scores[1] || 0
    const player2Score = scores[2] || 0
    return player1Score - player2Score
  }

  // Check if game is in a decisive state (one player clearly winning)
  const isGameDecisive = (
    squares: Array<{ player?: number }>,
    scores: Record<number, number>,
    advantageThreshold: number = 3
  ): boolean => {
    const advantage = Math.abs(getPlayerAdvantage(scores))
    const remainingSquares = getRemainingSquares(squares)
    return advantage > remainingSquares
  }

  // Get victory prediction based on current state
  const getVictoryPrediction = (
    squares: Array<{ player?: number }>,
    scores: Record<number, number>
  ): { predictedWinner: number | 'tie' | null; confidence: number } => {
    const remainingSquares = getRemainingSquares(squares)
    const advantage = getPlayerAdvantage(scores)
    
    if (remainingSquares === 0) {
      return {
        predictedWinner: determineWinner(scores),
        confidence: 1.0
      }
    }
    
    if (Math.abs(advantage) > remainingSquares) {
      return {
        predictedWinner: advantage > 0 ? 1 : 2,
        confidence: 1.0
      }
    }
    
    // If advantage is small compared to remaining squares, it's uncertain
    const confidence = Math.max(0.1, 1 - (remainingSquares / 10))
    return {
      predictedWinner: null,
      confidence
    }
  }

  return {
    // Main functions
    checkVictory,
    getVictoryState,
    
    // Utility functions
    getTotalSquares,
    areAllSquaresClaimed,
    getClaimedSquaresByPlayer,
    getTotalClaimedSquares,
    determineWinner,
    
    // Analysis functions
    isGameNearCompletion,
    getRemainingSquares,
    getGameProgress,
    isPlayerWinning,
    getPlayerAdvantage,
    isGameDecisive,
    getVictoryPrediction
  }
} 