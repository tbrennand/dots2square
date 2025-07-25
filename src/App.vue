<template>
  <div id="app">
    <div v-if="error" class="error-container">
      <h1>Something went wrong</h1>
      <p>{{ error }}</p>
      <button @click="reload" class="btn btn-primary">Reload Page</button>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted, onErrorCaptured } from 'vue'

console.log('App.vue: Component setup started')

const error = ref(null)

onMounted(() => {
  console.log('App.vue: Component mounted')
})

onErrorCaptured((err, instance, info) => {
  console.error('App.vue: Error captured:', err, instance, info)
  error.value = err.message
  return false // Prevent error from propagating
})

const reload = () => {
  window.location.reload()
}
</script>

<style>
#app {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.error-container h1 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.error-container p {
  color: #6b7280;
  margin-bottom: 2rem;
}
</style> 