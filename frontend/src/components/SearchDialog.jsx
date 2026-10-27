import { useEffect, useRef, useState } from 'react'
import { FileText, Loader2, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import RetrievalSettings from './RetrievalSettings.jsx'
import Modal from './Modal.jsx'
import { searchChunks } from '../lib/api.js'

export default function SearchDialog({ scopeDoc, retrieval, onRetrieval, onClose }) {
  const [tune, setTune] = useState(true)
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const input = useRef(null)
  useEffect(() => { input.current?.focus() }, [])

  const run = async (e) => {
    e.preventDefault()
    if (!q.trim()) return
    setLoading(true); setError('')
    try {
      setRes(await searchChunks({ query: q.trim(), documentId: scopeDoc?.id ?? null, topk: retrieval.topK, similaritySearch: retrieval.minSimilarity }))
    } catch (err) {
      setError(err.message); setRes(null)
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} className="max-w-3xl">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Search size={18} /></div>
          <h3 className="text-lg font-semibold">Semantic Vector Similarity Search</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close"><X size={20} /></button>
      </div>

      <form onSubmit={run} className="flex gap-3 border-t border-slate-200 px-6 py-4">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search concepts, clauses, or facts across vector chunks..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button disabled={!q.trim() || loading} className="rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
        </button>
        <button
          type="button"
          onClick={() => setTune(!tune)}
          aria-label="Search settings"
          className={`flex w-12 items-center justify-center rounded-xl border transition ${tune ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </form>
      <div className={`grid border-b border-slate-200 transition-all duration-300 ${tune ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] border-b-0'}`}>
        <div className="overflow-hidden">
          <div className="bg-slate-50 px-6 py-5">
            <RetrievalSettings value={retrieval} onChange={onRetrieval} />
          </div>
        </div>
      </div>

      <div className="min-h-[260px] flex-1 overflow-y-auto px-6 py-4">
        {scopeDoc && <p className="mb-3 text-xs text-slate-500">Searching in <b>{scopeDoc.fileName}</b></p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {!res && !error && !loading && (
          <div className="flex h-52 flex-col items-center justify-center gap-3 text-slate-400">
            <Sparkles size={40} strokeWidth={1.5} />
            <p className="text-sm">Type a search term above to inspect matching vector chunks.</p>
          </div>
        )}
        {res && (
          <>
            <p className="mb-3 text-sm text-slate-500">{res.totalMatches} match{res.totalMatches === 1 ? '' : 'es'} for “{res.query}”</p>
            {res.matches?.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No matching chunks found.</p>}
            <ul className="space-y-3">
              {res.matches?.map((m, i) => (
                <li key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-blue-600" />
                    <span className="truncate font-semibold">{m.fileName}</span>
                    <span className="text-slate-500">Chunk #{m.chunkIndex}{m.pageNumber != null && ` • p${m.pageNumber}`}</span>
                    {m.similarityScore != null && (
                      <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{(m.similarityScore * 100).toFixed(1)}% match</span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-slate-700">{m.snippet}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Modal>
  )
}
