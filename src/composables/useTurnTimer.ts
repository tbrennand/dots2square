import { ref, computed, onUnmounted, watch } from 'vue'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'

export interface TurnTimerState {
  isActive: boolean
  timeRemaining: number
  timeRemainingPercentage: number
  totalTime: number
  isExpired: boolean
  consecutiveMissedTurns: Record<string, number>
}

export function useTurnTimer(matchId: string, currentPlayerId: string | null) {
  // Timer state
  const timer = ref<NodeJS.Timeout | null>(null)
  const turnStartTime = ref<Date | null>(null)
  const turnDuration = ref(10) // 10 seconds for testing (change back to 30 for production)
  const timeRemaining = ref(turnDuration.value)
  const isTimerActive = ref(false)
  const consecutiveMissedTurns = ref<Record<string, number>>({})
  
  // Computed values
  const isExpired = computed(() => timeRemaining.value <= 0)
  const timeRemainingSeconds = computed(() => Math.max(0, Math.ceil(timeRemaining.value)))
  const timeRemainingPercentage = computed(() => {
    if (turnDuration.value === 0) return 0
    return Math.max(0, (timeRemaining.value / turnDuration.value) * 100)
  })

  // Start the turn timer
  const startTimer = (playerId: string, duration: number = 30) => {
    stopTimer() // Clear any existing timer
    
    turnDuration.value = duration
    turnStartTime.value = new Date()
    timeRemaining.value = duration
    isTimerActive.value = true
    
    console.log(`Turn timer started for player ${playerId}, duration: ${duration}s, remaining: ${timeRemaining.value}s`)
    
    // Update timer every 100ms for smooth countdown
    timer.value = setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value -= 0.1
        // Log every 5 seconds for debugging
        if (Math.ceil(timeRemaining.value) % 5 === 0 && timeRemaining.value > 0) {
          console.log(`Timer: ${Math.ceil(timeRemaining.value)}s remaining for player ${playerId}`)
        }
      } else {
        console.log(`Timer expired for player ${playerId}`)
        handleTurnExpired(playerId)
      }
    }, 100)
  }

  // Stop the turn timer
  const stopTimer = () => {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
    isTimerActive.value = false
    console.log('Turn timer stopped')
  }

  // Handle turn expiration
  const handleTurnExpired = async (playerId: string) => {
    stopTimer()
    
    if (!matchId) {
      console.warn('No match ID for turn expiration')
      return
    }

    try {
      // Increment consecutive missed turns
      const currentMissed = consecutiveMissedTurns.value[playerId] || 0
      const newMissedCount = currentMissed + 1
      consecutiveMissedTurns.value[playerId] = newMissedCount
      
      console.log(`Player ${playerId} missed turn. Consecutive misses: ${newMissedCount}`)

      // Check if player has missed 3 consecutive turns
      if (newMissedCount >= 3) {
        await handleGameTimeout(playerId)
      } else {
        await switchTurnToOpponent(playerId)
      }
    } catch (error) {
      console.error('Error handling turn expiration:', error)
    }
  }

  // Switch turn to opponent when current player misses
  const switchTurnToOpponent = async (playerId: string) => {
    if (!matchId) return

    try {
      const matchRef = doc(db, 'matches', matchId)
      
      // Get opponent ID (this would need to be passed in or retrieved)
      // For now, we'll update the turn start time and let the server handle the rest
      await updateDoc(matchRef, {
        turnStartedAt: serverTimestamp(),
        consecutiveMissedTurns: consecutiveMissedTurns.value,
        updatedAt: serverTimestamp()
      })
      
      console.log(`Turn switched to opponent after ${playerId} missed turn`)
    } catch (error) {
      console.error('Error switching turn:', error)
    }
  }

  // Handle game timeout (3 consecutive missed turns)
  const handleGameTimeout = async (playerId: string) => {
    if (!matchId) return

    try {
      const matchRef = doc(db, 'matches', matchId)
      
      // End the game - opponent wins
      await updateDoc(matchRef, {
        status: 'completed',
        gameEndReason: 'turn_timeout',
        consecutiveMissedTurns: consecutiveMissedTurns.value,
        updatedAt: serverTimestamp()
      })
      
      console.log(`Game ended due to 3 consecutive missed turns by ${playerId}`)
    } catch (error) {
      console.error('Error ending game due to timeout:', error)
    }
  }

  // Reset timer when turn is taken
  const resetTimerForPlayer = (playerId: string) => {
    if (consecutiveMissedTurns.value[playerId]) {
      consecutiveMissedTurns.value[playerId] = 0
      console.log(`Reset consecutive missed turns for player ${playerId}`)
    }
  }

  // Sync timer with server data
  const syncTimerWithServer = (serverTurnStartTime: Date | null, serverDuration: number = 30) => {
    if (!serverTurnStartTime) {
      stopTimer()
      return
    }

    const now = new Date()
    const elapsed = (now.getTime() - serverTurnStartTime.getTime()) / 1000
    const remaining = Math.max(0, serverDuration - elapsed)
    
    turnDuration.value = serverDuration
    timeRemaining.value = remaining
    turnStartTime.value = serverTurnStartTime
    
    // If there's still time remaining, start the timer
    if (remaining > 0) {
      startTimer(currentPlayerId || 'unknown', serverDuration)
    } else {
      // Turn has already expired
      handleTurnExpired(currentPlayerId || 'unknown')
    }
  }

  // Get timer state for display
  const getTimerState = (): TurnTimerState => {
    return {
      isActive: isTimerActive.value,
      timeRemaining: timeRemaining.value,
      timeRemainingPercentage: timeRemainingPercentage.value,
      totalTime: turnDuration.value,
      isExpired: isExpired.value,
      consecutiveMissedTurns: { ...consecutiveMissedTurns.value }
    }
  }

  // Clean up on unmount
  onUnmounted(() => {
    stopTimer()
  })

  return {
    // State
    timeRemaining: timeRemainingSeconds,
    timeRemainingPercentage,
    isExpired,
    isTimerActive,
    consecutiveMissedTurns,
    
    // Actions
    startTimer,
    stopTimer,
    resetTimerForPlayer,
    syncTimerWithServer,
    getTimerState
  }
} 