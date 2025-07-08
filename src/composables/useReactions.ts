import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/firebase/index'
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'

export interface Reaction {
  id: string
  emoji: string
  playerId: string
  playerName: string
  timestamp: Date
  matchId: string
}

export interface ReactionOptions {
  matchId: string
  currentUserId: string
  currentUserName: string
  maxReactions?: number
}

export function useReactions(options: ReactionOptions) {
  const { matchId, currentUserId, currentUserName, maxReactions = 50 } = options

  // State
  const reactions = ref<Reaction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const unsubscribe = ref<(() => void) | null>(null)

  // Computed
  const recentReactions = computed(() => {
    return reactions.value.slice(-10).reverse() // Last 10 reactions, most recent first
  })

  const playerReactions = computed(() => {
    return reactions.value.filter(r => r.playerId === currentUserId)
  })

  const canSendReaction = computed(() => {
    // Limit reactions per player to prevent spam
    const recentPlayerReactions = playerReactions.value.filter(r => {
      const timeDiff = Date.now() - r.timestamp.getTime()
      return timeDiff < 5000 // 5 seconds
    })
    return recentPlayerReactions.length < 3 // Max 3 reactions per 5 seconds
  })

  // Methods
  const sendReaction = async (emoji: string): Promise<boolean> => {
    if (!canSendReaction.value) {
      error.value = 'Too many reactions! Please wait a moment.'
      return false
    }

    try {
      isLoading.value = true
      error.value = null

      const reactionData = {
        emoji,
        playerId: currentUserId,
        playerName: currentUserName,
        matchId,
        timestamp: serverTimestamp()
      }

      await addDoc(collection(db, 'reactions'), reactionData)
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reaction'
      error.value = errorMessage
      console.error('Error sending reaction:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const subscribeToReactions = () => {
    try {
      const reactionsRef = collection(db, 'reactions')
      const reactionsQuery = query(
        reactionsRef,
        orderBy('timestamp', 'desc'),
        limit(maxReactions)
      )

      unsubscribe.value = onSnapshot(
        reactionsQuery,
        (snapshot) => {
          const newReactions: Reaction[] = []
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            if (data.matchId === matchId) {
              newReactions.push({
                id: doc.id,
                emoji: data.emoji,
                playerId: data.playerId,
                playerName: data.playerName,
                timestamp: data.timestamp?.toDate() || new Date(),
                matchId: data.matchId
              })
            }
          })

          // Sort by timestamp (oldest first for display)
          reactions.value = newReactions.sort((a, b) => 
            a.timestamp.getTime() - b.timestamp.getTime()
          )
        },
        (err) => {
          console.error('Error listening to reactions:', err)
          error.value = 'Failed to load reactions'
        }
      )
    } catch (err) {
      console.error('Error setting up reactions subscription:', err)
      error.value = 'Failed to connect to reactions'
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    reactions.value = []
    isLoading.value = false
    error.value = null
    
    if (unsubscribe.value) {
      unsubscribe.value()
      unsubscribe.value = null
    }
  }

  // Auto-subscribe
  subscribeToReactions()

  // Cleanup on unmount
  onUnmounted(() => {
    reset()
  })

  return {
    // State
    reactions: computed(() => reactions.value),
    recentReactions,
    playerReactions,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    canSendReaction,

    // Methods
    sendReaction,
    clearError,
    reset
  }
} 