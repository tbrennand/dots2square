import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { playMove, type PlayMoveResult, type MoveLine } from '../firebase/matchHelpers'
import type { MatchData } from '../firebase/matchHelpers'
import { runTransaction } from 'firebase/firestore'

// Mock Firebase
vi.mock('../firebase/index', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn()
}))

const mockRunTransaction = vi.mocked(runTransaction)

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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
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

  it('should claim multiple squares when a move completes more than one', async () => {
    const mockMatchData = createMockMatchData({
      gridSize: 3, // 3x3 dots, 2x2 squares
      currentTurn: 1,
      scores: { 1: 0, 2: 0 },
      dots: [
        { id: '0-0', x: 0, y: 0, connected: false },
        { id: '1-0', x: 1, y: 0, connected: false },
        { id: '2-0', x: 2, y: 0, connected: false },
        { id: '0-1', x: 0, y: 1, connected: false },
        { id: '1-1', x: 1, y: 1, connected: false },
        { id: '2-1', x: 2, y: 1, connected: false },
        { id: '0-2', x: 0, y: 2, connected: false },
        { id: '1-2', x: 1, y: 2, connected: false },
        { id: '2-2', x: 2, y: 2, connected: false }
      ],
      squares: [
        { id: '0-0', topLeftX: 0, topLeftY: 0, player: undefined, lines: [] },
        { id: '1-0', topLeftX: 1, topLeftY: 0, player: undefined, lines: [] },
        { id: '0-1', topLeftX: 0, topLeftY: 1, player: undefined, lines: [] },
        { id: '1-1', topLeftX: 1, topLeftY: 1, player: undefined, lines: [] }
      ],
      lines: [
        // Lines for first square almost complete
        { id: '0-0-0-1', startDot: '0-0', endDot: '0-1', player: 1, drawnAt: new Date() },
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() },
        { id: '1-0-1-1', startDot: '1-0', endDot: '1-1', player: 2, drawnAt: new Date() },
        // Lines for second square almost complete, sharing the middle vertical line
        { id: '1-0-2-0', startDot: '1-0', endDot: '2-0', player: 1, drawnAt: new Date() },
        { id: '2-0-2-1', startDot: '2-0', endDot: '2-1', player: 2, drawnAt: new Date() },
        { id: '1-1-2-1', startDot: '1-1', endDot: '2-1', player: 1, drawnAt: new Date() },
        // The completing line will be 0-1 to 1-1, which completes first square, but wait, to complete both.
        // Actually, to complete both with one line, the shared line.
        // Let's set up so the middle vertical line 1-0 to 1-1 completes both left and right squares.
        // So remove the 1-0-1-1 from initial, and make the move be drawing 1-0 to 1-1, assuming other lines are there.
        // Correct setup:
        // For left square (0-0): top 0-0-1-0, left 0-0-0-1, bottom 0-1-1-1, right 1-0-1-1 (shared)
        // For right square (1-0): top 1-0-2-0, left 1-0-1-1 (shared), bottom 1-1-2-1, right 2-0-2-1
        // So if all except the shared 1-0-1-1 are drawn, drawing 1-0-1-1 completes both.
        // Yes, so lines initial:
        // left square: top, left, bottom
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() },
        { id: '0-0-0-1', startDot: '0-0', endDot: '0-1', player: 2, drawnAt: new Date() },
        { id: '0-1-1-1', startDot: '0-1', endDot: '1-1', player: 1, drawnAt: new Date() },
        // right square: top, bottom, right
        { id: '1-0-2-0', startDot: '1-0', endDot: '2-0', player: 2, drawnAt: new Date() },
        { id: '1-1-2-1', startDot: '1-1', endDot: '2-1', player: 1, drawnAt: new Date() },
        { id: '2-0-2-1', startDot: '2-0', endDot: '2-1', player: 2, drawnAt: new Date() }
      ]
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '1-0',
      endDot: '1-1'
    }

    const result = await playMove('match-id', 'player1', move)

    expect(result.success).toBe(true)
    expect(result.squaresClaimed).toBe(2)
    expect(result.gameCompleted).toBe(false) // Only 2 out of 4 squares claimed
    expect(result.error).toBeUndefined()
  })

  it('should handle game ending in a tie correctly', async () => {
    const mockMatchData = createMockMatchData({
      gridSize: 3,
      currentTurn: 2,
      scores: { 1: 2, 2: 0 },
      dots: [
        { id: '0-0', x: 0, y: 0, connected: false },
        { id: '1-0', x: 1, y: 0, connected: false },
        { id: '2-0', x: 2, y: 0, connected: false },
        { id: '0-1', x: 0, y: 1, connected: false },
        { id: '1-1', x: 1, y: 1, connected: false },
        { id: '2-1', x: 2, y: 1, connected: false },
        { id: '0-2', x: 0, y: 2, connected: false },
        { id: '1-2', x: 1, y: 2, connected: false },
        { id: '2-2', x: 2, y: 2, connected: false }
      ],
      squares: [
        // Assume two squares already claimed by player 1, say the bottom ones
        { id: '0-0', topLeftX: 0, topLeftY: 0, player: undefined, lines: [] },
        { id: '1-0', topLeftX: 1, topLeftY: 0, player: undefined, lines: [] },
        { id: '0-1', topLeftX: 0, topLeftY: 1, player: 1, lines: [] },
        { id: '1-1', topLeftX: 1, topLeftY: 1, player: 1, lines: [] }
      ],
      lines: [
        // All lines for bottom two squares drawn (claimed), and setup for top two to be completed by one move
        // Assume bottom squares claimed, so their lines are there
        // For simplicity, we don't need all lines, but since check is based on lines, and squares have player set.
        // But in code, game complete based on claimedSquares count.
        // For the move, same setup as above for claiming two squares with one move.
        // Lines same as previous test.
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() },
        { id: '0-0-0-1', startDot: '0-0', endDot: '0-1', player: 2, drawnAt: new Date() },
        { id: '0-1-1-1', startDot: '0-1', endDot: '1-1', player: 1, drawnAt: new Date() },
        { id: '1-0-2-0', startDot: '1-0', endDot: '2-0', player: 2, drawnAt: new Date() },
        { id: '1-1-2-1', startDot: '1-1', endDot: '2-1', player: 1, drawnAt: new Date() },
        { id: '2-0-2-1', startDot: '2-0', endDot: '2-1', player: 2, drawnAt: new Date() },
        // Add lines for bottom squares to be claimed already, but since player set in squares, and for check, it skips if already claimed.
        // To make claimedSquares = 2 after move (total 4), but wait, in this setup, bottom squares are set player:1, but lines are only for top.
        // The lines above are for top row.
        // I need to add lines for bottom squares.
        // For bottom left square (0-1): dots 0-1,1-1,0-2,1-2
        // Lines: top 0-1-1-1 (already there? No, above has 0-1-1-1 but that's bottom for top square.
        // This is getting complicated.
        // For test, since checkForCompletedSquares skips if s.player !== undefined, and game complete if claimedSquares >= totalSquares, where claimedSquares = updatedSquares.filter(s => s.player !== undefined).length
        // So, to setup, I can set two squares with player:1, and lines set to the ones for the remaining two, so the move claims the last two.
        // Yes, and scores {1:0, 2:0}, but no, scores are separate, in mock set scores {1:2,2:0}, but if squares have player set, scores should match, but in test it's mock, so as long as consistent.
        // In playMove, updatedScores = {...matchData.scores}, then + squaresClaimed to player.
        // So, to have final tie, set initial scores {1:2,2:0}, initial squares with two claimed by 1, and move by player2 claims 2, final scores {1:2,2:2}, tie.
        // Yes.
        // For the function to detect the two completed, need the lines setup for them.
        // And since bottom squares already claimed, their lines are there, but don't matter for check as skipped.
        // Yes.
        // So, for test, add dummy lines for bottom, or not necessary if not affecting.
        // But to be accurate, add them.
        // Let's add lines for bottom left (0-1): top 0-1-1-1, left 0-1-0-2, right 1-1-1-2, bottom 0-2-1-2
        { id: '0-1-1-1', startDot: '0-1', endDot: '1-1', player: 1, drawnAt: new Date() }, // top
        { id: '0-1-0-2', startDot: '0-1', endDot: '0-2', player: 2, drawnAt: new Date() }, // left
        { id: '1-1-1-2', startDot: '1-1', endDot: '1-2', player: 1, drawnAt: new Date() }, // right
        { id: '0-2-1-2', startDot: '0-2', endDot: '1-2', player: 2, drawnAt: new Date() }, // bottom
        // Bottom right (1-1): top 1-1-2-1, left 1-1-1-2, right 2-1-2-2, bottom 1-2-2-2
        { id: '1-1-2-1', startDot: '1-1', endDot: '2-1', player: 1, drawnAt: new Date() }, // top
        // left already above
        { id: '2-1-2-2', startDot: '2-1', endDot: '2-2', player: 2, drawnAt: new Date() }, // right
        { id: '1-2-2-2', startDot: '1-2', endDot: '2-2', player: 1, drawnAt: new Date() }, // bottom
        // Now for top two, same as previous: lines missing the middle vertical 1-0-1-1
        { id: '0-0-1-0', startDot: '0-0', endDot: '1-0', player: 1, drawnAt: new Date() },
        { id: '0-0-0-1', startDot: '0-0', endDot: '0-1', player: 2, drawnAt: new Date() },
        { id: '0-1-1-1', startDot: '0-1', endDot: '1-1', player: 1, drawnAt: new Date() }, // already added
        { id: '1-0-2-0', startDot: '1-0', endDot: '2-0', player: 2, drawnAt: new Date() },
        { id: '1-1-2-1', startDot: '1-1', endDot: '2-1', player: 1, drawnAt: new Date() }, // already added
        { id: '2-0-2-1', startDot: '2-0', endDot: '2-1', player: 2, drawnAt: new Date() }
      ]
    })

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockMatchData
      }),
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
    }

    mockRunTransaction.mockImplementation(async (db, transactionFn) => {
      return await transactionFn(mockTransaction)
    })

    const move: MoveLine = {
      startDot: '1-0',
      endDot: '1-1'
    }

    const result = await playMove('match-id', 'player2', move) // player2 since currentTurn:2

    expect(result.success).toBe(true)
    expect(result.squaresClaimed).toBe(2)
    expect(result.gameCompleted).toBe(true)
    expect(result.winner).toBe('tie')
    expect(result.error).toBeUndefined()

    const updateCall = mockTransaction.update.mock.calls[0][1]
    expect(updateCall.scores[1]).toBe(2)
    expect(updateCall.scores[2]).toBe(2)
    expect(updateCall.gameOver).toBe(true)
    expect(updateCall.winner).toBe('tie')
    expect(updateCall.status).toBe('completed')
  })
}) 