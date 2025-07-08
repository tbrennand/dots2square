<template>
  <div class="leaderboard-example">
    <h3 class="text-lg font-semibold mb-4">Leaderboard Example</h3>
    
    <!-- Controls -->
    <div class="controls mb-6 p-4 bg-gray-50 rounded-lg">
      <h4 class="font-medium mb-3">Controls</h4>
      <div class="flex flex-wrap gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Current User ID
          </label>
          <input
            v-model="currentUserId"
            type="text"
            placeholder="Enter user ID"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Limit
          </label>
          <select
            v-model="limit"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="20">Top 20</option>
          </select>
        </div>
        
        <div class="flex items-end">
          <button
            @click="refreshData"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <Leaderboard
      :current-user-id="currentUserId || undefined"
      :limit="limit"
    />

    <!-- Debug Info -->
    <div class="debug-info mt-6 p-4 bg-gray-100 rounded-lg">
      <h4 class="font-medium mb-2">Debug Information</h4>
      <div class="text-sm space-y-1">
        <p><strong>Current User ID:</strong> {{ currentUserId || 'None' }}</p>
        <p><strong>Limit:</strong> {{ limit }}</p>
        <p><strong>Component Key:</strong> {{ componentKey }}</p>
      </div>
    </div>

    <!-- Test Scenarios -->
    <div class="test-scenarios mt-6">
      <h4 class="font-medium mb-3">Test Scenarios</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          @click="setScenario('top-player')"
          class="p-3 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition-colors text-left"
        >
          <div class="font-medium text-green-800">Top Player</div>
          <div class="text-sm text-green-600">Set current user as #1 player</div>
        </button>
        
        <button
          @click="setScenario('mid-player')"
          class="p-3 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors text-left"
        >
          <div class="font-medium text-blue-800">Mid Player</div>
          <div class="text-sm text-blue-600">Set current user as #5 player</div>
        </button>
        
        <button
          @click="setScenario('bottom-player')"
          class="p-3 bg-orange-100 border border-orange-300 rounded-lg hover:bg-orange-200 transition-colors text-left"
        >
          <div class="font-medium text-orange-800">Bottom Player</div>
          <div class="text-sm text-orange-600">Set current user as #15 player</div>
        </button>
        
        <button
          @click="setScenario('no-user')"
          class="p-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-left"
        >
          <div class="font-medium text-gray-800">No Current User</div>
          <div class="text-sm text-gray-600">Clear current user ID</div>
        </button>
      </div>
    </div>

    <!-- Mock Data Info -->
    <div class="mock-data-info mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 class="font-medium mb-2 text-yellow-800">Mock Data Information</h4>
      <p class="text-sm text-yellow-700 mb-2">
        This example uses mock data. In a real application, the leaderboard would be populated from Firebase.
      </p>
      <div class="text-xs text-yellow-600">
        <p><strong>Note:</strong> The leaderboard component will show loading states and error handling when Firebase is not available.</p>
        <p><strong>Integration:</strong> Connect to real Firebase data by providing actual user IDs and Firebase configuration.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Leaderboard from './Leaderboard.vue'

// State
const currentUserId = ref('user1')
const limit = ref(10)
const componentKey = ref(0)

// Methods
const refreshData = () => {
  // Force component re-render by changing key
  componentKey.value++
}

const setScenario = (scenario: string) => {
  switch (scenario) {
    case 'top-player':
      currentUserId.value = 'user1'
      break
    case 'mid-player':
      currentUserId.value = 'user5'
      break
    case 'bottom-player':
      currentUserId.value = 'user15'
      break
    case 'no-user':
      currentUserId.value = ''
      break
  }
  
  // Refresh to show changes
  refreshData()
}
</script>

<style scoped>
.leaderboard-example {
  @apply max-w-4xl mx-auto p-6;
}

.controls input,
.controls select {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.test-scenarios button {
  @apply transition-all duration-200;
}

.test-scenarios button:hover {
  @apply transform scale-105;
}
</style> 