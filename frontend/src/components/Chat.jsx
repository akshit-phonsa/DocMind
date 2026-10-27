import { useEffect, useRef, useState } from 'react'
import Message from './Message.jsx'
import { Download, RotateCcw, Send, Sparkles, Zap, Square } from 'lucide-react'
import { askQuestion, streamQuestion } from '../lib/api.js'
import { TEMPLATES } from '../lib/utils.js'

export default function Chat({ scopeDoc, hasDocs }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [stream, setStream] = useState(true)
  const [busy, setBusy] = useState(false)
  const convId = useRef(null)
  const abort = useRef(null)
  const bottom = useRef(null)
  const area = useRef(null)

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    const el = area.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px' }
  }, [input])

  const patchLast = (fn) => setMessages((ms) => ms.map((m, i) => (i === ms.length - 1 ? { ...m, ...fn(m) } : m)))

  const send = async (text = input, { replace = false } = {}) => {
    const question = text.trim()
    if (!question || busy) return
    setInput('')
    setBusy(true)
    setMessages((ms) => [...(replace ? ms.slice(0, -2) : ms), { role: 'user', content: question, at: Date.now() }, { role: 'assistant', content: '', pending: true, at: Date.now() }])
    const body = { question, documentId: scopeDoc?.id ?? null, conversationId: convId.current }
    const started = Date.now()
    try {
      if (stream) {
        abort.current = new AbortController()
        await streamQuestion(body, (t) => patchLast((m) => ({ content: m.content + t })), abort.current.signal)
        patchLast(() => ({ pending: false, responseTimeMs: Date.now() - started }))
      } else {
        const r = await askQuestion(body)
        convId.current = r.conversationId || convId.current
        patchLast(() => ({ content: r.answer, citations: r.citations, responseTimeMs: r.responseTimeMs, pending: false }))
      }
    } catch (e) {
      if (e.name === 'AbortError') patchLast(() => ({ pending: false }))
      else patchLast((m) => ({ pending: false, error: !m.content, content: m.content || e.message }))
    } finally {
      setBusy(false)
      abort.current = null
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

  const clear = () => { abort.current?.abort(); setMessages([]); convId.current = null }
  const ctx = scopeDoc?.fileName || 'All Uploaded Documents'

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 px-5 text-sm dark:border-white/5 dark:bg-ink-900/50">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="text-slate-500 dark:text-slate-400">Context:</span>
          <span className="truncate font-semibold">{ctx}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
          <label className="flex cursor-pointer items-center gap-2">
            <button
              role="switch"
              aria-checked={stream}
              onClick={() => setStream(!stream)}
              className={`relative h-5 w-9 rounded-full transition ${stream ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/20'}`}
            >
              <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${stream ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
            Stream Tokens
          </label>
          {messages.length > 0 && (
            <>
              <button onClick={exportChat} className="flex items-center gap-1 hover:text-blue-500"><Download size={14} />Export</button>
              <button onClick={clear} className="flex items-center gap-1 hover:text-blue-500"><RotateCcw size={14} />Clear</button>
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 pb-10 text-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30"><Sparkles size={30} /></div>
            <h2 className="text-3xl font-bold">DocMind AI Document Assistant</h2>
            <p className="mt-3 max-w-xl text-slate-500 dark:text-slate-400">
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
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{t.desc}</p>
                </button>
              ))}
            </div>
            {!hasDocs && <p className="mt-4 text-sm text-amber-500">Upload a document to get started.</p>}
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
            {messages.map((m, i) => (
              <Message
                key={i}
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

      <div className="shrink-0 px-6 pb-4 pt-2">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded-3xl border border-slate-300 bg-white px-5 py-3 focus-within:border-blue-500 dark:border-white/15 dark:bg-ink-950">
            <textarea
              ref={area}
              rows={1}
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
          <div className="mt-2 flex items-center justify-between px-2 text-xs text-slate-500">
            <span>
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
