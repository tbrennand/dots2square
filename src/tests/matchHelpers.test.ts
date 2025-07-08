import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Firebase and Firestore before importing the module
vi.mock('../firebase/index', () => ({
  db: {
    collection: vi.fn()
  }
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date('2024-01-01T00:00:00Z'))
}))

import { createMatch, type CreateMatchOptions, type MatchData } from '../firebase/matchHelpers'
import { addDoc, serverTimestamp } from 'firebase/firestore'

// Get mocked functions
const mockAddDoc = vi.mocked(addDoc)
const mockServerTimestamp = vi.mocked(serverTimestamp)

describe('matchHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddDoc.mockResolvedValue({
      id: 'test-match-id',
      path: 'matches/test-match-id',
      parent: null,
      converter: null,
      type: 'document',
      firestore: null
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createMatch', () => {
    it('should create a match with default options', async () => {
      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1'
      }

      const matchId = await createMatch(options)

      expect(matchId).toBe('test-match-id')
      expect(mockAddDoc).toHaveBeenCalledTimes(1)
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData

      // Check basic structure
      expect(matchData.player1.id).toBe('player1-id')
      expect(matchData.player1.name).toBe('Player 1')
      expect(matchData.status).toBe('waiting')
      expect(matchData.gridSize).toBe(5)
      expect(matchData.currentTurn).toBe(1)
      expect(matchData.scores).toEqual({ 1: 0, 2: 0 })
      expect(matchData.gameOver).toBe(false)
      expect(matchData.winner).toBe(null)

      // Check default values
      expect(matchData.isPublic).toBe(true)
      expect(matchData.maxPlayers).toBe(2)
      expect(matchData.dots).toBeDefined()
      expect(matchData.squares).toBeDefined()
      expect(matchData.lines).toEqual([])
      expect(matchData.settings).toBeDefined()
    })

    it('should create a match with custom options', async () => {
      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1',
        gridSize: 4,
        isPublic: false,
        maxPlayers: 3
      }

      const matchId = await createMatch(options)

      expect(matchId).toBe('test-match-id')
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData

      expect(matchData.gridSize).toBe(4)
      expect(matchData.isPublic).toBe(false)
      expect(matchData.maxPlayers).toBe(3)
      expect(matchData.settings?.gridSize).toBe(4)
      expect(matchData.settings?.allowSpectators).toBe(false)
    })

    it('should create correct grid structure for 5x5 grid', async () => {
      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1',
        gridSize: 5
      }

      await createMatch(options)
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData

      // Check dots (5x5 = 25 dots)
      expect(matchData.dots).toHaveLength(25)
      expect(matchData.dots?.[0]).toEqual({
        id: '0-0',
        x: 0,
        y: 0,
        connected: false
      })
      expect(matchData.dots?.[24]).toEqual({
        id: '4-4',
        x: 4,
        y: 4,
        connected: false
      })

      // Check squares (4x4 = 16 squares)
      expect(matchData.squares).toHaveLength(16)
      expect(matchData.squares?.[0]).toEqual({
        id: '0-0',
        topLeftX: 0,
        topLeftY: 0,
        player: undefined,
        lines: []
      })
      expect(matchData.squares?.[15]).toEqual({
        id: '3-3',
        topLeftX: 3,
        topLeftY: 3,
        player: undefined,
        lines: []
      })
    })

    it('should create correct grid structure for 3x3 grid', async () => {
      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1',
        gridSize: 3
      }

      await createMatch(options)
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData

      // Check dots (3x3 = 9 dots)
      expect(matchData.dots).toHaveLength(9)
      
      // Check squares (2x2 = 4 squares)
      expect(matchData.squares).toHaveLength(4)
    })

    it('should include server timestamps', async () => {
      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1'
      }

      await createMatch(options)
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData

      expect(matchData.createdAt).toBeDefined()
      expect(matchData.updatedAt).toBeDefined()
      expect(mockServerTimestamp).toHaveBeenCalledTimes(2)
    })

    it('should include proper settings object', async () => {
      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1',
        gridSize: 6,
        isPublic: true
      }

      await createMatch(options)
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData

      expect(matchData.settings).toEqual({
        gridSize: 6,
        allowSpectators: true,
        autoStart: false,
        timeLimit: null
      })
    })

    it('should handle Firestore errors', async () => {
      const error = new Error('Firestore connection failed')
      mockAddDoc.mockRejectedValue(error)

      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1'
      }

      await expect(createMatch(options)).rejects.toThrow('Failed to create match: Firestore connection failed')
    })

    it('should handle unknown errors', async () => {
      mockAddDoc.mockRejectedValue('Unknown error')

      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1'
      }

      await expect(createMatch(options)).rejects.toThrow('Failed to create match: Unknown error')
    })

    it('should handle missing optional parameters with defaults', async () => {
      // Test with minimal options
      const matchId = await createMatch({} as CreateMatchOptions)
      expect(matchId).toBe('test-match-id')
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData
      
      // Should use default values
      expect(matchData.gridSize).toBe(5)
      expect(matchData.isPublic).toBe(true)
      expect(matchData.maxPlayers).toBe(2)
    })

    it('should create unique dot and square IDs', async () => {
      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1',
        gridSize: 4
      }

      await createMatch(options)
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData

      // Check for unique dot IDs
      const dotIds = matchData.dots?.map(d => d.id) || []
      const uniqueDotIds = new Set(dotIds)
      expect(uniqueDotIds.size).toBe(dotIds.length)

      // Check for unique square IDs
      const squareIds = matchData.squares?.map(s => s.id) || []
      const uniqueSquareIds = new Set(squareIds)
      expect(uniqueSquareIds.size).toBe(squareIds.length)
    })

    it('should initialize all squares as unclaimed', async () => {
      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1',
        gridSize: 5
      }

      await createMatch(options)
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData

      // All squares should be unclaimed initially
      const unclaimedSquares = matchData.squares?.filter(s => s.player === undefined) || []
      expect(unclaimedSquares.length).toBe(matchData.squares?.length)
    })

    it('should initialize empty lines array', async () => {
      const options: CreateMatchOptions = {
        player1Id: 'player1-id',
        player1Name: 'Player 1'
      }

      await createMatch(options)
      
      const callArgs = mockAddDoc.mock.calls[0]
      const matchData = callArgs[1] as MatchData

      expect(matchData.lines).toEqual([])
    })
  })
}) 