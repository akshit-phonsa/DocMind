import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, ChevronDown, Copy, Search, FileText, HardDrive, Layers, Loader2, MessageSquare, Trash2, X, AlertCircle } from 'lucide-react'
import Modal from './Modal.jsx'
import { deleteDocument, getDocument, getDocumentChunks } from '../lib/api.js'
import { formatDate, formatSize } from '../lib/utils.js'

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-1.5 flex items-center gap-2 text-sm text-slate-500"><Icon size={15} />{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

export default function DocumentDialog({ id, onClose, onDeleted, onChat }) {
  const [doc, setDoc] = useState(null)
  const [chunks, setChunks] = useState([])
  const [error, setError] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState({})

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const d = await getDocument(id)
        if (!live) return
        setDoc(d)
        const list = await getDocumentChunks(id)
        if (live) { setChunks(list || []); setLoaded(true) }
      } catch (e) {
        if (live) setError(e.message)
      }
    })()
    return () => { live = false }
  }, [id])

  const remove = async () => {
    setDeleting(true)
    try { await deleteDocument(id); onDeleted() } catch (e) { setError(e.message); setDeleting(false); setConfirmDel(false) }
  }

  const f = filter.trim().toLowerCase()
  const shown = !showAll ? chunks.slice(0, 3) : f ? chunks.filter((c) => c.content.toLowerCase().includes(f) || String(c.chunkIndex) === f) : chunks
  const ok = doc && ['INDEXED', 'COMPLETED'].includes(doc.status)

  return (
    <Modal onClose={onClose} className="max-w-3xl">
      {!doc ? (
        <div className="flex h-64 items-center justify-center">
          {error ? <p className="text-red-500">{error}</p> : <Loader2 className="animate-spin text-blue-500" />}
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between border-b border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileText size={22} /></div>
              <div>
                <h3 className="text-xl font-bold">{doc.fileName}</h3>
                <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-400">
                  <span className="font-mono">{doc.id.slice(0, 13)}...</span>
                  <button onClick={() => { navigator.clipboard.writeText(doc.id); setCopied(true); setTimeout(() => setCopied(false), 1200) }} aria-label="Copy id">
                    {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}{doc.status}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close"><X size={20} /></button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50 p-5 md:grid-cols-4">
              <Stat icon={HardDrive} label="File Size" value={formatSize(doc.fileSize)} />
              <Stat icon={Layers} label="Vector Chunks" value={`${doc.totalChunks ?? 0} Chunks`} />
              <Stat icon={FileText} label="Total Pages" value={`${doc.totalPages ?? 1} Pages`} />
              <Stat icon={Calendar} label="Uploaded" value={formatDate(doc.createdAt)} />
            </div>

            {doc.errorMessage && <p className="mx-6 mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{doc.errorMessage}</p>}

            <div className="p-6">
              <div className="mb-4 flex items-center justify-between text-sm font-bold uppercase tracking-wider text-slate-500">
                <span>Indexed Vector Chunks</span>
                {chunks.length > 3 && (
                  <button
                    onClick={() => { setShowAll(!showAll); setFilter('') }}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold normal-case tracking-normal text-blue-600 hover:bg-blue-50"
                  >
                    {showAll ? 'Show sample' : `View all ${chunks.length} chunks`}
                  </button>
                )}
                {chunks.length <= 3 && <span>{showAll ? 'All' : 'Sample'} Chunks</span>}
              </div>

              {showAll && chunks.length > 3 && (
                <div className="relative mb-4">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter chunks by text or number…"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {!loaded && !error && <p className="py-6 text-center text-sm text-slate-400"><Loader2 className="mr-2 inline animate-spin" size={14} />Loading chunks…</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}
              {loaded && chunks.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No chunks stored for this document.</p>}

              <div className="space-y-4">
                {shown.map((c) => {
                  const expanded = showAll ? open[c.chunkIndex] : false
                  return (
                    <div key={c.chunkIndex} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-semibold">Chunk #{c.chunkIndex}{c.pageNumber != null && <span className="ml-2 text-xs font-normal text-slate-500">Page {c.pageNumber}</span>}</span>
                        <span className="text-xs text-slate-400">{c.content.length} chars</span>
                      </div>
                      <p className={`whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-700 ${expanded ? '' : 'line-clamp-4'}`}>{c.content}</p>
                      {showAll && c.content.length > 280 && (
                        <button onClick={() => setOpen((o) => ({ ...o, [c.chunkIndex]: !o[c.chunkIndex] }))} className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600">
                          <ChevronDown size={14} className={expanded ? 'rotate-180' : ''} />{expanded ? 'Show less' : 'Show full chunk'}
                        </button>
                      )}
                    </div>
                  )
                })}
                {showAll && filter && shown.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No chunks match “{filter}”.</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            {confirmDel ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-600">Delete this document and its vectors?</span>
                <button onClick={remove} disabled={deleting} className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white disabled:opacity-60">{deleting ? 'Deleting…' : 'Confirm'}</button>
                <button onClick={() => setConfirmDel(false)} className="font-semibold text-slate-500">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDel(true)} className="flex items-center gap-2 font-semibold text-red-600 hover:text-red-700"><Trash2 size={17} />Delete Document</button>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="rounded-xl border border-slate-200 px-6 py-2.5 font-semibold hover:bg-slate-50">Close</button>
              <button onClick={() => onChat(doc.id)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
                <MessageSquare size={17} />Chat with Document
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
