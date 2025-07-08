import { defineStore } from 'pinia'

export const useMatchStore = defineStore('match', {
  state: () => ({
    matchId: null,
    players: [],
    status: 'waiting',
  }),
  actions: {
    // Match actions will go here
  },
}) 