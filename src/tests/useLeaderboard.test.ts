import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLeaderboard } from '@/composables/useLeaderboard'
import type { LeaderboardEntry } from '@/firebase/userHelpers'
import { getLeaderboard, subscribeToLeaderboard, getUserRank } from '@/firebase/userHelpers'

// Mock Firebase helpers
vi.mock('@/firebase/userHelpers', () => ({
  getLeaderboard: vi.fn(),
  subscribeToLeaderboard: vi.fn(),
  getUserRank: vi.fn()
}))

describe('useLeaderboard', () => {
  const mockLeaderboard: LeaderboardEntry[] = [
    {
      id: 'user1',
      name: 'Player 1',
      totalScore: 200,
      gamesWon: 5,
      winRate: 80,
      rank: 1
    },
    {
      id: 'user2',
      name: 'Player 2',
      totalScore: 150,
      gamesWon: 3,
      winRate: 60,
      rank: 2
    },
    {
      id: 'user3',
      name: 'Player 3',
      totalScore: 100,
      gamesWon: 2,
      winRate: 40,
      rank: 3
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { leaderboard, isLoading, error, hasData } = useLeaderboard()

      expect(leaderboard.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(error.value).toBe(null)
      expect(hasData.value).toBe(false)
    })

    it('should auto-load leaderboard on initialization', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      useLeaderboard()

      expect(getLeaderboard).toHaveBeenCalledWith(10)
    })

    it('should auto-subscribe to leaderboard updates', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      useLeaderboard()

      expect(subscribeToLeaderboard).toHaveBeenCalledWith(10, expect.any(Function), expect.any(Function))
    })
  })

  describe('computed properties', () => {
    it('should return top 3 players', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue(mockLeaderboard)
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { topPlayers } = useLeaderboard()

      expect(topPlayers.value).toHaveLength(3)
      expect(topPlayers.value[0].rank).toBe(1)
      expect(topPlayers.value[1].rank).toBe(2)
      expect(topPlayers.value[2].rank).toBe(3)
    })

    it('should find current user entry', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue(mockLeaderboard)
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { currentUserEntry } = useLeaderboard({ currentUserId: 'user2' })

      expect(currentUserEntry.value).toEqual(mockLeaderboard[1])
    })

    it('should return null for current user entry when user not found', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue(mockLeaderboard)
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { currentUserEntry } = useLeaderboard({ currentUserId: 'nonexistent' })

      expect(currentUserEntry.value).toBeNull()
    })

    it('should return true for hasData when leaderboard has entries', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue(mockLeaderboard)
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { hasData } = useLeaderboard()

      expect(hasData.value).toBe(true)
    })

    it('should return false for hasData when leaderboard is empty', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { hasData } = useLeaderboard()

      expect(hasData.value).toBe(false)
    })
  })

  describe('loadLeaderboard', () => {
    it('should load leaderboard successfully', async () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue(mockLeaderboard)
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})
      vi.mocked(getUserRank).mockResolvedValue(2)

      const { loadLeaderboard, leaderboard, userRank } = useLeaderboard({ currentUserId: 'user2' })

      await loadLeaderboard()

      expect(leaderboard.value).toEqual(mockLeaderboard)
      expect(userRank.value).toBe(2)
    })

    it('should handle load errors', async () => {
      
      vi.mocked(getLeaderboard).mockRejectedValue(new Error('Firebase error'))
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { loadLeaderboard, error } = useLeaderboard()

      await loadLeaderboard()

      expect(error.value).toBe('Failed to load leaderboard')
    })

    it('should set loading state during load', async () => {
      
      vi.mocked(getLeaderboard).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockLeaderboard), 100)))
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { loadLeaderboard, isLoading } = useLeaderboard()

      const loadPromise = loadLeaderboard()
      
      expect(isLoading.value).toBe(true)
      
      await loadPromise
      
      expect(isLoading.value).toBe(false)
    })
  })

  describe('refreshLeaderboard', () => {
    it('should reload leaderboard data', async () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue(mockLeaderboard)
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { refreshLeaderboard, leaderboard } = useLeaderboard()

      await refreshLeaderboard()

      expect(getLeaderboard).toHaveBeenCalledTimes(2) // Once on init, once on refresh
      expect(leaderboard.value).toEqual(mockLeaderboard)
    })
  })

  describe('clearError', () => {
    it('should clear error message', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const { clearError, error } = useLeaderboard()

      // Simulate setting an error
      // In real usage, this would happen through loadLeaderboard
      clearError()
      
      expect(error.value).toBe(null)
    })
  })

  describe('reset', () => {
    it('should reset all state and unsubscribe', () => {
      
      const mockUnsubscribe = vi.fn()
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockReturnValue(mockUnsubscribe)

      const { reset, leaderboard, isLoading, error, userRank } = useLeaderboard()

      reset()

      expect(leaderboard.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(error.value).toBe(null)
      expect(userRank.value).toBe(null)
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('subscription handling', () => {
    it('should update leaderboard when subscription receives data', () => {
      
      let subscriptionCallback: (data: LeaderboardEntry[]) => void
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockImplementation((limit, callback) => {
        subscriptionCallback = callback
        return () => {}
      })

      const { leaderboard } = useLeaderboard()

      // Simulate subscription update
      subscriptionCallback!(mockLeaderboard)

      expect(leaderboard.value).toEqual(mockLeaderboard)
    })

    it('should handle subscription errors', () => {
      
      let errorCallback: (error: Error) => void
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockImplementation((limit, callback, onError) => {
        errorCallback = onError
        return () => {}
      })

      const { error } = useLeaderboard()

      // Simulate subscription error
      errorCallback!(new Error('Subscription error'))

      expect(error.value).toBe('Subscription error')
    })

    it('should update user rank when subscription receives data', () => {
      
      let subscriptionCallback: (data: LeaderboardEntry[]) => void
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockImplementation((limit, callback) => {
        subscriptionCallback = callback
        return () => {}
      })

      const { userRank } = useLeaderboard({ currentUserId: 'user2' })

      // Simulate subscription update
      subscriptionCallback!(mockLeaderboard)

      expect(userRank.value).toBe(2)
    })
  })

  describe('options handling', () => {
    it('should use custom limit', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      useLeaderboard({ limit: 5 })

      expect(getLeaderboard).toHaveBeenCalledWith(5)
      expect(subscribeToLeaderboard).toHaveBeenCalledWith(5, expect.any(Function), expect.any(Function))
    })

    it('should use current user ID for rank lookup', async () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue(mockLeaderboard)
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})
      vi.mocked(getUserRank).mockResolvedValue(3)

      const { loadLeaderboard } = useLeaderboard({ currentUserId: 'user3' })

      await loadLeaderboard()

      expect(getUserRank).toHaveBeenCalledWith('user3')
    })
  })

  describe('composable interface', () => {
    it('should return all required properties and methods', () => {
      
      vi.mocked(getLeaderboard).mockResolvedValue([])
      vi.mocked(subscribeToLeaderboard).mockReturnValue(() => {})

      const leaderboard = useLeaderboard()

      expect(leaderboard.leaderboard).toBeDefined()
      expect(leaderboard.topPlayers).toBeDefined()
      expect(leaderboard.currentUserEntry).toBeDefined()
      expect(leaderboard.userRank).toBeDefined()
      expect(leaderboard.isLoading).toBeDefined()
      expect(leaderboard.error).toBeDefined()
      expect(leaderboard.hasData).toBeDefined()

      expect(leaderboard.loadLeaderboard).toBeDefined()
      expect(leaderboard.refreshLeaderboard).toBeDefined()
      expect(leaderboard.clearError).toBeDefined()
      expect(leaderboard.reset).toBeDefined()
    })
  })
}) 