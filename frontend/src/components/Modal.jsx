import { useEffect } from 'react'

export default function Modal({ onClose, children, className = 'max-w-2xl', dismissable = true }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && dismissable && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, dismissable])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && dismissable && onClose()}
    >
      <div className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl ${className}`}>
        {children}
      </div>
    </div>
  )
}
