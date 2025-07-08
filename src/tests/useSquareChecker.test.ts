import { describe, it, expect, beforeEach } from 'vitest'
import { useSquareChecker } from '../composables/useSquareChecker'

describe('useSquareChecker', () => {
  let squareChecker: ReturnType<typeof useSquareChecker>

  beforeEach(() => {
    squareChecker = useSquareChecker(4) // Use 4x4 grid for more comprehensive testing
  })

  describe('line existence checking', () => {
    it('should detect existing lines', () => {
      const lines = [
        { id: '1', from: '0-0', to: '1-0' },
        { id: '2', from: '1-0', to: '1-1' }
      ]
      
      expect(squareChecker.hasLine(lines, '0-0', '1-0')).toBe(true)
      expect(squareChecker.hasLine(lines, '1-0', '0-0')).toBe(true) // Reverse order
      expect(squareChecker.hasLine(lines, '1-0', '1-1')).toBe(true)
    })

    it('should not detect non-existing lines', () => {
      const lines = [{ id: '1', from: '0-0', to: '1-0' }]
      
      expect(squareChecker.hasLine(lines, '0-0', '0-1')).toBe(false)
      expect(squareChecker.hasLine(lines, '1-0', '1-1')).toBe(false)
    })
  })

  describe('affected squares detection', () => {
    it('should detect squares affected by horizontal lines', () => {
      const affected = squareChecker.getAffectedSquares('0-1', '1-1')
      
      expect(affected).toHaveLength(2)
      expect(affected).toContainEqual({ x: 0, y: 0 }) // Square above
      expect(affected).toContainEqual({ x: 0, y: 1 }) // Square below
    })

    it('should detect squares affected by vertical lines', () => {
      const affected = squareChecker.getAffectedSquares('1-0', '1-1')
      
      expect(affected).toHaveLength(2)
      expect(affected).toContainEqual({ x: 0, y: 0 }) // Square to the left
      expect(affected).toContainEqual({ x: 1, y: 0 }) // Square to the right
    })

    it('should handle edge cases correctly', () => {
      // Top edge horizontal line
      const topEdge = squareChecker.getAffectedSquares('0-0', '1-0')
      expect(topEdge).toHaveLength(1)
      expect(topEdge).toContainEqual({ x: 0, y: 0 }) // Only square below
      
      // Bottom edge horizontal line
      const bottomEdge = squareChecker.getAffectedSquares('0-3', '1-3')
      expect(bottomEdge).toHaveLength(1)
      expect(bottomEdge).toContainEqual({ x: 0, y: 2 }) // Only square above
      
      // Left edge vertical line
      const leftEdge = squareChecker.getAffectedSquares('0-0', '0-1')
      expect(leftEdge).toHaveLength(1)
      expect(leftEdge).toContainEqual({ x: 0, y: 0 }) // Only square to the right
      
      // Right edge vertical line
      const rightEdge = squareChecker.getAffectedSquares('3-0', '3-1')
      expect(rightEdge).toHaveLength(1)
      expect(rightEdge).toContainEqual({ x: 2, y: 0 }) // Only square to the left
    })
  })

  describe('square completion checking', () => {
    it('should detect completed squares', () => {
      const lines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top
        { id: '2', from: '1-0', to: '1-1' }, // Right
        { id: '3', from: '1-1', to: '0-1' }, // Bottom
        { id: '4', from: '0-1', to: '0-0' }  // Left
      ]
      
      expect(squareChecker.isSquareCompleted(lines, 0, 0)).toBe(true)
    })

    it('should not detect incomplete squares', () => {
      const lines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top
        { id: '2', from: '1-0', to: '1-1' }, // Right
        { id: '3', from: '1-1', to: '0-1' }  // Bottom (missing left)
      ]
      
      expect(squareChecker.isSquareCompleted(lines, 0, 0)).toBe(false)
    })

    it('should handle squares with different line orders', () => {
      const lines = [
        { id: '1', from: '1-1', to: '0-1' }, // Bottom
        { id: '2', from: '0-0', to: '0-1' }, // Left
        { id: '3', from: '0-0', to: '1-0' }, // Top
        { id: '4', from: '1-0', to: '1-1' }  // Right
      ]
      
      expect(squareChecker.isSquareCompleted(lines, 0, 0)).toBe(true)
    })
  })

  describe('square lines identification', () => {
    it('should return correct lines for a square', () => {
      const lines = squareChecker.getSquareLines(0, 0)
      
      expect(lines).toHaveLength(4)
      expect(lines).toContain('0-0-1-0') // Top
      expect(lines).toContain('1-0-1-1') // Right
      expect(lines).toContain('1-1-0-1') // Bottom
      expect(lines).toContain('0-1-0-0') // Left
    })
  })

  describe('completed squares detection after new line - 0 adjacent squares', () => {
    it('should return empty array when no squares are completed', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' } // Only one line
      ]
      
      const newLine = { id: '2', from: '1-0', to: '1-1' } // Second line
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(0)
    })

    it('should return empty array when line is isolated', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top
        { id: '2', from: '1-0', to: '1-1' }  // Right
      ]
      
      const newLine = { id: '3', from: '0-0', to: '0-1' } // Isolated line
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(0)
    })

    it('should return empty array when line creates no complete squares', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top
        { id: '2', from: '1-0', to: '1-1' }, // Right
        { id: '3', from: '1-1', to: '0-1' }  // Bottom
      ]
      
      const newLine = { id: '4', from: '0-0', to: '0-1' } // Creates L-shape, no complete square
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(0)
    })

    it('should return empty array when line is in middle of grid with no adjacent squares', () => {
      const existingLines = [
        { id: '1', from: '1-1', to: '2-1' } // Middle horizontal line
      ]
      
      const newLine = { id: '2', from: '1-1', to: '1-2' } // Middle vertical line
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(0)
    })
  })

  describe('completed squares detection after new line - 1 adjacent square', () => {
    it('should detect single completed square when line completes it', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top
        { id: '2', from: '1-0', to: '1-1' }, // Right
        { id: '3', from: '1-1', to: '0-1' }  // Bottom
      ]
      
      const newLine = { id: '4', from: '0-1', to: '0-0' } // Left (completes square)
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(1)
      expect(completed[0]).toEqual({
        topLeftX: 0,
        topLeftY: 0,
        lines: ['0-0-1-0', '1-0-1-1', '1-1-0-1', '0-1-0-0']
      })
    })

    it('should detect single completed square in corner position', () => {
      const existingLines = [
        { id: '1', from: '2-2', to: '3-2' }, // Top
        { id: '2', from: '3-2', to: '3-3' }, // Right
        { id: '3', from: '3-3', to: '2-3' }  // Bottom
      ]
      
      const newLine = { id: '4', from: '2-3', to: '2-2' } // Left (completes corner square)
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(1)
      expect(completed[0]).toEqual({
        topLeftX: 2,
        topLeftY: 2,
        lines: ['2-2-3-2', '3-2-3-3', '3-3-2-3', '2-3-2-2']
      })
    })

    it('should detect single completed square when line is the last needed line', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top
        { id: '2', from: '0-0', to: '0-1' }, // Left
        { id: '3', from: '1-0', to: '1-1' }  // Right
      ]
      
      const newLine = { id: '4', from: '0-1', to: '1-1' } // Bottom (completes square)
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(1)
      expect(completed[0]).toEqual({
        topLeftX: 0,
        topLeftY: 0,
        lines: ['0-0-1-0', '1-0-1-1', '1-1-0-1', '0-1-0-0']
      })
    })

    it('should detect single completed square when line affects multiple squares but only completes one', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top of first square
        { id: '2', from: '1-0', to: '1-1' }, // Right of first square
        { id: '3', from: '1-1', to: '0-1' }, // Bottom of first square
        { id: '4', from: '1-0', to: '2-0' }, // Top of second square (incomplete)
        { id: '5', from: '2-0', to: '2-1' }  // Right of second square (incomplete)
      ]
      
      const newLine = { id: '6', from: '0-1', to: '0-0' } // Left of first square (completes only first)
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(1)
      expect(completed[0]).toEqual({
        topLeftX: 0,
        topLeftY: 0,
        lines: ['0-0-1-0', '1-0-1-1', '1-1-0-1', '0-1-0-0']
      })
    })
  })

  describe('completed squares detection after new line - 2 adjacent squares', () => {
    it('should detect two adjacent squares completed by single line', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top of first square
        { id: '2', from: '1-0', to: '1-1' }, // Right of first square
        { id: '3', from: '1-1', to: '0-1' }, // Bottom of first square
        { id: '4', from: '0-1', to: '0-0' }, // Left of first square (completes first)
        { id: '5', from: '1-0', to: '2-0' }, // Top of second square
        { id: '6', from: '2-0', to: '2-1' }, // Right of second square
        { id: '7', from: '2-1', to: '1-1' }  // Bottom of second square
      ]
      
      const newLine = { id: '8', from: '1-1', to: '1-0' } // Left of second square (completes second)
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(2)
      expect(completed).toContainEqual({
        topLeftX: 0,
        topLeftY: 0,
        lines: ['0-0-1-0', '1-0-1-1', '1-1-0-1', '0-1-0-0']
      })
      expect(completed).toContainEqual({
        topLeftX: 1,
        topLeftY: 0,
        lines: ['1-0-2-0', '2-0-2-1', '2-1-1-1', '1-1-1-0']
      })
    })

    it('should detect two squares completed when line is shared edge', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top of first square
        { id: '2', from: '1-0', to: '1-1' }, // Right of first square
        { id: '3', from: '1-1', to: '0-1' }, // Bottom of first square
        { id: '4', from: '0-1', to: '0-0' }, // Left of first square (completes first)
        { id: '5', from: '1-0', to: '2-0' }, // Top of second square
        { id: '6', from: '2-0', to: '2-1' }, // Right of second square
        { id: '7', from: '2-1', to: '1-1' }, // Bottom of second square
        { id: '8', from: '1-1', to: '1-0' }  // Left of second square (completes second)
      ]
      
      const newLine = { id: '9', from: '1-1', to: '1-2' } // Vertical line completing two squares below
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(2)
      expect(completed).toContainEqual({
        topLeftX: 0,
        topLeftY: 1,
        lines: ['0-1-1-1', '1-1-1-2', '1-2-0-2', '0-2-0-1']
      })
      expect(completed).toContainEqual({
        topLeftX: 1,
        topLeftY: 1,
        lines: ['1-1-2-1', '2-1-2-2', '2-2-1-2', '1-2-1-1']
      })
    })

    it('should detect two squares completed in L-shaped configuration', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top of first square
        { id: '2', from: '1-0', to: '1-1' }, // Right of first square
        { id: '3', from: '1-1', to: '0-1' }, // Bottom of first square
        { id: '4', from: '0-1', to: '0-0' }, // Left of first square (completes first)
        { id: '5', from: '1-1', to: '1-2' }, // Right of second square
        { id: '6', from: '1-2', to: '0-2' }, // Bottom of second square
        { id: '7', from: '0-2', to: '0-1' }  // Left of second square
      ]
      
      const newLine = { id: '8', from: '0-1', to: '1-1' } // Shared edge completing both squares
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(2)
      expect(completed).toContainEqual({
        topLeftX: 0,
        topLeftY: 0,
        lines: ['0-0-1-0', '1-0-1-1', '1-1-0-1', '0-1-0-0']
      })
      expect(completed).toContainEqual({
        topLeftX: 0,
        topLeftY: 1,
        lines: ['0-1-1-1', '1-1-1-2', '1-2-0-2', '0-2-0-1']
      })
    })

    it('should detect two squares completed when line creates cross pattern', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '2-0' }, // Long horizontal line
        { id: '2', from: '0-0', to: '0-2' }, // Long vertical line
        { id: '3', from: '2-0', to: '2-2' }, // Right vertical line
        { id: '4', from: '0-2', to: '2-2' }  // Bottom horizontal line
      ]
      
      const newLine = { id: '5', from: '1-0', to: '1-2' } // Middle vertical line completing both squares
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(2)
      expect(completed).toContainEqual({
        topLeftX: 0,
        topLeftY: 0,
        lines: ['0-0-1-0', '1-0-1-1', '1-1-0-1', '0-1-0-0']
      })
      expect(completed).toContainEqual({
        topLeftX: 1,
        topLeftY: 0,
        lines: ['1-0-2-0', '2-0-2-1', '2-1-1-1', '1-1-1-0']
      })
    })

    it('should detect two squares completed in diagonal configuration', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top of first square
        { id: '2', from: '1-0', to: '1-1' }, // Right of first square
        { id: '3', from: '1-1', to: '0-1' }, // Bottom of first square
        { id: '4', from: '0-1', to: '0-0' }, // Left of first square (completes first)
        { id: '5', from: '1-1', to: '2-1' }, // Top of second square
        { id: '6', from: '2-1', to: '2-2' }, // Right of second square
        { id: '7', from: '2-2', to: '1-2' }, // Bottom of second square
        { id: '8', from: '1-2', to: '1-1' }  // Left of second square (completes second)
      ]
      
      const newLine = { id: '9', from: '1-1', to: '1-2' } // Vertical line completing both squares
      
      const completed = squareChecker.checkForCompletedSquares(newLine, existingLines)
      
      expect(completed).toHaveLength(2)
      expect(completed).toContainEqual({
        topLeftX: 0,
        topLeftY: 1,
        lines: ['0-1-1-1', '1-1-1-2', '1-2-0-2', '0-2-0-1']
      })
      expect(completed).toContainEqual({
        topLeftX: 1,
        topLeftY: 1,
        lines: ['1-1-2-1', '2-1-2-2', '2-2-1-2', '1-2-1-1']
      })
    })
  })

  describe('potential move analysis', () => {
    it('should detect squares that would be completed by a move', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top
        { id: '2', from: '1-0', to: '1-1' }, // Right
        { id: '3', from: '1-1', to: '0-1' }  // Bottom
      ]
      
      const potentialLine = { from: '0-1', to: '0-0' } // Left (would complete square)
      
      const completed = squareChecker.getSquaresCompletedByMove(potentialLine, existingLines)
      
      expect(completed).toHaveLength(1)
      expect(completed[0]).toEqual({
        topLeftX: 0,
        topLeftY: 0,
        lines: ['0-0-1-0', '1-0-1-1', '1-1-0-1', '0-1-0-0']
      })
    })

    it('should detect multiple squares that would be completed by a move', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top of first square
        { id: '2', from: '1-0', to: '1-1' }, // Right of first square
        { id: '3', from: '1-1', to: '0-1' }, // Bottom of first square
        { id: '4', from: '0-1', to: '0-0' }, // Left of first square (completes first)
        { id: '5', from: '1-1', to: '1-2' }, // Right of second square
        { id: '6', from: '1-2', to: '0-2' }, // Bottom of second square
        { id: '7', from: '0-2', to: '0-1' }  // Left of second square
      ]
      
      const potentialLine = { from: '0-1', to: '1-1' } // Shared edge (would complete both squares)
      
      const completed = squareChecker.getSquaresCompletedByMove(potentialLine, existingLines)
      
      expect(completed).toHaveLength(2)
      expect(completed).toContainEqual({
        topLeftX: 0,
        topLeftY: 0,
        lines: ['0-0-1-0', '1-0-1-1', '1-1-0-1', '0-1-0-0']
      })
      expect(completed).toContainEqual({
        topLeftX: 0,
        topLeftY: 1,
        lines: ['0-1-1-1', '1-1-1-2', '1-2-0-2', '0-2-0-1']
      })
    })

    it('should check if a move would complete any squares', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top
        { id: '2', from: '1-0', to: '1-1' }, // Right
        { id: '3', from: '1-1', to: '0-1' }  // Bottom
      ]
      
      const completingMove = { from: '0-1', to: '0-0' } // Would complete square
      const nonCompletingMove = { from: '0-0', to: '0-1' } // Would not complete square
      
      expect(squareChecker.wouldCompleteAnySquares(completingMove, existingLines)).toBe(true)
      expect(squareChecker.wouldCompleteAnySquares(nonCompletingMove, existingLines)).toBe(false)
    })

    it('should detect moves that would complete multiple squares', () => {
      const existingLines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top of first square
        { id: '2', from: '1-0', to: '1-1' }, // Right of first square
        { id: '3', from: '1-1', to: '0-1' }, // Bottom of first square
        { id: '4', from: '0-1', to: '0-0' }, // Left of first square (completes first)
        { id: '5', from: '1-1', to: '1-2' }, // Right of second square
        { id: '6', from: '1-2', to: '0-2' }, // Bottom of second square
        { id: '7', from: '0-2', to: '0-1' }  // Left of second square
      ]
      
      const multiCompletingMove = { from: '0-1', to: '1-1' } // Would complete both squares
      
      expect(squareChecker.wouldCompleteAnySquares(multiCompletingMove, existingLines)).toBe(true)
    })
  })

  describe('all completed squares', () => {
    it('should return all currently completed squares', () => {
      const lines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top of first square
        { id: '2', from: '1-0', to: '1-1' }, // Right of first square
        { id: '3', from: '1-1', to: '0-1' }, // Bottom of first square
        { id: '4', from: '0-1', to: '0-0' }, // Left of first square (completes first)
        { id: '5', from: '1-0', to: '2-0' }, // Top of second square
        { id: '6', from: '2-0', to: '2-1' }, // Right of second square
        { id: '7', from: '2-1', to: '1-1' }, // Bottom of second square
        { id: '8', from: '1-1', to: '1-0' }  // Left of second square (completes second)
      ]
      
      const completed = squareChecker.getAllCompletedSquares(lines)
      
      expect(completed).toHaveLength(2)
      expect(completed).toContainEqual({
        topLeftX: 0,
        topLeftY: 0,
        lines: ['0-0-1-0', '1-0-1-1', '1-1-0-1', '0-1-0-0']
      })
      expect(completed).toContainEqual({
        topLeftX: 1,
        topLeftY: 0,
        lines: ['1-0-2-0', '2-0-2-1', '2-1-1-1', '1-1-1-0']
      })
    })

    it('should count completed squares correctly', () => {
      const lines = [
        { id: '1', from: '0-0', to: '1-0' },
        { id: '2', from: '1-0', to: '1-1' },
        { id: '3', from: '1-1', to: '0-1' },
        { id: '4', from: '0-1', to: '0-0' }
      ]
      
      expect(squareChecker.getCompletedSquareCount(lines)).toBe(1)
    })

    it('should count multiple completed squares correctly', () => {
      const lines = [
        { id: '1', from: '0-0', to: '1-0' }, // Top of first square
        { id: '2', from: '1-0', to: '1-1' }, // Right of first square
        { id: '3', from: '1-1', to: '0-1' }, // Bottom of first square
        { id: '4', from: '0-1', to: '0-0' }, // Left of first square (completes first)
        { id: '5', from: '1-0', to: '2-0' }, // Top of second square
        { id: '6', from: '2-0', to: '2-1' }, // Right of second square
        { id: '7', from: '2-1', to: '1-1' }, // Bottom of second square
        { id: '8', from: '1-1', to: '1-0' }  // Left of second square (completes second)
      ]
      
      expect(squareChecker.getCompletedSquareCount(lines)).toBe(2)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle empty lines array', () => {
      const completed = squareChecker.getAllCompletedSquares([])
      expect(completed).toHaveLength(0)
      expect(squareChecker.getCompletedSquareCount([])).toBe(0)
    })

    it('should handle single line', () => {
      const lines = [{ id: '1', from: '0-0', to: '1-0' }]
      const completed = squareChecker.getAllCompletedSquares(lines)
      expect(completed).toHaveLength(0)
    })

    it('should handle invalid coordinates gracefully', () => {
      // This should not throw an error
      expect(() => {
        squareChecker.getAffectedSquares('invalid', 'also-invalid')
      }).not.toThrow()
    })

    it('should handle lines outside grid boundaries', () => {
      const lines = [
        { id: '1', from: '0-0', to: '1-0' },
        { id: '2', from: '1-0', to: '1-1' },
        { id: '3', from: '1-1', to: '0-1' }
      ]
      
      // Line that would be outside grid
      const newLine = { id: '4', from: '3-3', to: '4-3' }
      
      const completed = squareChecker.checkForCompletedSquares(newLine, lines)
      expect(completed).toHaveLength(0)
    })

    it('should handle duplicate lines gracefully', () => {
      const lines = [
        { id: '1', from: '0-0', to: '1-0' },
        { id: '2', from: '1-0', to: '0-0' }, // Duplicate in reverse
        { id: '3', from: '1-0', to: '1-1' },
        { id: '4', from: '1-1', to: '0-1' }
      ]
      
      const newLine = { id: '5', from: '0-1', to: '0-0' }
      
      const completed = squareChecker.checkForCompletedSquares(newLine, lines)
      expect(completed).toHaveLength(1)
    })

    it('should handle lines with same endpoints', () => {
      const lines = [
        { id: '1', from: '0-0', to: '1-0' },
        { id: '2', from: '1-0', to: '1-1' },
        { id: '3', from: '1-1', to: '0-1' }
      ]
      
      const newLine = { id: '4', from: '0-0', to: '0-0' } // Same point
      
      const completed = squareChecker.checkForCompletedSquares(newLine, lines)
      expect(completed).toHaveLength(0)
    })
  })

  describe('grid size variations', () => {
    it('should work with 3x3 grid', () => {
      const smallGridChecker = useSquareChecker(3)
      const lines = [
        { id: '1', from: '0-0', to: '1-0' },
        { id: '2', from: '1-0', to: '1-1' },
        { id: '3', from: '1-1', to: '0-1' },
        { id: '4', from: '0-1', to: '0-0' }
      ]
      
      const completed = smallGridChecker.getAllCompletedSquares(lines)
      expect(completed).toHaveLength(1)
    })

    it('should work with 5x5 grid', () => {
      const largeGridChecker = useSquareChecker(5)
      const lines = [
        { id: '1', from: '0-0', to: '1-0' },
        { id: '2', from: '1-0', to: '1-1' },
        { id: '3', from: '1-1', to: '0-1' },
        { id: '4', from: '0-1', to: '0-0' }
      ]
      
      const completed = largeGridChecker.getAllCompletedSquares(lines)
      expect(completed).toHaveLength(1)
    })
  })
}) 