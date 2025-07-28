import { defineStore } from 'pinia'
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'

// Simple interface without complex types
interface SimpleMatch {
  id: string;
  status: string;
  gridSize: number;
  player1: any;
  player2: any;
  lines: any[];
  squares: any[];
  scores: any;
  currentPlayer: number;
  winnerId: string | null;
  createdAt: any;
  updatedAt: any;
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

          this.gameOver = claimedSquares >= totalSquares && totalSquares > 0
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