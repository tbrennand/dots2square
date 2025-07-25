# MatchLobby Component Enhancement

## Overview

The `MatchLobby.vue` component has been significantly enhanced to provide a comprehensive, modern lobby experience for multiplayer matches. It features responsive design, native sharing capabilities, real-time player status, and an intuitive user interface that works seamlessly across all devices.

## Features

### ✅ Enhanced Player Management
- **Player List**: Shows all joined players with color-coded avatars and status
- **Host Identification**: Crown icon for the match host
- **Current Player Highlighting**: Visual indication of the current user
- **Empty Slots**: Shows available slots for additional players
- **Player Kicking**: Host can kick players from the match
- **Color-coded Players**: Player 1 (blue) and Player 2 (orange) with consistent theming

### ✅ Ready System
- **Ready Status**: Players can mark themselves as ready/not ready
- **Color-coded Ready Indicators**: Each player shows in their respective color when ready
- **Start Game Logic**: Game can only start when all players are ready
- **Real-time Updates**: Status updates in real-time across all clients

### ✅ Native Sharing System
- **Native Share API**: Uses device's native share sheet on mobile devices
- **Platform-specific Buttons**: WhatsApp, Telegram, Email, SMS sharing options
- **Copy Link**: Enhanced copy functionality with visual feedback
- **Smart Detection**: Shows relevant sharing options based on device capabilities
- **Responsive Grid**: Platform buttons adapt to screen size

### ✅ Responsive Design
- **Desktop Optimized**: Expansive layout that uses screen real estate effectively
- **Tablet Friendly**: Balanced spacing and touch-friendly interface
- **Mobile Optimized**: Ultra-compact design for small screens
- **Viewport Height**: Content fits within screen height without scrolling
- **Progressive Enhancement**: Features scale appropriately across devices

### ✅ Enhanced UX
- **Orange Theme**: Consistent orange branding throughout
- **Visual Feedback**: Button animations and success messages
- **Loading States**: Spinner animations for async operations
- **Error Handling**: Clear error messages with emoji indicators
- **Accessibility**: Proper ARIA labels and keyboard navigation

### ✅ Chat System
- **Real-time Chat**: Live messaging between players
- **Orange Styling**: Chat title styled in orange theme
- **Compact Design**: Optimized chat height for different screen sizes
- **Message History**: Scrollable chat with timestamps
- **Auto-scroll**: Chat automatically scrolls to new messages

### ✅ Firebase Integration
- **Real-time Presence**: Shows if players are online/offline
- **Ready Status Sync**: Tracks player readiness in Firebase
- **Match State Management**: Real-time match status updates
- **Presence Indicators**: Visual indicators for player presence

## Component Structure

### Template Sections

```vue
<template>
  <div class="match-lobby">
    <!-- Header Section -->
    <div class="lobby-header-section">
      <img src="/src/assets/dots2squares-logo.png" alt="Dots2Squares Logo" class="lobby-logo" />
      <div class="lobby-header">
        <h2>{{ isHost ? 'Match Lobby' : 'Joining Match' }}</h2>
        <p class="subtitle">{{ getSubtitleText() }}</p>
      </div>
    </div>

    <!-- Match Info -->
    <div class="match-info-card">
      <div class="match-details">
        <div class="detail-row">
          <span class="label">Match ID</span>
          <span class="value">{{ matchId }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Grid Size</span>
          <span class="value">{{ gridSize }}x{{ gridSize }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status</span>
          <span class="value status" :class="getStatusClass()">{{ getStatusText() }}</span>
        </div>
      </div>
    </div>

    <!-- Players List -->
    <div class="players-section">
      <h3 class="section-title">Players ({{ joinedPlayers.length }}/{{ maxPlayers }})</h3>
      <div class="players-list">
        <!-- Player cards with color coding -->
      </div>
    </div>

    <!-- Ready Status -->
    <div class="ready-section" v-if="hasPlayer2 && matchData?.status === 'waiting'">
      <h3 class="section-title">Ready Status</h3>
      <div class="ready-indicators">
        <!-- Color-coded ready indicators -->
      </div>
    </div>

    <!-- Lobby Actions -->
    <div class="lobby-actions" v-if="hasPlayer2">
      <!-- Host/Player specific actions -->
    </div>

    <!-- Share Section -->
    <div class="share-section">
      <h3 class="section-title">🎮 Invite Friends to Play</h3>
      <div class="share-options">
        <button @click="nativeShare" class="share-btn primary">📤 Share Game</button>
        <button @click="copyMatchLink" class="share-btn secondary">📋 Copy Link</button>
      </div>
      <div class="platform-share-options" v-if="!nativeShareSupported">
        <!-- Platform-specific share buttons -->
      </div>
      <div class="match-url-display">
        <input :value="matchUrl" readonly class="url-input" />
      </div>
    </div>

    <!-- Chat System -->
    <Chat v-if="matchId" :matchId="matchId" :currentPlayerName="getPlayerName(getCurrentPlayerNumber())" />
  </div>
</template>
```

