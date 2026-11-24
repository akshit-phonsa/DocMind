import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Chat from '../components/Chat.jsx'
import UploadDialog from '../components/UploadDialog.jsx'
import SearchDialog from '../components/SearchDialog.jsx'
import DocumentDialog from '../components/DocumentDialog.jsx'
import { DEFAULT_RETRIEVAL } from '../components/RetrievalSettings.jsx'
import { useDocumentStore } from '../store/documentStore.js'
import { useConversationStore } from '../store/conversationStore.js'

export default function Workspace() {
  const { docs, loading, error, scopeId, refresh, setScope: setScopeId } = useDocumentStore() // scopeId null = all documents
  const loadChats = useConversationStore((s) => s.loadChats)
  const [dark, setDark] = useState(() => (localStorage.getItem('docmind-theme') || 'dark') === 'dark')
  const [retrieval, setRetrieval] = useState(() => {
    try { return { ...DEFAULT_RETRIEVAL, ...JSON.parse(localStorage.getItem('docmind-retrieval')) } } catch { return DEFAULT_RETRIEVAL }
  })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [initialFiles, setInitialFiles] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)

  useEffect(() => { refresh(); loadChats() }, [refresh, loadChats])

  useEffect(() => { localStorage.setItem('docmind-retrieval', JSON.stringify(retrieval)) }, [retrieval])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('docmind-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const scopeDoc = docs.find((d) => d.id === scopeId) || null
  // If scoped document was deleted, fall back to all
  useEffect(() => { if (scopeId && !loading && !scopeDoc) setScopeId(null) }, [scopeId, scopeDoc, loading])

  const openUpload = (files = []) => { setInitialFiles(files); setUploadOpen(true) }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header
        count={docs.length}
        scopeName={scopeDoc?.fileName}
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
        onSearch={() => setSearchOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          docs={docs}
          loading={loading}
          error={error}
          scopeId={scopeId}
          onScope={setScopeId}
          onUpload={openUpload}
          onOpenDoc={setDetailId}
          onRetry={refresh}
        />
        <Chat scopeDoc={scopeDoc} hasDocs={docs.length > 0} />
      </div>

      {uploadOpen && (
        <UploadDialog initialFiles={initialFiles} onClose={() => setUploadOpen(false)} onUploaded={refresh} />
      )}
      {searchOpen && <SearchDialog scopeDoc={scopeDoc} retrieval={retrieval} onRetrieval={setRetrieval} onClose={() => setSearchOpen(false)} />}
      {detailId && (
        <DocumentDialog
          id={detailId}
          onClose={() => setDetailId(null)}
          onDeleted={() => { setDetailId(null); refresh() }}
          onChat={(id) => { setScopeId(id); setDetailId(null) }}
        />
      )}
    </div>
  )
}
