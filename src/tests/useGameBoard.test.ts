import { describe, it, expect, beforeEach } from 'vitest'
import { useGameBoard } from '../composables/useGameBoard'

describe('useGameBoard', () => {
  let gameBoard: ReturnType<typeof useGameBoard>

  beforeEach(() => {
    gameBoard = useGameBoard(3) // Use 3x3 grid for testing
    gameBoard.initializeBoard()
  })

  it('should initialize with correct number of dots', () => {
    expect(gameBoard.dots.value).toHaveLength(9) // 3x3 = 9 dots
  })

  it('should initialize with correct number of squares', () => {
    expect(gameBoard.squares.value).toHaveLength(4) // 2x2 = 4 squares
  })

  it('should start with player 1', () => {
    expect(gameBoard.currentPlayer.value).toBe(1)
  })

  it('should start with zero scores', () => {
    expect(gameBoard.scores.value[1]).toBe(0)
    expect(gameBoard.scores.value[2]).toBe(0)
  })

  it('should allow drawing a line', () => {
    const result = gameBoard.drawLine('0-0', '1-0')
    expect(result).toBe(true)
    expect(gameBoard.lines.value).toHaveLength(1)
  })

  it('should not allow drawing the same line twice', () => {
    gameBoard.drawLine('0-0', '1-0')
    const result = gameBoard.drawLine('0-0', '1-0')
    expect(result).toBe(false)
    expect(gameBoard.lines.value).toHaveLength(1)
  })

  it('should switch turns when no square is completed', () => {
    gameBoard.drawLine('0-0', '1-0')
    expect(gameBoard.currentPlayer.value).toBe(2)
  })

  it('should complete a square and award points', () => {
    // Draw three sides of a square
    gameBoard.drawLine('0-0', '1-0') // Player 1
    gameBoard.drawLine('1-0', '1-1') // Player 2
    gameBoard.drawLine('1-1', '0-1') // Player 1
    
    // Draw the fourth side to complete the square
    gameBoard.drawLine('0-1', '0-0') // Player 2 should get the square
    
    expect(gameBoard.scores.value[2]).toBe(1)
    expect(gameBoard.currentPlayer.value).toBe(2) // Should still be player 2's turn
  })

  it('should detect game over when all squares are filled', () => {
    // Fill all squares in a 2x2 grid
    gameBoard.drawLine('0-0', '1-0')
    gameBoard.drawLine('1-0', '1-1')
    gameBoard.drawLine('1-1', '0-1')
    gameBoard.drawLine('0-1', '0-0')
    
    gameBoard.drawLine('1-0', '2-0')
    gameBoard.drawLine('2-0', '2-1')
    gameBoard.drawLine('2-1', '1-1')
    
    gameBoard.drawLine('0-1', '1-1')
    gameBoard.drawLine('1-1', '1-2')
    gameBoard.drawLine('1-2', '0-2')
    gameBoard.drawLine('0-2', '0-1')
    
    gameBoard.drawLine('1-1', '2-1')
    gameBoard.drawLine('2-1', '2-2')
    gameBoard.drawLine('2-2', '1-2')
    gameBoard.drawLine('1-2', '1-1')
    
    expect(gameBoard.gameOver.value).toBe(true)
  })

  it('should determine the correct winner', () => {
    // Simulate a game where player 1 wins
    gameBoard.scores.value[1] = 3
    gameBoard.scores.value[2] = 1
    gameBoard.gameOver.value = true
    
    expect(gameBoard.winner.value).toBe(1)
  })
}) 