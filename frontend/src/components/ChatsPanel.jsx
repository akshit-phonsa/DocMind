import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, MessageSquare, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useConversationStore } from '../store/conversationStore.js'
import { useUiStore } from '../store/uiStore.js'
import ListSkeleton from './Skeleton.jsx'

export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-GB')
}

const SEARCH_THRESHOLD = 5
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Buckets (already newest-first) chats into Today / Yesterday / Earlier, dropping empty groups. */
function groupChats(chats) {
  const today = startOfDay(new Date())
  const groups = { Today: [], Yesterday: [], Earlier: [] }
  for (const c of chats) {
    const t = startOfDay(new Date(c.updatedAt))
    groups[t >= today ? 'Today' : t >= today - 864e5 ? 'Yesterday' : 'Earlier'].push(c)
  }
  return Object.entries(groups).filter(([, list]) => list.length)
}

const iconBtn = 'rounded-md p-1.5 text-slate-500 transition hover:text-blue-500 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 dark:text-slate-400'

function ChatItem({ chat, active, onSelect }) {
  const renameChat = useConversationStore((s) => s.renameChat)
  const deleteChat = useConversationStore((s) => s.deleteChat)
  const [mode, setMode] = useState('view') // 'view' | 'rename' | 'confirm'
  const [draft, setDraft] = useState('')
  const input = useRef(null)

  const startRename = () => { setDraft(chat.title); setMode('rename') }
  const commit = () => { renameChat(chat.id, draft); setMode('view') }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18 }}
      className={`group rounded-2xl border p-3 transition ${
        active ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-200 hover:bg-slate-50 dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-1">
        {mode === 'rename' ? (
          <form className="flex min-w-0 flex-1 items-center gap-1" onSubmit={(e) => { e.preventDefault(); commit() }}>
            <input
              ref={input}
              autoFocus
              value={draft}
              maxLength={80}
              aria-label="Chat title"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setMode('view')}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-lg border border-blue-500 bg-white px-2 py-1 text-sm outline-none dark:bg-ink-950"
            />
            <button type="submit" aria-label="Save title" className="rounded-md p-1.5 text-emerald-500 hover:bg-emerald-500/10"><Check size={15} /></button>
            <button type="button" aria-label="Cancel rename" onClick={() => setMode('view')} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-500/10 dark:text-slate-400"><X size={15} /></button>
          </form>
        ) : (
          <>
            <button
              onClick={onSelect}
              onDoubleClick={startRename}
              aria-current={active ? 'true' : undefined}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"><MessageSquare size={16} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold" title={chat.title}>{chat.title}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{timeAgo(chat.updatedAt)}</span>
              </span>
            </button>
            {mode === 'view' && (
              <>
                <button onClick={startRename} aria-label={`Rename chat ${chat.title}`} className={iconBtn}><Pencil size={14} /></button>
                <button onClick={() => setMode('confirm')} aria-label={`Delete chat ${chat.title}`} className={`${iconBtn} hover:!text-red-500`}><Trash2 size={14} /></button>
              </>
            )}
          </>
        )}
      </div>
      {mode === 'confirm' && (
        <div role="alertdialog" aria-label="Confirm delete" className="mt-2.5 flex items-center gap-3 border-t border-slate-200/70 pt-2.5 text-xs dark:border-white/5">
          <span className="text-slate-600 dark:text-slate-400">Delete this chat?</span>
          <button autoFocus onClick={() => deleteChat(chat.id)} className="rounded-lg bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-700">Delete</button>
          <button onClick={() => setMode('view')} className="rounded-lg px-1.5 py-1 font-semibold text-slate-600 hover:underline dark:text-slate-400">Cancel</button>
        </div>
      )}
    </motion.div>
  )
}

export default function ChatsPanel() {
  const chats = useConversationStore((s) => s.chats)
  const activeId = useConversationStore((s) => s.activeId)
  const loaded = useConversationStore((s) => s.loaded)
  const newChat = useConversationStore((s) => s.newChat)
  const selectChat = useConversationStore((s) => s.selectChat)
  const closeDrawer = useUiStore((s) => s.setSidebarOpen)
  const [query, setQuery] = useState('')

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? chats.filter((c) => c.title.toLowerCase().includes(q)) : chats
  }, [chats, query])
  const groups = useMemo(() => groupChats(shown), [shown])

  return (
    <>
      <div className="p-4">
        <button
          onClick={() => { newChat(); closeDrawer(false) }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={17} /> New chat
        </button>
        {chats.length > SEARCH_THRESHOLD && (
          <div className="relative mt-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search chats"
              placeholder="Search chats..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-ink-950"
            />
          </div>
        )}
        <h2 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chats ({chats.length})</h2>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {!loaded && <ListSkeleton rows={4} label="Loading chats" />}
        {loaded && chats.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"><MessageSquare size={22} /></span>
            <p className="text-sm font-medium">No chats yet</p>
            <p className="max-w-[220px] text-xs text-slate-600 dark:text-slate-400">Ask a question about your documents to start your first chat.</p>
          </div>
        )}
        {loaded && chats.length > 0 && shown.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-600 dark:text-slate-400">No chats match “{query}”</p>
        )}
        {groups.map(([label, list]) => (
          <section key={label} aria-label={label}>
            <h3 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</h3>
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {list.map((c) => (
                  <ChatItem key={c.id} chat={c} active={c.id === activeId} onSelect={() => { selectChat(c.id); closeDrawer(false) }} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
