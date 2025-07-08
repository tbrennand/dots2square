import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useRematch } from '@/composables/useRematch'
import type { MatchData } from '@/firebase/matchHelpers'

// Mock Firebase functions
vi.mock('@/firebase/matchHelpers', () => ({
  createMatch: vi.fn()
}))

// Mock Vue Router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn()
  }
})

describe('useRematch', () => {
  let app: any
  let router: any

  beforeEach(() => {
    // Create a minimal Vue app for testing
    app = createApp({})
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/lobby/:id', component: {} },
        { path: '/', component: {} }
      ]
    })
    app.use(router)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mockMatchData: MatchData = {
    player1: {
      id: 'player1',
      name: 'Player 1',
      joinedAt: new Date()
    },
    player2: {
      id: 'player2',
      name: 'Player 2',
      joinedAt: new Date()
    },
    gridSize: 5,
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
    currentTurn: 1,
    scores: { 1: 3, 2: 2 },
    gameOver: true,
    winner: 1,
    isPublic: true,
    maxPlayers: 2,
    dots: [],
    squares: [],
    lines: [],
    settings: {
      gridSize: 5,
      allowSpectators: true,
      autoStart: false,
      timeLimit: null
    }
  }

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { isCreating, error, newMatchId, canCreateRematch, originalMatchData } = useRematch()

      expect(isCreating.value).toBe(false)
      expect(error.value).toBe(null)
      expect(newMatchId.value).toBe(null)
      expect(canCreateRematch.value).toBe(false)
      expect(originalMatchData.value).toBe(null)
    })
  })

  describe('setOriginalMatch', () => {
    it('should set original match data and reset state', () => {
      const rematch = useRematch()
      const { setOriginalMatch, originalMatchData } = rematch

      // Set original match
      setOriginalMatch(mockMatchData)

      expect(originalMatchData.value).toEqual(mockMatchData)
    })
  })

  describe('canCreateRematch', () => {
    it('should return false when no original match data', () => {
      const { canCreateRematch } = useRematch()
      expect(canCreateRematch.value).toBe(false)
    })

    it('should return false when match is not completed', () => {
      const rematch = useRematch()
      const { setOriginalMatch, canCreateRematch } = rematch
      const activeMatch = { ...mockMatchData, status: 'active' as const }
      
      setOriginalMatch(activeMatch)
      expect(canCreateRematch.value).toBe(false)
    })

    it('should return false when only one player', () => {
      const rematch = useRematch()
      const { setOriginalMatch, canCreateRematch } = rematch
      const singlePlayerMatch = { ...mockMatchData, player2: undefined }
      
      setOriginalMatch(singlePlayerMatch)
      expect(canCreateRematch.value).toBe(false)
    })

    it('should return true for valid completed match', () => {
      const rematch = useRematch()
      const { setOriginalMatch, canCreateRematch } = rematch
      
      setOriginalMatch(mockMatchData)
      expect(canCreateRematch.value).toBe(true)
    })

    it('should return false when creating rematch', async () => {
      const rematch = useRematch()
      const { setOriginalMatch, canCreateRematch, createRematch } = rematch
      const { createMatch } = await import('@/firebase/matchHelpers')
      
      vi.mocked(createMatch).mockResolvedValue('new-match-id')
      setOriginalMatch(mockMatchData)

      // Start creating rematch
      const promise = createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1'
      })

      expect(canCreateRematch.value).toBe(false)

      await promise
    })
  })

  describe('createRematch', () => {
    beforeEach(() => {
      const rematch = useRematch()
      rematch.setOriginalMatch(mockMatchData)
    })

    it('should create rematch successfully', async () => {
      const { createRematch, newMatchId } = useRematch()
      const { createMatch } = await import('@/firebase/matchHelpers')
      
      vi.mocked(createMatch).mockResolvedValue('new-match-id')

      const result = await createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1'
      })

      expect(result).toBe('new-match-id')
      expect(newMatchId.value).toBe('new-match-id')
      expect(createMatch).toHaveBeenCalledWith({
        player1Id: 'player1',
        player1Name: 'Player 1',
        gridSize: 5,
        isPublic: true,
        maxPlayers: 2
      })
    })

    it('should throw error if no original match data', async () => {
      const rematch = useRematch()
      const { createRematch, setOriginalMatch } = rematch
      
      // Clear original match data
      setOriginalMatch(null as any)

      await expect(createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1'
      })).rejects.toThrow('No original match data available')
    })

    it('should throw error if user was not part of original match', async () => {
      const { createRematch } = useRematch()

      await expect(createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player3',
        currentUserName: 'Player 3'
      })).rejects.toThrow('You were not part of the original match')
    })

    it('should throw error if other player not found', async () => {
      const rematch = useRematch()
      const { createRematch, setOriginalMatch } = rematch
      const singlePlayerMatch = { ...mockMatchData, player2: undefined }
      
      setOriginalMatch(singlePlayerMatch)

      await expect(createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1'
      })).rejects.toThrow('Cannot create rematch: other player not found')
    })

    it('should throw error if already creating rematch', async () => {
      const { createRematch } = useRematch()
      const { createMatch } = await import('@/firebase/matchHelpers')
      
      vi.mocked(createMatch).mockImplementation(() => 
        new Promise<string>(resolve => setTimeout(() => resolve('new-match-id'), 100))
      )

      // Start first rematch creation
      const promise1 = createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1'
      })

      // Try to start second rematch creation
      await expect(createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1'
      })).rejects.toThrow('Rematch creation already in progress')

      await promise1
    })

    it('should handle createMatch errors', async () => {
      const { createRematch, error } = useRematch()
      const { createMatch } = await import('@/firebase/matchHelpers')
      
      vi.mocked(createMatch).mockRejectedValue(new Error('Firebase error'))

      await expect(createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1'
      })).rejects.toThrow('Failed to create rematch')

      expect(error.value).toBe('Failed to create rematch')
    })

    it('should use custom grid size if provided', async () => {
      const { createRematch } = useRematch()
      const { createMatch } = await import('@/firebase/matchHelpers')
      
      vi.mocked(createMatch).mockResolvedValue('new-match-id')

      await createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1',
        gridSize: 7
      })

      expect(createMatch).toHaveBeenCalledWith({
        player1Id: 'player1',
        player1Name: 'Player 1',
        gridSize: 7,
        isPublic: true,
        maxPlayers: 2
      })
    })

    it('should use custom isPublic setting', async () => {
      const { createRematch } = useRematch()
      const { createMatch } = await import('@/firebase/matchHelpers')
      
      vi.mocked(createMatch).mockResolvedValue('new-match-id')

      await createRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1',
        isPublic: false
      })

      expect(createMatch).toHaveBeenCalledWith({
        player1Id: 'player1',
        player1Name: 'Player 1',
        gridSize: 5,
        isPublic: false,
        maxPlayers: 2
      })
    })
  })

  describe('navigateToRematch', () => {
    beforeEach(() => {
      const rematch = useRematch()
      rematch.setOriginalMatch(mockMatchData)
    })

    it('should navigate to new match lobby on success', async () => {
      const { navigateToRematch } = useRematch()
      const { createMatch } = await import('@/firebase/matchHelpers')
      
      vi.mocked(createMatch).mockResolvedValue('new-match-id')

      await navigateToRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1'
      })

      expect(mockPush).toHaveBeenCalledWith('/lobby/new-match-id')
    })

    it('should not navigate on error', async () => {
      const { navigateToRematch } = useRematch()
      const { createMatch } = await import('@/firebase/matchHelpers')
      
      vi.mocked(createMatch).mockRejectedValue(new Error('Firebase error'))

      await navigateToRematch({
        originalMatchId: 'match1',
        currentUserId: 'player1',
        currentUserName: 'Player 1'
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('getRematchShareLink', () => {
    it('should return correct share link', () => {
      const { getRematchShareLink } = useRematch()
      
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://example.com' },
        writable: true
      })

      const link = getRematchShareLink('match123')
      expect(link).toBe('https://example.com/lobby/match123')
    })
  })

  describe('copyRematchLink', () => {
    it('should copy link to clipboard successfully', async () => {
      const { copyRematchLink } = useRematch()
      
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://example.com' },
        writable: true
      })

      vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined)

      const result = await copyRematchLink('match123')

      expect(result).toBe(true)
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/lobby/match123')
    })

    it('should return false on clipboard error', async () => {
      const { copyRematchLink } = useRematch()
      
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Clipboard error'))

      const result = await copyRematchLink('match123')

      expect(result).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset all state', () => {
      const rematch = useRematch()
      const { reset, isCreating, error, newMatchId, originalMatchData, setOriginalMatch } = rematch
      
      // Set some state
      setOriginalMatch(mockMatchData)

      reset()

      expect(isCreating.value).toBe(false)
      expect(error.value).toBe(null)
      expect(newMatchId.value).toBe(null)
      expect(originalMatchData.value).toBe(null)
    })
  })

  describe('composable interface', () => {
    it('should return readonly state and methods', () => {
      const rematch = useRematch()

      expect(rematch.isCreating).toBeDefined()
      expect(rematch.error).toBeDefined()
      expect(rematch.newMatchId).toBeDefined()
      expect(rematch.canCreateRematch).toBeDefined()
      expect(rematch.originalMatchData).toBeDefined()

      expect(rematch.setOriginalMatch).toBeDefined()
      expect(rematch.createRematch).toBeDefined()
      expect(rematch.navigateToRematch).toBeDefined()
      expect(rematch.getRematchShareLink).toBeDefined()
      expect(rematch.copyRematchLink).toBeDefined()
      expect(rematch.reset).toBeDefined()
    })
  })
}) 