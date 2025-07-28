import { defineStore } from 'pinia'
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'

export interface SimpleMatch {
  id: string
  status: 'waiting' | 'active' | 'completed'
  gridSize: number
  player1: { id: string; name: string }
  player2: { id: string; name: string } | null
  lines: any[]
  squares: any[]
  scores: Record<number, number>
  currentPlayer: number
  winnerId: string | null
  turnStartedAt?: { toDate: () => Date } // Add this for timer
  turnDuration?: number // Add this for timer
  consecutiveMissedTurns?: Record<string, number> // Add this for timer reset
}

interface GameState {
  matchId: string | null;
  matchData: SimpleMatch | null;
  gameOver: boolean;
  unsubscribe: Unsubscribe | null;
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    matchId: null,
    matchData: null,
    gameOver: false,
    unsubscribe: null
  }),
  actions: {
    subscribeToMatch(matchId: string) {
      if (this.unsubscribe) {
        this.unsubscribe()
      }
      const matchRef = doc(db, 'matches', matchId)
      const unsubscribe = onSnapshot(matchRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as SimpleMatch
          this.matchData = data
          this.matchId = doc.id
          
          const totalSquares = (data.gridSize - 1) * (data.gridSize - 1)
          const claimedSquares = data.squares?.filter((square: any) => square.player !== undefined).length || 0
          
          console.log('[gameStore] Subscription update:', {
              claimed: claimedSquares,
              total: totalSquares,
              gridSize: data.gridSize,
              isGameOver: claimedSquares >= totalSquares && totalSquares > 0,
              matchStatus: data.status
          });

          // Game is over if all squares are claimed OR if the match status is completed
          this.gameOver = (claimedSquares >= totalSquares && totalSquares > 0) || data.status === 'completed'
        } else {
          console.error('Match not found')
          this.matchData = null
        }
      })
    },
    unsubscribeFromMatch() {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
    }
  },
}) 