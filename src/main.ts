import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/tailwind.css'

console.log('Main.ts: Starting Vue app initialization')

try {
  const app = createApp(App)
  console.log('Main.ts: Vue app created')
  
  app.use(createPinia())
  console.log('Main.ts: Pinia added')
  
  app.use(router)
  console.log('Main.ts: Router added')
  
  app.mount('#app')
  console.log('Main.ts: App mounted successfully')
} catch (error) {
  console.error('Main.ts: Error during app initialization:', error)
} 