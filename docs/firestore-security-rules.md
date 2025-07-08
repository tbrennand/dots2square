# Firestore Security Rules for Dots to Squares

This document describes the comprehensive Firestore Security Rules that protect the Dots to Squares multiplayer game data.

## Overview

The security rules enforce three critical requirements:
1. **Match Participant Access**: Only match participants can write to match documents
2. **Game State Protection**: No writes allowed after game status is 'completed'
3. **Turn Enforcement**: Only one move per player per turn

## Security Model

### Access Control

#### Read Access
- **Public**: All authenticated users can read match documents
- **Rationale**: Players need to view game state, and public matches should be discoverable

#### Write Access
- **Create**: Only authenticated users can create matches (must be player1)
- **Update**: Only match participants can update match documents
- **Delete**: Only match creator can delete matches (only when status is 'waiting')

### Game State Protection

#### Completed Game Protection
- No updates allowed when `status` is 'completed', 'cancelled', or `gameOver` is true
- Prevents tampering with finished games

#### Field-Level Validation
Only specific fields can be updated during gameplay:
- `lines` - New line additions
- `squares` - Square ownership changes
- `scores` - Score updates
- `currentTurn` - Turn progression
- `gameOver` - Game completion flag
- `winner` - Winner declaration
- `status` - Status changes
- `updatedAt` - Timestamp updates

### Turn Enforcement

#### Player Validation
- Only the current player (based on `currentTurn`) can make moves
- Player must be a valid participant (player1 or player2)

#### Move Validation
- Exactly one new line must be added per move
- Line must belong to the current player
- Line coordinates must be valid (within grid bounds, horizontal/vertical, adjacent dots)
- Line must not already exist

#### Game Logic Validation
- **Squares**: Can only claim previously unclaimed squares
- **Scores**: Can only increase, never decrease
- **Turns**: Must alternate between players (unless squares are claimed)
- **Game Completion**: Can only set completion flags when appropriate

## Rule Structure

### Main Rules
```javascript
match /matches/{matchId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == resource.data.player1.id;
  allow update: if request.auth != null && isMatchParticipant(request.auth.uid, resource.data) && !isGameCompleted(resource.data) && validateMoveUpdate(...);
  allow delete: if request.auth != null && request.auth.uid == resource.data.player1.id && resource.data.status == 'waiting';
}
```

### Helper Functions

#### `isMatchParticipant(userId, matchData)`
- Returns true if user is player1 or player2
- Ensures only participants can modify match data

#### `isGameCompleted(matchData)`
- Returns true if game is finished (completed, cancelled, or gameOver)
- Prevents modifications to finished games

#### `validateMoveUpdate(userId, oldData, newData)`
- Comprehensive validation of move updates
- Enforces turn order, move validity, and game logic
- Validates field-level changes

#### `getPlayerNumber(userId, matchData)`
- Returns player number (1 or 2) for the given user
- Returns null if user is not a participant

#### `isValidLine(line, gridSize)`
- Validates line coordinates and geometry
- Ensures lines are horizontal/vertical and connect adjacent dots
- Checks bounds within grid

## Deployment

### Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project initialized: `firebase init firestore`
3. Authenticated with Firebase: `firebase login`

### Deploy Rules
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Or deploy everything
firebase deploy
```

### Local Testing
```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# Test rules locally
firebase emulators:exec --only firestore "npm test"
```

## Testing Security Rules

### Test Cases to Implement

#### Access Control Tests
```javascript
// Test: Non-participant cannot update match
// Test: Non-authenticated user cannot read/write
// Test: Only player1 can create match
// Test: Only player1 can delete match (when waiting)
```

#### Game State Tests
```javascript
// Test: Cannot update completed game
// Test: Cannot update cancelled game
// Test: Cannot update when gameOver is true
```

#### Turn Enforcement Tests
```javascript
// Test: Only current player can make moves
// Test: Cannot make moves out of turn
// Test: Must add exactly one line per move
// Test: Line must belong to current player
```

#### Game Logic Tests
```javascript
// Test: Cannot claim already claimed squares
// Test: Scores can only increase
// Test: Turn must alternate (unless squares claimed)
// Test: Cannot set invalid game completion state
```

### Example Test Structure
```javascript
describe('Firestore Security Rules', () => {
  let testEnv;
  let db;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'dots2squares-test',
      firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') }
    });
    db = testEnv.authenticatedContext('user1').firestore();
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  describe('Match Updates', () => {
    it('should allow participant to make valid move', async () => {
      // Test implementation
    });
    
    it('should reject non-participant move', async () => {
      // Test implementation
    });
  });
});
```

## Security Considerations

### Attack Vectors Mitigated

1. **Unauthorized Access**
   - Non-participants cannot modify match data
   - Authentication required for all operations

2. **Game State Tampering**
   - Completed games cannot be modified
   - Only valid game state transitions allowed

3. **Turn Manipulation**
   - Players cannot make moves out of turn
   - Turn progression is validated

4. **Score Manipulation**
   - Scores can only increase
   - Square ownership cannot be changed once claimed

5. **Invalid Moves**
   - Line geometry is validated
   - Duplicate lines are prevented
   - Grid bounds are enforced

### Best Practices

1. **Always test rules thoroughly** before deployment
2. **Use Firebase Emulator** for local development
3. **Monitor rule performance** in production
4. **Keep rules simple** and avoid complex logic
5. **Document rule changes** and their rationale

## Troubleshooting

### Common Issues

#### Rule Evaluation Errors
- Check syntax with `firebase firestore:rules:validate`
- Use Firebase Console to test rules interactively
- Review error messages for specific validation failures

#### Performance Issues
- Avoid complex queries in rules
- Use indexes for frequently accessed data
- Monitor rule evaluation times in Firebase Console

#### Deployment Failures
- Ensure Firebase CLI is up to date
- Check project permissions
- Verify rule syntax before deployment

### Debugging Tips

1. **Use Firebase Console** to test rules interactively
2. **Enable debug logging** in development
3. **Test with minimal data** to isolate issues
4. **Review rule evaluation logs** in Firebase Console

## Integration with Application

### Client-Side Considerations

1. **Error Handling**: Handle permission denied errors gracefully
2. **Validation**: Validate moves client-side before sending to server
3. **Retry Logic**: Implement retry for transient failures
4. **User Feedback**: Provide clear error messages for rule violations

### Server-Side Considerations

1. **Transaction Safety**: Use Firestore transactions for atomic operations
2. **Error Propagation**: Properly handle and log security rule violations
3. **Monitoring**: Monitor rule evaluation performance
4. **Testing**: Include security rule tests in CI/CD pipeline

## Version History

- **v1.0**: Initial security rules implementation
  - Basic access control
  - Game state protection
  - Turn enforcement

## Future Enhancements

1. **Rate Limiting**: Add rate limiting for move submissions
2. **Audit Logging**: Enhanced logging for security events
3. **Advanced Validation**: More sophisticated game logic validation
4. **Performance Optimization**: Rule optimization for large games 