import type { ConfidenceLevel } from '@/lib/types'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
  sampleSize: number
}

const CONFIG = {
  low: {
    bg: '#FEE2E2',
    text: '#DC2626',
    label: 'Low Confidence',
  },
  medium: {
    bg: '#FEF3C7',
    text: '#D97706',
    label: 'Medium Confidence',
  },
  high: {
    bg: '#D1FAE5',
    text: '#059669',
    label: 'High Confidence',
  },
}

export default function ConfidenceBadge({ level, sampleSize }: ConfidenceBadgeProps) {
  const config = CONFIG[level]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.text }}
      />
      {config.label} · {sampleSize} report{sampleSize !== 1 ? 's' : ''}
    </span>
  )
}
