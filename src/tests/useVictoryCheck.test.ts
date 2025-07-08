import { describe, it, expect, beforeEach } from 'vitest'
import { useVictoryCheck } from '../composables/useVictoryCheck'

describe('useVictoryCheck', () => {
  let victoryChecker: ReturnType<typeof useVictoryCheck>

  beforeEach(() => {
    victoryChecker = useVictoryCheck(3) // Use 3x3 grid for testing (4 squares total)
  })

  describe('total squares calculation', () => {
    it('should calculate total squares correctly for different grid sizes', () => {
      expect(victoryChecker.getTotalSquares()).toBe(4) // 3x3 grid = 4 squares
      
      const checker5x5 = useVictoryCheck(5)
      expect(checker5x5.getTotalSquares()).toBe(16) // 5x5 grid = 16 squares
      
      const checker4x4 = useVictoryCheck(4)
      expect(checker4x4.getTotalSquares()).toBe(9) // 4x4 grid = 9 squares
    })
  })

  describe('square claiming detection', () => {
    it('should detect when all squares are claimed', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: 2 }
      ]
      
      expect(victoryChecker.areAllSquaresClaimed(squares)).toBe(true)
    })

    it('should detect when not all squares are claimed', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: undefined }
      ]
      
      expect(victoryChecker.areAllSquaresClaimed(squares)).toBe(false)
    })

    it('should count claimed squares by player', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: 2 }
      ]
      
      const claimed = victoryChecker.getClaimedSquaresByPlayer(squares)
      expect(claimed[1]).toBe(2)
      expect(claimed[2]).toBe(2)
    })

    it('should get total claimed squares', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: undefined }
      ]
      
      expect(victoryChecker.getTotalClaimedSquares(squares)).toBe(3)
    })
  })

  describe('winner determination', () => {
    it('should determine player 1 as winner', () => {
      const scores = { 1: 3, 2: 1 }
      expect(victoryChecker.determineWinner(scores)).toBe(1)
    })

    it('should determine player 2 as winner', () => {
      const scores = { 1: 1, 2: 3 }
      expect(victoryChecker.determineWinner(scores)).toBe(2)
    })

    it('should determine tie', () => {
      const scores = { 1: 2, 2: 2 }
      expect(victoryChecker.determineWinner(scores)).toBe('tie')
    })

    it('should handle missing scores', () => {
      const scores = { 1: 2 }
      expect(victoryChecker.determineWinner(scores)).toBe(1)
      
      const scores2 = { 2: 2 }
      expect(victoryChecker.determineWinner(scores2)).toBe(2)
    })
  })

  describe('main victory check', () => {
    it('should return game in progress when not all squares claimed', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: undefined }
      ]
      const scores = { 1: 2, 2: 1 }
      
      const result = victoryChecker.checkVictory(squares, scores)
      
      expect(result.isGameOver).toBe(false)
      expect(result.winner).toBe(null)
      expect(result.reason).toContain('Game in progress')
      expect(result.playerStats.player1.score).toBe(2)
      expect(result.playerStats.player2.score).toBe(1)
    })

    it('should return player 1 as winner when game is complete', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: 1 }
      ]
      const scores = { 1: 3, 2: 1 }
      
      const result = victoryChecker.checkVictory(squares, scores)
      
      expect(result.isGameOver).toBe(true)
      expect(result.winner).toBe(1)
      expect(result.reason).toContain('Player 1 wins')
      expect(result.playerStats.player1.score).toBe(3)
      expect(result.playerStats.player2.score).toBe(1)
    })

    it('should return tie when game is complete and scores are equal', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: 2 }
      ]
      const scores = { 1: 2, 2: 2 }
      
      const result = victoryChecker.checkVictory(squares, scores)
      
      expect(result.isGameOver).toBe(true)
      expect(result.winner).toBe('tie')
      expect(result.reason).toContain("It's a tie")
    })
  })

  describe('victory state', () => {
    it('should return complete victory state', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: 1 }
      ]
      const scores = { 1: 3, 2: 1 }
      
      const state = victoryChecker.getVictoryState(squares, scores)
      
      expect(state.isGameOver).toBe(true)
      expect(state.winner).toBe(1)
      expect(state.totalSquares).toBe(4)
      expect(state.claimedSquares).toBe(4)
      expect(state.finalScores).toEqual({ 1: 3, 2: 1 })
    })
  })

  describe('game progress analysis', () => {
    it('should detect game near completion', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: undefined }
      ]
      
      expect(victoryChecker.isGameNearCompletion(squares, 0.7)).toBe(true) // 3/4 = 75%
      expect(victoryChecker.isGameNearCompletion(squares, 0.8)).toBe(false) // 3/4 = 75%
    })

    it('should get remaining squares count', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: undefined },
        { player: undefined }
      ]
      
      expect(victoryChecker.getRemainingSquares(squares)).toBe(2)
    })

    it('should get game progress percentage', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: undefined }
      ]
      
      expect(victoryChecker.getGameProgress(squares)).toBe(75) // 3/4 * 100
    })
  })

  describe('player advantage analysis', () => {
    it('should check if specific player is winning', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: undefined }
      ]
      const scores = { 1: 2, 2: 1 }
      
      expect(victoryChecker.isPlayerWinning(squares, scores, 1)).toBe(true)
      expect(victoryChecker.isPlayerWinning(squares, scores, 2)).toBe(false)
    })

    it('should get player advantage', () => {
      const scores = { 1: 3, 2: 1 }
      expect(victoryChecker.getPlayerAdvantage(scores)).toBe(2) // Player 1 winning by 2
      
      const scores2 = { 1: 1, 2: 3 }
      expect(victoryChecker.getPlayerAdvantage(scores2)).toBe(-2) // Player 2 winning by 2
    })

    it('should detect decisive game state', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: undefined }
      ]
      const scores = { 1: 3, 2: 0 }
      
      expect(victoryChecker.isGameDecisive(squares, scores, 3)).toBe(true) // 3 point advantage > 1 remaining square
    })
  })

  describe('victory prediction', () => {
    it('should predict winner when game is complete', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: 1 }
      ]
      const scores = { 1: 3, 2: 1 }
      
      const prediction = victoryChecker.getVictoryPrediction(squares, scores)
      
      expect(prediction.predictedWinner).toBe(1)
      expect(prediction.confidence).toBe(1.0)
    })

    it('should predict winner when advantage is insurmountable', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: 1 },
        { player: undefined }
      ]
      const scores = { 1: 3, 2: 0 }
      
      const prediction = victoryChecker.getVictoryPrediction(squares, scores)
      
      expect(prediction.predictedWinner).toBe(1)
      expect(prediction.confidence).toBe(1.0)
    })

    it('should return uncertain prediction when game is close', () => {
      const squares = [
        { player: 1 },
        { player: 2 },
        { player: undefined },
        { player: undefined }
      ]
      const scores = { 1: 1, 2: 1 }
      
      const prediction = victoryChecker.getVictoryPrediction(squares, scores)
      
      expect(prediction.predictedWinner).toBe(null)
      expect(prediction.confidence).toBeLessThan(1.0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty squares array', () => {
      const squares: Array<{ player?: number }> = []
      const scores = { 1: 0, 2: 0 }
      
      expect(victoryChecker.areAllSquaresClaimed(squares)).toBe(true)
      expect(victoryChecker.getTotalClaimedSquares(squares)).toBe(0)
      expect(victoryChecker.getClaimedSquaresByPlayer(squares)).toEqual({})
    })

    it('should handle all unclaimed squares', () => {
      const squares = [
        { player: undefined },
        { player: undefined },
        { player: undefined },
        { player: undefined }
      ]
      
      expect(victoryChecker.areAllSquaresClaimed(squares)).toBe(false)
      expect(victoryChecker.getTotalClaimedSquares(squares)).toBe(0)
    })

    it('should handle zero scores', () => {
      const scores = { 1: 0, 2: 0 }
      expect(victoryChecker.determineWinner(scores)).toBe('tie')
    })

    it('should handle single player scores', () => {
      const scores = { 1: 2 }
      expect(victoryChecker.determineWinner(scores)).toBe(1)
      
      const scores2 = { 2: 2 }
      expect(victoryChecker.determineWinner(scores2)).toBe(2)
    })
  })
}) 