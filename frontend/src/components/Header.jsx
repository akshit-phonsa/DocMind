import { BookOpen, ExternalLink, Search, Sparkles, Sun, Moon } from 'lucide-react'

export default function Header({ count, scopeName, dark, onToggleTheme, onSearch }) {
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-white/5 dark:bg-ink-900">
      <div className="flex items-center gap-3">
        <div className="relative flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <BookOpen size={20} />
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-ink-900" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-500">DocMind</h1>
            <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-500">
              <Sparkles size={11} /> AI RAG
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Spring AI • PostgreSQL pgvector • OpenAI</p>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm md:flex dark:border-white/10 dark:bg-white/5">
        <span className="size-2 rounded-full bg-blue-500" />
        <span className="text-slate-500 dark:text-slate-400">Scope:</span>
        <span className="max-w-[260px] truncate font-semibold">{scopeName || `All Documents (${count})`}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSearch}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
        >
          <Search size={15} className="text-slate-500" /> Search Chunks
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-white/10">⌘ K</kbd>
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
          aria-label="Toggle theme"
          className="rounded-xl p-2 text-amber-500 transition hover:bg-slate-100 dark:hover:bg-white/5"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} className="text-slate-600" />}
        </button>
      </div>
    </header>
  )
}