### Script Logic

```typescript
// Core imports
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '../stores/matchStore'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/index'
import Chat from './Chat.vue'

// State management
const matchId = ref('')
const isHost = ref(false)
const currentPlayerId = ref('')
const isStarting = ref(false)
const isUpdatingReady = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Native sharing support
const nativeShareSupported = ref('share' in navigator)

// Computed properties
const matchData = computed(() => matchStore.matchData)
const matchUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_PUBLIC_URL || 
    (import.meta.env.PROD ? 'https://dots2squarev2.vercel.app' : window.location.origin)
  return `${baseUrl}/invite/${matchId.value}`
})

// Sharing functions
const nativeShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Dots 2 Squares Game',
        text: 'Join my Dots 2 Squares game!',
        url: matchUrl.value
      })
      successMessage.value = '✅ Shared successfully!'
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        errorMessage.value = '❌ Failed to share'
      }
    }
  }
}

const copyMatchLink = async () => {
  try {
    await navigator.clipboard.writeText(matchUrl.value)
    successMessage.value = '✅ Match link copied to clipboard!'
    
    // Visual feedback
    const copyBtn = document.querySelector('.share-btn.primary') as HTMLElement
    if (copyBtn) {
      copyBtn.style.transform = 'scale(0.95)'
      copyBtn.style.background = '#059669'
      setTimeout(() => {
        copyBtn.style.transform = ''
        copyBtn.style.background = ''
      }, 200)
    }
  } catch (error) {
    errorMessage.value = '❌ Failed to copy link'
  }
}

// Platform-specific sharing
const shareViaWhatsApp = () => {
  const text = `Join my Dots 2 Squares game! ${matchUrl.value}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(whatsappUrl, '_blank')
}

const shareViaTelegram = () => {
  const text = `Join my Dots 2 Squares game! ${matchUrl.value}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(matchUrl.value)}&text=${encodeURIComponent('Join my Dots 2 Squares game!')}`
  window.open(telegramUrl, '_blank')
}

const shareViaEmail = () => {
  const subject = 'Join my Dots 2 Squares game!'
  const body = `Hey! I'm playing Dots 2 Squares and want you to join me!\n\nClick this link to join: ${matchUrl.value}\n\nSee you in the game!`
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoUrl, '_blank')
}

const shareViaSMS = () => {
  const text = `Join my Dots 2 Squares game! ${matchUrl.value}`
  const smsUrl = `sms:?body=${encodeURIComponent(text)}`
  window.open(smsUrl, '_blank')
}
```

## Styling & Responsive Design

### CSS Architecture

```css
/* Base container with viewport height constraint */
.match-lobby {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  max-height: 100vh;
  overflow-y: auto;
}

/* Color-coded player cards */
.player-card.player1 {
  border-left: 4px solid #3b82f6;
}

.player-card.player2 {
  border-left: 4px solid #f97316;
}

.player-avatar.player1-avatar {
  background: #3b82f6;
  color: white;
}

.player-avatar.player2-avatar {
  background: #f97316;
  color: white;
}

/* Orange theme throughout */
.start-btn {
  background: #f97316;
  color: white;
}

.chat-section .section-title {
  color: #f97316 !important;
}

/* Platform share buttons */
.platform-btn.whatsapp {
  background: #25d366;
  color: white;
}

.platform-btn.telegram {
  background: #0088cc;
  color: white;
}

.platform-btn.email {
  background: #ea4335;
  color: white;
}

