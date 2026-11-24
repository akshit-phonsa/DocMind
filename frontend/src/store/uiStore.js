import { create } from 'zustand'

export const useUiStore = create((set) => ({
  sidebarTab: 'documents', // 'documents' | 'chats'
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  sidebarOpen: false, // off-canvas drawer, only meaningful below the md breakpoint
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
