import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { playMove, type PlayMoveResult, type MoveLine } from '../firebase/matchHelpers'
import type { MatchData } from '../firebase/matchHelpers'

// Mock Firebase
vi.mock('../firebase/index', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn()
}))

const mockRunTransaction = vi.mocked(require('firebase/firestore').runTransaction)

describe('playMove', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockMatchData = (overrides: Partial<MatchData> = {}): MatchData => ({
    player1: { id: 'player1', name: 'Player 1', joinedAt: new Date() },
    player2: { id: 'player2', name: 'Player 2', joinedAt: new Date() },
    gridSize: 5,
    status: 'active',
    currentTurn: 1,
    scores: { 1: 0, 2: 0 },
    gameOver: false,
    winner: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    dots: [
      { id: '0-0', x: 0, y: 0, connected: false },
      { id: '1-0', x: 1, y: 0, connected: false },
      { id: '0-1', x: 0, y: 1, connected: false },
      { id: '1-1', x: 1, y: 1, connected: false }
    ],
    squares: [
      { id: '0-0', topLeftX: 0, topLeftY: 0, player: undefined, lines: [] }
    ],
    lines: [],
    ...overrides
  })

  it('should successfully play a valid move', async () => {
    const mockMatchData = createMockMatchData()
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-0'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(true)
    expect(result.squaresClaimed).toBe(0)
    expect(result.gameCompleted).toBe(false)
    expect(result.error).toBeUndefined()
    expect(mockTransaction.update).toHaveBeenCalled()
  })

  it('should claim a square when a move completes it', async () => {
    const mockMatchData = createMockMatchData({
      lines: [
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() },
        { id: '1-0-1-1', startDot: '1-0', endDot: '1-1', player: 2, drawnAt: new Date() },
        { id: '0-1-1-1', startDot: '0-1', endDot: '1-1', player: 1, drawnAt: new Date() }
      ]
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '0-1'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(true)
    expect(result.squaresClaimed).toBe(1)
    expect(result.gameCompleted).toBe(false)
    expect(result.error).toBeUndefined()
  })

  it('should give player another turn when they claim a square', async () => {
    const mockMatchData = createMockMatchData({
      lines: [
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() },
        { id: '1-0-1-1', startDot: '1-0', endDot: '1-1', player: 2, drawnAt: new Date() },
        { id: '0-1-1-1', startDot: '0-1', endDot: '1-1', player: 1, drawnAt: new Date() }
      ]
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '0-1'
    }

    await playMove('match-id', 'player1', move)

    // Check that the transaction update was called with currentTurn still being 1
    const updateCall = mockTransaction.update.mock.calls[0][1]
    expect(updateCall.currentTurn).toBe(1) // Player 1 gets another turn
  })

  it('should switch turns when no square is claimed', async () => {
    const mockMatchData = createMockMatchData()

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-0'
    }

    await playMove('match-id', 'player1', move)

    // Check that the transaction update was called with currentTurn switched to 2
    const updateCall = mockTransaction.update.mock.calls[0][1]
    expect(updateCall.currentTurn).toBe(2) // Turn switches to player 2
  })

  it('should complete the game when all squares are claimed', async () => {
    const mockMatchData = createMockMatchData({
      gridSize: 2, // 2x2 grid = 1 square
      lines: [
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() },
        { id: '1-0-1-1', startDot: '1-0', endDot: '1-1', player: 2, drawnAt: new Date() },
        { id: '0-1-1-1', startDot: '0-1', endDot: '1-1', player: 1, drawnAt: new Date() }
      ]
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '0-1'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(true)
    expect(result.squaresClaimed).toBe(1)
    expect(result.gameCompleted).toBe(true)
    expect(result.winner).toBe(1) // Player 1 wins

    const updateCall = mockTransaction.update.mock.calls[0][1]
    expect(updateCall.gameOver).toBe(true)
    expect(updateCall.status).toBe('completed')
    expect(updateCall.winner).toBe(1)
  })

  it('should handle ties correctly', async () => {
    const mockMatchData = createMockMatchData({
      gridSize: 2,
      scores: { 1: 0, 2: 0 },
      lines: [
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() },
        { id: '1-0-1-1', startDot: '1-0', endDot: '1-1', player: 2, drawnAt: new Date() },
        { id: '0-1-1-1', startDot: '0-1', endDot: '1-1', player: 1, drawnAt: new Date() }
      ]
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '0-1'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(true)
    expect(result.gameCompleted).toBe(true)
    expect(result.winner).toBe(1) // Player 1 wins the square
  })

  it('should reject move if match not found', async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => false
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-0'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Match not found')
  })

  it('should reject move if not player\'s turn', async () => {
    const mockMatchData = createMockMatchData({
      currentTurn: 2 // Player 2's turn
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-0'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not your turn')
  })

  it('should reject move if game is not active', async () => {
    const mockMatchData = createMockMatchData({
      status: 'waiting'
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-0'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Game is not active')
  })

  it('should reject move if game is already over', async () => {
    const mockMatchData = createMockMatchData({
      gameOver: true
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-0'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Game is already completed')
  })

  it('should reject move if line already exists', async () => {
    const mockMatchData = createMockMatchData({
      lines: [
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() }
      ]
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-0'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Line already exists')
  })

  it('should reject move if player is not in match', async () => {
    const mockMatchData = createMockMatchData()

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-0'
    }

    const result = await playMove('match-id', 'player3', move)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Player not found in match')
  })

  it('should reject invalid line coordinates', async () => {
    const mockMatchData = createMockMatchData()

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '2-0' // Invalid: not adjacent
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Horizontal line must connect adjacent dots')
  })

  it('should reject diagonal lines', async () => {
    const mockMatchData = createMockMatchData()

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-1' // Diagonal: invalid
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Line must be horizontal or vertical')
  })

  it('should handle transaction errors gracefully', async () => {
    mockRunTransaction.mockRejectedValue(new Error('Database error'))

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '1-0'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Database error')
  })

  it('should update scores correctly when squares are claimed', async () => {
    const mockMatchData = createMockMatchData({
      scores: { 1: 2, 2: 1 },
      lines: [
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() },
        { id: '1-0-1-1', startDot: '1-0', endDot: '1-1', player: 2, drawnAt: new Date() },
        { id: '0-1-1-1', startDot: '0-1', endDot: '1-1', player: 1, drawnAt: new Date() }
      ]
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '0-0',
      endDot: '0-1'
    }

    await playMove('match-id', 'player1', move)

    const updateCall = mockTransaction.update.mock.calls[0][1]
    expect(updateCall.scores[1]).toBe(3) // Player 1 gets 1 more point
    expect(updateCall.scores[2]).toBe(1) // Player 2 score unchanged
  })
}) 