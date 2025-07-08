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

export interface CompletedSquare {
  topLeftX: number
  topLeftY: number
  lines: string[]
}

export function useSquareChecker(gridSize: number = 5) {
  // Check if a line exists between two dots
  const hasLine = (lines: Line[], fromId: string, toId: string): boolean => {
    return lines.some(line => 
      (line.from === fromId && line.to === toId) ||
      (line.from === toId && line.to === fromId)
    )
  }

  // Get all possible squares that could be affected by a new line
  const getAffectedSquares = (fromId: string, toId: string): Array<{ x: number; y: number }> => {
    const [fromX, fromY] = fromId.split('-').map(Number)
    const [toX, toY] = toId.split('-').map(Number)
    
    const affectedSquares: Array<{ x: number; y: number }> = []
    
    // Horizontal line
    if (fromY === toY) {
      const y = fromY
      const minX = Math.min(fromX, toX)
      
      // Square above the line
      if (y > 0) {
        affectedSquares.push({ x: minX, y: y - 1 })
      }
      
      // Square below the line
      if (y < gridSize - 1) {
        affectedSquares.push({ x: minX, y: y })
      }
    }
    
    // Vertical line
    if (fromX === toX) {
      const x = fromX
      const minY = Math.min(fromY, toY)
      
      // Square to the left of the line
      if (x > 0) {
        affectedSquares.push({ x: x - 1, y: minY })
      }
      
      // Square to the right of the line
      if (x < gridSize - 1) {
        affectedSquares.push({ x: x, y: minY })
      }
    }
    
    return affectedSquares
  }

  // Check if a specific square is completed
  const isSquareCompleted = (
    lines: Line[], 
    topLeftX: number, 
    topLeftY: number
  ): boolean => {
    const topLeft = `${topLeftX}-${topLeftY}`
    const topRight = `${topLeftX + 1}-${topLeftY}`
    const bottomLeft = `${topLeftX}-${topLeftY + 1}`
    const bottomRight = `${topLeftX + 1}-${topLeftY + 1}`
    
    // Check all four sides of the square
    const hasTop = hasLine(lines, topLeft, topRight)
    const hasRight = hasLine(lines, topRight, bottomRight)
    const hasBottom = hasLine(lines, bottomRight, bottomLeft)
    const hasLeft = hasLine(lines, bottomLeft, topLeft)
    
    return hasTop && hasRight && hasBottom && hasLeft
  }

  // Get the lines that form a square
  const getSquareLines = (topLeftX: number, topLeftY: number): string[] => {
    const topLeft = `${topLeftX}-${topLeftY}`
    const topRight = `${topLeftX + 1}-${topLeftY}`
    const bottomLeft = `${topLeftX}-${topLeftY + 1}`
    const bottomRight = `${topLeftX + 1}-${topLeftY + 1}`
    
    return [
      `${topLeft}-${topRight}`,
      `${topRight}-${bottomRight}`,
      `${bottomRight}-${bottomLeft}`,
      `${bottomLeft}-${topLeft}`
    ]
  }

  // Main function: check for completed squares after drawing a new line
  const checkForCompletedSquares = (
    newLine: Line,
    existingLines: Line[]
  ): CompletedSquare[] => {
    const allLines = [...existingLines, newLine]
    const affectedSquares = getAffectedSquares(newLine.from, newLine.to)
    const completedSquares: CompletedSquare[] = []
    
    for (const square of affectedSquares) {
      if (isSquareCompleted(allLines, square.x, square.y)) {
        completedSquares.push({
          topLeftX: square.x,
          topLeftY: square.y,
          lines: getSquareLines(square.x, square.y)
        })
      }
    }
    
    return completedSquares
  }

  // Check if a specific square would be completed by a potential line
  const wouldCompleteSquare = (
    potentialLine: { from: string; to: string },
    existingLines: Line[],
    topLeftX: number,
    topLeftY: number
  ): boolean => {
    const testLines = [...existingLines, { id: '', from: potentialLine.from, to: potentialLine.to }]
    return isSquareCompleted(testLines, topLeftX, topLeftY)
  }

  // Get all squares that would be completed by a potential move
  const getSquaresCompletedByMove = (
    potentialLine: { from: string; to: string },
    existingLines: Line[]
  ): CompletedSquare[] => {
    const affectedSquares = getAffectedSquares(potentialLine.from, potentialLine.to)
    const completedSquares: CompletedSquare[] = []
    
    for (const square of affectedSquares) {
      if (wouldCompleteSquare(potentialLine, existingLines, square.x, square.y)) {
        completedSquares.push({
          topLeftX: square.x,
          topLeftY: square.y,
          lines: getSquareLines(square.x, square.y)
        })
      }
    }
    
    return completedSquares
  }

  // Get all currently completed squares
  const getAllCompletedSquares = (lines: Line[]): CompletedSquare[] => {
    const completedSquares: CompletedSquare[] = []
    
    for (let y = 0; y < gridSize - 1; y++) {
      for (let x = 0; x < gridSize - 1; x++) {
        if (isSquareCompleted(lines, x, y)) {
          completedSquares.push({
            topLeftX: x,
            topLeftY: y,
            lines: getSquareLines(x, y)
          })
        }
      }
    }
    
    return completedSquares
  }

  // Count completed squares
  const getCompletedSquareCount = (lines: Line[]): number => {
    return getAllCompletedSquares(lines).length
  }

  // Check if a move would complete any squares (for AI/hint system)
  const wouldCompleteAnySquares = (
    potentialLine: { from: string; to: string },
    existingLines: Line[]
  ): boolean => {
    return getSquaresCompletedByMove(potentialLine, existingLines).length > 0
  }

  return {
    checkForCompletedSquares,
    getSquaresCompletedByMove,
    getAllCompletedSquares,
    getCompletedSquareCount,
    wouldCompleteAnySquares,
    isSquareCompleted,
    getAffectedSquares,
    hasLine,
    getSquareLines
  }
} 