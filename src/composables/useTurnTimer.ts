import { ref, computed, onUnmounted, watch } from 'vue'
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
  matchId: string, 
  currentPlayerId: string | null,
  matchData: { 
    player1?: { id: string, name: string }, 
    player2?: { id: string, name: string } | null,
    currentTurn?: number
  } | null
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
    
    if (!matchId) {
      console.warn('No match ID for turn expiration')
      return
    }

    try {
      // Determine which actual player (player1 or player2) the current player ID corresponds to
      let actualPlayerId = playerId
      let missedPlayerName = 'Unknown Player'
      
      console.log('Determining actual player for turn expiration:', {
        playerId,
        currentPlayerId,
        player1Id: matchData?.player1?.id,
        player2Id: matchData?.player2?.id,
        currentTurn: matchData?.currentTurn
      })
      
      // If the playerId is the random user ID, we need to determine which actual player it corresponds to
      if (playerId.startsWith('user-')) {
        // This is a random user ID, we need to determine which player it is
        if (currentPlayerId === matchData?.player1?.id) {
          actualPlayerId = matchData.player1.id
          missedPlayerName = matchData.player1.name
          console.log('Current player is player1:', missedPlayerName)
        } else if (currentPlayerId === matchData?.player2?.id) {
          actualPlayerId = matchData.player2?.id || ''
          missedPlayerName = matchData.player2?.name || 'Player 2'
          console.log('Current player is player2:', missedPlayerName)
        } else {
          // Fallback: determine based on current turn
          if (matchData?.currentTurn === 1) {
            actualPlayerId = matchData.player1?.id || ''
            missedPlayerName = matchData.player1?.name || 'Player 1'
            console.log('Based on current turn, player1 missed:', missedPlayerName)
          } else if (matchData?.currentTurn === 2) {
            actualPlayerId = matchData.player2?.id || ''
            missedPlayerName = matchData.player2?.name || 'Player 2'
            console.log('Based on current turn, player2 missed:', missedPlayerName)
          }
        }
      } else {
        // This is already an actual player ID
        if (playerId === matchData?.player1?.id) {
          missedPlayerName = matchData.player1.name
        } else if (playerId === matchData?.player2?.id) {
          missedPlayerName = matchData.player2?.name || 'Player 2'
        }
      }
      
      // Increment consecutive missed turns for the actual player
      const currentMissed = consecutiveMissedTurns.value[actualPlayerId] || 0
      const newMissedCount = currentMissed + 1
      consecutiveMissedTurns.value[actualPlayerId] = newMissedCount
      
      console.log(`Player ${actualPlayerId} (${missedPlayerName}) missed turn. Consecutive misses: ${newMissedCount}`)

      // Emit warning events to the player who missed their turn AND the host
      // Always show warning to both players for debugging
      const shouldShowWarning = true
      
      console.log('Turn expired - shouldShowWarning:', shouldShowWarning, {
        currentPlayerId,
        actualPlayerId,
        missedPlayerName,
        isCurrentPlayer: currentPlayerId === playerId,
        isHost: matchData && matchData.player1 && currentPlayerId === matchData.player1.id,
        currentTurn: matchData?.currentTurn,
        player1Id: matchData?.player1?.id,
        player2Id: matchData?.player2?.id
      })
      
      if (shouldShowWarning) {
        if (newMissedCount === 1) {
          console.log('Emitting turnWarning event for 1st miss')
          turnTimerEvents.emit('turnWarning', {
            strikes: 1,
            message: currentPlayerId === playerId 
              ? 'You missed your go - two more before you are thrown from the game. Either pass, play, or quit.'
              : `${missedPlayerName} missed their go - two more before they are thrown from the game.`,
            showActions: currentPlayerId === playerId
          })
        } else if (newMissedCount === 2) {
          console.log('Emitting turnWarning event for 2nd miss')
          turnTimerEvents.emit('turnWarning', {
            strikes: 2,
            message: currentPlayerId === playerId 
              ? 'One more miss and the game is over. Either pass, play, or quit.'
              : `${missedPlayerName} has one more miss before the game is over.`,
            showActions: currentPlayerId === playerId
          })
        }
      }

      // Check if player has missed 3 consecutive turns
      if (newMissedCount >= 3) {
        await handleGameTimeout(actualPlayerId)
      } else {
        await switchTurnToOpponent(actualPlayerId)
      }
    } catch (error) {
      console.error('Error handling turn expiration:', error)
    }
  }

  // Switch turn to opponent when current player misses
  const switchTurnToOpponent = async (playerId: string) => {
    if (!matchId || !matchData) {
      console.log('Cannot switch turn - missing matchId or matchData:', { matchId, matchData })
      return
    }

    try {
      const matchRef = doc(db, 'matches', matchId)
      
      console.log('Switching turn after missed turn:', {
        currentTurn: matchData.currentTurn,
        playerId,
        player1Id: matchData.player1?.id,
        player2Id: matchData.player2?.id
      })
      
      // Determine which player should be next
      let nextTurn = 1
      let nextPlayerId = matchData.player1?.id || ''
      
      if (matchData.currentTurn === 1) {
        // Currently player 1's turn, switch to player 2
        nextTurn = 2
        nextPlayerId = matchData.player2?.id || matchData.player1?.id || ''
        console.log('Switching from player 1 to player 2:', nextPlayerId)
      } else if (matchData.currentTurn === 2) {
        // Currently player 2's turn, switch to player 1
        nextTurn = 1
        nextPlayerId = matchData.player1?.id || ''
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
    if (!matchId || !matchData) return

    try {
      const matchRef = doc(db, 'matches', matchId)
      
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
      player1Id: matchData?.player1?.id,
      player2Id: matchData?.player2?.id
    })
    
    if (!matchData || !matchData.player1 || !matchData.player2) {
      console.log('Cannot get opponent - missing player data')
      return null
    }
    if (timedOutPlayerId === matchData.player1.id) {
      console.log('Player 1 timed out, opponent is player 2:', matchData.player2.id)
      return matchData.player2.id
    }
    if (timedOutPlayerId === matchData.player2?.id) { // Added optional chaining for player2
      console.log('Player 2 timed out, opponent is player 1:', matchData.player1.id)
      return matchData.player1.id
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
            currentTurn: matchData?.currentTurn,
            player1: matchData?.player1?.id,
            player2: matchData?.player2?.id,
            currentPlayerId
          })
          
          if (matchData?.currentTurn && matchData.player1?.id) {
            if (matchData.currentTurn === 1) {
              currentTurnPlayerId = matchData.player1.id
            } else if (matchData.currentTurn === 2 && matchData.player2?.id) {
              currentTurnPlayerId = matchData.player2.id
            }
          } else {
            // Fallback: if currentTurn is not available, use the current player ID
            currentTurnPlayerId = currentPlayerId || 'unknown'
          }
          
          console.log('Synchronized timer expired for player:', currentTurnPlayerId, 'currentTurn:', matchData?.currentTurn)
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