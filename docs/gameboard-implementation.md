# GameBoard.vue Implementation Summary

## Overview

The `GameBoard.vue` component is the central hub for the Dots2Squares gameplay experience. It integrates real-time data from Firebase for multiplayer games, manages local state for AI matches, and provides a fully responsive interface for both desktop and mobile devices. The implementation focuses on a clean, modern aesthetic and an intuitive user experience.

## Component Structure

The game is structured for clarity and maintainability:

- **`src/views/GameBoard.vue`**: The main parent component. It handles all core game logic, including:
  - Real-time data fetching from Firebase.
  - Turn management and the turn timer.
  - The overall layout of the header (logo, player panels, controls).
  - The "Play Again" functionality.
- **`src/components/DotGrid.vue`**: A dedicated child component responsible for rendering the interactive game grid, including the dots, lines, and hover effects.
- **`src/views/GameResult.vue`**: A component that displays the game completion screen and emits the "play-again" event.

## Key Features Implemented

The current version includes a robust set of features that create a complete and polished game experience:

- ✅ **Real-Time Multiplayer**: The game state is perfectly synchronized between two players using Firebase Firestore listeners.
- ✅ **Turn Timer & Three-Strikes Rule**: 
  - Each player has a 30-second timer for their turn.
  - A countdown sound plays for the final 5 seconds.
  - If a player fails to make a move within the time limit, the turn automatically passes to their opponent.
  - If a player misses three consecutive turns, they forfeit the game, and the completion screen is shown.
- ✅ **Dynamic Player Panels**: The header displays both players' names, scores, and avatar initials. The current player's panel is highlighted with an orange border, and a "YOUR TURN" / "THEIR TURN" indicator makes the game state clear.
- ✅ **"Play Again" Functionality**:
  - After a game is complete, a "Play Again" button is displayed on the results screen.
  - For AI games, this button resets the local game state for a new match.
  - For multiplayer games, it resets the current match data in Firebase, allowing both players to start a new game without leaving the screen.
- ✅ **Responsive Design**: The interface is fully optimized for desktop and mobile. On mobile, the header rearranges itself to save space, and the grid scales to fit the viewport.
- ✅ **Clean Grid Interface**: The game starts with only dots visible. The hover effect to show a potential move only appears after the first line has been drawn, preventing initial visual clutter.

## Data Flow

The data flow is centered around the Pinia `gameStore` and Firebase's real-time capabilities:

1.  **Subscription**: On component mount, `GameBoard.vue` subscribes to the relevant match document in Firestore for multiplayer games.
2.  **Synchronization**: Any changes to the Firestore document are automatically pushed to all subscribed clients.
3.  **Local State Update**: `GameBoard.vue` listens for these changes and updates its local reactive state.
4.  **Props Down**: This updated state is passed down as props to the `DotGrid` and `GameResult` components.
5.  **Move Up**: When a player clicks on a line in `DotGrid`, it emits a `line-selected` event up to `GameBoard`.
6.  **Firebase Update**: `GameBoard` processes this event and updates the Firestore document, which then triggers the synchronization for the other player.
7.  **Play Again**: The `GameResult` component emits a `play-again` event, which is handled by `GameBoard` to reset the match.

## Styling Highlights

- **Modern & Clean**: The UI uses a simple white background with a black and orange color scheme.
- **Flexbox Layout**: The header uses a robust flexbox layout to ensure perfect alignment on all screen sizes.
- **Mobile First**: Specific media queries are used to adjust the layout for a seamless mobile experience.
- **Visual Feedback**: The current player's turn is clearly indicated with borders and text, and the timer provides a clear visual cue of the remaining time.

This implementation delivers a complete, polished, and fully functional Dots2Squares game with both AI and multiplayer modes. 