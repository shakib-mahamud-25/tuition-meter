import { formatBDT } from '../../lib/benchmark'
import type { BenchmarkStats } from '../../lib/types'

interface SalaryRangeBarProps {
  stats: BenchmarkStats
}

export function SalaryRangeBar({ stats }: SalaryRangeBarProps) {
  const { min, max, p25, p75, median } = stats
  if (min === max) return null

  const range = max - min
  const toPercent = (v: number) => Math.max(0, Math.min(100, ((v - min) / range) * 100))

  const p25pct = toPercent(p25)
  const p75pct = toPercent(p75)
  const medpct = toPercent(median)
  const iqrWidth = p75pct - p25pct

  return (
    <div className="space-y-5">
      {/* Labels above */}
      <div className="relative h-5 text-xs text-slate-500">
        <span className="absolute left-0 -translate-x-1/2" style={{ left: '0%' }}>
          {formatBDT(min)}
        </span>
        <span
          className="absolute font-semibold text-[#059669] -translate-x-1/2"
          style={{ left: `${medpct}%` }}
        >
          {formatBDT(median)}
        </span>
        <span className="absolute -translate-x-full" style={{ left: '100%' }}>
          {formatBDT(max)}
        </span>
      </div>

      {/* Bar */}
      <div className="relative">
        {/* Track */}
        <div className="range-bar-track h-1.5 bg-[#E2E8F0] rounded-full relative overflow-visible">
          {/* IQR fill */}
          <div
            className="range-bar-fill absolute top-0 h-full rounded-full bg-[#059669]/30"
            style={{ left: `${p25pct}%`, width: `${iqrWidth}%` }}
            aria-hidden="true"
          />
          {/* Median tick */}
          <div
            className="range-bar-median absolute bg-[#059669] w-[3px] rounded-full -translate-x-1/2"
            style={{
              left: `${medpct}%`,
              top: '-7px',
              height: '22px',
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* P25 / P75 labels below */}
      <div className="relative h-4 text-xs text-slate-400">
        <span className="-translate-x-1/2 absolute" style={{ left: `${p25pct}%` }}>
          P25: {formatBDT(p25)}
        </span>
        <span className="-translate-x-1/2 absolute" style={{ left: `${p75pct}%` }}>
          P75: {formatBDT(p75)}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-1.5 rounded bg-[#059669]/30" />
          <span className="text-xs text-slate-500">Middle 50% (IQR)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-4 rounded bg-[#059669]" />
          <span className="text-xs text-slate-500">Median</span>
        </div>
      </div>
    </div>
  )
}
