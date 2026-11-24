import { create } from 'zustand'
import { conversationApi } from '../services/conversationApi.js'
import { useAuthStore } from './authStore.js'
import { readJson, userKey, writeJson } from '../lib/storage.js'

const initial = { chats: [], activeId: null, messages: {}, loaded: false }
const now = () => new Date().toISOString()
const titleOf = (text) => (text.length > 60 ? text.slice(0, 57).trimEnd() + '…' : text)
const activeKey = () => userKey(useAuthStore.getState().user?.id, 'activeConversation')
const rememberActive = (id) => { if (useAuthStore.getState().user) writeJson(activeKey(), id) }

// In-flight and failed messages never reach storage.
const persistable = (ms) => ms.filter((m) => !m.pending && !m.error)

export const useConversationStore = create((set, get) => ({
  ...initial,

  /** Loads the chat list and restores the previously active chat (survives reload). */
  async loadChats() {
    const chats = await conversationApi.list()
    const saved = readJson(activeKey(), null)
    const activeId = saved ?? chats[0]?.id ?? null
    set({ chats, activeId, loaded: true })
    if (activeId) await get().selectChat(activeId)
  },

  /** Mints the id client-side. Not listed until its first message is sent. */
  newChat() {
    const id = crypto.randomUUID()
    set((s) => ({ activeId: id, messages: { ...s.messages, [id]: [] } }))
    rememberActive(id)
    return id
  },

  async selectChat(id) {
    set({ activeId: id })
    rememberActive(id)
    if (!get().messages[id]) {
      const ms = await conversationApi.getMessages(id)
      set((s) => (s.messages[id] ? s : { messages: { ...s.messages, [id]: ms } }))
    }
  },

  async deleteChat(id) {
    await conversationApi.remove(id)
    set((s) => {
      const { [id]: _gone, ...messages } = s.messages
      return { chats: s.chats.filter((c) => c.id !== id), messages }
    })
    if (get().activeId === id) {
      const next = get().chats[0]
      if (next) await get().selectChat(next.id)
      else get().newChat()
    }
  },

  /** Adds a message and persists the transcript (unless it is a pending placeholder). */
  appendMessage(convId, msg) {
    const full = { id: crypto.randomUUID(), createdAt: now(), ...msg }
    set((s) => ({ messages: { ...s.messages, [convId]: [...(s.messages[convId] || []), full] } }))
    if (!full.pending) get().persist(convId)
    return full
  },

  /** Patches the last message in memory only (used for every streamed token). */
  patchLast(convId, patch) {
    set((s) => {
      const ms = s.messages[convId] || []
      return { messages: { ...s.messages, [convId]: ms.map((m, i) => (i === ms.length - 1 ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)) } }
    })
  },

  dropLast(convId, n) {
    set((s) => ({ messages: { ...s.messages, [convId]: (s.messages[convId] || []).slice(0, -n) } }))
  },

  /** Writes the transcript + conversation list entry to the cache. */
  async persist(convId) {
    const ms = persistable(get().messages[convId] || [])
    if (ms.length === 0) return
    const existing = get().chats.find((c) => c.id === convId)
    const firstUser = ms.find((m) => m.messageType === 'USER')
    const conv = {
      id: convId,
      title: existing?.title || titleOf(firstUser?.content || 'New chat'),
      createdAt: existing?.createdAt || ms[0].createdAt,
      updatedAt: now(),
    }
    await conversationApi.saveMessages(convId, ms)
    await conversationApi.saveConversation(conv)
    set((s) => ({ chats: [conv, ...s.chats.filter((c) => c.id !== convId)] }))
  },

  /** Renames a chat; an empty title keeps the old one. */
  async renameChat(id, title) {
    const t = title.trim()
    const chat = get().chats.find((c) => c.id === id)
    if (!chat || !t || t === chat.title) return
    const conv = { ...chat, title: t.slice(0, 80) }
    await conversationApi.saveConversation(conv)
    set((s) => ({ chats: s.chats.map((c) => (c.id === id ? conv : c)) }))
  },

  /** If the server answers with a different id than the one we minted, follow the server. */
  async rekey(oldId, newId) {
    if (!newId || newId === oldId) return
    const ms = get().messages[oldId] || []
    set((s) => {
      const { [oldId]: _old, ...rest } = s.messages
      return { messages: { ...rest, [newId]: ms }, activeId: s.activeId === oldId ? newId : s.activeId, chats: s.chats.filter((c) => c.id !== oldId) }
    })
    await conversationApi.remove(oldId)
    rememberActive(newId)
    await get().persist(newId)
  },

  reset: () => set({ ...initial }),
}))

useAuthStore.subscribe((s, prev) => { if (prev.token && !s.token) useConversationStore.getState().reset() })
