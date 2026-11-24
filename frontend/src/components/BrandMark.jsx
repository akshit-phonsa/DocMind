import { Sparkles } from 'lucide-react'

/** The DocMind logo mark, shared by the header, auth screens and the chat welcome screen. */
export default function BrandMark({ size = 40, className = '' }) {
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 ${className}`}
    >
      <Sparkles size={Math.round(size * 0.5)} />
    </div>
  )
}
