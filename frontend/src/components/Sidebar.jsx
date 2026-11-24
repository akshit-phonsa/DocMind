import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CloudUpload, MessageSquare, Copy, Database, FileText, Layers, Loader2, Search, AlertCircle, X } from 'lucide-react'
import { formatSize } from '../lib/utils.js'
import { useUiStore } from '../store/uiStore.js'
import ChatsPanel from './ChatsPanel.jsx'
import ListSkeleton from './Skeleton.jsx'

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
  const tab = useUiStore((s) => s.sidebarTab)
  const setTab = useUiStore((s) => s.setSidebarTab)
  const open = useUiStore((s) => s.sidebarOpen)
  const setOpen = useUiStore((s) => s.setSidebarOpen)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const shown = docs.filter((d) => d.fileName.toLowerCase().includes(filter.toLowerCase()))

  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const files = [...e.dataTransfer.files]
    if (files.length) onUpload(files)
  }

  return (
    <>
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/60 md:hidden"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
    <aside
      id="app-sidebar"
      aria-label="Documents and chats"
      className={`fixed inset-y-0 left-0 z-40 flex w-[88vw] max-w-[350px] flex-col border-r border-slate-200 bg-white transition-[transform,visibility] duration-200 md:static md:z-auto md:w-[350px] md:shrink-0 md:translate-x-0 md:visible dark:border-white/5 dark:bg-ink-900 ${
        open ? 'translate-x-0' : 'invisible -translate-x-full'
      }`}
    >
      <div className="flex items-center gap-1 border-b border-slate-200 p-2 dark:border-white/5" role="tablist" aria-label="Sidebar sections">
        {[['documents', 'Documents', Database], ['chats', 'Chats', MessageSquare]].map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition ${
              tab === id ? 'bg-blue-500/10 text-blue-500' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
            }`}
          >
            <Icon size={15} />{label}
          </button>
        ))}
        <button onClick={() => setOpen(false)} aria-label="Close sidebar" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-white/5"><X size={18} /></button>
      </div>
      {tab === 'chats' ? <ChatsPanel /> : <>
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
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click() } }}
          role="button"
          tabIndex={0}
          aria-label="Upload document: click or drag files here"
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
            aria-label="Filter files"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-ink-950"
          />
        </div>

        <div className="mt-4 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <span>Documents ({docs.length})</span><span>Status</span>
        </div>
      </div>

      <div className="mt-2 min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-4">
        {loading && <ListSkeleton rows={3} label="Loading documents" />}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            Couldn't reach backend: {error}
            <button onClick={onRetry} className="ml-2 font-semibold underline">Retry</button>
          </div>
        )}
        {!loading && !error && shown.length === 0 && (
          docs.length ? (
            <p className="py-6 text-center text-sm text-slate-600 dark:text-slate-400">No matching files</p>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"><FileText size={22} /></span>
              <p className="text-sm font-medium">No documents yet</p>
              <p className="max-w-[220px] text-xs text-slate-600 dark:text-slate-400">Upload a PDF, Word file or notes above to start chatting with them.</p>
            </div>
          )
        )}
        {shown.map((d) => {
          const st = statusOf(d.status)
          const active = scopeId === d.id
          return (
            <div
              key={d.id}
              className={`group rounded-2xl border p-3 transition ${
                active ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-200 hover:bg-slate-50 dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/5'
              }`}
            >
              <button
                onClick={() => onScope(d.id)}
                onDoubleClick={() => onOpenDoc(d.id)}
                aria-pressed={active}
                className="flex w-full items-center gap-3 rounded-lg border-b border-slate-200/70 pb-2.5 text-left dark:border-white/5"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/5"><FileText size={16} /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold" title={d.fileName}>{d.fileName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{formatSize(d.fileSize)} • {d.totalPages ?? 1}p</div>
                </div>
              </button>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Layers size={13} />{d.totalChunks ?? 0} chunks</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onOpenDoc(d.id)}
                    aria-label={`Details for ${d.fileName}`}
                    className="rounded font-medium text-blue-500 transition md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
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
      </>}
    </aside>
    </>
  )
}
