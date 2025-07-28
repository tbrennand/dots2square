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
      this.unsubscribe = onSnapshot(matchRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as SimpleMatch
          this.matchData = data
          this.matchId = doc.id
          const totalSquares = data.gridSize ? (data.gridSize - 1) * (data.gridSize - 1) : 0
          // Only count squares that have a player assigned (not undefined)
          const claimedSquares = data.squares?.filter((square: any) => square.player !== undefined) || []
          this.gameOver = claimedSquares.length >= totalSquares && totalSquares > 0
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