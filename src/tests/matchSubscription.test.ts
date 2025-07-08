import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { subscribeToMatch, type MatchData } from '../firebase/matchHelpers'
import { useMatchStore } from '../stores/matchStore'
import { useMatchSubscription } from '../composables/useMatchSubscription'

// Mock Firebase
vi.mock('../firebase/matchHelpers', () => ({
  subscribeToMatch: vi.fn()
}))

const mockSubscribeToMatch = vi.mocked(subscribeToMatch)

describe('Match Subscription', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useMatchStore', () => {
    it('should initialize with default state', () => {
      const store = useMatchStore()
      
      expect(store.currentMatchId).toBe(null)
      expect(store.matchData).toBe(null)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.isConnected).toBe(false)
    })

    it('should subscribe to match and update state', () => {
      const store = useMatchStore()
      const mockUnsubscribe = vi.fn()
      const mockMatchData = {
        player1: { id: 'player1', name: 'Player 1', joinedAt: new Date() },
        status: 'waiting',
        gridSize: 5,
        currentTurn: 1,
        scores: { 1: 0, 2: 0 },
        gameOver: false,
        winner: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      store.subscribeToMatchById('test-match-id')

      expect(store.currentMatchId).toBe('test-match-id')
      expect(store.isLoading).toBe(true)
      expect(mockSubscribeToMatch).toHaveBeenCalledWith('test-match-id', expect.any(Function))

      // Simulate callback with match data
      const callback = mockSubscribeToMatch.mock.calls[0][1]
      callback(mockMatchData)

      expect(store.matchData).toEqual(mockMatchData)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.isConnected).toBe(true)
    })

    it('should handle subscription errors', () => {
      const store = useMatchStore()
      const mockUnsubscribe = vi.fn()

      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      store.subscribeToMatchById('test-match-id')

      // Simulate callback with null (error case)
      const callback = mockSubscribeToMatch.mock.calls[0][1]
      callback(null)

      expect(store.matchData).toBe(null)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Match not found or no longer available')
      expect(store.isConnected).toBe(false)
    })

    it('should unsubscribe cleanly', () => {
      const store = useMatchStore()
      const mockUnsubscribe = vi.fn()

      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      store.subscribeToMatchById('test-match-id')
      store.unsubscribeFromMatch()

      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(store.currentMatchId).toBe(null)
      expect(store.matchData).toBe(null)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should compute match status correctly', () => {
      const store = useMatchStore()
      
      expect(store.getMatchStatus()).toBe('disconnected')

      const mockMatchData = {
        player1: { id: 'player1', name: 'Player 1', joinedAt: new Date() },
        status: 'active',
        gridSize: 5,
        currentTurn: 1,
        scores: { 1: 0, 2: 0 },
        gameOver: false,
        winner: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      store.matchData = mockMatchData
      expect(store.getMatchStatus()).toBe('active')
    })

    it('should compute player information correctly', () => {
      const store = useMatchStore()
      const mockMatchData = {
        player1: { id: 'player1', name: 'Player 1', joinedAt: new Date() },
        player2: { id: 'player2', name: 'Player 2', joinedAt: new Date() },
        status: 'active',
        gridSize: 5,
        currentTurn: 1,
        scores: { 1: 0, 2: 0 },
        gameOver: false,
        winner: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      store.matchData = mockMatchData

      expect(store.players).toHaveLength(2)
      expect(store.getPlayerById('player1')).toEqual(mockMatchData.player1)
      expect(store.getPlayerById('player2')).toEqual(mockMatchData.player2)
      expect(store.getPlayerNumber('player1')).toBe(1)
      expect(store.getPlayerNumber('player2')).toBe(2)
      expect(store.isPlayerInMatch('player1')).toBe(true)
      expect(store.isPlayerInMatch('player3')).toBe(false)
    })

    it('should compute turn information correctly', () => {
      const store = useMatchStore()
      const mockMatchData = {
        player1: { id: 'player1', name: 'Player 1', joinedAt: new Date() },
        player2: { id: 'player2', name: 'Player 2', joinedAt: new Date() },
        status: 'active',
        gridSize: 5,
        currentTurn: 1,
        scores: { 1: 0, 2: 0 },
        gameOver: false,
        winner: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      store.matchData = mockMatchData

      expect(store.currentPlayer).toBe(1)
      expect(store.isCurrentPlayerTurn('player1')).toBe(true)
      expect(store.isCurrentPlayerTurn('player2')).toBe(false)
      expect(store.canPlayerMove('player1')).toBe(true)
      expect(store.canPlayerMove('player2')).toBe(false)
    })

    it('should compute game progress correctly', () => {
      const store = useMatchStore()
      const mockSquares = [
        { id: '0-0', topLeftX: 0, topLeftY: 0, player: 1, lines: [] },
        { id: '0-1', topLeftX: 0, topLeftY: 1, player: 2, lines: [] },
        { id: '1-0', topLeftX: 1, topLeftY: 0, player: undefined, lines: [] },
        { id: '1-1', topLeftX: 1, topLeftY: 1, player: undefined, lines: [] }
      ]

      store.squares = mockSquares

      expect(store.getMatchProgress()).toBe(50) // 2 out of 4 squares claimed
      expect(store.getRemainingSquares()).toBe(2)
      expect(store.getClaimedSquaresByPlayer(1)).toBe(1)
      expect(store.getClaimedSquaresByPlayer(2)).toBe(1)
    })
  })

  describe('useMatchSubscription', () => {
    it('should provide match store data', () => {
      const mockUnsubscribe = vi.fn()
      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      const { match, isConnected, isLoading, error } = useMatchSubscription('test-match-id')

      expect(match).toBe(null)
      expect(isConnected).toBe(false)
      expect(isLoading).toBe(false)
      expect(error).toBe(null)
    })

    it('should auto-subscribe when matchId is provided', () => {
      const mockUnsubscribe = vi.fn()
      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      useMatchSubscription('test-match-id')

      expect(mockSubscribeToMatch).toHaveBeenCalledWith('test-match-id', expect.any(Function))
    })

    it('should not auto-subscribe when disabled', () => {
      const mockUnsubscribe = vi.fn()
      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      useMatchSubscription('test-match-id', { autoSubscribe: false })

      expect(mockSubscribeToMatch).not.toHaveBeenCalled()
    })

    it('should call onMatchUpdate callback when match data changes', () => {
      const mockUnsubscribe = vi.fn()
      const onMatchUpdate = vi.fn()
      const mockMatchData = {
        player1: { id: 'player1', name: 'Player 1', joinedAt: new Date() },
        status: 'waiting',
        gridSize: 5,
        currentTurn: 1,
        scores: { 1: 0, 2: 0 },
        gameOver: false,
        winner: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      useMatchSubscription('test-match-id', { onMatchUpdate })

      const callback = mockSubscribeToMatch.mock.calls[0][1]
      callback(mockMatchData)

      expect(onMatchUpdate).toHaveBeenCalledWith(mockMatchData)
    })

    it('should call onError callback when error occurs', () => {
      const mockUnsubscribe = vi.fn()
      const onError = vi.fn()

      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      useMatchSubscription('test-match-id', { onError })

      const callback = mockSubscribeToMatch.mock.calls[0][1]
      callback(null) // Simulate error

      expect(onError).toHaveBeenCalledWith('Match not found or no longer available')
    })

    it('should call onStatusChange callback when status changes', () => {
      const mockUnsubscribe = vi.fn()
      const onStatusChange = vi.fn()
      const mockMatchData = {
        player1: { id: 'player1', name: 'Player 1', joinedAt: new Date() },
        status: 'active',
        gridSize: 5,
        currentTurn: 1,
        scores: { 1: 0, 2: 0 },
        gameOver: false,
        winner: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      useMatchSubscription('test-match-id', { onStatusChange })

      const callback = mockSubscribeToMatch.mock.calls[0][1]
      callback(mockMatchData)

      expect(onStatusChange).toHaveBeenCalledWith('active')
    })

    it('should provide subscribe and unsubscribe methods', () => {
      const mockUnsubscribe = vi.fn()
      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      const { subscribe, unsubscribe } = useMatchSubscription(null, { autoSubscribe: false })

      expect(typeof subscribe).toBe('function')
      expect(typeof unsubscribe).toBe('function')
    })

    it('should provide updateMatchId method', () => {
      const mockUnsubscribe = vi.fn()
      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      const { updateMatchId } = useMatchSubscription(null, { autoSubscribe: false })

      expect(typeof updateMatchId).toBe('function')
    })

    it('should provide helper methods from store', () => {
      const mockUnsubscribe = vi.fn()
      mockSubscribeToMatch.mockReturnValue(mockUnsubscribe)

      const { 
        getPlayerById, 
        isPlayerInMatch, 
        getPlayerNumber, 
        isCurrentPlayerTurn, 
        canPlayerMove 
      } = useMatchSubscription('test-match-id')

      expect(typeof getPlayerById).toBe('function')
      expect(typeof isPlayerInMatch).toBe('function')
      expect(typeof getPlayerNumber).toBe('function')
      expect(typeof isCurrentPlayerTurn).toBe('function')
      expect(typeof canPlayerMove).toBe('function')
    })
  })
}) 