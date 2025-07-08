// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands for game testing
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to wait for Firebase to be ready
       */
      waitForFirebase(): Chainable<void>
      
      /**
       * Custom command to create a match as Player A
       */
      createMatchAsPlayerA(): Chainable<string>
      
      /**
       * Custom command to join a match as Player B
       */
      joinMatchAsPlayerB(matchId: string): Chainable<void>
      
      /**
       * Custom command to make a move on the game board
       */
      makeMove(lineId: string): Chainable<void>
      
      /**
       * Custom command to wait for turn to change
       */
      waitForTurnChange(expectedPlayer: string): Chainable<void>
      
      /**
       * Custom command to verify game state
       */
      verifyGameState(expectedState: {
        status?: string
        currentTurn?: string
        scores?: Record<string, number>
        linesCount?: number
        squaresCount?: number
      }): Chainable<void>
    }
  }
} 