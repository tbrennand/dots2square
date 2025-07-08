// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to wait for Firebase to be ready
Cypress.Commands.add('waitForFirebase', () => {
  // Wait for Firebase to initialize
  cy.window().then((win) => {
    // Wait for Firebase to be available
    cy.wrap(win).should('have.property', 'firebase')
  })
})

// Custom command to create a match as Player A
Cypress.Commands.add('createMatchAsPlayerA', () => {
  cy.visit('/')
  
  // Wait for the page to load
  cy.get('[data-testid="home-screen"]', { timeout: 10000 }).should('be.visible')
  
  // Click create match button
  cy.get('[data-testid="create-match-btn"]').click()
  
  // Wait for match creation and get match ID from URL
  cy.url().should('include', '/lobby')
  
  // Extract match ID from URL or page content
  cy.url().then((url) => {
    const matchId = url.split('/').pop() || 'test-match'
    cy.wrap(matchId).as('matchId')
  })
  
  // Return the match ID
  return cy.get('@matchId')
})

// Custom command to join a match as Player B
Cypress.Commands.add('joinMatchAsPlayerB', (matchId: string) => {
  // Visit the match lobby directly
  cy.visit(`/lobby?matchId=${matchId}`)
  
  // Wait for lobby to load
  cy.get('[data-testid="match-lobby"]', { timeout: 10000 }).should('be.visible')
  
  // Click join button
  cy.get('[data-testid="join-match-btn"]').click()
  
  // Wait for player to be added to the match
  cy.get('[data-testid="player-list"]').should('contain', 'Player 2')
})

// Custom command to make a move on the game board
Cypress.Commands.add('makeMove', (lineId: string) => {
  // Find and click the line on the game board
  cy.get(`[data-testid="line-${lineId}"]`).click()
  
  // Wait for the move to be processed
  cy.wait(1000)
})

// Custom command to wait for turn to change
Cypress.Commands.add('waitForTurnChange', (expectedPlayer: string) => {
  cy.get('[data-testid="current-turn"]', { timeout: 10000 })
    .should('contain', expectedPlayer)
})

// Custom command to verify game state
Cypress.Commands.add('verifyGameState', (expectedState: {
  status?: string
  currentTurn?: string
  scores?: Record<string, number>
  linesCount?: number
  squaresCount?: number
}) => {
  if (expectedState.status) {
    cy.get('[data-testid="game-status"]').should('contain', expectedState.status)
  }
  
  if (expectedState.currentTurn) {
    cy.get('[data-testid="current-turn"]').should('contain', expectedState.currentTurn)
  }
  
  if (expectedState.scores) {
    Object.entries(expectedState.scores).forEach(([player, score]) => {
      cy.get(`[data-testid="score-${player}"]`).should('contain', score.toString())
    })
  }
  
  if (expectedState.linesCount !== undefined) {
    cy.get('[data-testid="lines-count"]').should('contain', expectedState.linesCount.toString())
  }
  
  if (expectedState.squaresCount !== undefined) {
    cy.get('[data-testid="squares-count"]').should('contain', expectedState.squaresCount.toString())
  }
}) 