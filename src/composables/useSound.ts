import { ref } from 'vue'

const isMuted = ref(false)
const sounds: Record<string, HTMLAudioElement> = {}

export function useSound() {
  const loadSound = (name: string, path: string) => {
    if (!sounds[name]) {
      sounds[name] = new Audio(path)
    }
  }

  const playSound = (name: string) => {
    if (!isMuted.value && sounds[name]) {
      sounds[name].currentTime = 0
      sounds[name].play().catch(e => console.error(`Error playing sound ${name}:`, e))
    }
  }

  const toggleMute = () => {
    isMuted.value = !isMuted.value
  }

  // Preload common sounds
  loadSound('countdown', '/sounds/countdown.mp3')

  return {
    isMuted,
    loadSound,
    playSound,
    toggleMute,
  }
} 