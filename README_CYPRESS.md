# Cypress E2E Testing Guide

This guide covers how to run Cypress end-to-end tests for the Dots to Squares multiplayer game.

## 🚀 Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

This starts the Vite development server on `http://localhost:5173`

### 2. Start Firebase Emulator (Optional)

For tests that use Firebase emulator:

```bash
npm run emulator:start
```

### 3. Run Cypress Tests

```bash
npm run test:e2e
```

Or open Cypress in interactive mode:

```bash
npx cypress open
```

## 📋 Test Files

### 1. `firebase-multiplayer-game.cy.ts` (Recommended)
**Location:** `cypress/e2e/firebase-multiplayer-game.cy.ts`

**What it tests:**
- ✅ Player A creates game
- ✅ Player B joins via link
- ✅ Players take turns
- ✅ One wins
- ✅ Confirm GameResult shows correct winner

**Features:**
- Uses Firebase emulator for real testing
- Tests complete game flow
- Verifies turn management
- Tests square completion and chain turns
- Handles error conditions

### 2. `simple-multiplayer-game.cy.ts`
**Location:** `cypress/e2e/simple-multiplayer-game.cy.ts`

**What it tests:**
- Basic game creation and navigation
- Simplified move testing
- Game completion verification

**Features:**
- Simpler approach without Firebase emulator
- Tests basic UI interactions
- Good for quick smoke tests

## 🎯 Test Scenarios

### Scenario 1: Complete 2-Player Game
**Objective:** Test the full game flow from creation to completion

**Steps:**
1. Player A creates a game
2. Player B joins the game
3. Players take turns making moves
4. Game completes with a winner
5. Verify GameResult page shows correct winner

**Expected Results:**
- Game creation works correctly
- Player joining works via link
- Turn management functions properly
- Square completion detection works
- Winner determination is accurate
- GameResult page displays correctly

### Scenario 2: Turn Management
**Objective:** Test that turns alternate correctly

**Steps:**
1. Create a game with two players
2. Make moves alternately
3. Verify turn changes after each move

**Expected Results:**
- Turns alternate between players
- Turn indicator updates correctly
- Invalid moves are prevented

### Scenario 3: Square Completion and Chain Turns
**Objective:** Test that completing a square gives the player another turn

**Steps:**
1. Set up moves to complete a square
2. Complete the square
3. Verify the player gets another turn

**Expected Results:**
- Player gets additional turn after completing square
- Turn only switches when no square is completed

### Scenario 4: Error Handling
**Objective:** Test error conditions and edge cases

**Steps:**
1. Try to make moves before game starts
2. Try to make invalid moves
3. Test concurrent access

**Expected Results:**
- Error messages are displayed
- Invalid moves are prevented
- Game state remains consistent

## 🔧 Configuration

### Cypress Configuration
**File:** `cypress.config.ts`

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    // ... other settings
  },
})
```

### Custom Commands
**File:** `cypress/support/commands.ts`

Available custom commands:
- `cy.waitForFirebase()` - Wait for Firebase to be ready
- `cy.createMatchAsPlayerA()` - Create a match as Player A
- `cy.joinMatchAsPlayerB(matchId)` - Join a match as Player B
- `cy.makeMove(lineId)` - Make a move on the game board
- `cy.waitForTurnChange(expectedPlayer)` - Wait for turn to change
- `cy.verifyGameState(expectedState)` - Verify game state

## 🧪 Running Tests

### Run All Tests
```bash
npx cypress run
```

### Run Specific Test File
```bash
npx cypress run --spec "cypress/e2e/firebase-multiplayer-game.cy.ts"
```

### Run Tests in Interactive Mode
```bash
npx cypress open
```

### Run Tests with Firebase Emulator
```bash
# Terminal 1: Start Firebase emulator
npm run emulator:start

# Terminal 2: Start development server
npm run dev

# Terminal 3: Run Cypress tests
npx cypress run
```

## 📊 Test Results

### Success Criteria
A successful test run should show:

- ✅ **Game Creation:** Match is created successfully
- ✅ **Player Joining:** Second player can join via link
- ✅ **Turn Management:** Turns alternate correctly
- ✅ **Move Validation:** Invalid moves are prevented
- ✅ **Square Completion:** Squares are detected correctly
- ✅ **Chain Turns:** Players get extra turns for completing squares
- ✅ **Game Completion:** Game ends when all squares are filled
- ✅ **Winner Determination:** Correct winner is determined
- ✅ **GameResult Page:** Results are displayed correctly

### Example Output
```
🎮 Player A creating game...
✅ Game created successfully
👤 Player B joining game...
✅ Player B joined successfully
🔄 Running full game simulation...
✅ Full simulation completed
🏆 Verifying final game state...
✅ Final game state verified
📊 Checking GameResult page...
✅ GameResult page verified
```

## 🛠️ Troubleshooting

### Common Issues

1. **Firebase Emulator Not Running**
   ```
   Error: Failed to connect to Firebase emulator
   ```
   **Solution:** Start Firebase emulator with `npm run emulator:start`

2. **Development Server Not Running**
   ```
   Error: Failed to connect to localhost:5173
   ```
   **Solution:** Start development server with `npm run dev`

3. **Tests Timing Out**
   ```
   Error: Timed out retrying after 10000ms
   ```
   **Solution:** Increase timeout in `cypress.config.ts` or check for slow operations

4. **Element Not Found**
   ```
   Error: cy.get() failed because this element is not attached to the DOM
   ```
   **Solution:** Check that the component is rendered and has correct selectors

### Debug Commands

```bash
# Run tests with debug output
DEBUG=cypress:* npx cypress run

# Run tests with video recording
npx cypress run --record

# Run tests with specific browser
npx cypress run --browser chrome
```

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: Cypress E2E Tests
on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run dev &
      - run: npm run emulator:start &
      - run: sleep 10
      - run: npx cypress run
```

## 🎯 Best Practices

1. **Use Descriptive Test Names**
   ```typescript
   it('should complete a 2-player game and show correct winner', () => {
   ```

2. **Add Meaningful Logs**
   ```typescript
   cy.log('🎮 Player A creating game...')
   ```

3. **Use Custom Commands**
   ```typescript
   cy.createMatchAsPlayerA()
   cy.joinMatchAsPlayerB(matchId)
   ```

4. **Verify State Changes**
   ```typescript
   cy.verifyGameState({
     status: 'active',
     currentTurn: 'player2'
   })
   ```

5. **Handle Async Operations**
   ```typescript
   cy.get('.game-status', { timeout: 10000 }).should('contain', 'complete')
   ```

## 🚀 Next Steps

1. **Add More Test Scenarios**
   - Test with different grid sizes
   - Test with more than 2 players
   - Test network disconnection scenarios

2. **Performance Testing**
   - Test with many concurrent players
   - Test with slow network conditions

3. **Visual Regression Testing**
   - Add visual snapshots
   - Test UI consistency

4. **Accessibility Testing**
   - Test keyboard navigation
   - Test screen reader compatibility

---

**Happy Testing! 🎮**

For questions or issues, check the troubleshooting section or review the Cypress documentation. 