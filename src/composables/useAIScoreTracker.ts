import { ref, watchEffect } from 'vue'

// --- State ---
// By defining the state outside the function, it becomes a singleton.
// It's created only once, and the same instance is shared across all components.
const score = ref({
  wins: 0,
  losses: 0,
  draws: 0,
})

// --- Logic ---
// Load the score from localStorage as soon as the app starts.
const savedScore = localStorage.getItem('ai-score')
if (savedScore) {
  score.value = JSON.parse(savedScore)
}

// Automatically save the score to localStorage whenever it changes.
watchEffect(() => {
  localStorage.setItem('ai-score', JSON.stringify(score.value))
})

// --- Composable Function ---
export function useAIScoreTracker() {
  const updateScore = (result: 'win' | 'loss' | 'draw') => {
    if (result === 'win') score.value.wins++
    if (result === 'loss') score.value.losses++
    if (result === 'draw') score.value.draws++
  }

  return {
    score,
    updateScore,
  }
} 