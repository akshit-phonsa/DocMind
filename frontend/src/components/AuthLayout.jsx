import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import BrandMark from './BrandMark.jsx'

export default function AuthLayout({ title, subtitle, children, footer }) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', (localStorage.getItem('docmind-theme') || 'dark') === 'dark')
  }, [])
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 dark:border-white/5 dark:bg-ink-900"
      >
        <div className="mb-6 flex items-center gap-3">
          <BrandMark size={44} />
          <div>
            <p className="text-xl font-bold text-blue-500">DocMind</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <h1 className="mb-5 text-2xl font-bold">{title}</h1>
        {children}
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</p>
      </motion.div>
    </main>
  )
}

export const inputCls =
  'w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 outline-none focus:border-blue-500 dark:bg-ink-950'
export const btnCls =
  'flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

/** Labelled input with an inline error (announced to screen readers) and optional password toggle. */
export function Field({ label, error, type = 'text', id, ...props }) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  const errId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={isPw && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={`${inputCls} ${isPw ? 'pr-11' : ''} ${error ? 'border-red-500' : 'border-slate-300 dark:border-white/10'}`}
          {...props}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && <p id={errId} role="alert" className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}
