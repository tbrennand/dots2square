# Firebase Emulator Testing Guide

This guide covers how to test the Dots to Squares multiplayer game using Firebase Emulator for real-time synchronization and match completion logic.

## Overview

The Firebase Emulator provides a local development environment that simulates Firebase services (Firestore, Auth) without requiring a real Firebase project. This allows us to test:

- Real-time data synchronization
- Multiplayer game logic
- Match creation and management
- Turn-based gameplay
- Square completion detection
- Game completion and winner determination

## Prerequisites

1. **Firebase CLI installed:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project initialized:**
   ```bash
   firebase init
   ```

3. **Dependencies installed:**
   ```bash
   npm install
   ```

## Quick Start

### 1. Start Firebase Emulator

```bash
npm run emulator:start
```

This starts:
- **Firestore Emulator** on port 8080
- **Auth Emulator** on port 9099
- **Emulator UI** on port 4000

### 2. Run Automated Test

```bash
npm run emulator:test
```

This runs a complete 2-player match simulation that tests:
- Match creation
- Player joining
- Real-time synchronization
- Move validation
- Square completion
- Turn management
- Game completion

### 3. Full Test (Start Emulator + Run Test)

```bash
npm run emulator:full
```

This automatically starts the emulator and runs the test after a 5-second delay.

## Manual Testing

### 1. Start Development Server

In one terminal:
```bash
npm run dev
```

### 2. Start Firebase Emulator

In another terminal:
```bash
npm run emulator:start
```

### 3. Open Browser

Navigate to `http://localhost:5173` (or the port shown by Vite)

### 4. Test Multiplayer Flow

1. **Create Match:** Click "Create Match" on the home screen
2. **Join Match:** Open a second browser tab/window and join the match
3. **Play Game:** Take turns drawing lines and completing squares
4. **Observe Sync:** Watch real-time updates across both browser windows
5. **Complete Game:** Finish the game and verify winner determination

## Test Scenarios

### Scenario 1: Basic 2-Player Match

**Objective:** Test complete game flow from creation to completion

**Steps:**
1. Create match with Player 1
2. Join match with Player 2
3. Play moves alternately
4. Complete squares and verify scoring
5. Finish game and determine winner

**Expected Results:**
- Real-time synchronization between players
- Correct turn management
- Accurate square completion detection
- Proper score calculation
- Game completion with winner

### Scenario 2: Chain Turns

**Objective:** Test that completing a square gives the player another turn

**Steps:**
1. Set up a position where Player 1 can complete a square
2. Player 1 draws the line to complete the square
3. Verify Player 1 gets another turn
4. Continue until no more squares can be completed

**Expected Results:**
- Player gets additional turn after completing square
- Turn switches only when no square is completed

### Scenario 3: Concurrent Moves

**Objective:** Test handling of simultaneous moves

**Steps:**
1. Both players try to make moves at the same time
2. Verify only one move succeeds
3. Check that the other move is rejected

**Expected Results:**
- Only one move per turn is allowed
- Invalid moves are rejected with appropriate error messages

### Scenario 4: Game Completion

**Objective:** Test end-game conditions

**Steps:**
1. Play until all squares are completed
2. Verify game status changes to 'complete'
3. Check winner determination
4. Verify no more moves can be made

**Expected Results:**
- Game status updates to 'complete'
- Winner is correctly determined
- Further moves are rejected

## Monitoring and Debugging

### Firebase Emulator UI

Access the emulator UI at `http://localhost:4000` to:
- View Firestore data in real-time
- Monitor authentication state
- Debug security rules
- Export/import test data

### Console Logging

The test script provides detailed logging:
- Match creation and joining
- Move validation and processing
- Real-time updates
- Game state changes
- Error conditions

### Browser Developer Tools

Use browser dev tools to:
- Monitor network requests
- Check console for errors
- Debug Vue component state
- Verify Pinia store updates

## Troubleshooting

### Common Issues

1. **Emulator Connection Failed**
   ```
   Error: Failed to connect to Firestore emulator
   ```
   **Solution:** Ensure emulator is running on correct ports

2. **Permission Denied**
   ```
   Error: Missing or insufficient permissions
   ```
   **Solution:** Check Firestore security rules in `firestore.rules`

3. **Real-time Updates Not Working**
   ```
   No updates received from Firestore
   ```
   **Solution:** Verify `subscribeToMatch()` is called correctly

4. **Move Validation Errors**
   ```
   Error: Not your turn
   ```
   **Solution:** Check turn management logic and current player state

### Debug Commands

```bash
# Check emulator status
firebase emulators:status

# View emulator logs
firebase emulators:start --only firestore --debug

# Reset emulator data
firebase emulators:start --import=./test-data --export-on-exit=./test-data
```

## Test Data

### Sample Match Document

```json
{
  "id": "match-123",
  "gridSize": 3,
  "grid": [
    {"id": "0-0", "row": 0, "col": 0},
    {"id": "0-1", "row": 0, "col": 1},
    {"id": "0-2", "row": 0, "col": 2},
    {"id": "1-0", "row": 1, "col": 0},
    {"id": "1-1", "row": 1, "col": 1},
    {"id": "1-2", "row": 1, "col": 2},
    {"id": "2-0", "row": 2, "col": 0},
    {"id": "2-1", "row": 2, "col": 1},
    {"id": "2-2", "row": 2, "col": 2}
  ],
  "possibleLines": [
    {"id": "h-0-0", "type": "horizontal", "start": "0-0", "end": "0-1"},
    {"id": "h-0-1", "type": "horizontal", "start": "0-1", "end": "0-2"},
    {"id": "v-0-0", "type": "vertical", "start": "0-0", "end": "1-0"},
    {"id": "v-0-1", "type": "vertical", "start": "0-1", "end": "1-1"}
  ],
  "lines": [],
  "squares": [],
  "scores": {},
  "currentTurn": "player1",
  "status": "waiting",
  "players": ["player1"],
  "host": "player1",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Performance Testing

### Load Testing

To test with multiple concurrent players:

```bash
# Run multiple test instances
for i in {1..5}; do
  node scripts/test-emulator-match.js &
done
wait
```

### Memory Usage

Monitor emulator memory usage:
```bash
# Check emulator process
ps aux | grep firebase
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Firebase Emulator Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm install -g firebase-tools
      - run: firebase emulators:start --only firestore,auth &
      - run: sleep 10
      - run: npm run emulator:test
```

## Best Practices

1. **Always use emulators for development**
2. **Test real-time synchronization thoroughly**
3. **Verify security rules work correctly**
4. **Test edge cases and error conditions**
5. **Monitor performance with multiple players**
6. **Keep test data consistent and realistic**
7. **Document test scenarios and expected results**

## Next Steps

1. **Add more test scenarios** for edge cases
2. **Implement performance benchmarks**
3. **Add visual test results dashboard**
4. **Create automated regression tests**
5. **Integrate with end-to-end testing** 