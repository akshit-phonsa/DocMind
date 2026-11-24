import { memo, useState } from 'react'
import { Bot, Check, ChevronDown, Copy, FileText, RefreshCw, ThumbsDown, ThumbsUp, User, Clock } from 'lucide-react'
import Markdown from './Markdown.jsx'

const time = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '')

const FOLLOW_UPS = ['Explain in more detail', 'Summarize as bullet points', 'Give me an example']

function Thinking() {
  return (
    <div className="flex items-center gap-2 py-1 text-sm text-slate-600 dark:text-slate-400">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => <span key={i} className="dot size-2 rounded-full bg-blue-500" style={{ animationDelay: `${i * 0.16}s` }} />)}
      </span>
      Searching documents…
    </div>
  )
}

function Sources({ citations }) {
  const [open, setOpen] = useState(false)
  if (!citations?.length) return null
  const files = [...new Set(citations.map((c) => c.fileName))]
  return (
    <div className="mt-4">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex flex-wrap rounded items-center gap-2 text-xs">
        <span className="flex items-center gap-1 font-semibold text-blue-500">
          <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
          {citations.length} source{citations.length > 1 ? 's' : ''}
        </span>
        {!open && files.slice(0, 3).map((f) => (
          <span key={f} className="max-w-[180px] truncate rounded-full border border-slate-200 px-2 py-0.5 text-slate-500 dark:border-white/10 dark:text-slate-400">{f}</span>
        ))}
      </button>
      {open && (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {citations.map((c, i) => {
            const pct = Math.round((c.similarityScore ?? 0) * 100)
            return (
              <div key={i} className="animate-fade-up rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-500/40 dark:border-white/5 dark:bg-black/20" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="flex size-5 items-center justify-center rounded-md bg-blue-500/15 text-[10px] text-blue-500">{i + 1}</span>
                  <FileText size={12} className="shrink-0 text-slate-400" />
                  <span className="truncate">{c.fileName}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Chunk #{c.chunkIndex}{c.pageNumber != null && ` • Page ${c.pageNumber}`}</div>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{c.snippet}</p>
                {c.similarityScore != null && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div className="animate-bar h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-500">{pct}%</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function IconBtn({ onClick, label, active, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : !!active}
      title={label}
      className={`rounded-lg p-1.5 transition hover:bg-slate-100 dark:hover:bg-white/10 ${active ? 'text-blue-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
    >
      {children}
    </button>
  )
}

function Message({ m, isLast, busy, onRegenerate, onFollowUp }) {
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState(null)

  if (m.role === 'user') {
    return (
      <div className="animate-fade-up flex items-end justify-end gap-2.5">
        <div className="flex max-w-[85%] flex-col sm:max-w-[70%] items-end">
          <span className="mb-1 mr-1 text-[11px] text-slate-500 dark:text-slate-400">You • {time(m.at)}</span>
          <div className="whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-500 to-blue-700 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-md shadow-blue-600/20">{m.content}</div>
        </div>
        <div className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"><User size={15} /></div>
      </div>
    )
  }

  const done = !m.pending && !m.error
  return (
    <div className="group animate-fade-up flex items-end gap-2.5">
      <div className={`mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-md shadow-blue-600/30 ${m.pending ? 'animate-pulse' : ''}`}><Bot size={15} /></div>
      <div className="min-w-0 max-w-[88%] sm:max-w-[78%]">
        <span className="mb-1 ml-1 block text-[11px] text-slate-500 dark:text-slate-400">DocMind • {time(m.at)}</span>
        <div className={`overflow-hidden break-words rounded-2xl rounded-bl-sm border px-4 py-2.5 shadow-sm ${m.error ? 'border-red-500/40 bg-red-500/10 text-red-500' : 'border-slate-200 bg-white dark:border-white/5 dark:bg-ink-850'}`}>
          {m.content ? (
            <div className={m.pending ? 'cursor' : ''}><Markdown>{m.content}</Markdown></div>
          ) : m.pending ? <Thinking /> : null}
          <Sources citations={m.citations} />
        </div>

        {done && (
          <div className="mt-1.5 flex items-center gap-1 pl-1">
            <IconBtn label={copied ? 'Copied' : 'Copy'} onClick={() => { navigator.clipboard.writeText(m.content); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
              {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </IconBtn>
            <IconBtn label="Good answer" active={vote === 'up'} onClick={() => setVote(vote === 'up' ? null : 'up')}><ThumbsUp size={15} /></IconBtn>
            <IconBtn label="Bad answer" active={vote === 'down'} onClick={() => setVote(vote === 'down' ? null : 'down')}><ThumbsDown size={15} /></IconBtn>
            {isLast && !busy && <IconBtn label="Regenerate" onClick={onRegenerate}><RefreshCw size={15} /></IconBtn>}
            {m.responseTimeMs != null && (
              <span className="ml-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Clock size={12} />{(m.responseTimeMs / 1000).toFixed(1)}s</span>
            )}
          </div>
        )}

        {done && isLast && !busy && (
          <div className="mt-3 flex flex-wrap gap-2 pl-1">
            {FOLLOW_UPS.map((f) => (
              <button
                key={f}
                onClick={() => onFollowUp(f)}
                className="rounded-full border border-blue-500/30 bg-blue-500/5 px-3.5 py-1.5 text-xs font-medium text-blue-600 transition hover:-translate-y-0.5 hover:bg-blue-500 hover:text-white dark:text-blue-300 dark:hover:text-white"
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Streaming rewrites only the last message; skip re-rendering (and re-parsing markdown for) all the others.
// Handlers/busy are only used by the last message, so they're ignored for earlier ones; the last one always re-renders.
export default memo(Message, (a, b) => a.m === b.m && !a.isLast && !b.isLast)
