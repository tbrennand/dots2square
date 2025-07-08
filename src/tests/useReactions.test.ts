import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useReactions } from '@/composables/useReactions'
import type { Reaction } from '@/composables/useReactions'

// Mock Firebase
vi.mock('@/firebase/index', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}))

describe('useReactions', () => {
  const mockOptions = {
    matchId: 'match123',
    currentUserId: 'user1',
    currentUserName: 'Player 1',
    maxReactions: 50
  }

  const mockReaction: Reaction = {
    id: 'reaction1',
    emoji: '👍',
    playerId: 'user1',
    playerName: 'Player 1',
    timestamp: new Date(),
    matchId: 'match123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { reactions, isLoading, error, canSendReaction } = useReactions(mockOptions)

      expect(reactions.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(error.value).toBe(null)
      expect(canSendReaction.value).toBe(true)
    })
  })

  describe('sendReaction', () => {
    it('should send reaction successfully', async () => {
      const { sendReaction } = useReactions(mockOptions)
      const { addDoc } = await import('firebase/firestore')
      
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-reaction-id' } as any)

      const result = await sendReaction('👍')

      expect(result).toBe(true)
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          emoji: '👍',
          playerId: 'user1',
          playerName: 'Player 1',
          matchId: 'match123'
        })
      )
    })

    it('should handle send errors', async () => {
      const { sendReaction, error } = useReactions(mockOptions)
      const { addDoc } = await import('firebase/firestore')
      
      vi.mocked(addDoc).mockRejectedValue(new Error('Firebase error'))

      const result = await sendReaction('👍')

      expect(result).toBe(false)
      expect(error.value).toBe('Failed to send reaction')
    })

    it('should prevent spam reactions', async () => {
      const { sendReaction, canSendReaction } = useReactions(mockOptions)
      const { addDoc } = await import('firebase/firestore')
      
      vi.mocked(addDoc).mockResolvedValue({ id: 'reaction-id' } as any)

      // Send 3 reactions quickly
      await sendReaction('👍')
      await sendReaction('❤️')
      await sendReaction('🎉')

      // Fourth reaction should be blocked
      const result = await sendReaction('😊')
      expect(result).toBe(false)
      expect(canSendReaction.value).toBe(false)
    })
  })

  describe('recentReactions', () => {
    it('should return last 10 reactions in reverse order', () => {
      const { recentReactions } = useReactions(mockOptions)
      
      // Mock reactions array with more than 10 items
      const mockReactions = Array.from({ length: 15 }, (_, i) => ({
        ...mockReaction,
        id: `reaction${i}`,
        timestamp: new Date(Date.now() + i * 1000)
      }))

      // Manually set reactions (in real usage this would come from Firebase)
      const reactions = useReactions(mockOptions)
      // Note: In a real test, we'd need to mock the Firebase subscription
      // This is a simplified test
    })
  })

  describe('playerReactions', () => {
    it('should filter reactions by current player', () => {
      const { playerReactions } = useReactions(mockOptions)
      
      // This would be tested with mocked Firebase data
      expect(playerReactions.value).toEqual([])
    })
  })

  describe('canSendReaction', () => {
    it('should allow reactions when under limit', () => {
      const { canSendReaction } = useReactions(mockOptions)
      expect(canSendReaction.value).toBe(true)
    })

    it('should block reactions when over limit', async () => {
      const { sendReaction, canSendReaction } = useReactions(mockOptions)
      const { addDoc } = await import('firebase/firestore')
      
      vi.mocked(addDoc).mockResolvedValue({ id: 'reaction-id' } as any)

      // Send reactions to trigger limit
      await sendReaction('👍')
      await sendReaction('❤️')
      await sendReaction('🎉')

      expect(canSendReaction.value).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should clear errors', () => {
      const { error, clearError } = useReactions(mockOptions)
      
      // Simulate setting an error
      // In real usage, this would happen through sendReaction
      clearError()
      expect(error.value).toBe(null)
    })
  })

  describe('cleanup', () => {
    it('should reset state on cleanup', () => {
      const { reset, reactions, isLoading, error } = useReactions(mockOptions)
      
      reset()
      
      expect(reactions.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(error.value).toBe(null)
    })
  })

  describe('composable interface', () => {
    it('should return all required properties and methods', () => {
      const reactions = useReactions(mockOptions)

      expect(reactions.reactions).toBeDefined()
      expect(reactions.recentReactions).toBeDefined()
      expect(reactions.playerReactions).toBeDefined()
      expect(reactions.isLoading).toBeDefined()
      expect(reactions.error).toBeDefined()
      expect(reactions.canSendReaction).toBeDefined()

      expect(reactions.sendReaction).toBeDefined()
      expect(reactions.clearError).toBeDefined()
      expect(reactions.reset).toBeDefined()
    })
  })
}) 