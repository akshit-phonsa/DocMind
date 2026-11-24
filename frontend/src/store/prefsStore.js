import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Small per-user preference store. Intentionally NOT cleared on logout (it holds no
// chat or document data), so a user's last-picked stream/normal mode survives re-login.
export const usePrefsStore = create(
  persist(
    (set) => ({
      streamByUser: {}, // { [userId]: boolean }
      setStream: (userId, on) => set((s) => ({ streamByUser: { ...s.streamByUser, [userId]: on } })),
    }),
    { name: 'docmind-prefs' },
  ),
)

export const selectStream = (userId) => (s) => s.streamByUser[userId] ?? true
