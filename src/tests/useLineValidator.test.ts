import { describe, it, expect, beforeEach } from 'vitest'
import { useLineValidator } from '../composables/useLineValidator'

describe('useLineValidator', () => {
  let validator: ReturnType<typeof useLineValidator>
  let dots: Array<{ id: string; x: number; y: number }>
  let lines: Array<{ id: string; from: string; to: string; player?: number }>

  beforeEach(() => {
    // Create a 3x3 grid of dots
    dots = []
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        dots.push({ id: `${x}-${y}`, x, y })
      }
    }
    
    lines = []
    validator = useLineValidator(dots, lines, false, 3)
  })

  describe('adjacent dots validation', () => {
    it('should validate horizontal adjacency', () => {
      expect(validator.areDotsAdjacent('0-0', '1-0')).toBe(true)
      expect(validator.areDotsAdjacent('1-0', '2-0')).toBe(true)
      expect(validator.areDotsAdjacent('0-1', '1-1')).toBe(true)
    })

    it('should validate vertical adjacency', () => {
      expect(validator.areDotsAdjacent('0-0', '0-1')).toBe(true)
      expect(validator.areDotsAdjacent('1-0', '1-1')).toBe(true)
      expect(validator.areDotsAdjacent('2-1', '2-2')).toBe(true)
    })

    it('should reject non-adjacent dots', () => {
      expect(validator.areDotsAdjacent('0-0', '2-0')).toBe(false) // Horizontal gap
      expect(validator.areDotsAdjacent('0-0', '0-2')).toBe(false) // Vertical gap
      expect(validator.areDotsAdjacent('0-0', '2-2')).toBe(false) // Diagonal
      expect(validator.areDotsAdjacent('0-0', '1-1')).toBe(false) // Diagonal
    })
  })

  describe('duplicate line validation', () => {
    it('should detect existing lines', () => {
      lines.push({ id: '0-0-1-0', from: '0-0', to: '1-0', player: 1 })
      
      expect(validator.isLineDuplicate('0-0', '1-0')).toBe(true)
      expect(validator.isLineDuplicate('1-0', '0-0')).toBe(true) // Reverse order
    })

    it('should not detect non-existing lines as duplicates', () => {
      lines.push({ id: '0-0-1-0', from: '0-0', to: '1-0', player: 1 })
      
      expect(validator.isLineDuplicate('0-0', '0-1')).toBe(false)
      expect(validator.isLineDuplicate('1-0', '1-1')).toBe(false)
    })
  })

  describe('dot existence validation', () => {
    it('should validate existing dots', () => {
      expect(validator.doDotsExist('0-0', '1-0')).toBe(true)
      expect(validator.doDotsExist('2-2', '1-1')).toBe(true)
    })

    it('should reject non-existing dots', () => {
      expect(validator.doDotsExist('0-0', '3-0')).toBe(false) // Out of bounds
      expect(validator.doDotsExist('5-5', '1-1')).toBe(false) // Out of bounds
      expect(validator.doDotsExist('invalid', '1-1')).toBe(false) // Invalid format
    })
  })

  describe('same dot validation', () => {
    it('should detect when trying to connect same dot', () => {
      expect(validator.areDotsSame('0-0', '0-0')).toBe(true)
      expect(validator.areDotsSame('1-1', '1-1')).toBe(true)
    })

    it('should allow different dots', () => {
      expect(validator.areDotsSame('0-0', '1-0')).toBe(false)
      expect(validator.areDotsSame('1-1', '2-2')).toBe(false)
    })
  })

  describe('main validation function', () => {
    it('should validate correct moves', () => {
      const result = validator.validateLine('0-0', '1-0')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject moves when game is over', () => {
      const gameOverValidator = useLineValidator(dots, lines, true, 3)
      const result = gameOverValidator.validateLine('0-0', '1-0')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Game is already over')
    })

    it('should reject moves with non-existing dots', () => {
      const result = validator.validateLine('0-0', '5-5')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('One or both dots do not exist')
    })

    it('should reject moves connecting same dot', () => {
      const result = validator.validateLine('0-0', '0-0')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Cannot connect a dot to itself')
    })

    it('should reject non-adjacent moves', () => {
      const result = validator.validateLine('0-0', '2-0')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Dots must be adjacent (horizontally or vertically)')
    })

    it('should reject duplicate lines', () => {
      lines.push({ id: '0-0-1-0', from: '0-0', to: '1-0', player: 1 })
      const result = validator.validateLine('0-0', '1-0')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Line already exists between these dots')
    })
  })

  describe('valid moves computation', () => {
    it('should return all valid moves initially', () => {
      const validMoves = validator.getValidMoves.value
      
      // In a 3x3 grid, there should be 12 possible horizontal lines + 12 vertical lines = 24 total
      // But we're counting each line twice (A->B and B->A), so we need to divide by 2
      expect(validMoves.length).toBe(12) // 6 horizontal + 6 vertical unique lines
    })

    it('should reduce valid moves when lines are drawn', () => {
      lines.push({ id: '0-0-1-0', from: '0-0', to: '1-0', player: 1 })
      
      const updatedValidator = useLineValidator(dots, lines, false, 3)
      const validMoves = updatedValidator.getValidMoves.value
      
      expect(validMoves.length).toBe(11) // One less than before
    })

    it('should return empty array when game is over', () => {
      const gameOverValidator = useLineValidator(dots, lines, true, 3)
      const validMoves = gameOverValidator.getValidMoves.value
      
      expect(validMoves.length).toBe(0)
    })
  })

  describe('utility functions', () => {
    it('should check if move is valid', () => {
      expect(validator.isMoveValid('0-0', '1-0')).toBe(true)
      expect(validator.isMoveValid('0-0', '2-0')).toBe(false)
    })

    it('should get validation error messages', () => {
      expect(validator.getValidationError('0-0', '1-0')).toBeNull()
      expect(validator.getValidationError('0-0', '2-0')).toBe('Dots must be adjacent (horizontally or vertically)')
    })

    it('should check if valid moves are available', () => {
      expect(validator.hasValidMoves.value).toBe(true)
      
      const gameOverValidator = useLineValidator(dots, lines, true, 3)
      expect(gameOverValidator.hasValidMoves.value).toBe(false)
    })

    it('should count remaining moves', () => {
      expect(validator.remainingMoves.value).toBe(12)
      
      lines.push({ id: '0-0-1-0', from: '0-0', to: '1-0', player: 1 })
      const updatedValidator = useLineValidator(dots, lines, false, 3)
      expect(updatedValidator.remainingMoves.value).toBe(11)
    })
  })
}) 