import { defineStore } from 'pinia'

interface User {
  uid: string;
  name?: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isAuthenticated: false,
  }),
  actions: {
    // User actions will go here
  },
}) 