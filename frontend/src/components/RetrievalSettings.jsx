import { RotateCcw } from 'lucide-react'

export const DEFAULT_RETRIEVAL = { topK: 5, minSimilarity: 0 }

function SliderField({ label, hint, value, min, max, step, display, tag, onChange }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs opacity-60">{hint}</div>
        </div>
        <div className="flex items-center gap-2">
          {tag && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-500">{tag}</span>}
          <span className="min-w-[3.25rem] rounded-lg bg-blue-600 px-2.5 py-1 text-center text-sm font-bold tabular-nums text-white shadow-md shadow-blue-600/30">{display}</span>
        </div>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        style={{ '--p': `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="mt-1.5 flex justify-between text-[11px] tabular-nums opacity-50">
        <span>{min === 0 ? '0%' : min}</span><span>{max === 1 ? '100%' : max}</span>
      </div>
    </div>
  )
}

const strictness = (v) => (v === 0 ? 'Any match' : v < 0.35 ? 'Broad' : v < 0.65 ? 'Balanced' : 'Strict')

export default function RetrievalSettings({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch })
  const isDefault = value.topK === DEFAULT_RETRIEVAL.topK && value.minSimilarity === DEFAULT_RETRIEVAL.minSimilarity
  return (
    <div className="space-y-5">
      <SliderField
        label="Top Results"
        hint="Max chunks retrieved"
        value={value.topK}
        min={1}
        max={20}
        step={1}
        display={value.topK}
        onChange={(topK) => set({ topK })}
      />
      <SliderField
        label="Min Similarity"
        hint="Discard weaker matches"
        value={value.minSimilarity}
        min={0}
        max={1}
        step={0.05}
        display={`${Math.round(value.minSimilarity * 100)}%`}
        tag={strictness(value.minSimilarity)}
        onChange={(minSimilarity) => set({ minSimilarity: Math.round(minSimilarity * 100) / 100 })}
      />
      <button
        onClick={() => onChange(DEFAULT_RETRIEVAL)}
        disabled={isDefault}
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 transition disabled:opacity-40"
      >
        <RotateCcw size={12} />Reset to defaults
      </button>
    </div>
  )
}
