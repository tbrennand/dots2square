import { describe, it, expect, beforeEach } from 'vitest'
import { useTurnManager } from '../composables/useTurnManager'

describe('useTurnManager', () => {
  let turnManager: ReturnType<typeof useTurnManager>

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      turnManager = useTurnManager()
      expect(turnManager.currentPlayer.value).toBe(1)
      expect(turnManager.turnNumber.value).toBe(1)
      expect(turnManager.lastMoveCompletedSquares.value).toBe(false)
      expect(turnManager.isFirstTurn.value).toBe(true)
    })

    it('should initialize with custom totalPlayers and startingPlayer', () => {
      turnManager = useTurnManager(4, 3)
      expect(turnManager.currentPlayer.value).toBe(3)
      expect(turnManager.turnNumber.value).toBe(1)
      expect(turnManager.getTurnState().totalPlayers).toBe(4)
    })
  })

  describe('Basic Turn Cycling', () => {
    beforeEach(() => {
      turnManager = useTurnManager(3, 2)
    })

    it('should cycle turns among players', () => {
      expect(turnManager.currentPlayer.value).toBe(2)
      turnManager.processTurnAfterMove(0) // No square, next player
      expect(turnManager.currentPlayer.value).toBe(3)
      turnManager.processTurnAfterMove(0)
      expect(turnManager.currentPlayer.value).toBe(1)
      turnManager.processTurnAfterMove(0)
      expect(turnManager.currentPlayer.value).toBe(2)
    })

    it('getNextPlayer and getPreviousPlayer should work', () => {
      expect(turnManager.getNextPlayer(1)).toBe(2)
      expect(turnManager.getNextPlayer(3)).toBe(1)
      expect(turnManager.getPreviousPlayer(1)).toBe(3)
      expect(turnManager.getPreviousPlayer(2)).toBe(1)
    })
  })

  describe('Chain Turns', () => {
    beforeEach(() => {
      turnManager = useTurnManager(2, 1)
    })

    it('should keep player turn if they complete a square', () => {
      expect(turnManager.currentPlayer.value).toBe(1)
      let result = turnManager.processTurnAfterMove(1)
      expect(result.nextPlayer).toBe(1)
      expect(result.turnChanged).toBe(false)
      expect(turnManager.currentPlayer.value).toBe(1)
      expect(turnManager.lastMoveCompletedSquares.value).toBe(true)
    })

    it('should allow multiple consecutive chain turns', () => {
      turnManager.processTurnAfterMove(2)
      expect(turnManager.currentPlayer.value).toBe(1)
      turnManager.processTurnAfterMove(1)
      expect(turnManager.currentPlayer.value).toBe(1)
      expect(turnManager.getTurnStats().consecutiveTurns).toBe(2)
    })

    it('should switch turn after chain ends', () => {
      turnManager.processTurnAfterMove(1)
      expect(turnManager.currentPlayer.value).toBe(1)
      turnManager.processTurnAfterMove(0)
      expect(turnManager.currentPlayer.value).toBe(2)
      expect(turnManager.lastMoveCompletedSquares.value).toBe(false)
    })
  })

  describe('Turn History and Stats', () => {
    beforeEach(() => {
      turnManager = useTurnManager(2, 1)
    })

    it('should record turn history', () => {
      turnManager.processTurnAfterMove(0)
      turnManager.processTurnAfterMove(1)
      turnManager.processTurnAfterMove(0)
      const history = turnManager.getTurnHistory()
      expect(history.length).toBe(3)
      expect(history[0]).toEqual({ player: 1, completedSquares: 0 })
      expect(history[1]).toEqual({ player: 2, completedSquares: 1 })
      expect(history[2]).toEqual({ player: 2, completedSquares: 0 })
    })

    it('should provide correct turn stats', () => {
      turnManager.processTurnAfterMove(0) // 1
      turnManager.processTurnAfterMove(1) // 2
      turnManager.processTurnAfterMove(0) // 2
      const stats = turnManager.getTurnStats()
      expect(stats.totalTurns).toBe(3)
      expect(stats.playerTurns[1]).toBe(1)
      expect(stats.playerTurns[2]).toBe(2)
      expect(stats.playerSquares[1]).toBe(0)
      expect(stats.playerSquares[2]).toBe(1)
    })

    it('should provide correct turn summary', () => {
      turnManager.processTurnAfterMove(0)
      turnManager.processTurnAfterMove(1)
      const summary = turnManager.getTurnSummary.value
      expect(summary.currentPlayer).toBe(2)
      expect(summary.turnNumber).toBe(2)
      expect(summary.nextPlayer).toBe(1)
      expect(summary.consecutiveTurns).toBe(1)
      expect(summary.totalTurns).toBe(2)
      expect(summary.playerStats[1]).toBe(1)
      expect(summary.playerStats[2]).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle only 1 player (always their turn)', () => {
      turnManager = useTurnManager(1, 1)
      expect(turnManager.currentPlayer.value).toBe(1)
      turnManager.processTurnAfterMove(0)
      expect(turnManager.currentPlayer.value).toBe(1)
      turnManager.processTurnAfterMove(2)
      expect(turnManager.currentPlayer.value).toBe(1)
    })

    it('should handle excessive consecutive turns', () => {
      turnManager = useTurnManager(2, 1)
      for (let i = 0; i < 5; i++) {
        turnManager.processTurnAfterMove(1) // Always complete a square
      }
      expect(turnManager.hasExcessiveConsecutiveTurns(5)).toBe(true)
      expect(turnManager.hasExcessiveConsecutiveTurns(6)).toBe(false)
    })

    it('should force switch turn', () => {
      turnManager = useTurnManager(2, 1)
      turnManager.processTurnAfterMove(1) // Player 1 again
      const result = turnManager.forceSwitchTurn()
      expect(result.turnChanged).toBe(true)
      expect(turnManager.currentPlayer.value).toBe(2)
      expect(result.reason).toMatch(/forced/)
    })

    it('should re-initialize mid-game', () => {
      turnManager = useTurnManager(2, 1)
      turnManager.processTurnAfterMove(0)
      turnManager.initializeTurn(2)
      expect(turnManager.currentPlayer.value).toBe(2)
      expect(turnManager.turnNumber.value).toBe(1)
      expect(turnManager.getTurnHistory().length).toBe(0)
    })
  })

  describe('Invalid/Unusual Moves', () => {
    beforeEach(() => {
      turnManager = useTurnManager(2, 1)
    })

    it('should handle negative squaresCompleted', () => {
      const result = turnManager.processTurnAfterMove(-1)
      expect(result.turnChanged).toBe(true)
      expect(turnManager.currentPlayer.value).toBe(2)
    })

    it('should handle large squaresCompleted (chain turn)', () => {
      const result = turnManager.processTurnAfterMove(99)
      expect(result.turnChanged).toBe(false)
      expect(turnManager.currentPlayer.value).toBe(1)
    })
  })

  describe('Game End Simulation', () => {
    it('should not advance turn if processTurnAfterMove is not called (simulate game end)', () => {
      turnManager = useTurnManager(2, 1)
      expect(turnManager.currentPlayer.value).toBe(1)
      // No moves processed, still player 1
      expect(turnManager.turnNumber.value).toBe(1)
    })
  })
}) 