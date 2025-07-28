import { ref, computed, type Ref } from 'vue'
import type { Line, Square } from '@/types'

export function useAIOpponent(
  gridSize: Ref<number>,
  drawnLines: Ref<Line[]>,
  canPlay: Ref<boolean>
) {
  const isThinking = ref(false)

  const getPossibleMoves = (lines = drawnLines.value) => {
    const moves: { startDot: string; endDot: string }[] = []
    const drawnLineIds = new Set(lines.map(l => l.id))

    for (let y = 0; y < gridSize.value; y++) {
      for (let x = 0; x < gridSize.value; x++) {
        // Horizontal
        if (x < gridSize.value - 1) {
          const startDot = `${y}-${x}`
          const endDot = `${y}-${x + 1}`
          const id = [startDot, endDot].sort().join('-')
          if (!drawnLineIds.has(id)) {
            moves.push({ startDot, endDot })
          }
        }
        // Vertical
        if (y < gridSize.value - 1) {
          const startDot = `${y}-${x}`
          const endDot = `${y + 1}-${x}`
          const id = [startDot, endDot].sort().join('-')
          if (!drawnLineIds.has(id)) {
            moves.push({ startDot, endDot })
          }
        }
      }
    }
    return moves
  }

  const checkForCompletedSquares = (
    newLine: { startDot: string; endDot: string },
    currentLines: Line[]
  ) => {
    const foundSquares = []
    const [y1, x1] = newLine.startDot.split('-').map(Number)
    const [y2, x2] = newLine.endDot.split('-').map(Number)

    const lineExists = (dot1: string, dot2: string) =>
      currentLines.some(l => l.id === [dot1, dot2].sort().join('-'))

    if (y1 === y2) { // Horizontal line
      if (y1 > 0) {
        const c1 = `${y1 - 1}-${x1}`, c2 = `${y1 - 1}-${x2}`
        if (lineExists(newLine.startDot, c1) && lineExists(newLine.endDot, c2) && lineExists(c1, c2)) {
          foundSquares.push({ id: `sq-${y1 - 1}-${x1}` })
        }
      }
      if (y1 < gridSize.value - 1) {
        const c3 = `${y1 + 1}-${x1}`, c4 = `${y1 + 1}-${x2}`
        if (lineExists(newLine.startDot, c3) && lineExists(newLine.endDot, c4) && lineExists(c3, c4)) {
          foundSquares.push({ id: `sq-${y1}-${x1}` })
        }
      }
    } else { // Vertical line
      if (x1 > 0) {
        const c1 = `${y1}-${x1 - 1}`, c2 = `${y2}-${x2 - 1}`
        if (lineExists(newLine.startDot, c1) && lineExists(newLine.endDot, c2) && lineExists(c1, c2)) {
          foundSquares.push({ id: `sq-${y1}-${x1 - 1}` })
        }
      }
      if (x1 < gridSize.value - 1) {
        const c3 = `${y1}-${x1 + 1}`, c4 = `${y2}-${x2 + 1}`
        if (lineExists(newLine.startDot, c3) && lineExists(newLine.endDot, c4) && lineExists(c3, c4)) {
          foundSquares.push({ id: `sq-${y1}-${x1}` })
        }
      }
    }
    return foundSquares
  }

  const findBestMove = () => {
    const possibleMoves = getPossibleMoves()
    if (possibleMoves.length === 0) return null

    // 1. Winning move: find any move that completes a square
    const winningMoves = possibleMoves.filter(move => {
      const tempLines = [...drawnLines.value, { ...move, id: [move.startDot, move.endDot].sort().join('-'), player: 2 }]
      return checkForCompletedSquares(move, tempLines).length > 0
    })

    if (winningMoves.length > 0) {
      return winningMoves[Math.floor(Math.random() * winningMoves.length)]; // Pick a random winning move
    }

    // 2. Defensive move: find moves that don't give the opponent a square
    const safeMoves = possibleMoves.filter(move => {
      // Simulate AI making the move
      const linesAfterAIMove = [...drawnLines.value, { ...move, id: [move.startDot, move.endDot].sort().join('-'), player: 2 }]
      
      // Get all possible moves for opponent
      const opponentMoves = getPossibleMoves(linesAfterAIMove)

      // Check if any opponent move is a winning move
      const opponentCanWin = opponentMoves.some(oppMove => {
        const linesAfterOppMove = [...linesAfterAIMove, { ...oppMove, id: [oppMove.startDot, oppMove.endDot].sort().join('-'), player: 1 }]
        return checkForCompletedSquares(oppMove, linesAfterOppMove).length > 0
      })
      
      return !opponentCanWin
    })

    if (safeMoves.length > 0) {
      return safeMoves[Math.floor(Math.random() * safeMoves.length)]
    }

    // 3. If no safe moves, just pick a random move
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
  }

  const playMove = async () => {
    if (!canPlay.value) return null
    isThinking.value = true
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
    
    const move = findBestMove()
    
    isThinking.value = false
    return move
  }

  return {
    isThinking,
    playMove,
  }
} 