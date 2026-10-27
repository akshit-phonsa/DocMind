import { useRef, useState } from 'react'
import { CheckCircle2, CloudUpload, Copy, Database, FileText, Layers, Loader2, Search, AlertCircle } from 'lucide-react'
import { formatSize } from '../lib/utils.js'

const STATUS = {
  INDEXED: { label: 'Indexed', cls: 'text-emerald-500', Icon: CheckCircle2 },
  COMPLETED: { label: 'Indexed', cls: 'text-emerald-500', Icon: CheckCircle2 },
  FAILED: { label: 'Failed', cls: 'text-red-500', Icon: AlertCircle },
}
const statusOf = (s) => STATUS[s] || { label: s ? s[0] + s.slice(1).toLowerCase() : 'Pending', cls: 'text-amber-500', Icon: Loader2 }

export default function Sidebar({ docs, loading, error, scopeId, onScope, onUpload, onOpenDoc, onRetry }) {
  const [filter, setFilter] = useState('')
  const [drag, setDrag] = useState(false)
  const input = useRef(null)

  const shown = docs.filter((d) => d.fileName.toLowerCase().includes(filter.toLowerCase()))

  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const files = [...e.dataTransfer.files]
    if (files.length) onUpload(files)
  }

  return (
    <aside className="flex w-[350px] shrink-0 flex-col border-r border-slate-200 bg-white dark:border-white/5 dark:bg-ink-900">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 dark:border-white/5">
        <Database size={18} className="text-blue-500" />
        <div>
          <h2 className="font-semibold">Knowledge Base</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Indexed vector documents</p>
        </div>
      </div>

      <div className="p-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => input.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
            drag ? 'border-blue-500 bg-blue-500/10' : 'border-slate-300 hover:border-blue-500/60 dark:border-white/15'
          }`}
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <CloudUpload size={22} />
          </div>
          <p className="text-sm"><span className="font-semibold text-blue-500">Upload document</span> or drag here</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">PDF, Word, Markdown, TXT, CSV (max 25MB)</p>
          <input
            ref={input}
            type="file"
            multiple
            hidden
            accept=".pdf,.doc,.docx,.md,.txt,.csv"
            onChange={(e) => { const f = [...e.target.files]; e.target.value = ''; if (f.length) onUpload(f) }}
          />
        </div>
      </div>

      <div className="px-4">
        <button
          onClick={() => onScope(null)}
          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
            scopeId === null
              ? 'border-blue-500/40 bg-blue-500/10'
              : 'border-slate-200 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5'
          }`}
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white"><Copy size={16} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">All Documents</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Search across complete corpus</div>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold dark:bg-white/10">{docs.length}</span>
        </button>

        <div className="relative mt-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-ink-950"
          />
        </div>

        <div className="mt-4 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <span>Documents ({docs.length})</span><span>Status</span>
        </div>
      </div>

      <div className="mt-2 min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-4">
        {loading && <p className="py-6 text-center text-sm text-slate-500"><Loader2 className="mr-2 inline animate-spin" size={14} />Loading…</p>}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            Couldn't reach backend: {error}
            <button onClick={onRetry} className="ml-2 font-semibold underline">Retry</button>
          </div>
        )}
        {!loading && !error && shown.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">{docs.length ? 'No matching files' : 'No documents yet'}</p>
        )}
        {shown.map((d) => {
          const st = statusOf(d.status)
          const active = scopeId === d.id
          return (
            <div
              key={d.id}
              onClick={() => onScope(d.id)}
              onDoubleClick={() => onOpenDoc(d.id)}
              className={`group cursor-pointer rounded-2xl border p-3 transition ${
                active ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-200 hover:bg-slate-50 dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 border-b border-slate-200/70 pb-2.5 dark:border-white/5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/5"><FileText size={16} /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold" title={d.fileName}>{d.fileName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{formatSize(d.fileSize)} • {d.totalPages ?? 1}p</div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Layers size={13} />{d.totalChunks ?? 0} chunks</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenDoc(d.id) }}
                    className="font-medium text-blue-500 opacity-0 transition group-hover:opacity-100"
                  >
                    Details
                  </button>
                  <span className={`flex items-center gap-1 font-semibold ${st.cls}`}>
                    <st.Icon size={13} className={st.Icon === Loader2 ? 'animate-spin' : ''} />{st.label}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
