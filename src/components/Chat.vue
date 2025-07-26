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
      <!-- Small tooltip indicator -->
      <div class="chat-tooltip" v-if="!isOpen">
        <span>Chat available</span>
      </div>
    </div>

    <!-- Slide-out Chat Panel -->
    <div class="chat-panel" :class="{ 'chat-panel--open': isOpen }">
      <div class="chat-panel-header">
        <h3 class="chat-panel-title">{{ props.isHostChat ? '💬 Chat with Host' : '💬 Chat' }}</h3>
        <button @click="toggleChat" class="chat-close-btn" title="Close chat">
          ✕
        </button>
      </div>
      
      <div class="chat-messages" ref="messagesContainerRef">
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
  isHostChat?: boolean
}

interface Props {
  matchId: string
  currentPlayerName: string
  hasSecondPlayer?: boolean
  isHostChat?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasSecondPlayer: false,
  isHostChat: false
})

const chatMessages = ref<ChatMessage[]>([])
const newMessage = ref('')
const messagesContainerRef = ref<HTMLElement>()
const isLoading = ref(false)
const isOpen = ref(false)
const unreadCount = ref(0)
const lastReadMessageId = ref<string>('')
let unsubscribe: Unsubscribe | null = null

// Computed sorted messages (oldest to newest)
const sortedMessages = computed(() => {
  const messages = Array.isArray(chatMessages.value) ? chatMessages.value : [];
  console.log('sortedMessages computed - chatMessages.value:', chatMessages.value)
  console.log('sortedMessages computed - messages array:', messages)
  const sorted = messages.sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  console.log('sortedMessages computed - sorted result:', sorted)
  return sorted;
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
  
  console.log('Sending message:', {
    matchId: props.matchId,
    author: props.currentPlayerName,
    text: newMessage.value.trim(),
    isHostChat: props.isHostChat
  })
  
  isLoading.value = true
  const messageText = newMessage.value.trim()
  
  const message = {
    author: props.currentPlayerName,
    text: messageText,
    timestamp: serverTimestamp(),
    isHostChat: props.isHostChat || false
  }
  
  console.log('Message object being sent:', JSON.stringify(message, null, 2))
  
  try {
    const messagesRef = collection(db, `matches/${props.matchId}/messages`)
    console.log('Messages collection ref:', messagesRef)
    
    const docRef = await addDoc(messagesRef, message)
    console.log('Message sent successfully with ID:', docRef.id)
    
    newMessage.value = ''
    
    // Scroll to bottom
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack
    })
  } finally {
    isLoading.value = false
  }
}

// Scroll to bottom of chat
function scrollToBottom() {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
  }
}

// Subscribe to messages
onMounted(() => {
  console.log('Chat component mounted with props:', {
    matchId: props.matchId,
    currentPlayerName: props.currentPlayerName,
    hasSecondPlayer: props.hasSecondPlayer,
    isHostChat: props.isHostChat,
    isHostChatType: typeof props.isHostChat
  })
  
  if (!props.matchId) {
    console.warn('No matchId provided for chat subscription');
    return;
  }
  
  const messagesRef = collection(db, `matches/${props.matchId}/messages`)
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'))
  
  unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    console.log('Chat subscription update:', {
      matchId: props.matchId,
      isHostChat: props.isHostChat,
      totalMessages: snapshot.docs.length
    })
    
    const allMessages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() ?? new Date()
    }) as ChatMessage) || [];
    
    console.log('All messages:', allMessages)
    console.log('Message details:', allMessages.map(msg => ({
      id: msg.id,
      author: msg.author,
      text: msg.text,
      isHostChat: msg.isHostChat,
      isHostChatType: typeof msg.isHostChat,
      timestamp: msg.timestamp
    })))
    
    // Log the actual message content for debugging
    console.log('Raw message data:', allMessages)
    
    // Log the actual chatMessages array that gets displayed
    console.log('chatMessages.value before filtering:', chatMessages.value)
    
    // Filter messages based on chat type
    console.log('Filtering logic - props.isHostChat:', props.isHostChat, 'type:', typeof props.isHostChat)
    
    if (props.isHostChat) {
      // For host chat, only show messages marked as host chat
      const hostMessages = allMessages.filter(msg => {
        console.log('Checking message:', msg.id, 'isHostChat:', msg.isHostChat, 'type:', typeof msg.isHostChat, '=== true:', msg.isHostChat === true)
        return msg.isHostChat === true
      });
      chatMessages.value = hostMessages;
      console.log('Host chat messages:', hostMessages)
      console.log('chatMessages.value after host filtering:', chatMessages.value)
    } else {
      // For regular chat, only show messages NOT marked as host chat
      const regularMessages = allMessages.filter(msg => msg.isHostChat !== true);
      chatMessages.value = regularMessages;
      console.log('Regular chat messages:', regularMessages)
      console.log('chatMessages.value after regular filtering:', chatMessages.value)
    }
    
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
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  background: #f97316;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  border: 2px solid white;
}

.chat-tab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
}

.chat-tab--active {
  background: #ea580c;
  transform: scale(1.05);
}

.chat-tab-icon {
  font-size: 1.5rem;
  color: white;
}

.chat-notification {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #dc2626;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  border: 2px solid white;
}

/* Chat tooltip */
.chat-tooltip {
  position: absolute;
  bottom: 70px;
  right: 0;
  background: #1f2937;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  pointer-events: none;
  z-index: 1001;
}

.chat-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  right: 20px;
  border: 5px solid transparent;
  border-top-color: #1f2937;
}

.chat-tab:hover .chat-tooltip {
  opacity: 1;
  transform: translateY(0);
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