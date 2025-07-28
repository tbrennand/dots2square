import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/HomeScreen.vue'),
  },
  {
    path: '/create-game', // Renamed from /create
    name: 'GameCreation',
    component: () => import('../components/GameCreation.vue'),
  },
  {
    path: '/create-ai-game', // New route for AI game setup
    name: 'AIGameCreation',
    component: () => import('../components/AIGameCreation.vue'),
  },
  {
    path: '/lobby/:id',
    name: 'MatchLobby',
    component: () => import('../components/MatchLobby.vue'),
  },
  {
    path: '/invite/:id',
    name: 'GameInvite',
    component: () => import('../components/GameInvite.vue'),
  },
  {
    path: '/game',
    name: 'GameBoard',
    component: () => import('../views/GameBoard.vue'),
  },
  {
    path: '/match/:id',
    name: 'MatchGame',
    component: () => import('../views/GameBoard.vue'),
    props: () => ({ mode: 'multiplayer' }) // Add a mode prop
  },
  {
    path: '/result',
    name: 'GameResult',
    component: () => import('../views/GameResult.vue'),
  },
  {
    path: '/emulator-test',
    name: 'EmulatorTest',
    component: () => import('../components/EmulatorTest.vue'),
  },
  {
    path: '/ai-game',
    name: 'AIGame',
    component: () => import('../views/GameBoard.vue'), // Use the main game board
    props: (route: RouteLocationNormalized) => ({
      mode: 'ai', // Add a mode prop
      playerName: route.query.playerName,
      gridSize: Number(route.query.gridSize)
    })
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router 