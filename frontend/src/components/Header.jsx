import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Menu, Search, Sparkles, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../store/authStore.js'
import { useUiStore } from '../store/uiStore.js'
import BrandMark from './BrandMark.jsx'

function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', esc) }
  }, [])

  if (!user) return null
  const initials = user.username.slice(0, 2).toUpperCase()
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.username}`}
        className="flex items-center gap-2.5 rounded-xl p-1.5 pr-3 transition hover:bg-slate-100 dark:hover:bg-white/5">
        <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">{initials}</span>
        <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:block">{user.username}</span>
        <span className="hidden rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-500 sm:block">{user.role}</span>
      </button>
      {open && (
        <div role="menu" className="animate-pop absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-ink-850">
          <div className="border-b border-slate-200 px-3 pb-2 pt-1 dark:border-white/5">
            <div className="truncate text-sm font-semibold">{user.username}</div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
          </div>
          <button
            role="menuitem"
            onClick={() => { logout(); navigate('/login', { replace: true }) }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header({ count, scopeName, dark, onToggleTheme, onSearch }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-4 dark:border-white/5 dark:bg-ink-900">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open documents and chats"
          aria-expanded={sidebarOpen}
          aria-controls="app-sidebar"
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-white/5"
        >
          <Menu size={20} />
        </button>
        <div className="relative">
          <BrandMark />
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-ink-900" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-500">DocMind</h1>
            <span className="hidden items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-500 sm:flex">
              <Sparkles size={11} /> AI RAG
            </span>
          </div>
          <p className="hidden text-xs text-slate-600 sm:block dark:text-slate-400">Spring AI • PostgreSQL pgvector • OpenAI</p>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm md:flex dark:border-white/10 dark:bg-white/5">
        <span className="size-2 rounded-full bg-blue-500" />
        <span className="text-slate-500 dark:text-slate-400">Scope:</span>
        <span className="max-w-[260px] truncate font-semibold">{scopeName || `All Documents (${count})`}</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <button
          onClick={onSearch}
          aria-label="Search chunks"
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-sm font-medium transition hover:bg-slate-100 sm:px-3.5 dark:border-white/10 dark:hover:bg-white/5"
        >
          <Search size={15} className="text-slate-500 dark:text-slate-400" /><span className="hidden sm:inline">Search Chunks</span>
          <kbd className="hidden rounded lg:inline bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-white/10">⌘ K</kbd>
        </button>
        <a
          href="/swagger-ui/index.html"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-500 sm:flex dark:text-slate-300"
        >
          Swagger API <ExternalLink size={13} />
        </a>
        <button
          onClick={onToggleTheme}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="rounded-xl p-2 text-amber-500 transition hover:bg-slate-100 dark:hover:bg-white/5"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} className="text-slate-600" />}
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
