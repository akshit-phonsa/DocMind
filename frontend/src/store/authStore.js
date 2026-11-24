import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/authApi.js'
import { clearUserData } from '../lib/storage.js'

/** Reads the `exp` claim; a token we can't parse is treated as valid (server decides). */
export function isTokenExpired(token) {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof exp === 'number' && exp * 1000 <= Date.now()
  } catch {
    return false
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      /** @type {import('../types').UserDto | null} */
      user: null,
      /** @type {string | null} */
      token: null,
      isLoading: false,

      async login(username, password) {
        set({ isLoading: true })
        try {
          const { accessToken, user } = await authApi.login(username, password)
          set({ user, token: accessToken })
        } finally {
          set({ isLoading: false })
        }
      },

      // Register does not log in; the caller sends the user to /login afterwards.
      async register(username, email, password) {
        set({ isLoading: true })
        try {
          return await authApi.register(username, email, password)
        } finally {
          set({ isLoading: false })
        }
      },

      logout() {
        // Wipe this user's namespaced chat/document cache first; conversationStore and
        // documentStore subscribe to the token going null and reset their memory state.
        clearUserData(get().user?.id)
        set({ user: null, token: null })
      },
    }),
    {
      name: 'docmind-auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
)

/** True when there is a usable (present, unexpired) session. */
export const hasSession = (s) => !!s.token && !!s.user && !isTokenExpired(s.token)
