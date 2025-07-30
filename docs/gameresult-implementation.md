# GameResult Component Implementation

## Overview

The `GameResult.vue` component is a presentational component responsible for displaying the game completion screen. It is designed to be a "dumb" component, meaning it receives all of its data via props and emits events to its parent (`GameBoard.vue`) to handle actions. This approach ensures a clean separation of concerns and makes the component highly reusable.

## Features

### ✅ Winner Display
- **Winner Announcement**: Clearly displays the winner or announces a tie.
- **Forfeit Messaging**: Provides a specific message when a game ends due to a player forfeiting from missed turns.
- **Tie Handling**: A unique display for tied games.

### ✅ Final Score Display
- **Player Cards**: Individual score cards for each player, with a visual highlight for the winner.
- **Player Information**: Shows the final scores and names for both players.

### ✅ Game Statistics
- **Total Squares**: The total number of squares on the grid.
- **Total Moves**: The total number of moves made by both players.
- **Record vs AI / Duration**: Displays the "Record vs AI" for AI games and the match duration for multiplayer games.

### ✅ Action Buttons
- **Play Again**: A button that, when clicked, emits a `play-again` event to the parent component.
- **Back to Home**: A button to navigate back to the home screen.

## Component Structure and Data Flow

### Props
The `GameResult` component is driven entirely by props passed down from `GameBoard.vue`. It does not fetch its own data or manage any complex state.

- `isMultiplayer`: A boolean to determine if the game was against an AI or another player.
- `winner`: The winner of the game (player 1, player 2, or 'tie').
- `scores`: The final scores for both players.
- `player1Name` & `player2Name`: The names of the players.
- `totalMoves`: The total number of moves made in the game.

### Emits
The component emits a single event:

- **`play-again`**: This event is emitted when the "Play Again" button is clicked. It signals to the parent component (`GameBoard.vue`) that the user wants to start a new game.

### Integration
The `GameResult` component is rendered inside `GameBoard.vue` within a `v-if="isGameOver"` directive, so it only appears when the game has concluded.

```vue
<!-- In GameBoard.vue -->
<div v-if="isGameOver" class="game-over-overlay">
  <GameResult
    :is-multiplayer="isMultiplayer"
    :winner="isMultiplayer ? multiplayerWinner : aiWinner"
    :scores="isMultiplayer ? matchData?.scores : localScores"
    :player1-name="player1Name"
    :player2-name="player2Name"
    :total-moves="drawnLines.length"
    @play-again="handleRestart"
  />
</div>
```

This setup ensures that `GameBoard.vue` remains in control of the game state and logic, while `GameResult.vue` focuses solely on presenting the final results. 