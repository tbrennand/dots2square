<template>
  <div class="leaderboard">
    <!-- Header -->
    <div class="leaderboard-header">
      <h2 class="text-2xl font-bold text-gray-800">Leaderboard</h2>
      <div class="flex items-center gap-2">
        <button
          @click="refreshLeaderboard"
          :disabled="isLoading"
          class="p-2 text-gray-600 hover:text-blue-600 transition-colors"
          title="Refresh leaderboard"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <span v-if="isLoading" class="text-sm text-gray-500">Loading...</span>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      <p class="text-red-600 text-sm">{{ error }}</p>
      <button @click="clearError" class="text-blue-600 text-xs underline">
        Dismiss
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !hasData" class="loading-state">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="text-gray-500 text-sm mt-2">Loading leaderboard...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasData && !isLoading" class="empty-state">
      <div class="text-center py-8">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="text-gray-500">No players yet. Be the first to play!</p>
      </div>
    </div>

    <!-- Leaderboard Content -->
    <div v-else class="leaderboard-content">
      <!-- Top 3 Players (Special Display) -->
      <div v-if="topPlayers.length > 0" class="top-players mb-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Top Players</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 2nd Place -->
          <div v-if="topPlayers[1]" class="top-player-card second-place">
            <div class="rank-badge">2</div>
            <div class="player-info">
              <h4 class="player-name">{{ topPlayers[1].name }}</h4>
              <p class="player-score">{{ formatScore(topPlayers[1].totalScore) }} pts</p>
              <p class="player-stats">{{ topPlayers[1].gamesWon }} wins ({{ formatWinRate(topPlayers[1].winRate) }})</p>
            </div>
          </div>

          <!-- 1st Place -->
          <div v-if="topPlayers[0]" class="top-player-card first-place">
            <div class="rank-badge">1</div>
            <div class="crown-icon">👑</div>
            <div class="player-info">
              <h4 class="player-name">{{ topPlayers[0].name }}</h4>
              <p class="player-score">{{ formatScore(topPlayers[0].totalScore) }} pts</p>
              <p class="player-stats">{{ topPlayers[0].gamesWon }} wins ({{ formatWinRate(topPlayers[0].winRate) }})</p>
            </div>
          </div>

          <!-- 3rd Place -->
          <div v-if="topPlayers[2]" class="top-player-card third-place">
            <div class="rank-badge">3</div>
            <div class="player-info">
              <h4 class="player-name">{{ topPlayers[2].name }}</h4>
              <p class="player-score">{{ formatScore(topPlayers[2].totalScore) }} pts</p>
              <p class="player-stats">{{ topPlayers[2].gamesWon }} wins ({{ formatWinRate(topPlayers[2].winRate) }})</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Full Leaderboard Table -->
      <div class="leaderboard-table">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">All Players</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-medium text-gray-700">Rank</th>
                <th class="text-left py-3 px-4 font-medium text-gray-700">Player</th>
                <th class="text-right py-3 px-4 font-medium text-gray-700">Score</th>
                <th class="text-right py-3 px-4 font-medium text-gray-700">Wins</th>
                <th class="text-right py-3 px-4 font-medium text-gray-700">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in leaderboard"
                :key="entry.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                :class="{ 'current-user': entry.id === currentUserId }"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <span class="rank-number">{{ entry.rank }}</span>
                    <span v-if="entry.rank <= 3" class="medal">
                      {{ getMedal(entry.rank) }}
                    </span>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {{ getInitials(entry.name) }}
                    </div>
                    <span class="font-medium">{{ entry.name }}</span>
                    <span v-if="entry.id === currentUserId" class="text-blue-600 text-xs">(You)</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-right font-medium">
                  {{ formatScore(entry.totalScore) }}
                </td>
                <td class="py-3 px-4 text-right text-gray-600">
                  {{ entry.gamesWon }}
                </td>
                <td class="py-3 px-4 text-right text-gray-600">
                  {{ formatWinRate(entry.winRate) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Current User Rank -->
      <div v-if="currentUserEntry && userRank && userRank > 10" class="current-user-rank">
        <div class="border-t border-gray-200 pt-4 mt-4">
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div class="flex items-center gap-3">
              <span class="text-blue-600 font-medium">Your Rank:</span>
              <span class="text-lg font-bold text-blue-600">#{{ userRank }}</span>
            </div>
            <div class="text-right">
              <p class="font-medium">{{ currentUserEntry.name }}</p>
              <p class="text-sm text-gray-600">{{ formatScore(currentUserEntry.totalScore) }} pts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLeaderboard } from '@/composables/useLeaderboard'
import type { LeaderboardEntry } from '@/firebase/userHelpers'

interface Props {
  currentUserId?: string
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 10
})

// Use leaderboard composable
const {
  leaderboard,
  topPlayers,
  currentUserEntry,
  userRank,
  isLoading,
  error,
  hasData,
  loadLeaderboard,
  refreshLeaderboard,
  clearError
} = useLeaderboard({
  limit: props.limit,
  currentUserId: props.currentUserId
})

// Methods
const formatScore = (score: number): string => {
  return score.toLocaleString()
}

const formatWinRate = (winRate: number): string => {
  return `${winRate.toFixed(1)}%`
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getMedal = (rank: number): string => {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return ''
  }
}
</script>

<style scoped>
.leaderboard {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.leaderboard-header {
  @apply flex items-center justify-between mb-6;
}

.error-message {
  @apply p-3 bg-red-50 border border-red-200 rounded-lg mb-4;
}

.loading-state {
  @apply flex flex-col items-center justify-center py-12;
}

.empty-state {
  @apply py-8;
}

.top-players {
  @apply mb-6;
}

.top-player-card {
  @apply relative bg-gradient-to-br rounded-lg p-4 text-center text-white;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.first-place {
  @apply bg-gradient-to-br from-yellow-400 to-yellow-600;
  transform: scale(1.05);
}

.second-place {
  @apply bg-gradient-to-br from-gray-400 to-gray-600;
}

.third-place {
  @apply bg-gradient-to-br from-orange-400 to-orange-600;
}

.rank-badge {
  @apply absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white text-gray-800 font-bold text-sm flex items-center justify-center;
}

.crown-icon {
  @apply absolute -top-4 text-2xl;
}

.player-info {
  @apply mt-2;
}

.player-name {
  @apply font-bold text-lg mb-1;
}

.player-score {
  @apply text-xl font-bold mb-1;
}

.player-stats {
  @apply text-sm opacity-90;
}

.leaderboard-table {
  @apply mt-6;
}

.rank-number {
  @apply font-bold text-gray-800;
}

.medal {
  @apply text-lg;
}

.current-user {
  @apply bg-blue-50 border-blue-200;
}

.current-user-rank {
  @apply mt-4;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .top-player-card {
    min-height: 100px;
  }
  
  .player-name {
    @apply text-base;
  }
  
  .player-score {
    @apply text-lg;
  }
  
  .leaderboard-table {
    @apply text-sm;
  }
}
</style> 