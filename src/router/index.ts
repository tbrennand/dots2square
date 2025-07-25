import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/HomeScreen.vue'),
  },
  {
    path: '/create',
    name: 'GameCreation',
    component: () => import('../components/GameCreation.vue'),
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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router 