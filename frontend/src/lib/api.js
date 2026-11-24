import axios from 'axios'
import { useAuthStore } from '../store/authStore.js'
import { authFetch } from './authFetch.js'
import { handleUnauthorized } from './session.js'
import { errMsg } from './utils.js'

const http = axios.create({ baseURL: '/api/v1' })

// Outside the React tree, so read the token straight from the store.
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) handleUnauthorized()
    return Promise.reject(err)
  },
)

// Backend wraps everything in { success, message, data, timestamp }
const unwrap = (res) => res.data?.data

async function call(p) {
  try {
    return unwrap(await p)
  } catch (e) {
    throw new Error(errMsg(e))
  }
}

// GET /documents is ADMIN-only (403 for normal users); the normal list is GET /documents/user.
export const listDocuments = () => call(http.get('/documents'))
export const listMyDocuments = () => call(http.get('/documents/user'))
export const getDocument = (id) => call(http.get(`/documents/${id}`))
export const getDocumentChunks = (id) => call(http.get(`/documents/${id}/chunks`))
export const deleteDocument = (id) => call(http.delete(`/documents/${id}`))

export const uploadDocument = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return call(
    http.post('/documents/upload', form, {
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    }),
  )
}

export const documentApi = {
  getMine: listMyDocuments,
  getAll: listDocuments, // reserved for a future admin-gated view (user.role === 'ADMIN')
}

export const askQuestion = (body) => call(http.post('/chat/query', body))
export const searchChunks = (body) => call(http.post('/chat/search/similarity', body))

/**
 * Streams answer tokens. Handles both raw chunked text and SSE "data:" framing.
 * SSE events: unnamed = token, `citations` = JSON array of sources (sent first), `done` = end of stream.
 */
export async function streamQuestion(body, onToken, signal, onCitations) {
  const res = await authFetch('/api/v1/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, text/plain' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try { msg = (await res.json()).message || msg } catch { /* ignore */ }
    if (res.status === 401) msg = 'Session expired. Please sign in again.'
    throw new Error(msg)
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  const sse = (res.headers.get('content-type') || '').includes('event-stream')
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = dec.decode(value, { stream: true })
    if (!sse) { onToken(chunk); continue }
    buf += chunk
    const events = buf.replace(/\r\n/g, '\n').split('\n\n')
    buf = events.pop()
    for (const ev of events) {
      const lines = ev.split('\n')
      const name = lines.find((l) => l.startsWith('event:'))?.slice(6).trim()
      if (name === 'done') { await reader.cancel().catch(() => {}); return }
      const data = lines.filter((l) => l.startsWith('data:')).map((l) => l.slice(5)).join('\n')
      if (name === 'citations') {
        try { onCitations?.(JSON.parse(data)) } catch { /* sources are optional; ignore malformed */ }
      } else if (data) onToken(data)
    }
  }
  if (sse && buf.startsWith('data:')) onToken(buf.slice(5))
}
