<template>
  <div class="reaction-panel-example">
    <h3 class="text-lg font-semibold mb-4">Reaction Panel Example</h3>
    
    <!-- Error Display -->
    <div v-if="error" class="error-message mb-4">
      <p class="text-red-600 text-sm">{{ error }}</p>
      <button @click="clearError" class="text-blue-600 text-xs underline">
        Dismiss
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-message mb-4">
      <p class="text-blue-600 text-sm">Sending reaction...</p>
    </div>

    <!-- Reaction Panel -->
    <ReactionPanel
      :match-id="matchId"
      :current-user-id="currentUserId"
      :current-user-name="currentUserName"
      :can-send-reactions="canSendReaction"
      :reactions="reactions"
      @reaction-sent="handleReactionSent"
      @reaction-received="handleReactionReceived"
    />

    <!-- Debug Info -->
    <div class="debug-info mt-6 p-4 bg-gray-100 rounded-lg">
      <h4 class="font-medium mb-2">Debug Information</h4>
      <div class="text-sm space-y-1">
        <p><strong>Match ID:</strong> {{ matchId }}</p>
        <p><strong>Current User:</strong> {{ currentUserName }}</p>
        <p><strong>Can Send Reaction:</strong> {{ canSendReaction ? 'Yes' : 'No' }}</p>
        <p><strong>Total Reactions:</strong> {{ reactions.length }}</p>
        <p><strong>Recent Reactions:</strong> {{ recentReactions.length }}</p>
        <p><strong>Your Reactions:</strong> {{ playerReactions.length }}</p>
      </div>
    </div>

    <!-- Recent Reactions List -->
    <div class="recent-reactions mt-4">
      <h4 class="font-medium mb-2">Recent Reactions</h4>
      <div class="space-y-2">
        <div 
          v-for="reaction in recentReactions" 
          :key="reaction.id"
          class="flex items-center gap-2 p-2 bg-white border rounded"
        >
          <span class="text-lg">{{ reaction.emoji }}</span>
          <span class="text-sm font-medium">{{ reaction.playerName }}</span>
          <span class="text-xs text-gray-500">
            {{ formatTime(reaction.timestamp) }}
          </span>
        </div>
        <div v-if="recentReactions.length === 0" class="text-gray-500 text-sm">
          No reactions yet
        </div>
      </div>
    </div>

    <!-- Test Controls -->
    <div class="test-controls mt-6 p-4 bg-blue-50 rounded-lg">
      <h4 class="font-medium mb-2">Test Controls</h4>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="emoji in testEmojis"
          :key="emoji"
          @click="sendTestReaction(emoji)"
          :disabled="!canSendReaction"
          class="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {{ emoji }}
        </button>
      </div>
      <button
        @click="resetReactions"
        class="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
      >
        Reset Reactions
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReactionPanel from './ReactionPanel.vue'
import { useReactions } from '@/composables/useReactions'
import type { Reaction } from '@/composables/useReactions'

// Props
interface Props {
  matchId: string
  currentUserId: string
  currentUserName: string
}

const props = defineProps<Props>()

// Use reactions composable
const {
  reactions,
  recentReactions,
  playerReactions,
  isLoading,
  error,
  canSendReaction,
  sendReaction,
  clearError,
  reset
} = useReactions({
  matchId: props.matchId,
  currentUserId: props.currentUserId,
  currentUserName: props.currentUserName,
  maxReactions: 20
})

// Test emojis
const testEmojis = ['👍', '❤️', '🎉', '😊', '🤔', '😎', '🔥', '💯']

// Methods
const handleReactionSent = (reaction: Reaction) => {
  console.log('Reaction sent:', reaction)
}

const handleReactionReceived = (reaction: Reaction) => {
  console.log('Reaction received:', reaction)
}

const sendTestReaction = async (emoji: string) => {
  const success = await sendReaction(emoji)
  if (success) {
    console.log(`Test reaction sent: ${emoji}`)
  } else {
    console.log(`Failed to send test reaction: ${emoji}`)
  }
}

const resetReactions = () => {
  reset()
  console.log('Reactions reset')
}

const formatTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) {
    return `${seconds}s ago`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  } else {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h ago`
  }
}
</script>

<style scoped>
.reaction-panel-example {
  @apply max-w-2xl mx-auto p-6;
}

.error-message {
  @apply p-3 bg-red-50 border border-red-200 rounded-lg;
}

.loading-message {
  @apply p-3 bg-blue-50 border border-blue-200 rounded-lg;
}

.debug-info {
  @apply text-xs;
}

.recent-reactions {
  @apply max-h-64 overflow-y-auto;
}

.test-controls button {
  @apply transition-colors;
}
</style> 