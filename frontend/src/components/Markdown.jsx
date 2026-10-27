import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-700/60 bg-[#0d1117] shadow-sm">
      <div className="flex items-center justify-between bg-white/5 px-4 py-1.5 text-xs text-slate-400">
        <span className="font-mono uppercase tracking-wide">{lang || 'code'}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <><Check size={12} className="text-emerald-400" />Copied</> : <><Copy size={12} />Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-200"><code className="font-mono">{code}</code></pre>
    </div>
  )
}

const components = {
  code({ className, children }) {
    const lang = /language-(\w+)/.exec(className || '')?.[1]
    const text = String(children).replace(/\n$/, '')
    if (!lang && !text.includes('\n')) {
      return <code className="rounded-md bg-blue-500/10 px-1.5 py-0.5 font-mono text-[0.85em] text-blue-600 dark:text-blue-300">{text}</code>
    }
    return <CodeBlock lang={lang} code={text} />
  },
  pre: ({ children }) => <>{children}</>,
  h1: (p) => <h1 className="mb-1.5 mt-3 text-base font-bold" {...p} />,
  h2: (p) => <h2 className="mb-1.5 mt-3 text-[15px] font-bold" {...p} />,
  h3: (p) => <h3 className="mb-1 mt-3 text-[15px] font-semibold" {...p} />,
  p: (p) => <p className="my-1.5 leading-relaxed" {...p} />,
  ul: (p) => <ul className="my-1.5 list-disc space-y-0.5 pl-5 marker:text-blue-500" {...p} />,
  ol: (p) => <ol className="my-1.5 list-decimal space-y-0.5 pl-5 marker:font-semibold marker:text-blue-500" {...p} />,
  a: (p) => <a className="font-medium text-blue-500 underline underline-offset-2 hover:text-blue-400" target="_blank" rel="noreferrer" {...p} />,
  strong: (p) => <strong className="font-semibold text-slate-900 dark:text-white" {...p} />,
  blockquote: (p) => <blockquote className="my-3 rounded-r-lg border-l-4 border-blue-500 bg-blue-500/5 py-1 pl-4 italic text-slate-600 dark:text-slate-300" {...p} />,
  hr: () => <hr className="my-4 border-slate-200 dark:border-white/10" />,
  table: (p) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
      <table className="w-full border-collapse text-sm" {...p} />
    </div>
  ),
  thead: (p) => <thead className="bg-slate-100 text-left dark:bg-white/5" {...p} />,
  th: (p) => <th className="px-3 py-2 font-semibold" {...p} />,
  td: (p) => <td className="border-t border-slate-200 px-3 py-2 dark:border-white/10" {...p} />,
}

export default function Markdown({ children }) {
  return (
    <div className="text-[15px] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
    </div>
  )
}
