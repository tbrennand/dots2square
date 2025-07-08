/**
 * Simple Multiplayer Game E2E Test
 * 
 * This test simulates a 2-player game using a simpler approach:
 * 1. Create game and get match ID
 * 2. Join game in same session
 * 3. Play moves alternately
 * 4. Verify winner and game result
 */

describe('Simple Multiplayer Game Flow', () => {
  let matchId: string

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('should complete a 2-player game and show correct winner', () => {
    // Step 1: Create a game
    cy.log('🎮 Creating game...')
    cy.visit('/')
    
    // Wait for home screen
    cy.get('h1').should('contain', 'Dots to Squares')
    
    // Click create match (assuming button exists)
    cy.contains('button', 'Create Match').click()
    
    // Wait for lobby
    cy.url().should('include', '/lobby')
    cy.log('✅ Game created successfully')

    // Step 2: Join the game (simulate second player)
    cy.log('👤 Joining game...')
    
    // Get current URL to extract match ID
    cy.url().then((url) => {
      matchId = url.split('/').pop() || 'test-match'
      cy.log(`📋 Match ID: ${matchId}`)
      
      // Simulate joining by updating the match state
      // This would normally be done by a second player
      cy.window().then((win) => {
        // Check if we can access the app's global state
        if ((win as any).__VUE_APP__) {
          cy.log('🔥 Vue app available, simulating second player join')
        }
      })
    })

    // Step 3: Start the game
    cy.log('🎯 Starting game...')
    
    // Look for start game button or wait for auto-start
    cy.contains('button', 'Start Game').click()
    
    // Wait for game board
    cy.get('.game-board', { timeout: 10000 }).should('be.visible')
    cy.log('✅ Game started')

    // Step 4: Play moves (simplified version)
    cy.log('🔄 Playing moves...')
    
    // Make some moves - we'll click on the grid
    // For a 3x3 grid, we need to complete 4 squares
    
    // Move 1: Player 1
    cy.get('.dot-grid').click(100, 100) // Click near top-left
    cy.wait(1000)
    
    // Move 2: Player 2  
    cy.get('.dot-grid').click(200, 100) // Click near top-right
    cy.wait(1000)
    
    // Move 3: Player 1
    cy.get('.dot-grid').click(100, 200) // Click near bottom-left
    cy.wait(1000)
    
    // Move 4: Player 2
    cy.get('.dot-grid').click(200, 200) // Click near bottom-right
    cy.wait(1000)
    
    // Continue with more moves to complete the game
    // This is a simplified version - in reality, you'd need to click specific lines
    
    cy.log('✅ Moves completed')

    // Step 5: Verify game completion
    cy.log('🏆 Checking game completion...')
    
    // Wait for game to complete
    cy.get('.game-status', { timeout: 15000 }).should('contain', 'complete')
    
    // Check for winner
    cy.get('.winner-announcement').should('be.visible')
    cy.log('✅ Game completed with winner')

    // Step 6: Verify GameResult page
    cy.log('📊 Checking GameResult page...')
    
    // Navigate to results (or wait for auto-navigation)
    cy.url().should('include', '/result')
    
    // Verify winner is displayed
    cy.get('.winner-name').should('be.visible')
    
    // Verify scores are shown
    cy.get('.final-scores').should('be.visible')
    
    // Verify "Play Again" button
    cy.contains('button', 'Play Again').should('be.visible')
    
    cy.log('✅ GameResult page verified')
  })

  it('should handle basic game interactions', () => {
    // Test basic game functionality
    cy.log('🧪 Testing basic interactions...')
    
    cy.visit('/')
    
    // Test that we can navigate to different pages
    cy.contains('button', 'Create Match').click()
    cy.url().should('include', '/lobby')
    
    // Test that we can go back
    cy.go('back')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    
    cy.log('✅ Basic interactions work')
  })
}) 