import { Component } from 'react'
import { RotateCcw } from 'lucide-react'
import BrandMark from './BrandMark.jsx'

/** Catches render errors so a bug shows a recoverable screen instead of a blank page. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error, info) { console.error('UI crashed:', error, info.componentStack) }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <BrandMark size={56} />
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          The app hit an unexpected error. Your chats are saved. Try again, or reload the page if it keeps happening.
        </p>
        <div className="flex gap-3">
          <button onClick={() => this.setState({ error: null })} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Try again</button>
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/5">
            <RotateCcw size={14} /> Reload
          </button>
        </div>
      </div>
    )
  }
}
