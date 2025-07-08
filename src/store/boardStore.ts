import { defineStore } from 'pinia'

export const useBoardStore = defineStore('board', {
  state: () => ({
    grid: [],
    lines: [],
    squares: [],
  }),
  actions: {
    // Board actions will go here
  },
}) 