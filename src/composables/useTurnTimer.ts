import { ref, computed, onUnmounted, watch, Ref } from 'vue'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import mitt from 'mitt'

export const turnTimerEvents = mitt()

export interface TurnTimerState {
  isActive: boolean
  timeRemaining: number
  timeRemainingPercentage: number
  totalTime: number
  isExpired: boolean
  consecutiveMissedTurns: Record<string, number>
}

export function useTurnTimer(
  matchId: Ref<string>, 
  currentPlayerId: Ref<string | null>,
  matchData: Ref<{ 
    player1?: { id: string, name: string }, 
    player2?: { id: string, name: string } | null,
    currentTurn?: number
  } | null>
) {
  // Timer state
  const timer = ref<NodeJS.Timeout | null>(null)
  const turnStartTime = ref<Date | null>(null)
  const turnDuration = ref(30) // 30 seconds for production
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
    
    // Update timer every 100ms for smooth countdown, but base it on server time
    timer.value = setInterval(() => {
      if (turnStartTime.value) {
        const now = new Date()
        const elapsed = (now.getTime() - turnStartTime.value.getTime()) / 1000
        const remaining = Math.max(0, turnDuration.value - elapsed)
        
        timeRemaining.value = remaining
        
        // Log every 5 seconds for debugging
        if (Math.ceil(remaining) % 5 === 0 && remaining > 0) {
          console.log(`Timer: ${Math.ceil(remaining)}s remaining for player ${playerId}`)
        }
        
        if (remaining <= 0) {
          console.log(`Timer expired for player ${playerId}`)
          handleTurnExpired(playerId)
        }
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
    
    if (!matchId.value) {
      console.warn('No match ID for turn expiration')
      return
    }

    try {
      console.log('Turn expired for player:', playerId, {
        currentTurn: matchData.value?.currentTurn,
        player1Id: matchData.value?.player1?.id,
        player2Id: matchData.value?.player2?.id
      })
      
      // Determine which player actually missed their turn based on currentTurn
      let missedPlayerId = ''
      let missedPlayerName = 'Unknown Player'
      
      if (matchData.value?.currentTurn === 1 && matchData.value?.player1?.id) {
        missedPlayerId = matchData.value.player1.id
        missedPlayerName = matchData.value.player1.name
        console.log('Player 1 missed turn:', missedPlayerName)
      } else if (matchData.value?.currentTurn === 2 && matchData.value?.player2?.id) {
        missedPlayerId = matchData.value.player2.id
        missedPlayerName = matchData.value.player2.name
        console.log('Player 2 missed turn:', missedPlayerName)
      } else {
        console.log('Cannot determine which player missed turn')
        return
      }
      
      // Increment consecutive missed turns for the missed player
      const currentMissed = consecutiveMissedTurns.value[missedPlayerId] || 0
      const newMissedCount = currentMissed + 1
      consecutiveMissedTurns.value[missedPlayerId] = newMissedCount
      
      console.log(`Player ${missedPlayerId} (${missedPlayerName}) missed turn. Consecutive misses: ${newMissedCount}`)

      // No warning screens - just pass turn to other player
      console.log('Turn expired - passing turn to opponent without warning')

      // Check if player has missed 3 consecutive turns
      if (newMissedCount >= 3) {
        await handleGameTimeout(missedPlayerId)
      } else {
        await switchTurnToOpponent(missedPlayerId)
      }
    } catch (error) {
      console.error('Error handling turn expiration:', error)
    }
  }

  // Switch turn to opponent when current player misses
  const switchTurnToOpponent = async (playerId: string) => {
    if (!matchId.value || !matchData.value) {
      console.log('Cannot switch turn - missing matchId or matchData:', { matchId: matchId.value, matchData: matchData.value })
      return
    }

    try {
      const matchRef = doc(db, 'matches', matchId.value)
      
      console.log('Switching turn after missed turn:', {
        currentTurn: matchData.value.currentTurn,
        playerId,
        player1Id: matchData.value.player1?.id,
        player2Id: matchData.value.player2?.id
      })
      
      // Determine which player should be next
      let nextTurn = 1
      let nextPlayerId = matchData.value.player1?.id || ''
      
      if (matchData.value.currentTurn === 1) {
        // Currently player 1's turn, switch to player 2
        nextTurn = 2
        nextPlayerId = matchData.value.player2?.id || matchData.value.player1?.id || ''
        console.log('Switching from player 1 to player 2:', nextPlayerId)
      } else if (matchData.value.currentTurn === 2) {
        // Currently player 2's turn, switch to player 1
        nextTurn = 1
        nextPlayerId = matchData.value.player1?.id || ''
        console.log('Switching from player 2 to player 1:', nextPlayerId)
      } else {
        console.log('Unknown current turn, defaulting to player 1')
      }
      
      const updateData = {
        currentTurn: nextTurn,
        currentPlayerId: nextPlayerId,
        turnStartedAt: serverTimestamp(),
        consecutiveMissedTurns: consecutiveMissedTurns.value,
        updatedAt: serverTimestamp()
      }
      
      console.log('Updating match with turn switch data:', updateData)
      
      await updateDoc(matchRef, updateData)
      
      console.log(`Turn switched to opponent after ${playerId} missed turn. Next turn: ${nextTurn}, next player: ${nextPlayerId}`)
    } catch (error) {
      console.error('Error switching turn:', error)
    }
  }

  // Handle game timeout (3 consecutive missed turns)
  const handleGameTimeout = async (playerId: string) => {
    if (!matchId.value || !matchData.value) return

    try {
      const matchRef = doc(db, 'matches', matchId.value)
      
      // Get the opponent who wins
      const winnerId = getOpponentId(playerId)
      
      // End the game - opponent wins
      await updateDoc(matchRef, {
        status: 'completed',
        gameEndReason: 'turn_timeout',
        winner: winnerId,
        winnerId: winnerId, // Also set winnerId field
        consecutiveMissedTurns: consecutiveMissedTurns.value,
        updatedAt: serverTimestamp()
      })
      
      // Emit game over event to both players
      turnTimerEvents.emit('gameOverByTimeout', { winner: winnerId })
      
      console.log(`Game ended due to 3 consecutive missed turns by ${playerId}. Winner: ${winnerId}`)
    } catch (error) {
      console.error('Error ending game due to timeout:', error)
    }
  }

  // A placeholder function to get the opponent's ID
  // This will need to be implemented properly based on your match data structure
  const getOpponentId = (timedOutPlayerId: string): string | null => {
    console.log('Getting opponent ID for:', timedOutPlayerId, {
      player1Id: matchData.value?.player1?.id,
      player2Id: matchData.value?.player2?.id
    })
    
    if (!matchData.value || !matchData.value.player1 || !matchData.value.player2) {
      console.log('Cannot get opponent - missing player data')
      return null
    }
    if (timedOutPlayerId === matchData.value.player1.id) {
      console.log('Player 1 timed out, opponent is player 2:', matchData.value.player2.id)
      return matchData.value.player2.id
    }
    if (timedOutPlayerId === matchData.value.player2?.id) { // Added optional chaining for player2
      console.log('Player 2 timed out, opponent is player 1:', matchData.value.player1.id)
      return matchData.value.player1.id
    }
    console.log('Unknown player timed out:', timedOutPlayerId)
    return null
  }

  // Reset timer when turn is taken
  const resetTimerForPlayer = (playerId: string) => {
    if (consecutiveMissedTurns.value[playerId]) {
      consecutiveMissedTurns.value[playerId] = 0
      console.log(`Reset consecutive missed turns for player ${playerId}`)
    }
  }

  // Sync timer with server data
  const syncTimerWithServer = (serverTurnStartTime: Date | null, serverDuration: number = 30, serverMissedTurns?: Record<string, number>) => {
    console.log('Syncing timer with server:', {
      serverTurnStartTime,
      serverDuration,
      serverMissedTurns,
      currentTurnStartTime: turnStartTime.value
    })
    
    if (!serverTurnStartTime) {
      console.log('No server turn start time - stopping timer')
      stopTimer()
      return
    }

    const now = new Date()
    const elapsed = (now.getTime() - serverTurnStartTime.getTime()) / 1000
    const remaining = Math.max(0, serverDuration - elapsed)
    
    // Check if this is a new turn (turn start time changed significantly)
    const isNewTurn = !turnStartTime.value || 
                     Math.abs(turnStartTime.value.getTime() - serverTurnStartTime.getTime()) > 1000 // 1 second threshold
    
    console.log('Timer sync calculation:', {
      now: now.toISOString(),
      serverTurnStartTime: serverTurnStartTime.toISOString(),
      elapsed,
      remaining,
      serverDuration,
      isNewTurn,
      currentTurnStartTime: turnStartTime.value?.toISOString()
    })
    
    if (isNewTurn) {
      console.log('🔄 NEW TURN DETECTED - Resetting timer to full duration')
      turnDuration.value = serverDuration
      timeRemaining.value = serverDuration // Start with full duration for new turn
      turnStartTime.value = serverTurnStartTime
    } else {
      console.log('⏱️ SAME TURN - Using calculated remaining time')
      turnDuration.value = serverDuration
      timeRemaining.value = remaining
      turnStartTime.value = serverTurnStartTime
    }
    
    // Sync consecutive missed turns from server
    if (serverMissedTurns) {
      consecutiveMissedTurns.value = { ...serverMissedTurns }
      console.log('Synced consecutive missed turns from server:', consecutiveMissedTurns.value)
    }
    
    // Always start the timer to keep it synchronized, even if remaining is 0
    // This ensures both players see the same countdown
    isTimerActive.value = true
    
    // Clear any existing timer
    if (timer.value) {
      clearInterval(timer.value)
    }
    
    console.log('Starting synchronized timer with remaining time:', remaining)
    
    // Start synchronized timer that's based on server time, not client time
    timer.value = setInterval(() => {
      if (turnStartTime.value) {
        const currentTime = new Date()
        const elapsed = (currentTime.getTime() - turnStartTime.value.getTime()) / 1000
        const remaining = Math.max(0, turnDuration.value - elapsed)
        
        timeRemaining.value = remaining
        
        // Log every 5 seconds for debugging
        if (Math.ceil(remaining) % 5 === 0 && remaining > 0) {
          console.log(`Synchronized timer: ${Math.ceil(remaining)}s remaining`)
        }
        
        if (remaining <= 0) {
          // Turn has expired - determine which player should be timed out
          // Use the currentTurn field from match data to determine which player should be playing
          let currentTurnPlayerId = 'unknown'
          
          console.log('Timer expired - matchData:', {
            currentTurn: matchData.value?.currentTurn,
            player1: matchData.value?.player1?.id,
            player2: matchData.value?.player2?.id,
            currentPlayerId: currentPlayerId.value
          })
          
          if (matchData.value?.currentTurn && matchData.value.player1?.id) {
            if (matchData.value.currentTurn === 1) {
              currentTurnPlayerId = matchData.value.player1.id
            } else if (matchData.value.currentTurn === 2 && matchData.value.player2?.id) {
              currentTurnPlayerId = matchData.value.player2.id
            }
          } else {
            // Fallback: if currentTurn is not available, use the current player ID
            currentTurnPlayerId = currentPlayerId.value || 'unknown'
          }
          
          console.log('Synchronized timer expired for player:', currentTurnPlayerId, 'currentTurn:', matchData.value?.currentTurn)
          handleTurnExpired(currentTurnPlayerId)
        }
      }
    }, 100)
    
    console.log(`Timer synchronized with server: ${Math.ceil(remaining)}s remaining, duration: ${serverDuration}s`)
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