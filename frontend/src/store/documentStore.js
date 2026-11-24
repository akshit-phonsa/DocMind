import { create } from 'zustand'
import { documentApi } from '../lib/api.js'
import { useAuthStore } from './authStore.js'

const initial = { docs: [], loading: true, error: '', scopeId: null }

export const useDocumentStore = create((set, get) => ({
  ...initial,

  /** Loads the current user's own documents (GET /documents/user). */
  async refresh() {
    try {
      const docs = (await documentApi.getMine()) || []
      set({ docs, error: '', loading: false })
    } catch (e) {
      set({ error: e.message, loading: false })
    }
  },

  setScope: (scopeId) => set({ scopeId }),
  reset: () => set({ ...initial }),
}))

// Drop everything when the session ends (logout or 401).
useAuthStore.subscribe((s, prev) => { if (prev.token && !s.token) useDocumentStore.getState().reset() })
