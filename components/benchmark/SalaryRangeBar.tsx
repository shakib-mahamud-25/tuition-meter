import type { BenchmarkStats } from '@/lib/types'

interface SalaryRangeBarProps {
  stats: BenchmarkStats
}

function fmtBDT(n: number) {
  return '৳' + n.toLocaleString('en-BD')
}

export default function SalaryRangeBar({ stats }: SalaryRangeBarProps) {
  const { min, max, p25, p75, median } = stats
  const range = max - min || 1

  const p25Pct = ((p25 - min) / range) * 100
  const p75Pct = ((p75 - min) / range) * 100
  const medianPct = ((median - min) / range) * 100

  return (
    <div className="space-y-3">
      {/* Range bar */}
      <div className="range-bar-track my-4">
        {/* IQR fill */}
        <div
          className="range-bar-fill"
          style={{ left: `${p25Pct}%`, width: `${p75Pct - p25Pct}%` }}
        />
        {/* Median tick */}
        <div
          className="range-bar-median"
          style={{ left: `${medianPct}%` }}
        />
      </div>

      {/* Labels row */}
      <div className="relative flex justify-between text-xs text-slate-500 tabular-nums">
        <span>{fmtBDT(min)}</span>
        <span className="text-[#059669] font-semibold">{fmtBDT(median)} median</span>
        <span>{fmtBDT(max)}</span>
      </div>

      {/* P25/P75 labels */}
      <div className="relative flex justify-between text-xs text-slate-400 tabular-nums mt-1">
        <span style={{ marginLeft: `${p25Pct}%` }}>
          P25: {fmtBDT(p25)}
        </span>
        <span style={{ marginRight: `${100 - p75Pct}%` }}>
          P75: {fmtBDT(p75)}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-slate-500 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgba(5,150,105,0.25)', border: '1px solid rgba(5,150,105,0.4)' }} />
          IQR (P25–P75)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-0.5 h-4 rounded-full bg-[#059669]" />
          Median
        </span>
      </div>
    </div>
  )
}
