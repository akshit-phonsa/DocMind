// TODO(backend): replace with real endpoint. The backend has no endpoints to list chats,
// load a chat's history or delete a chat yet, so list/getMessages/remove are backed by a
// localStorage cache namespaced per user. Swapping in real endpoints = rewriting this file
// (the save* helpers disappear because the server will persist on /chat/query).
import { userKey, readJson, writeJson } from '../lib/storage.js'
import { useAuthStore } from '../store/authStore.js'

const uid = () => useAuthStore.getState().user?.id
const convKey = (u) => userKey(u, 'conversations')
const msgKey = (u, id) => userKey(u, `messages:${id}`)

export const conversationApi = {
  /** @returns {Promise<import('../types').ConversationDto[]>} newest first */
  async list() {
    const u = uid()
    if (u == null) return []
    return readJson(convKey(u), []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  /** @returns {Promise<import('../types').MessageDto[]>} */
  async getMessages(id) {
    const u = uid()
    return u == null ? [] : readJson(msgKey(u, id), [])
  },

  async remove(id) {
    const u = uid()
    if (u == null) return
    writeJson(convKey(u), readJson(convKey(u), []).filter((c) => c.id !== id))
    localStorage.removeItem(msgKey(u, id))
  },

  // --- cache writers (local-only; the real backend would do this server-side) ---
  async saveConversation(conv) {
    const u = uid()
    if (u == null) return
    const all = readJson(convKey(u), []).filter((c) => c.id !== conv.id)
    writeJson(convKey(u), [conv, ...all])
  },

  async saveMessages(id, messages) {
    const u = uid()
    if (u != null) writeJson(msgKey(u, id), messages)
  },
}
