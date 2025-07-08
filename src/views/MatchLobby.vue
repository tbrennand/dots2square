<template>
  <div class="match-lobby">
    <h2>Match Lobby</h2>
    <div class="players">
      <div>Player 1: ...</div>
      <div>Player 2: ...</div>
    </div>
    <button>Start Game</button>
  </div>
</template>

<script setup>
// MatchLobby logic will go here
</script>

<style scoped>
.match-lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}
.players {
  display: flex;
  gap: 2rem;
}
</style> 