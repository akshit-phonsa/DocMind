import { useEffect, useMemo, useRef, useState } from 'react'
import Message from './Message.jsx'
import { Download, RotateCcw, Send, Zap, Square } from 'lucide-react'
import BrandMark from './BrandMark.jsx'
import { askQuestion, streamQuestion } from '../lib/api.js'
import { TEMPLATES } from '../lib/utils.js'
import { useAuthStore } from '../store/authStore.js'
import { useConversationStore } from '../store/conversationStore.js'
import { selectStream, usePrefsStore } from '../store/prefsStore.js'

// Stored DTO shape -> the shape Message.jsx renders.
// Cached per stored message so unchanged messages keep a stable identity and Message's memo can skip them.
const views = new WeakMap()
const toView = (m) => {
  let v = views.get(m)
  if (!v) { v = { ...m, role: m.messageType === 'USER' ? 'user' : 'assistant', at: m.createdAt }; views.set(m, v) }
  return v
}

export default function Chat({ scopeDoc, hasDocs }) {
  const userId = useAuthStore((s) => s.user?.id)
  const stream = usePrefsStore(selectStream(userId))
  const setStreamPref = usePrefsStore((s) => s.setStream)
  const setStream = (on) => setStreamPref(userId, on)
  const { newChat, appendMessage, patchLast, dropLast, persist, rekey } = useConversationStore.getState()
  const stored = useConversationStore((s) => (s.activeId ? s.messages[s.activeId] : undefined))
  const messages = useMemo(() => (stored || []).map(toView), [stored])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const abort = useRef(null)
  const bottom = useRef(null)
  const area = useRef(null)

  // Switching chats cancels any in-flight stream; it finishes writing to its own chat.
  const current = useConversationStore((s) => s.activeId)
  // Only abort when leaving the chat being streamed; creating the chat for the first message also changes `current`.
  const streamingId = useRef(null)
  useEffect(() => () => {
    if (streamingId.current && streamingId.current !== current) abort.current?.abort()
  }, [current])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    const el = area.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px' }
  }, [input])

  const send = async (text = input, { replace = false } = {}) => {
    const question = text.trim()
    if (!question || busy) return
    setInput('')
    setBusy(true)
    // The id is minted before the first message and sent on every request (stream or not).
    let convId = useConversationStore.getState().activeId ?? newChat()
    if (replace) dropLast(convId, 2)
    appendMessage(convId, { messageType: 'USER', content: question })
    appendMessage(convId, { messageType: 'ASSISTANT', content: '', pending: true })
    // Only the question + id (+ scope) go over the wire; the backend memory advisor owns history.
    const body = { question, documentId: scopeDoc?.id ?? null, conversationId: convId }
    const started = Date.now()
    try {
      if (stream) {
        abort.current = new AbortController()
        streamingId.current = convId
        await streamQuestion(
          body,
          (t) => patchLast(convId, (m) => ({ content: m.content + t })),
          abort.current.signal,
          (citations) => patchLast(convId, { citations }),
        )
        patchLast(convId, { pending: false, responseTimeMs: Date.now() - started })
        persist(convId)
      } else {
        const r = await askQuestion(body)
        patchLast(convId, { content: r.answer, citations: r.citations, responseTimeMs: r.responseTimeMs, pending: false })
        if (r.conversationId && r.conversationId !== convId) { await rekey(convId, r.conversationId); convId = r.conversationId }
        else persist(convId)
      }
    } catch (e) {
      if (e.name === 'AbortError') { patchLast(convId, { pending: false }); persist(convId) }
      else patchLast(convId, (m) => ({ pending: false, error: !m.content, content: m.content || e.message }))
    } finally {
      setBusy(false)
      abort.current = null
      streamingId.current = null
    }
  }

  const exportChat = () => {
    const md = messages.map((m) => `**${m.role === 'user' ? 'You' : 'DocMind'}:** ${m.content}`).join('\n\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }))
    a.download = 'docmind-chat.md'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const clear = () => { abort.current?.abort(); newChat() }
  const ctx = scopeDoc?.fileName || 'All Uploaded Documents'

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 text-sm sm:px-5 dark:border-white/5 dark:bg-ink-900/50">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="hidden text-slate-600 sm:inline dark:text-slate-400">Context:</span>
          <span className="truncate font-semibold">{ctx}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-slate-600 sm:gap-4 dark:text-slate-400">
          <label className="flex cursor-pointer items-center gap-2">
            <button
              role="switch"
              aria-checked={stream}
              aria-label="Stream tokens"
              onClick={() => setStream(!stream)}
              className={`relative h-5 w-9 rounded-full transition ${stream ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/20'}`}
            >
              <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${stream ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
            <span className="hidden sm:inline">Stream Tokens</span>
          </label>
          {messages.length > 0 && (
            <>
              <button onClick={exportChat} aria-label="Export chat" className="flex items-center gap-1 rounded hover:text-blue-500"><Download size={14} /><span className="hidden sm:inline">Export</span></button>
              <button onClick={clear} aria-label="Clear chat and start a new one" className="flex items-center gap-1 rounded hover:text-blue-500"><RotateCcw size={14} /><span className="hidden sm:inline">Clear</span></button>
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 pb-10 text-center sm:px-6">
            <BrandMark size={64} className="mb-6 !rounded-2xl" />
            <h2 className="text-2xl font-bold sm:text-3xl">DocMind AI Document Assistant</h2>
            <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
              Upload PDF reports, Word files, or notes and chat naturally with grounded facts, source citations, and page numbers.
            </p>
            <div className="mt-10 grid w-full gap-3.5 sm:grid-cols-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  disabled={!hasDocs || busy}
                  onClick={() => send(t.prompt)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-500/50 hover:bg-blue-500/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/5 dark:bg-ink-850"
                >
                  <div className="font-semibold text-blue-500">{t.icon} {t.title}</div>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{t.desc}</p>
                </button>
              ))}
            </div>
            {!hasDocs && <p className="mt-4 text-sm text-amber-500">Upload a document to get started.</p>}
          </div>
        ) : (
          <div role="log" aria-live="off" aria-label="Conversation" className="mx-auto max-w-4xl space-y-6 px-3 py-6 sm:px-6 sm:py-8">
            {messages.map((m, i) => (
              <Message
                key={m.id ?? i}
                m={m}
                busy={busy}
                isLast={i === messages.length - 1}
                onFollowUp={(t) => send(t)}
                onRegenerate={() => send(messages[i - 1].content, { replace: true })}
              />
            ))}
            <div ref={bottom} />
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 pb-4 pt-2 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded-3xl border border-slate-300 bg-white px-4 py-2 focus-within:border-blue-500 sm:px-5 sm:py-3 dark:border-white/15 dark:bg-ink-950">
            <textarea
              ref={area}
              rows={1}
              aria-label="Message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
              placeholder={`Ask a question ${scopeDoc ? 'about this document' : 'across all documents'}...`}
              className="max-h-40 flex-1 resize-none bg-transparent py-1.5 outline-none placeholder:text-slate-400"
            />
            {busy && stream ? (
              <button onClick={() => abort.current?.abort()} aria-label="Stop" className="flex size-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200"><Square size={14} fill="currentColor" /></button>
            ) : (
              <button
                onClick={() => send()}
                disabled={!input.trim() || busy}
                aria-label="Send"
                className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition enabled:hover:bg-blue-600 enabled:hover:text-white disabled:opacity-50 dark:bg-white/10 dark:text-slate-300"
              >
                <Send size={17} />
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between px-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="hidden sm:inline">
              Press <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 font-mono dark:border-white/10 dark:bg-white/5">Enter</kbd> to send,{' '}
              <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 font-mono dark:border-white/10 dark:bg-white/5">Shift+Enter</kbd> for newline
            </span>
            <span className="flex items-center gap-1 font-medium text-blue-500"><Zap size={13} />Grounded RAG</span>
          </div>
        </div>
      </div>
    </main>
  )
}
