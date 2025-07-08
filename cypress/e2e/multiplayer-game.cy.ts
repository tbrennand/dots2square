/**
 * Multiplayer Game E2E Test
 * 
 * This test simulates a complete 2-player Dots to Squares game:
 * 1. Player A creates a game
 * 2. Player B joins via link
 * 3. Players take turns making moves
 * 4. One player wins by completing more squares
 * 5. Verify GameResult shows correct winner
 */

describe('Multiplayer Game Flow', () => {
  let matchId: string

  beforeEach(() => {
    // Reset any previous state
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('should complete a full 2-player game and show correct winner', () => {
    // Step 1: Player A creates a game
    cy.log('🎮 Player A creating game...')
    cy.visit('/')
    
    // Wait for home screen to load
    cy.get('[data-testid="home-screen"]', { timeout: 10000 }).should('be.visible')
    
    // Click create match button
    cy.get('[data-testid="create-match-btn"]').click()
    
    // Wait for lobby to load
    cy.get('[data-testid="match-lobby"]', { timeout: 10000 }).should('be.visible')
    
    // Get match ID from URL
    cy.url().then((url) => {
      matchId = url.split('/').pop() || 'test-match'
      cy.log(`📋 Match created with ID: ${matchId}`)
    })
    
    // Verify Player A is in the lobby
    cy.get('[data-testid="player-list"]').should('contain', 'Player 1')
    cy.get('[data-testid="lobby-status"]').should('contain', 'waiting')

    // Step 2: Player B joins via link
    cy.log('👤 Player B joining game...')
    
    // Open new window/tab for Player B
    cy.window().then((win) => {
      // Simulate opening the match link in a new window
      const newWindow = win.open(`/lobby?matchId=${matchId}`, '_blank')
      
      // Switch to the new window context
      cy.window({ log: false }).then((newWin) => {
        cy.wrap(newWin).should('not.equal', win)
        
        // Wait for lobby to load in new window
        cy.get('[data-testid="match-lobby"]', { timeout: 10000 }).should('be.visible')
        
        // Click join button
        cy.get('[data-testid="join-match-btn"]').click()
        
        // Wait for player to be added
        cy.get('[data-testid="player-list"]').should('contain', 'Player 2')
        cy.get('[data-testid="lobby-status"]').should('contain', 'ready')
        
        // Start the game
        cy.get('[data-testid="start-game-btn"]').click()
      })
    })

    // Step 3: Game begins - verify initial state
    cy.log('🎯 Game starting...')
    
    // Wait for game board to load
    cy.get('[data-testid="game-board"]', { timeout: 10000 }).should('be.visible')
    
    // Verify initial game state
    cy.verifyGameState({
      status: 'active',
      currentTurn: 'player1',
      scores: { player1: 0, player2: 0 },
      linesCount: 0,
      squaresCount: 0
    })

    // Step 4: Players take turns making moves
    cy.log('🔄 Players taking turns...')
    
    // Player 1's first move (horizontal line)
    cy.log('Player 1: Drawing horizontal line h-0-0')
    cy.makeMove('h-0-0')
    cy.waitForTurnChange('player2')
    
    // Player 2's first move (vertical line)
    cy.log('Player 2: Drawing vertical line v-0-0')
    cy.makeMove('v-0-0')
    cy.waitForTurnChange('player1')
    
    // Player 1's second move (horizontal line)
    cy.log('Player 1: Drawing horizontal line h-1-0')
    cy.makeMove('h-1-0')
    cy.waitForTurnChange('player2')
    
    // Player 2's second move (vertical line) - completes first square!
    cy.log('Player 2: Drawing vertical line v-0-1 - completes square!')
    cy.makeMove('v-0-1')
    
    // Player 2 should get another turn for completing a square
    cy.waitForTurnChange('player2')
    cy.verifyGameState({
      scores: { player1: 0, player2: 1 },
      squaresCount: 1
    })
    
    // Player 2's bonus move (horizontal line)
    cy.log('Player 2: Bonus move - horizontal line h-0-1')
    cy.makeMove('h-0-1')
    cy.waitForTurnChange('player1')
    
    // Player 1's move (vertical line)
    cy.log('Player 1: Drawing vertical line v-1-0')
    cy.makeMove('v-1-0')
    cy.waitForTurnChange('player2')
    
    // Player 2's move (horizontal line)
    cy.log('Player 2: Drawing horizontal line h-1-1')
    cy.makeMove('h-1-1')
    cy.waitForTurnChange('player1')
    
    // Player 1's move (vertical line) - completes second square!
    cy.log('Player 1: Drawing vertical line v-1-1 - completes square!')
    cy.makeMove('v-1-1')
    
    // Player 1 should get another turn for completing a square
    cy.waitForTurnChange('player1')
    cy.verifyGameState({
      scores: { player1: 1, player2: 1 },
      squaresCount: 2
    })
    
    // Player 1's bonus move (horizontal line)
    cy.log('Player 1: Bonus move - horizontal line h-2-0')
    cy.makeMove('h-2-0')
    cy.waitForTurnChange('player2')
    
    // Player 2's move (horizontal line)
    cy.log('Player 2: Drawing horizontal line h-2-1')
    cy.makeMove('h-2-1')
    cy.waitForTurnChange('player1')
    
    // Player 1's move (vertical line)
    cy.log('Player 1: Drawing vertical line v-0-2')
    cy.makeMove('v-0-2')
    cy.waitForTurnChange('player2')
    
    // Player 2's move (vertical line) - completes third square!
    cy.log('Player 2: Drawing vertical line v-1-2 - completes square!')
    cy.makeMove('v-1-2')
    
    // Player 2 should get another turn for completing a square
    cy.waitForTurnChange('player2')
    cy.verifyGameState({
      scores: { player1: 1, player2: 2 },
      squaresCount: 3
    })
    
    // Player 2's bonus move (final move)
    cy.log('Player 2: Final move - completing last square')
    cy.makeMove('h-2-2')
    
    // Step 5: Game completion and winner verification
    cy.log('🏆 Game completed!')
    
    // Wait for game to be marked as complete
    cy.get('[data-testid="game-status"]', { timeout: 10000 }).should('contain', 'complete')
    
    // Verify final scores
    cy.verifyGameState({
      status: 'complete',
      scores: { player1: 1, player2: 3 },
      squaresCount: 4
    })
    
    // Verify winner is Player 2
    cy.get('[data-testid="winner-announcement"]').should('contain', 'Player 2')
    
    // Step 6: Navigate to GameResult and verify
    cy.log('📊 Verifying GameResult page...')
    
    // Click "View Results" or wait for automatic navigation
    cy.get('[data-testid="view-results-btn"]').click()
    
    // Wait for GameResult page to load
    cy.get('[data-testid="game-result"]', { timeout: 10000 }).should('be.visible')
    
    // Verify winner is displayed correctly
    cy.get('[data-testid="winner-name"]').should('contain', 'Player 2')
    
    // Verify final scores are displayed
    cy.get('[data-testid="final-scores"]').within(() => {
      cy.get('[data-testid="player1-score"]').should('contain', '1')
      cy.get('[data-testid="player2-score"]').should('contain', '3')
    })
    
    // Verify game statistics
    cy.get('[data-testid="game-stats"]').within(() => {
      cy.get('[data-testid="total-moves"]').should('contain', '12')
      cy.get('[data-testid="total-squares"]').should('contain', '4')
      cy.get('[data-testid="game-duration"]').should('exist')
    })
    
    // Verify "Play Again" button is available
    cy.get('[data-testid="play-again-btn"]').should('be.visible')
    
    cy.log('✅ Test completed successfully!')
  })

  it('should handle edge cases and error conditions', () => {
    // Test invalid moves
    cy.log('🧪 Testing edge cases...')
    
    cy.visit('/')
    cy.get('[data-testid="create-match-btn"]').click()
    
    // Try to make a move before game starts
    cy.get('[data-testid="game-board"]').should('not.exist')
    
    // Test joining with invalid match ID
    cy.visit('/lobby?matchId=invalid-id')
    cy.get('[data-testid="error-message"]').should('contain', 'Match not found')
    
    cy.log('✅ Edge case tests completed!')
  })
}) 