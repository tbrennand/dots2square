<template>
  <div class="reaction-panel">
    <!-- Reaction Display Area -->
    <div class="reactions-display" v-if="reactions.length > 0">
      <div 
        v-for="reaction in recentReactions" 
        :key="reaction.id"
        class="reaction-bubble"
        :class="{ 'own-reaction': reaction.playerId === currentUserId }"
      >
        <span class="reaction-emoji">{{ reaction.emoji }}</span>
        <span class="reaction-player">{{ reaction.playerName }}</span>
      </div>
    </div>

    <!-- Reaction Picker -->
    <div class="reaction-picker" :class="{ 'picker-open': isPickerOpen }">
      <button 
        @click="togglePicker"
        class="reaction-toggle"
        :disabled="!canSendReactions"
        :title="canSendReactions ? 'Send reaction' : 'Reactions disabled'"
      >
        😊
      </button>

      <div v-if="isPickerOpen" class="reaction-grid">
        <button
          v-for="emoji in availableEmojis"
          :key="emoji"
          @click="sendReaction(emoji)"
          class="reaction-option"
          :disabled="!canSendReactions"
        >
          {{ emoji }}
        </button>
      </div>
    </div>

    <!-- Quick Reactions -->
    <div class="quick-reactions" v-if="!isPickerOpen">
      <button
        v-for="emoji in quickReactions"
        :key="emoji"
        @click="sendReaction(emoji)"
        class="quick-reaction"
        :disabled="!canSendReactions"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Reaction {
  id: string
  emoji: string
  playerId: string
  playerName: string
  timestamp: Date
  matchId: string
}

interface Props {
  matchId: string
  currentUserId: string
  currentUserName: string
  canSendReactions?: boolean
  reactions?: Reaction[]
}

const props = withDefaults(defineProps<Props>(), {
  canSendReactions: true,
  reactions: () => []
})

const emit = defineEmits<{
  'reaction-sent': [reaction: Reaction]
  'reaction-received': [reaction: Reaction]
}>()

// State
const isPickerOpen = ref(false)
const reactions = ref<Reaction[]>(props.reactions)

// Available emojis
const availableEmojis = [
  '😊', '😂', '😍', '🤔', '😎', '😢', '😡', '🤯', '🎉', '👏',
  '👍', '👎', '❤️', '💪', '🔥', '💯', '🎯', '🏆', '🤝', '🙏'
]

const quickReactions = ['👍', '❤️', '🎉', '😊']

// Computed
const recentReactions = computed(() => {
  return reactions.value
    .slice(-5) // Show last 5 reactions
    .reverse() // Most recent first
})

// Methods
const togglePicker = () => {
  if (props.canSendReactions) {
    isPickerOpen.value = !isPickerOpen.value
  }
}

const sendReaction = (emoji: string) => {
  if (!props.canSendReactions) return

  const reaction: Reaction = {
    id: generateReactionId(),
    emoji,
    playerId: props.currentUserId,
    playerName: props.currentUserName,
    timestamp: new Date(),
    matchId: props.matchId
  }

  // Add to local reactions
  reactions.value.push(reaction)

  // Emit to parent
  emit('reaction-sent', reaction)

  // Close picker
  isPickerOpen.value = false
}

const addReaction = (reaction: Reaction) => {
  reactions.value.push(reaction)
  emit('reaction-received', reaction)
}

const generateReactionId = (): string => {
  return `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Click outside to close picker
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.reaction-picker')) {
    isPickerOpen.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Expose methods for parent components
defineExpose({
  addReaction,
  reactions: computed(() => reactions.value)
})
</script>

<style scoped>
.reaction-panel {
  @apply relative flex flex-col gap-3;
}

.reactions-display {
  @apply flex flex-wrap gap-2 min-h-[2rem];
}

.reaction-bubble {
  @apply flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full text-sm animate-bounce;
  animation-duration: 0.6s;
  animation-iteration-count: 1;
}

.reaction-bubble.own-reaction {
  @apply bg-green-100;
}

.reaction-emoji {
  @apply text-lg;
}

.reaction-player {
  @apply text-xs text-gray-600 font-medium;
}

.reaction-picker {
  @apply relative;
}

.reaction-toggle {
  @apply w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-xl flex items-center justify-center;
}

.reaction-toggle:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.reaction-grid {
  @apply absolute bottom-full left-0 mb-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg grid grid-cols-5 gap-1 z-10;
  min-width: 200px;
}

.reaction-option {
  @apply w-8 h-8 rounded hover:bg-gray-100 transition-colors text-lg flex items-center justify-center;
}

.reaction-option:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.quick-reactions {
  @apply flex gap-2;
}

.quick-reaction {
  @apply w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-lg flex items-center justify-center;
}

.quick-reaction:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Animation for new reactions */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

.animate-bounce {
  animation: bounce 0.6s ease-in-out;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .reaction-grid {
    @apply grid-cols-4;
    min-width: 160px;
  }
  
  .reaction-option {
    @apply w-7 h-7 text-base;
  }
  
  .quick-reaction {
    @apply w-7 h-7 text-base;
  }
}
</style> 