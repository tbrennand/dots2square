<template>
  <div v-if="props.matchId && hasSecondPlayer" class="chat-container">
    <!-- Chat Tab Icon (always visible when second player joins) -->
    <div 
      class="chat-tab" 
      :class="{ 'chat-tab--active': isOpen }"
      @click="toggleChat"
      :title="isOpen ? 'Close chat' : 'Open chat'"
    >
      <span class="chat-tab-icon">💬</span>
      <span v-if="unreadCount > 0" class="chat-notification">{{ unreadCount }}</span>
    </div>

    <!-- Slide-out Chat Panel -->
    <div class="chat-panel" :class="{ 'chat-panel--open': isOpen }">
      <div class="chat-panel-header">
        <h3 class="chat-panel-title">💬 Chat</h3>
        <button @click="toggleChat" class="chat-close-btn" title="Close chat">
          ✕
        </button>
      </div>
      
      <div class="chat-messages" ref="chatMessages">
        <div v-if="sortedMessages.length === 0" class="no-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
        <div v-for="message in sortedMessages" :key="message.id" class="chat-message">
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          <span class="message-author">{{ message.author }}:</span>
          <span class="message-text">{{ message.text }}</span>
        </div>
      </div>
      
      <div class="chat-input">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage"
          placeholder="Type a message..."
          class="message-input"
          :disabled="isLoading"
        />
        <button @click="sendMessage" :disabled="!newMessage.trim() || isLoading" class="send-btn">
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Send</span>
        </button>
      </div>
    </div>

    <!-- Backdrop for mobile -->
    <div v-if="isOpen" class="chat-backdrop" @click="toggleChat"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { doc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/index'

import type { Unsubscribe } from 'firebase/firestore'

interface ChatMessage {
  id: string
  author: string
  text: string
  timestamp: Date
}

interface Props {
  matchId: string
  currentPlayerName: string
  hasSecondPlayer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasSecondPlayer: false
})

const chatMessages = ref<ChatMessage[]>([])
const newMessage = ref('')
const chatMessagesRef = ref<HTMLElement>()
const isLoading = ref(false)
const isOpen = ref(false)
const unreadCount = ref(0)
const lastReadMessageId = ref<string>('')
let unsubscribe: Unsubscribe | null = null

// Computed sorted messages (oldest to newest)
const sortedMessages = computed(() => {
  const messages = Array.isArray(chatMessages.value) ? chatMessages.value : [];
  return messages.sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
})

// Format timestamp
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Toggle chat panel
function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    // Mark messages as read when opening
    markMessagesAsRead()
    // Focus input after animation
    setTimeout(() => {
      const input = document.querySelector('.message-input') as HTMLInputElement
      if (input) input.focus()
    }, 300)
  }
}

// Mark messages as read
function markMessagesAsRead() {
  if (sortedMessages.value.length > 0) {
    lastReadMessageId.value = sortedMessages.value[sortedMessages.value.length - 1].id
    unreadCount.value = 0
  }
}

// Send message
async function sendMessage() {
  if (!newMessage.value.trim() || isLoading.value) return
  
  isLoading.value = true
  const messageText = newMessage.value.trim()
  
  const message = {
    author: props.currentPlayerName,
    text: messageText,
    timestamp: serverTimestamp()
  }
  
  try {
    const messagesRef = collection(db, `matches/${props.matchId}/messages`)
    await addDoc(messagesRef, message)
    newMessage.value = ''
    
    // Scroll to bottom
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    console.error('Error sending message:', error)
  } finally {
    isLoading.value = false
  }
}

// Scroll to bottom of chat
function scrollToBottom() {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

// Subscribe to messages
onMounted(() => {
  if (!props.matchId) {
    console.warn('No matchId provided for chat subscription');
    return;
  }
  
  const messagesRef = collection(db, `matches/${props.matchId}/messages`)
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'))
  
  unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    chatMessages.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() ?? new Date()
    }) as ChatMessage) || [];
    
    // Update unread count
    if (!isOpen.value && sortedMessages.value.length > 0) {
      const lastMessage = sortedMessages.value[sortedMessages.value.length - 1]
      if (lastMessage.id !== lastReadMessageId.value && lastMessage.author !== props.currentPlayerName) {
        unreadCount.value++
      }
    }
    
    // Scroll to bottom on new messages if chat is open
    if (isOpen.value) {
      nextTick(() => {
        scrollToBottom()
      })
    }
  }, (error) => {
    console.error('Error listening to messages:', error);
    chatMessages.value = [];
  })
})

// Watch for second player joining
watch(() => props.hasSecondPlayer, (newValue) => {
  if (newValue && !isOpen.value) {
    // Auto-open chat when second player joins
    setTimeout(() => {
      isOpen.value = true
      markMessagesAsRead()
    }, 500)
  }
})

// Cleanup
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
/* Chat Container */
.chat-container {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 1000;
  pointer-events: none;
}

/* Chat Tab */
.chat-tab {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  background: #f97316;
  color: white;
  padding: 1rem 0.75rem;
  border-radius: 0.5rem 0 0 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  z-index: 1001;
}

.chat-tab:hover {
  background: #ea580c;
  transform: translateY(-50%) translateX(-5px);
}

.chat-tab--active {
  background: #ea580c;
}

.chat-tab-icon {
  font-size: 1.25rem;
  display: block;
}

.chat-notification {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Chat Panel */
.chat-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  z-index: 1002;
}

.chat-panel--open {
  right: 0;
}

/* Chat Panel Header */
.chat-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f97316;
  color: white;
  border-bottom: 1px solid #ea580c;
}

.chat-panel-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.chat-close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.chat-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Chat Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f8fafc;
}

.no-messages {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 2rem 0;
}

.no-messages p {
  margin: 0;
  font-size: 0.875rem;
}

.chat-message {
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.4;
}

.message-time {
  color: #9ca3af;
  font-size: 0.75rem;
  margin-right: 0.5rem;
}

.message-author {
  font-weight: 600;
  color: #374151;
  margin-right: 0.5rem;
}

.message-text {
  color: #1f2937;
  word-wrap: break-word;
}

/* Chat Input */
.chat-input {
  display: flex;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.message-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.send-btn {
  padding: 0.75rem 1rem;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.875rem;
  min-width: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background: #ea580c;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Backdrop for mobile */
.chat-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Responsive Design */
@media (max-width: 768px) {
  .chat-panel {
    width: 100vw;
    right: -100vw;
  }
  
  .chat-tab {
    padding: 0.75rem 0.5rem;
  }
  
  .chat-tab-icon {
    font-size: 1rem;
  }
  
  .chat-panel-header {
    padding: 0.75rem;
  }
  
  .chat-panel-title {
    font-size: 1rem;
  }
  
  .chat-messages {
    padding: 0.75rem;
  }
  
  .chat-input {
    padding: 0.75rem;
  }
  
  .message-input {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .send-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    min-width: 60px;
  }
}

@media (max-width: 480px) {
  .chat-tab {
    padding: 0.5rem 0.375rem;
  }
  
  .chat-tab-icon {
    font-size: 0.875rem;
  }
  
  .chat-notification {
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
  }
}
</style> 