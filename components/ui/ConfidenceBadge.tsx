import type { ConfidenceLevel } from '../../lib/types'

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel
  sampleSize: number
}

const CONFIG = {
  low: {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#DC2626]',
    dot: 'bg-[#DC2626]',
    label: 'Low Confidence',
  },
  medium: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#D97706]',
    dot: 'bg-[#D97706]',
    label: 'Moderate Confidence',
  },
  high: {
    bg: 'bg-[#D1FAE5]',
    text: 'text-[#059669]',
    dot: 'bg-[#059669]',
    label: 'High Confidence',
  },
}

export function ConfidenceBadge({ confidence, sampleSize }: ConfidenceBadgeProps) {
  const c = CONFIG[confidence]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
      aria-label={`${c.label} — ${sampleSize} reports`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} aria-hidden="true" />
      {c.label} · {sampleSize} reports
    </span>
  )
}
