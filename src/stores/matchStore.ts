import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subscribeToMatch, type MatchData } from '../firebase/matchHelpers'

export const useMatchStore = defineStore('match', () => {
  // State
  const currentMatchId = ref<string | null>(null)
  const matchData = ref<MatchData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const unsubscribe = ref<(() => void) | null>(null)

  // Computed properties
  const isConnected = computed(() => currentMatchId.value !== null && matchData.value !== null)
  const isWaiting = computed(() => matchData.value?.status === 'waiting')
  const isActive = computed(() => matchData.value?.status === 'active')
  const isCompleted = computed(() => matchData.value?.status === 'completed')
  const isCancelled = computed(() => matchData.value?.status === 'cancelled')
  
  const players = computed(() => {
    if (!matchData.value) return []
    
    const players = [matchData.value.player1]
    if (matchData.value.player2) {
      players.push(matchData.value.player2)
    }
    return players
  })

  const currentPlayer = computed(() => matchData.value?.currentTurn || 1)
  const scores = computed(() => matchData.value?.scores || { 1: 0, 2: 0 })
  const gameOver = computed(() => matchData.value?.gameOver || false)
  const winner = computed(() => matchData.value?.winner || null)
  
  const dots = computed(() => matchData.value?.dots || [])
  const squares = computed(() => matchData.value?.squares || [])
  const lines = computed(() => matchData.value?.lines || [])
  const gridSize = computed(() => matchData.value?.gridSize || 5)

  // Actions
  const subscribeToMatchById = (matchId: string) => {
    // Clean up existing subscription
    unsubscribeFromMatch()
    
    currentMatchId.value = matchId
    isLoading.value = true
    error.value = null
    
    try {
      const unsubscribeFn = subscribeToMatch(matchId, (data) => {
        isLoading.value = false
        
        if (data) {
          matchData.value = data
          error.value = null
        } else {
          matchData.value = null
          error.value = 'Match not found or no longer available'
        }
      })
      
      unsubscribe.value = unsubscribeFn
    } catch (err) {
      isLoading.value = false
      error.value = err instanceof Error ? err.message : 'Failed to subscribe to match'
      console.error('Error subscribing to match:', err)
    }
  }

  const unsubscribeFromMatch = () => {
    if (unsubscribe.value) {
      unsubscribe.value()
      unsubscribe.value = null
    }
    
    currentMatchId.value = null
    matchData.value = null
    isLoading.value = false
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  const getPlayerById = (playerId: string) => {
    return players.value.find(player => player.id === playerId)
  }

  const isPlayerInMatch = (playerId: string) => {
    return players.value.some(player => player.id === playerId)
  }

  const getPlayerNumber = (playerId: string) => {
    if (matchData.value?.player1.id === playerId) return 1
    if (matchData.value?.player2?.id === playerId) return 2
    return null
  }

  const isCurrentPlayerTurn = (playerId: string) => {
    const playerNumber = getPlayerNumber(playerId)
    return playerNumber === currentPlayer.value
  }

  const canPlayerMove = (playerId: string) => {
    return isActive.value && 
           isPlayerInMatch(playerId) && 
           isCurrentPlayerTurn(playerId) && 
           !gameOver.value
  }

  const getMatchStatus = () => {
    if (!matchData.value) return 'disconnected'
    return matchData.value.status
  }

  const getMatchProgress = () => {
    if (!squares.value.length) return 0
    const claimedSquares = squares.value.filter(s => s.player !== undefined).length
    return (claimedSquares / squares.value.length) * 100
  }

  const getRemainingSquares = () => {
    if (!squares.value.length) return 0
    return squares.value.filter(s => s.player === undefined).length
  }

  const getClaimedSquaresByPlayer = (playerNumber: number) => {
    if (!squares.value.length) return 0
    return squares.value.filter(s => s.player === playerNumber).length
  }

  // Reset store state
  const reset = () => {
    unsubscribeFromMatch()
  }

  return {
    // State
    currentMatchId,
    matchData,
    isLoading,
    error,
    
    // Computed
    isConnected,
    isWaiting,
    isActive,
    isCompleted,
    isCancelled,
    players,
    currentPlayer,
    scores,
    gameOver,
    winner,
    dots,
    squares,
    lines,
    gridSize,
    
    // Actions
    subscribeToMatchById,
    unsubscribeFromMatch,
    clearError,
    getPlayerById,
    isPlayerInMatch,
    getPlayerNumber,
    isCurrentPlayerTurn,
    canPlayerMove,
    getMatchStatus,
    getMatchProgress,
    getRemainingSquares,
    getClaimedSquaresByPlayer,
    reset
  }
}) 