.platform-btn.sms {
  background: #34a853;
  color: white;
}
```

### Responsive Breakpoints

```css
/* Desktop (default) */
.match-lobby {
  max-width: 1000px;
  padding: 1.5rem;
}

/* Tablet (≤768px) */
@media (max-width: 768px) {
  .match-lobby {
    padding: 0.75rem;
    margin: 0.25rem;
  }
  
  .players-list {
    flex-direction: column;
  }
  
  .platform-share-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile (≤480px) */
@media (max-width: 480px) {
  .match-lobby {
    padding: 0.5rem;
    margin: 0.125rem;
  }
  
  .platform-share-options {
    grid-template-columns: 1fr;
  }
  
  .chat-messages {
    height: 80px;
  }
}
```

## Key Features Implementation

### Native Sharing

The component implements a smart sharing system that:

1. **Detects native sharing support** using `'share' in navigator`
2. **Uses native share sheet** on supported devices (mobile)
3. **Falls back to platform buttons** on desktop/older devices
4. **Provides multiple sharing options**:
   - Native share (mobile)
   - Copy link (all devices)
   - WhatsApp (web/mobile)
   - Telegram (web/mobile)
   - Email (desktop/mobile)
   - SMS (mobile)

### Responsive Design

The lobby is designed to work optimally across all devices:

1. **Desktop**: Expansive layout with generous spacing
2. **Tablet**: Balanced design with touch-friendly elements
3. **Mobile**: Ultra-compact with optimized touch targets

### Real-time Updates

The component maintains real-time synchronization through:

1. **Firebase Firestore** for match state
2. **Vue 3 reactivity** for UI updates
3. **WebSocket-like behavior** via Firestore listeners
4. **Optimistic updates** for better UX

## Usage Examples

### Basic Usage

```vue
<template>
  <MatchLobby />
</template>

<script setup>
import MatchLobby from '@/components/MatchLobby.vue'
</script>
```

### With Custom Props

```vue
<template>
  <MatchLobby 
    :matchId="matchId"
    :isHost="isHost"
    @game-started="handleGameStart"
  />
</template>
```

## Testing

### Unit Tests

```typescript
import { mount } from '@vue/test-utils'
import MatchLobby from '@/components/MatchLobby.vue'

describe('MatchLobby', () => {
  it('displays match information correctly', () => {
    const wrapper = mount(MatchLobby, {
      props: {
        matchId: 'test-match-123'
      }
    })
    
    expect(wrapper.text()).toContain('test-match-123')
  })
  
  it('shows native share button on supported devices', () => {
    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      value: jest.fn(),
      writable: true
    })
    
    const wrapper = mount(MatchLobby)
    expect(wrapper.find('.share-btn.primary').text()).toContain('Share Game')
  })
})
```

### E2E Tests

```typescript
describe('Match Lobby E2E', () => {
  it('allows players to join and start game', () => {
    cy.visit('/lobby/test-match-123')
    cy.get('[data-testid="player-card"]').should('have.length', 1)
    cy.get('[data-testid="ready-btn"]').click()
    cy.get('[data-testid="start-btn"]').should('be.enabled')
  })
  
  it('shows sharing options', () => {
    cy.visit('/lobby/test-match-123')
    cy.get('[data-testid="share-btn"]').click()
    cy.get('[data-testid="copy-link-btn"]').should('be.visible')
  })
})
```

## Performance Considerations

1. **Lazy Loading**: Chat component loads only when needed
2. **Debounced Updates**: Firebase writes are debounced to prevent spam
3. **Optimistic UI**: Immediate UI updates with fallback on errors
4. **Memory Management**: Proper cleanup of Firebase listeners
5. **Bundle Size**: Tree-shaking for unused sharing features

## Browser Support

- **Modern Browsers**: Full native sharing support
- **Older Browsers**: Fallback to platform-specific buttons
- **Mobile Browsers**: Native share sheet integration
- **Desktop Browsers**: Copy link + platform web versions

## Future Enhancements

1. **QR Code Generation**: For easy mobile sharing
2. **Social Media Integration**: Direct posting to platforms
3. **Custom Share Messages**: User-defined invite messages
4. **Share Analytics**: Track sharing effectiveness
5. **Offline Support**: Cache lobby state for poor connections 