/**
 * Firebase Multiplayer Game E2E Test
 * 
 * This test uses Firebase Emulator to test the actual multiplayer functionality:
 * 1. Player A creates game
 * 2. Player B joins via link
 * 3. Players take turns
 * 4. One wins
 * 5. Confirm GameResult shows correct winner
 */

describe('Firebase Multiplayer Game Flow', () => {
  let matchId: string

  beforeEach(() => {
    // Ensure Firebase emulator is running
    cy.log('🔥 Checking Firebase emulator connection...')
    
    // Clear any previous state
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // Visit the emulator test page to verify connection
    cy.visit('/emulator-test')
    cy.get('.emulator-test', { timeout: 10000 }).should('be.visible')
  })

  it('should complete a full 2-player game with Firebase emulator', () => {
    // Step 1: Player A creates a game
    cy.log('🎮 Player A creating game...')
    
    // Use the emulator test interface to create a match
    cy.get('button').contains('Create Test Match').click()
    
    // Wait for match creation
    cy.get('strong').contains('Match ID:').should('be.visible')
    cy.get('div').contains('Match ID:').then(($el) => {
      const text = $el.text()
      matchId = text.split('Match ID:')[1].trim()
      cy.log(`📋 Match created with ID: ${matchId}`)
    })
    
    // Verify initial state
    cy.get('div').contains('Status: waiting').should('be.visible')
    cy.get('div').contains('Current Turn: player1').should('be.visible')

    // Step 2: Player B joins the game
    cy.log('👤 Player B joining game...')
    
    cy.get('button').contains('Join as Player 2').click()
    
    // Wait for player to join
    cy.get('div').contains('Status: active').should('be.visible')
    cy.log('✅ Player B joined successfully')

    // Step 3: Run the full simulation
    cy.log('🔄 Running full game simulation...')
    
    cy.get('button').contains('Run Full Simulation').click()
    
    // Wait for simulation to complete
    cy.get('div').contains('Status: complete', { timeout: 30000 }).should('be.visible')
    cy.log('✅ Full simulation completed')

    // Step 4: Verify final game state
    cy.log('🏆 Verifying final game state...')
    
    // Check winner
    cy.get('div').contains('Winner:').should('be.visible')
    
    // Check final scores
    cy.get('div').contains('Scores').parent().within(() => {
      cy.get('div').should('contain', 'player1:')
      cy.get('div').should('contain', 'player2:')
    })
    
    // Check that all squares are completed (4 for 3x3 grid)
    cy.get('div').contains('Squares Completed: 4').should('be.visible')
    
    cy.log('✅ Final game state verified')

    // Step 5: Verify GameResult page
    cy.log('📊 Checking GameResult page...')
    
    // Navigate to the game result page
    cy.visit('/result')
    
    // Verify the result page loads
    cy.get('h1').should('contain', 'Game Result')
    
    // Verify winner is displayed
    cy.get('.winner-name, [data-testid="winner-name"]').should('be.visible')
    
    // Verify final scores are shown
    cy.get('.final-scores, [data-testid="final-scores"]').should('be.visible')
    
    // Verify "Play Again" button
    cy.contains('button', 'Play Again').should('be.visible')
    
    cy.log('✅ GameResult page verified')
  })

  it('should test individual moves and turn management', () => {
    cy.log('🧪 Testing individual moves...')
    
    // Create a match
    cy.get('button').contains('Create Test Match').click()
    cy.get('button').contains('Join as Player 2').click()
    
    // Wait for game to be active
    cy.get('div').contains('Status: active').should('be.visible')
    
    // Test individual moves
    cy.get('select').first().select('player1')
    cy.get('select').last().select('h-0-0')
    cy.get('button').contains('Play Move').click()
    
    // Verify turn changed to player2
    cy.get('div').contains('Current Turn: player2').should('be.visible')
    
    // Make another move
    cy.get('select').first().select('player2')
    cy.get('select').last().select('v-0-0')
    cy.get('button').contains('Play Move').click()
    
    // Verify turn changed back to player1
    cy.get('div').contains('Current Turn: player1').should('be.visible')
    
    cy.log('✅ Individual moves and turn management work correctly')
  })

  it('should test square completion and chain turns', () => {
    cy.log('🧪 Testing square completion...')
    
    // Create a match
    cy.get('button').contains('Create Test Match').click()
    cy.get('button').contains('Join as Player 2').click()
    
    // Wait for game to be active
    cy.get('div').contains('Status: active').should('be.visible')
    
    // Make moves that will complete a square
    // Player 1: h-0-0
    cy.get('select').first().select('player1')
    cy.get('select').last().select('h-0-0')
    cy.get('button').contains('Play Move').click()
    
    // Player 2: h-1-0
    cy.get('select').first().select('player2')
    cy.get('select').last().select('h-1-0')
    cy.get('button').contains('Play Move').click()
    
    // Player 1: v-0-0
    cy.get('select').first().select('player1')
    cy.get('select').last().select('v-0-0')
    cy.get('button').contains('Play Move').click()
    
    // Player 2: v-0-1 (this should complete a square and give player2 another turn)
    cy.get('select').first().select('player2')
    cy.get('select').last().select('v-0-1')
    cy.get('button').contains('Play Move').click()
    
    // Verify player2 gets another turn (chain turn)
    cy.get('div').contains('Current Turn: player2').should('be.visible')
    
    // Verify a square was completed
    cy.get('div').contains('Squares Completed: 1').should('be.visible')
    
    cy.log('✅ Square completion and chain turns work correctly')
  })

  it('should handle error conditions', () => {
    cy.log('🧪 Testing error conditions...')
    
    // Try to make a move before game starts
    cy.get('select').first().select('player1')
    cy.get('select').last().select('h-0-0')
    cy.get('button').contains('Play Move').click()
    
    // Should show an error or not allow the move
    cy.get('.error-message, [data-testid="error-message"]').should('be.visible')
    
    // Try to make an invalid move
    cy.get('select').first().select('player2')
    cy.get('select').last().select('h-0-0') // Same move as before
    cy.get('button').contains('Play Move').click()
    
    // Should show an error about invalid move
    cy.get('.error-message, [data-testid="error-message"]').should('be.visible')
    
    cy.log('✅ Error conditions handled correctly')
  })
}) 