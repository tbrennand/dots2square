import { ref, computed, readonly } from 'vue'
import { createMatch } from '@/firebase/matchHelpers'
import { useRouter } from 'vue-router'
import type { MatchData } from '@/firebase/matchHelpers'

export interface RematchOptions {
  originalMatchId: string
  currentUserId: string
  currentUserName: string
  gridSize?: number
  isPublic?: boolean
}

export interface RematchState {
  isCreating: boolean
  error: string | null
  newMatchId: string | null
  canCreateRematch: boolean
}

export function useRematch() {
  const router = useRouter()
  
  // State
  const isCreating = ref(false)
  const error = ref<string | null>(null)
  const newMatchId = ref<string | null>(null)
  const originalMatchData = ref<MatchData | null>(null)

  // Computed
  const canCreateRematch = computed(() => {
    if (!originalMatchData.value) return false
    if (isCreating.value) return false
    
    // Check if both players are available for rematch
    const match = originalMatchData.value
    return match.player1 && match.player2 && match.status === 'completed'
  })

  // Methods
  const setOriginalMatch = (matchData: MatchData) => {
    originalMatchData.value = matchData
    error.value = null
    newMatchId.value = null
  }

  const createRematch = async (options: RematchOptions): Promise<string | null> => {
    const {
      originalMatchId,
      currentUserId,
      currentUserName,
      gridSize,
      isPublic = true
    } = options

    if (isCreating.value) {
      throw new Error('Rematch creation already in progress')
    }

    if (!originalMatchData.value) {
      throw new Error('No original match data available')
    }

    const originalMatch = originalMatchData.value

    // Validate that the current user was part of the original match
    const isPlayer1 = originalMatch.player1.id === currentUserId
    const isPlayer2 = originalMatch.player2?.id === currentUserId

    if (!isPlayer1 && !isPlayer2) {
      throw new Error('You were not part of the original match')
    }

    // Determine the other player
    const otherPlayer = isPlayer1 ? originalMatch.player2 : originalMatch.player1
    
    if (!otherPlayer) {
      throw new Error('Cannot create rematch: other player not found')
    }

    try {
      isCreating.value = true
      error.value = null

      // Create new match with same players
      const createdMatchId = await createMatch({
        player1Id: currentUserId,
        player1Name: currentUserName,
        gridSize: gridSize || originalMatch.gridSize || 5,
        isPublic,
        maxPlayers: 2
      })

      // Store the new match ID
      newMatchId.value = createdMatchId

      console.log('Rematch created successfully:', createdMatchId)
      return createdMatchId

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create rematch'
      error.value = errorMessage
      console.error('Error creating rematch:', err)
      throw new Error(errorMessage)
    } finally {
      isCreating.value = false
    }
  }

  const navigateToRematch = async (options: RematchOptions): Promise<void> => {
    try {
      const matchId = await createRematch(options)
      if (matchId) {
        // Navigate to the new match lobby
        router.push(`/lobby/${matchId}`)
      }
    } catch (err) {
      // Error is already set in createRematch
      console.error('Failed to navigate to rematch:', err)
    }
  }

  const getRematchShareLink = (matchId: string): string => {
    const baseUrl = window.location.origin
    return `${baseUrl}/lobby/${matchId}`
  }

  const copyRematchLink = async (matchId: string): Promise<boolean> => {
    try {
      const shareLink = getRematchShareLink(matchId)
      await navigator.clipboard.writeText(shareLink)
      return true
    } catch (err) {
      console.error('Failed to copy rematch link:', err)
      return false
    }
  }

  const reset = () => {
    isCreating.value = false
    error.value = null
    newMatchId.value = null
    originalMatchData.value = null
  }

  // Return composable interface
  return {
    // State
    isCreating: readonly(isCreating),
    error: readonly(error),
    newMatchId: readonly(newMatchId),
    canCreateRematch: readonly(canCreateRematch),
    originalMatchData: readonly(originalMatchData),

    // Methods
    setOriginalMatch,
    createRematch,
    navigateToRematch,
    getRematchShareLink,
    copyRematchLink,
    reset
  }
} 