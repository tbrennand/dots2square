import { ref, computed, onUnmounted } from 'vue'
import { 
  getLeaderboard, 
  subscribeToLeaderboard, 
  getUserRank,
  type LeaderboardEntry 
} from '@/firebase/userHelpers'

export interface LeaderboardOptions {
  limit?: number
  currentUserId?: string
}

export function useLeaderboard(options: LeaderboardOptions = {}) {
  const { limit = 10, currentUserId } = options

  // State
  const leaderboard = ref<LeaderboardEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const unsubscribe = ref<(() => void) | null>(null)
  const userRank = ref<number | null>(null)

  // Computed
  const topPlayers = computed(() => {
    return leaderboard.value.slice(0, 3) // Top 3 players
  })

  const currentUserEntry = computed(() => {
    if (!currentUserId) return null
    return leaderboard.value.find(entry => entry.id === currentUserId) || null
  })

  const hasData = computed(() => {
    return leaderboard.value.length > 0
  })

  // Methods
  const loadLeaderboard = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const data = await getLeaderboard(limit)
      leaderboard.value = data

      // Load user rank if current user ID is provided
      if (currentUserId) {
        const rank = await getUserRank(currentUserId)
        userRank.value = rank
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leaderboard'
      error.value = errorMessage
      console.error('Error loading leaderboard:', err)
    } finally {
      isLoading.value = false
    }
  }

  const subscribeToLeaderboardUpdates = (): void => {
    try {
      unsubscribe.value = subscribeToLeaderboard(
        limit,
        (data) => {
          leaderboard.value = data
          
          // Update user rank if current user ID is provided
          if (currentUserId) {
            const userEntry = data.find(entry => entry.id === currentUserId)
            userRank.value = userEntry ? userEntry.rank : null
          }
        },
        (err) => {
          error.value = err.message
          console.error('Leaderboard subscription error:', err)
        }
      )
    } catch (err) {
      console.error('Error setting up leaderboard subscription:', err)
      error.value = 'Failed to connect to leaderboard'
    }
  }

  const refreshLeaderboard = async (): Promise<void> => {
    await loadLeaderboard()
  }

  const clearError = (): void => {
    error.value = null
  }

  const reset = (): void => {
    leaderboard.value = []
    isLoading.value = false
    error.value = null
    userRank.value = null
    
    if (unsubscribe.value) {
      unsubscribe.value()
      unsubscribe.value = null
    }
  }

  // Auto-load leaderboard
  loadLeaderboard()

  // Auto-subscribe to updates
  subscribeToLeaderboardUpdates()

  // Cleanup on unmount
  onUnmounted(() => {
    reset()
  })

  return {
    // State
    leaderboard: computed(() => leaderboard.value),
    topPlayers,
    currentUserEntry,
    userRank: computed(() => userRank.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    hasData,

    // Methods
    loadLeaderboard,
    refreshLeaderboard,
    clearError,
    reset
  }
} 