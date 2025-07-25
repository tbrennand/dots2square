/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// Turn timer function - runs every minute to check for expired turns
export const checkTurnTimer = onSchedule({
  schedule: "every 1 minutes",
  region: "us-central1",
}, async () => {
  logger.info("Checking for expired turns...");

  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000); // 1 minute ago

    // Query for active matches with expired turns
    const matchesRef = db.collection("matches");
    const expiredMatchesQuery = matchesRef
      .where("status", "==", "active")
      .where("turnStartedAt", "<", oneMinuteAgo);

    const snapshot = await expiredMatchesQuery.get();

    if (snapshot.empty) {
      logger.info("No expired turns found");
      return;
    }

    logger.info(`Found ${snapshot.size} matches with expired turns`);

    // Process each expired match
    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const matchData = doc.data();
      const currentPlayerId = matchData.currentPlayerId;

      if (!currentPlayerId) {
        logger.warn(`Match ${doc.id} has no currentPlayerId`);
        continue;
      }

      // Increment consecutive missed turns for current player
      const consecutiveMissedTurns = matchData.consecutiveMissedTurns || {};
      const currentPlayerMissedTurns =
        (consecutiveMissedTurns[currentPlayerId] || 0) + 1;

      logger.info(
        `Player ${currentPlayerId} missed turn in match ${doc.id}. ` +
        `Consecutive misses: ${currentPlayerMissedTurns}`,
      );

      // Check if player has missed 3 consecutive turns
      if (currentPlayerMissedTurns >= 3) {
        // Game over - opponent wins
        const opponentId = matchData.player1?.id === currentPlayerId ?
          matchData.player2?.id :
          matchData.player1?.id;

        batch.update(doc.ref, {
          status: "completed",
          winnerId: opponentId,
          gameEndReason: "turn_timeout",
          consecutiveMissedTurns: {
            ...consecutiveMissedTurns,
            [currentPlayerId]: currentPlayerMissedTurns,
          },
          updatedAt: FieldValue.serverTimestamp(),
        });

        logger.info(
          `Match ${doc.id} ended due to 3 consecutive missed turns. ` +
          `Winner: ${opponentId}`,
        );
      } else {
        // Switch turn to opponent
        const opponentId = matchData.player1?.id === currentPlayerId ?
          matchData.player2?.id :
          matchData.player1?.id;

        batch.update(doc.ref, {
          currentPlayerId: opponentId,
          turnStartedAt: FieldValue.serverTimestamp(),
          consecutiveMissedTurns: {
            ...consecutiveMissedTurns,
            [currentPlayerId]: currentPlayerMissedTurns,
          },
          updatedAt: FieldValue.serverTimestamp(),
        });

        logger.info(`Turn switched to ${opponentId} in match ${doc.id}`);
      }
    }

    // Commit all updates
    await batch.commit();
    logger.info("Successfully processed expired turns");
  } catch (error) {
    logger.error("Error checking turn timer:", error);
    throw error;
  }
});

// Function to handle new match creation - set initial turn timer
export const onMatchCreated = onDocumentCreated("matches", async (event) => {
  const matchData = event.data?.data();
  const matchId = event.data?.id;

  if (!matchData || !matchId) {
    logger.warn("No match data or ID found");
    return;
  }

  logger.info(`New match created: ${matchId}`);

  // The turn timer will be set when the match becomes active
  // This function just logs the creation for monitoring
});

// Function to handle match updates - reset turn timer when turn changes
export const onMatchUpdated = onDocumentUpdated("matches", async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();
  const matchId = event.data?.after.id;

  if (!beforeData || !afterData || !matchId) {
    return;
  }

  // Check if the current player changed (indicating a turn was taken)
  if (beforeData.currentPlayerId !== afterData.currentPlayerId) {
    logger.info(
      `Turn changed in match ${matchId}: ` +
      `${beforeData.currentPlayerId} -> ${afterData.currentPlayerId}`,
    );

    // Reset consecutive missed turns for the player who just took their turn
    const playerWhoJustPlayed = beforeData.currentPlayerId;
    if (playerWhoJustPlayed) {
      const consecutiveMissedTurns = afterData.consecutiveMissedTurns || {};
      consecutiveMissedTurns[playerWhoJustPlayed] = 0;

      await event.data?.after.ref.update({
        consecutiveMissedTurns: consecutiveMissedTurns,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(
        `Reset consecutive missed turns for player ${playerWhoJustPlayed} ` +
        `in match ${matchId}`,
      );
    }
  }
});
