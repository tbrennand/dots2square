import { ref, onUnmounted, watch } from 'vue'
import { useMatchStore } from '../stores/matchStore'
import type { MatchData } from '../firebase/matchHelpers'

export interface UseMatchSubscriptionOptions {
  autoSubscribe?: boolean
  onMatchUpdate?: (match: MatchData | null) => void
  onError?: (error: string) => void
  onStatusChange?: (status: string) => void
}

export function useMatchSubscription(
  matchId: string | null = null,
  options: UseMatchSubscriptionOptions = {}
) {
  const {
    autoSubscribe = true,
    onMatchUpdate,
    onError,
    onStatusChange
  } = options

  const matchStore = useMatchStore()
  const localMatchId = ref<string | null>(matchId)
  const isSubscribing = ref(false)

  // Subscribe to match
  const subscribe = async (id?: string) => {
    const targetId = id || localMatchId.value
    if (!targetId) {
      console.warn('No match ID provided for subscription')
      return
    }

    isSubscribing.value = true
    
    try {
      matchStore.subscribeToMatchById(targetId)
      localMatchId.value = targetId
    } catch (error) {
      console.error('Failed to subscribe to match:', error)
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to subscribe to match')
      }
    } finally {
      isSubscribing.value = false
    }
  }

  // Unsubscribe from match
  const unsubscribe = () => {
    matchStore.unsubscribeFromMatch()
    localMatchId.value = null
  }

  // Update match ID and optionally resubscribe
  const updateMatchId = (newMatchId: string | null, resubscribe = true) => {
    if (newMatchId === localMatchId.value) return
    
    if (resubscribe && newMatchId) {
      subscribe(newMatchId)
    } else {
      unsubscribe()
      localMatchId.value = newMatchId
    }
  }

  // Watch for match data changes and call callbacks
  watch(
    () => matchStore.matchData.value,
    (newMatch: MatchData | null) => {
      if (onMatchUpdate) {
        onMatchUpdate(newMatch)
      }
    },
    { immediate: true }
  )

  // Watch for status changes
  watch(
    () => matchStore.getMatchStatus(),
    (newStatus) => {
      if (onStatusChange) {
        onStatusChange(newStatus)
      }
    },
    { immediate: true }
  )

  // Watch for errors
  watch(
    () => matchStore.error.value,
    (newError: string | null) => {
      if (newError && onError) {
        onError(newError)
      }
    },
    { immediate: true }
  )

  // Auto-subscribe if enabled and matchId is provided
  if (autoSubscribe && localMatchId.value) {
    subscribe()
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    // State
    matchId: localMatchId,
    isSubscribing,
    isLoading: matchStore.isLoading,
    error: matchStore.error,
    
    // Match data
    match: matchStore.matchData,
    isConnected: matchStore.isConnected,
    isWaiting: matchStore.isWaiting,
    isActive: matchStore.isActive,
    isCompleted: matchStore.isCompleted,
    isCancelled: matchStore.isCancelled,
    
    // Game state
    players: matchStore.players,
    currentPlayer: matchStore.currentPlayer,
    scores: matchStore.scores,
    gameOver: matchStore.gameOver,
    winner: matchStore.winner,
    dots: matchStore.dots,
    squares: matchStore.squares,
    lines: matchStore.lines,
    gridSize: matchStore.gridSize,
    
    // Actions
    subscribe,
    unsubscribe,
    updateMatchId,
    clearError: matchStore.clearError,
    
    // Helper methods
    getPlayerById: matchStore.getPlayerById,
    isPlayerInMatch: matchStore.isPlayerInMatch,
    getPlayerNumber: matchStore.getPlayerNumber,
    isCurrentPlayerTurn: matchStore.isCurrentPlayerTurn,
    canPlayerMove: matchStore.canPlayerMove,
    getMatchStatus: matchStore.getMatchStatus,
    getMatchProgress: matchStore.getMatchProgress,
    getRemainingSquares: matchStore.getRemainingSquares,
    getClaimedSquaresByPlayer: matchStore.getClaimedSquaresByPlayer
  }
} 