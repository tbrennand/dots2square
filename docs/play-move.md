# `playMove` Function and Turn Logic

This document explains the core game logic handled by the `playMove` function and the associated turn management system in Dots2Squares.

## `playMove` Function Overview

The `playMove` function is the heart of the game's multiplayer logic. It uses Firestore transactions to ensure that every move is processed atomically, preventing race conditions and ensuring data integrity.

### Key Responsibilities:
- **Move Validation**: Checks if a move is legal (e.g., not a diagonal line, not already taken).
- **Square Detection**: Identifies if a move completes one or more squares.
- **Score Updates**: Updates the scores for the players.
- **Turn Management**: Handles turn switching and extra turns.
- **Game Completion**: Determines the winner when all squares are claimed.
- **Timer and Missed Turn Reset**: Resets the turn timer and the consecutive missed turns counter for the player who made the move.

### Function Signature
```typescript
async function playMove(
  matchId: string,
  playerId: string,
  line: { startDot: string; endDot: string }
): Promise<PlayMoveResult>
```

### Return Value
```typescript
interface PlayMoveResult {
  success: boolean;
  squaresClaimed: number;
  gameCompleted: boolean;
  winner?: number | 'tie' | null;
  error?: string;
}
```

## Turn Management and Timer

The game's turn logic is designed to be fair, responsive, and to keep the game moving.

### Turn Switching
- **No Squares Claimed**: If a player makes a move that does not complete a square, the turn automatically switches to the other player.
- **Squares Claimed**: If a player's move completes one or more squares, they get to take another turn.

### Turn Timer and Three-Strikes Rule
- **30-Second Timer**: Each player has 30 seconds to make a move. This timer is synchronized across both players' devices using a server timestamp.
- **Timer Reset**: When a player successfully makes a move, the `turnStartedAt` field in the Firestore document is updated to the current server time, which automatically resets the timer for the next turn.
- **Resetting Missed Turns**: In addition to resetting the timer, the `playMove` function also resets the `consecutiveMissedTurns` counter for the player who made the move. This ensures that a player is only penalized for consecutive inactivity.
- **Forfeiting**: If a player misses three consecutive turns, they forfeit the game.

## Data Flow and UI Updates

The `playMove` function is designed to work seamlessly with the reactive nature of the frontend.

1.  **User Action**: A player clicks on the grid in `DotGrid.vue`, which emits a `line-selected` event.
2.  **Function Call**: `GameBoard.vue` receives this event and calls the `playMove` function with the appropriate `matchId`, `playerId`, and `line` data.
3.  **Firestore Transaction**: `playMove` executes a Firestore transaction that updates the match document with the new line, any new squares, the updated scores, and the new `turnStartedAt` timestamp.
4.  **Real-Time Sync**: Because both players are subscribed to the match document, Firestore automatically pushes the updated data to both clients.
5.  **Reactive UI Update**: The Vue components react to the new data, and the UI updates instantly to show the new line, the updated scores, and the reset timer.

This reactive loop ensures that the game state is always synchronized and that players see the results of their actions—and their opponent's actions—in real time. 