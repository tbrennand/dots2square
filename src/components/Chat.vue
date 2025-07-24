<template>
  <div class="chat-section">
    <h3 class="section-title">Chat</h3>
    <div class="chat-messages" ref="chatMessages">
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
      />
      <button @click="sendMessage" :disabled="!newMessage.trim()" class="send-btn">
        Send
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
let unsubscribe: Unsubscribe | null = null

// Computed sorted messages (oldest to newest)
const sortedMessages = computed(() => {
  return [...chatMessages.value].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
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
  if (!newMessage.value.trim()) return
  
  const message = {
    author: props.currentPlayerName,
    text: newMessage.value.trim(),
    timestamp: serverTimestamp()
  }
  
  try {
    const messagesRef = collection(db, `matches/${props.matchId}/messages`)
    await addDoc(messagesRef, message)
    newMessage.value = ''
    
    // Scroll to bottom
    nextTick(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      }
    })
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

// Subscribe to messages
onMounted(() => {
  const messagesRef = collection(db, `matches/${props.matchId}/messages`)
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'))
  
  unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    chatMessages.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }) as ChatMessage)
    
    // Scroll to bottom
    nextTick(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      }
    })
  }, (error) => {
    console.error('Error listening to messages:', error)
  })
})

// Cleanup
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
/* Reuse styles from MatchLobby.vue chat section */
.chat-section {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.chat-messages {
  height: 200px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8fafc;
}

.chat-message {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
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
}

.chat-input {
  display: flex;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.message-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  margin-right: 0.5rem;
}

.send-btn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 