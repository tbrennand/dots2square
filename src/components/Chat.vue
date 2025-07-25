<template>
  <div v-if="props.matchId" class="chat-section">
    <h3 class="section-title">💬 Chat</h3>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { doc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/index'

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
}

const props = defineProps<Props>()
const chatMessages = ref<ChatMessage[]>([])
const newMessage = ref('')
const chatMessagesRef = ref<HTMLElement>()
const isLoading = ref(false)
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
    
    // Scroll to bottom on new messages
    nextTick(() => {
      scrollToBottom()
    })
  }, (error) => {
    console.error('Error listening to messages:', error);
    chatMessages.value = [];
  })
})

// Cleanup
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
/* Chat Section - Integrated with MatchLobby design */
.chat-section {
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  text-align: center;
  color: #f97316 !important;
  font-weight: 600;
  margin: 0.75rem 0;
  font-size: 1rem;
}

.chat-messages {
  height: 120px; /* Reduced height for better integration */
  overflow-y: auto;
  padding: 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.no-messages {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 1rem 0;
}

.no-messages p {
  margin: 0;
  font-size: 0.875rem;
}

.chat-message {
  margin-bottom: 0.375rem;
  font-size: 0.8rem;
  line-height: 1.4;
}

.message-time {
  color: #9ca3af;
  font-size: 0.7rem;
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

.chat-input {
  display: flex;
  padding: 0.75rem;
  background: white;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
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
  padding: 0.5rem 1rem;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.875rem;
  min-width: 60px;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .chat-messages {
    height: 100px;
  }
  
  .section-title {
    font-size: 0.875rem;
    margin: 0.5rem 0;
  }
  
  .chat-input {
    padding: 0.5rem;
  }
  
  .message-input {
    font-size: 0.8rem;
  }
  
  .send-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    min-width: 50px;
  }
}

@media (max-width: 480px) {
  .chat-messages {
    height: 80px;
  }
  
  .chat-message {
    font-size: 0.75rem;
  }
  
  .message-time {
    font-size: 0.65rem;
  }
}
</style> 