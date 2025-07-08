import { computed } from 'vue'

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

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function useLineValidator(
  dots: Dot[],
  lines: Line[],
  gameOver: boolean,
  gridSize: number = 5
) {
  // Check if two dots are adjacent (horizontally or vertically)
  const areDotsAdjacent = (fromId: string, toId: string): boolean => {
    const from = dots.find(dot => dot.id === fromId)
    const to = dots.find(dot => dot.id === toId)
    
    if (!from || !to) return false
    
    // Horizontal adjacency
    if (from.y === to.y && Math.abs(from.x - to.x) === 1) {
      return true
    }
    
    // Vertical adjacency
    if (from.x === to.x && Math.abs(from.y - to.y) === 1) {
      return true
    }
    
    return false
  }

  // Check if a line already exists
  const isLineDuplicate = (fromId: string, toId: string): boolean => {
    return lines.some(line => 
      (line.from === fromId && line.to === toId) ||
      (line.from === toId && line.to === fromId)
    )
  }

  // Check if dots exist
  const doDotsExist = (fromId: string, toId: string): boolean => {
    const fromExists = dots.some(dot => dot.id === fromId)
    const toExists = dots.some(dot => dot.id === toId)
    return fromExists && toExists
  }

  // Check if dots are the same
  const areDotsSame = (fromId: string, toId: string): boolean => {
    return fromId === toId
  }

  // Main validation function
  const validateLine = (fromId: string, toId: string): ValidationResult => {
    // Check if game is over
    if (gameOver) {
      return {
        isValid: false,
        error: 'Game is already over'
      }
    }

    // Check if dots exist
    if (!doDotsExist(fromId, toId)) {
      return {
        isValid: false,
        error: 'One or both dots do not exist'
      }
    }

    // Check if trying to connect same dot
    if (areDotsSame(fromId, toId)) {
      return {
        isValid: false,
        error: 'Cannot connect a dot to itself'
      }
    }

    // Check if dots are adjacent
    if (!areDotsAdjacent(fromId, toId)) {
      return {
        isValid: false,
        error: 'Dots must be adjacent (horizontally or vertically)'
      }
    }

    // Check if line already exists
    if (isLineDuplicate(fromId, toId)) {
      return {
        isValid: false,
        error: 'Line already exists between these dots'
      }
    }

    return { isValid: true }
  }

  // Get all valid moves for the current game state
  const getValidMoves = computed(() => {
    const validMoves: Array<{ from: string; to: string }> = []
    
    for (const fromDot of dots) {
      for (const toDot of dots) {
        if (fromDot.id !== toDot.id) {
          const validation = validateLine(fromDot.id, toDot.id)
          if (validation.isValid) {
            validMoves.push({
              from: fromDot.id,
              to: toDot.id
            })
          }
        }
      }
    }
    
    return validMoves
  })

  // Check if a specific move is valid
  const isMoveValid = (fromId: string, toId: string): boolean => {
    return validateLine(fromId, toId).isValid
  }

  // Get validation error message for a move
  const getValidationError = (fromId: string, toId: string): string | null => {
    const validation = validateLine(fromId, toId)
    return validation.error || null
  }

  // Check if any valid moves are available
  const hasValidMoves = computed(() => {
    return getValidMoves.value.length > 0
  })

  // Get count of remaining valid moves
  const remainingMoves = computed(() => {
    return getValidMoves.value.length
  })

  return {
    validateLine,
    isMoveValid,
    getValidationError,
    getValidMoves,
    hasValidMoves,
    remainingMoves,
    areDotsAdjacent,
    isLineDuplicate,
    doDotsExist,
    areDotsSame
  }
} 