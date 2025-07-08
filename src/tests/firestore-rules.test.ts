/**
 * Firestore Security Rules Tests
 * 
 * This file demonstrates how to test the Firestore security rules
 * using the Firebase Testing SDK. These tests should be run with
 * the Firebase emulator.
 */

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { MatchData } from '../firebase/matchHelpers'

// Note: These tests require the Firebase Testing SDK
// npm install --save-dev @firebase/rules-unit-testing

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment
  let db: any

  beforeAll(async () => {
    // Initialize test environment with our rules
    testEnv = await initializeTestEnvironment({
      projectId: 'dots2squares-test',
      firestore: {
        rules: `
          // Copy the contents of firestore.rules here for testing
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /matches/{matchId} {
                allow read: if request.auth != null;
                allow create: if request.auth != null && request.auth.uid == resource.data.player1.id;
                allow update: if request.auth != null && isMatchParticipant(request.auth.uid, resource.data) && !isGameCompleted(resource.data);
                allow delete: if request.auth != null && request.auth.uid == resource.data.player1.id && resource.data.status == 'waiting';
              }
              
              function isMatchParticipant(userId, matchData) {
                return userId == matchData.player1.id || (matchData.player2 != null && userId == matchData.player2.id);
              }
              
              function isGameCompleted(matchData) {
                return matchData.status == 'completed' || matchData.status == 'cancelled' || matchData.gameOver == true;
              }
            }
          }
        `
      }
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  describe('Match Creation', () => {
    it('should allow authenticated user to create match', async () => {
      const user1 = testEnv.authenticatedContext('user1')
      const db = user1.firestore()
      
      const matchData: MatchData = {
        player1: {
          id: 'user1',
          name: 'Player 1',
          joinedAt: new Date()
        },
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await expect(
        setDoc(doc(db, 'matches', 'test-match'), matchData)
      ).resolves.not.toThrow()
    })

    it('should reject creation if user is not player1', async () => {
      const user2 = testEnv.authenticatedContext('user2')
      const db = user2.firestore()
      
      const matchData: MatchData = {
        player1: {
          id: 'user1', // Different user
          name: 'Player 1',
          joinedAt: new Date()
        },
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await expect(
        setDoc(doc(db, 'matches', 'test-match'), matchData)
      ).rejects.toThrow()
    })
  })

  describe('Match Updates', () => {
    let matchId: string

    beforeEach(async () => {
      // Create a test match
      const user1 = testEnv.authenticatedContext('user1')
      const db = user1.firestore()
      
      const matchData: MatchData = {
        player1: {
          id: 'user1',
          name: 'Player 1',
          joinedAt: new Date()
        },
        player2: {
          id: 'user2',
          name: 'Player 2',
          joinedAt: new Date()
        },
        status: 'active',
        currentTurn: 1,
        scores: { 1: 0, 2: 0 },
        gameOver: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      matchId = 'test-match'
      await setDoc(doc(db, 'matches', matchId), matchData)
    })

    it('should allow participant to update match', async () => {
      const user1 = testEnv.authenticatedContext('user1')
      const db = user1.firestore()
      
      await expect(
        updateDoc(doc(db, 'matches', matchId), {
          currentTurn: 2,
          updatedAt: new Date()
        })
      ).resolves.not.toThrow()
    })

    it('should reject non-participant update', async () => {
      const user3 = testEnv.authenticatedContext('user3')
      const db = user3.firestore()
      
      await expect(
        updateDoc(doc(db, 'matches', matchId), {
          currentTurn: 2
        })
      ).rejects.toThrow()
    })

    it('should reject update of completed game', async () => {
      // First complete the game
      const user1 = testEnv.authenticatedContext('user1')
      const db = user1.firestore()
      
      await updateDoc(doc(db, 'matches', matchId), {
        status: 'completed',
        gameOver: true
      })

      // Try to update completed game
      await expect(
        updateDoc(doc(db, 'matches', matchId), {
          currentTurn: 2
        })
      ).rejects.toThrow()
    })
  })

  describe('Match Deletion', () => {
    let matchId: string

    beforeEach(async () => {
      // Create a test match
      const user1 = testEnv.authenticatedContext('user1')
      const db = user1.firestore()
      
      const matchData: MatchData = {
        player1: {
          id: 'user1',
          name: 'Player 1',
          joinedAt: new Date()
        },
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      matchId = 'test-match'
      await setDoc(doc(db, 'matches', matchId), matchData)
    })

    it('should allow creator to delete waiting match', async () => {
      const user1 = testEnv.authenticatedContext('user1')
      const db = user1.firestore()
      
      await expect(
        deleteDoc(doc(db, 'matches', matchId))
      ).resolves.not.toThrow()
    })

    it('should reject deletion by non-creator', async () => {
      const user2 = testEnv.authenticatedContext('user2')
      const db = user2.firestore()
      
      await expect(
        deleteDoc(doc(db, 'matches', matchId))
      ).rejects.toThrow()
    })
  })

  describe('Match Reading', () => {
    let matchId: string

    beforeEach(async () => {
      // Create a test match
      const user1 = testEnv.authenticatedContext('user1')
      const db = user1.firestore()
      
      const matchData: MatchData = {
        player1: {
          id: 'user1',
          name: 'Player 1',
          joinedAt: new Date()
        },
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      matchId = 'test-match'
      await setDoc(doc(db, 'matches', matchId), matchData)
    })

    it('should allow authenticated user to read match', async () => {
      const user2 = testEnv.authenticatedContext('user2')
      const db = user2.firestore()
      
      await expect(
        getDoc(doc(db, 'matches', matchId))
      ).resolves.not.toThrow()
    })

    it('should reject unauthenticated read', async () => {
      const unauthenticated = testEnv.unauthenticatedContext()
      const db = unauthenticated.firestore()
      
      await expect(
        getDoc(doc(db, 'matches', matchId))
      ).rejects.toThrow()
    })
  })
})

// Example of how to run these tests:
// 1. Start Firebase emulator: firebase emulators:start --only firestore
// 2. Run tests: npm test -- --testPathPattern=firestore-rules.test.ts 