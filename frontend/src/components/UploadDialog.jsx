import { useRef, useState } from 'react'
import { CheckCircle2, CloudUpload, FileText, Loader2, X, XCircle } from 'lucide-react'
import Modal from './Modal.jsx'
import { uploadDocument } from '../lib/api.js'
import { ALLOWED_EXT, MAX_SIZE, extOf, formatSize } from '../lib/utils.js'

let seq = 0
const toItem = (file) => {
  let error = null
  if (!ALLOWED_EXT.includes(extOf(file.name))) error = 'Unsupported file type'
  else if (file.size > MAX_SIZE) error = 'Exceeds 25MB limit'
  return { id: ++seq, file, progress: 0, status: error ? 'error' : 'queued', error }
}

export default function UploadDialog({ initialFiles, onClose, onUploaded }) {
  const [items, setItems] = useState(() => initialFiles.map(toItem))
  const [running, setRunning] = useState(false)
  const [drag, setDrag] = useState(false)
  const input = useRef(null)

  const patch = (id, p) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const add = (files) => setItems((xs) => [...xs, ...[...files].map(toItem)])
  const queued = items.filter((i) => i.status === 'queued')
  const allDone = items.length > 0 && items.every((i) => i.status === 'done' || i.status === 'error')

  const start = async () => {
    setRunning(true)
    // Sequential so each file gets its own accurate progress bar
    for (const it of items.filter((i) => i.status === 'queued')) {
      patch(it.id, { status: 'uploading', progress: 0 })
      try {
        await uploadDocument(it.file, (p) => patch(it.id, { progress: p, status: p >= 100 ? 'indexing' : 'uploading' }))
        patch(it.id, { status: 'done', progress: 100 })
      } catch (e) {
        patch(it.id, { status: 'error', error: e.message })
      }
      onUploaded()
    }
    setRunning(false)
  }

  const label = (i) =>
    ({ queued: 'Ready', uploading: `Uploading ${i.progress}%`, indexing: 'Indexing embeddings…', done: 'Indexed', error: i.error })[i.status]

  return (
    <Modal onClose={onClose} dismissable={!running} className="max-w-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h3 className="text-lg font-semibold">Upload Documents</h3>
        <button onClick={onClose} disabled={running} className="text-slate-400 hover:text-slate-700 disabled:opacity-40" aria-label="Close"><X size={20} /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files) }}
          onClick={() => input.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed py-8 text-center transition ${drag ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
        >
          <CloudUpload className="text-blue-500" size={28} />
          <p className="text-sm"><span className="font-semibold text-blue-600">Choose files</span> or drag and drop</p>
          <p className="text-xs text-slate-500">PDF, Word, Markdown, TXT, CSV (max 25MB each)</p>
          <input ref={input} type="file" multiple hidden accept=".pdf,.doc,.docx,.md,.txt,.csv" onChange={(e) => { add(e.target.files); e.target.value = '' }} />
        </div>

        {items.length > 0 && (
          <ul className="mt-5 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{i.file.name}</div>
                    <div className={`text-xs ${i.status === 'error' ? 'text-red-500' : i.status === 'done' ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {formatSize(i.file.size)} • {label(i)}
                    </div>
                  </div>
                  {i.status === 'done' && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {i.status === 'error' && <XCircle size={18} className="text-red-500" />}
                  {(i.status === 'uploading' || i.status === 'indexing') && <Loader2 size={18} className="animate-spin text-blue-500" />}
                  {i.status === 'queued' && !running && (
                    <button onClick={() => setItems((xs) => xs.filter((x) => x.id !== i.id))} className="text-slate-400 hover:text-red-500" aria-label="Remove"><X size={16} /></button>
                  )}
                </div>
                {['uploading', 'indexing', 'done'].includes(i.status) && (
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${i.status === 'done' ? 'bg-emerald-500' : 'bg-blue-600'} ${i.status === 'indexing' ? 'animate-pulse' : ''}`}
                      style={{ width: `${i.progress}%` }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <button onClick={onClose} disabled={running} className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
          {allDone ? 'Done' : 'Cancel'}
        </button>
        {!allDone && (
          <button
            onClick={start}
            disabled={running || queued.length === 0}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? 'Uploading…' : `Upload ${queued.length || ''} file${queued.length === 1 ? '' : 's'}`}
          </button>
        )}
      </div>
    </Modal>
  )
}
