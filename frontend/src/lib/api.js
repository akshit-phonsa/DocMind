import axios from 'axios'

const http = axios.create({ baseURL: '/api/v1' })

// Backend wraps everything in { success, message, data, timestamp }
const unwrap = (res) => res.data?.data
const errMsg = (e) =>
  e.response?.data?.message || e.response?.data?.error || e.message || 'Request failed'

async function call(p) {
  try {
    return unwrap(await p)
  } catch (e) {
    throw new Error(errMsg(e))
  }
}

export const listDocuments = () => call(http.get('/documents'))
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

export const askQuestion = (body) => call(http.post('/chat/query', body))
export const searchChunks = (body) => call(http.post('/chat/search/similarity', body))

/**
 * Streams answer tokens. Handles both raw chunked text and SSE "data:" framing.
 */
export async function streamQuestion(body, onToken, signal) {
  const res = await fetch('/api/v1/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, text/plain' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try { msg = (await res.json()).message || msg } catch { /* ignore */ }
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
      const data = ev.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5)).join('\n')
      if (data) onToken(data)
    }
  }
  if (sse && buf.startsWith('data:')) onToken(buf.slice(5))
}
