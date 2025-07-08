import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  createOrUpdateUser, 
  getUser, 
  updateUserStats, 
  getLeaderboard, 
  getUserRank,
  getUsers,
  type User,
  type CreateUserData,
  type UpdateUserStatsData
} from '@/firebase/userHelpers'

// Mock Firebase
vi.mock('@/firebase/index', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  increment: vi.fn((value) => ({ increment: value })),
  where: vi.fn()
}))

describe('userHelpers', () => {
  const mockUserId = 'user123'
  const mockUserData: CreateUserData = {
    name: 'Test User',
    email: 'test@example.com'
  }

  const mockUser: User = {
    id: mockUserId,
    name: 'Test User',
    email: 'test@example.com',
    totalGames: 5,
    gamesWon: 3,
    gamesLost: 2,
    totalScore: 150,
    bestScore: 50,
    averageScore: 30,
    winRate: 60,
    lastPlayed: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createOrUpdateUser', () => {
    it('should create a new user when user does not exist', async () => {
      const { doc, getDoc, setDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      } as any)
      
      vi.mocked(setDoc).mockResolvedValue(undefined)

      const result = await createOrUpdateUser(mockUserId, mockUserData)

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: mockUserData.name,
          email: mockUserData.email,
          totalGames: 0,
          gamesWon: 0,
          gamesLost: 0,
          totalScore: 0,
          bestScore: 0,
          averageScore: 0,
          winRate: 0
        })
      )

      expect(result.id).toBe(mockUserId)
      expect(result.name).toBe(mockUserData.name)
    })

    it('should update existing user when user exists', async () => {
      const { doc, getDoc, updateDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockUser
        } as any)
      
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      const result = await createOrUpdateUser(mockUserId, mockUserData)

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: mockUserData.name,
          email: mockUserData.email
        })
      )

      expect(result.id).toBe(mockUserId)
    })

    it('should handle errors', async () => {
      const { getDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc).mockRejectedValue(new Error('Firebase error'))

      await expect(createOrUpdateUser(mockUserId, mockUserData))
        .rejects.toThrow('Failed to create or update user')
    })
  })

  describe('getUser', () => {
    it('should return user when user exists', async () => {
      const { doc, getDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUser
      } as any)

      const result = await getUser(mockUserId)

      expect(result).toEqual(mockUser)
    })

    it('should return null when user does not exist', async () => {
      const { doc, getDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      } as any)

      const result = await getUser(mockUserId)

      expect(result).toBeNull()
    })

    it('should handle errors', async () => {
      const { getDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc).mockRejectedValue(new Error('Firebase error'))

      await expect(getUser(mockUserId))
        .rejects.toThrow('Failed to get user')
    })
  })

  describe('updateUserStats', () => {
    it('should update user stats for a win', async () => {
      const { doc, getDoc, updateDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockUser
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ...mockUser, totalGames: 6, gamesWon: 4, totalScore: 200 })
        } as any)
      
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      const stats: UpdateUserStatsData = {
        gameWon: true,
        score: 50
      }

      await updateUserStats(mockUserId, stats)

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalGames: { increment: 1 },
          gamesWon: { increment: 1 },
          totalScore: { increment: 50 }
        })
      )
    })

    it('should update user stats for a loss', async () => {
      const { doc, getDoc, updateDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockUser
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ...mockUser, totalGames: 6, gamesLost: 3, totalScore: 200 })
        } as any)
      
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      const stats: UpdateUserStatsData = {
        gameWon: false,
        score: 30
      }

      await updateUserStats(mockUserId, stats)

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalGames: { increment: 1 },
          gamesLost: { increment: 1 },
          totalScore: { increment: 30 }
        })
      )
    })

    it('should update best score when current score is higher', async () => {
      const { doc, getDoc, updateDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockUser
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ...mockUser, totalGames: 6, totalScore: 200 })
        } as any)
      
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      const stats: UpdateUserStatsData = {
        score: 75 // Higher than current bestScore of 50
      }

      await updateUserStats(mockUserId, stats)

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bestScore: 75
        })
      )
    })

    it('should handle user not found', async () => {
      const { getDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      } as any)

      await expect(updateUserStats(mockUserId, { gameWon: true }))
        .rejects.toThrow('User not found')
    })

    it('should handle errors', async () => {
      const { getDoc } = await import('firebase/firestore')
      
      vi.mocked(getDoc).mockRejectedValue(new Error('Firebase error'))

      await expect(updateUserStats(mockUserId, { gameWon: true }))
        .rejects.toThrow('Failed to update user stats')
    })
  })

  describe('getLeaderboard', () => {
    it('should return leaderboard entries', async () => {
      const { collection, query, orderBy, limit, getDocs, where } = await import('firebase/firestore')
      
      const mockSnapshot = {
        docs: [
          {
            id: 'user1',
            data: () => ({
              name: 'User 1',
              totalScore: 200,
              gamesWon: 5,
              winRate: 80
            })
          },
          {
            id: 'user2',
            data: () => ({
              name: 'User 2',
              totalScore: 150,
              gamesWon: 3,
              winRate: 60
            })
          }
        ]
      }

      vi.mocked(collection).mockReturnValue({} as any)
      vi.mocked(query).mockReturnValue({} as any)
      vi.mocked(orderBy).mockReturnValue({} as any)
      vi.mocked(limit).mockReturnValue({} as any)
      vi.mocked(where).mockReturnValue({} as any)
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any)

      const result = await getLeaderboard(10)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'user1',
        name: 'User 1',
        totalScore: 200,
        gamesWon: 5,
        winRate: 80,
        rank: 1
      })
      expect(result[1]).toEqual({
        id: 'user2',
        name: 'User 2',
        totalScore: 150,
        gamesWon: 3,
        winRate: 60,
        rank: 2
      })
    })

    it('should handle errors', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      vi.mocked(getDocs).mockRejectedValue(new Error('Firebase error'))

      await expect(getLeaderboard())
        .rejects.toThrow('Failed to get leaderboard')
    })
  })

  describe('getUserRank', () => {
    it('should return user rank when user exists and has played games', async () => {
      const { getUser } = await import('@/firebase/userHelpers')
      const { collection, query, orderBy, getDocs, where } = await import('firebase/firestore')
      
      vi.mocked(getUser).mockResolvedValue(mockUser)
      
      const mockSnapshot = {
        docs: [
          { id: 'user1' },
          { id: 'user2' },
          { id: mockUserId }, // User is 3rd
          { id: 'user4' }
        ]
      }

      vi.mocked(collection).mockReturnValue({} as any)
      vi.mocked(query).mockReturnValue({} as any)
      vi.mocked(orderBy).mockReturnValue({} as any)
      vi.mocked(where).mockReturnValue({} as any)
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any)

      const result = await getUserRank(mockUserId)

      expect(result).toBe(3)
    })

    it('should return null when user has not played games', async () => {
      const { getUser } = await import('@/firebase/userHelpers')
      
      vi.mocked(getUser).mockResolvedValue({
        ...mockUser,
        totalGames: 0
      })

      const result = await getUserRank(mockUserId)

      expect(result).toBeNull()
    })

    it('should return null when user does not exist', async () => {
      const { getUser } = await import('@/firebase/userHelpers')
      
      vi.mocked(getUser).mockResolvedValue(null)

      const result = await getUserRank(mockUserId)

      expect(result).toBeNull()
    })

    it('should handle errors', async () => {
      const { getUser } = await import('@/firebase/userHelpers')
      
      vi.mocked(getUser).mockRejectedValue(new Error('Firebase error'))

      await expect(getUserRank(mockUserId))
        .rejects.toThrow('Failed to get user rank')
    })
  })

  describe('getUsers', () => {
    it('should return multiple users', async () => {
      const { getUser } = await import('@/firebase/userHelpers')
      
      const user1 = { ...mockUser, id: 'user1', name: 'User 1' }
      const user2 = { ...mockUser, id: 'user2', name: 'User 2' }
      
      vi.mocked(getUser)
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2)

      const result = await getUsers(['user1', 'user2'])

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(user1)
      expect(result[1]).toEqual(user2)
    })

    it('should filter out non-existent users', async () => {
      const { getUser } = await import('@/firebase/userHelpers')
      
      vi.mocked(getUser)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null)

      const result = await getUsers([mockUserId, 'nonexistent'])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockUser)
    })

    it('should handle errors', async () => {
      const { getUser } = await import('@/firebase/userHelpers')
      
      vi.mocked(getUser).mockRejectedValue(new Error('Firebase error'))

      await expect(getUsers([mockUserId]))
        .rejects.toThrow('Failed to get users')
    })
  })
}) 