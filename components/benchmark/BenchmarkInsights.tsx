'use client'

import { useState } from 'react'
import { formatBDT } from '../../lib/benchmark'
import type { BenchmarkStats } from '../../lib/types'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold text-slate-700 mb-4">{children}</p>
  )
}

// ─── 1. Salary Histogram ──────────────────────────────────────────────────────
// Fixed height of the chart area in pixels. All bar heights are computed as
// explicit pixel values against this constant — percentage heights are
// unreliable when bars are nested inside a flex wrapper.
const CHART_HEIGHT_PX = 128

export function SalaryHistogram({ stats }: { stats: BenchmarkStats }) {
  const { histogram, p25, p75, median } = stats
  if (!histogram || histogram.length === 0) return null

  const maxCount = Math.max(...histogram.map(b => b.count), 1)
  const MIN_BAR_PX = 4 // always show at least a sliver so the bar is visible

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
      <SectionHeading>Salary Distribution</SectionHeading>
      <p className="text-xs text-slate-400 mb-5">
        How many tutors earn within each salary band — reveals the shape of the market.
      </p>

      {/* Chart area — fixed pixel height, position:relative so bars can use absolute bottom:0 */}
      <div className="flex items-end gap-1.5" style={{ height: CHART_HEIGHT_PX }}>
        {histogram.map((bucket, i) => {
          const barPx = Math.max(
            Math.round((bucket.count / maxCount) * CHART_HEIGHT_PX),
            MIN_BAR_PX
          )
          const inIQR = bucket.rangeMax > p25 && bucket.rangeMin < p75
          const hasMedian = median >= bucket.rangeMin && median <= bucket.rangeMax

          return (
            // Column wrapper: fills available width, has the full chart height so
            // the tooltip (bottom-full) and count label (-top-5) both position correctly.
            <div
              key={i}
              className="group relative flex-1"
              style={{ height: CHART_HEIGHT_PX }}
            >
              {/* Hover tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                <p className="font-semibold">{bucket.count} tutor{bucket.count !== 1 ? 's' : ''}</p>
                <p className="text-slate-300">{bucket.label}</p>
                {hasMedian && <p className="text-[#34D399] text-[10px] mt-0.5">← median range</p>}
              </div>

              {/* Count label above the tallest bar only */}
              {bucket.count === maxCount && (
                <span
                  className="absolute left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-semibold whitespace-nowrap"
                  style={{ bottom: barPx + 4 }}
                >
                  {bucket.count}
                </span>
              )}

              {/* Bar — anchored to bottom using absolute positioning */}
              <div
                className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-colors ${
                  hasMedian
                    ? 'bg-[#059669]'
                    : inIQR
                    ? 'bg-[#059669]/40'
                    : 'bg-slate-200 group-hover:bg-slate-300'
                }`}
                style={{ height: barPx }}
              />
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-slate-400">
        <span>{histogram[0].label.split('–')[0]}</span>
        <span>{histogram[histogram.length - 1].label.split('–')[1]}</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-[#059669]" />
          <span className="text-[11px] text-slate-500">Median range</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-[#059669]/40" />
          <span className="text-[11px] text-slate-500">Middle 50% (IQR)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-slate-200" />
          <span className="text-[11px] text-slate-500">Other</span>
        </div>
      </div>
    </div>
  )
}

// ─── 2. Breakdown comparison bars ─────────────────────────────────────────────

function BreakdownChart({
  title,
  description,
  bars,
}: {
  title: string
  description: string
  bars: { label: string; average: number; count: number }[]
}) {
  if (!bars || bars.length < 2) return null

  const maxAvg = Math.max(...bars.map(b => b.average), 1)

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-xs text-slate-400 mb-3">{description}</p>
      <div className="space-y-2.5">
        {bars.map((bar, i) => {
          const widthPct = (bar.average / maxAvg) * 100
          const isTop = i === 0
          return (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${isTop ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                  {bar.label}
                  {isTop && (
                    <span className="ml-1.5 text-[10px] text-[#059669] font-semibold">highest</span>
                  )}
                </span>
                <div className="text-right">
                  <span className={`text-xs font-semibold tabular-nums ${isTop ? 'text-[#059669]' : 'text-slate-600'}`}>
                    {formatBDT(bar.average)}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">({bar.count})</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isTop ? 'bg-[#059669]' : 'bg-[#059669]/30'}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SalaryBreakdown({ stats }: { stats: BenchmarkStats }) {
  const { levelBreakdown, curriculumBreakdown } = stats
  const hasLevel = levelBreakdown && levelBreakdown.length >= 2
  const hasCurriculum = curriculumBreakdown && curriculumBreakdown.length >= 2
  if (!hasLevel && !hasCurriculum) return null

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
      <SectionHeading>Earnings by Category</SectionHeading>
      <div className={`grid gap-8 ${hasLevel && hasCurriculum ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        {hasLevel && (
          <BreakdownChart
            title="By Student Level"
            description="Average monthly salary per level — shows which students pay more."
            bars={levelBreakdown}
          />
        )}
        {hasCurriculum && (
          <BreakdownChart
            title="By Curriculum"
            description="Average monthly salary per medium — English Medium pays most."
            bars={curriculumBreakdown}
          />
        )}
      </div>
    </div>
  )
}

// ─── 3. Area ranking table ────────────────────────────────────────────────────

export function AreaRankingTable({ stats }: { stats: BenchmarkStats }) {
  const { areaRankings } = stats
  if (!areaRankings || areaRankings.length < 2) return null

  // Show top 5 (or all if fewer)
  const top = areaRankings.slice(0, 5)
  const maxAvg = top[0].average

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
      <SectionHeading>Top-Paying Areas</SectionHeading>
      <p className="text-xs text-slate-400 mb-4">
        Ranked by average monthly salary for the current filters. Pick your area strategically.
      </p>
      <div className="space-y-3">
        {top.map((entry, i) => {
          const widthPct = (entry.average / maxAvg) * 100
          const isTop = i === 0
          return (
            <div key={entry.area} className="flex items-center gap-3">
              {/* Rank number */}
              <span className={`text-xs font-bold w-5 text-center flex-shrink-0 tabular-nums ${
                isTop ? 'text-[#059669]' : 'text-slate-400'
              }`}>
                {i + 1}
              </span>

              {/* Bar + label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs truncate ${isTop ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                    {entry.area}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className={`text-xs font-semibold tabular-nums ${isTop ? 'text-[#059669]' : 'text-slate-600'}`}>
                      {formatBDT(entry.average)}
                    </span>
                    <span className="text-[10px] text-slate-400">({entry.count})</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isTop ? 'bg-[#059669]' : 'bg-[#059669]/25'}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {areaRankings.length > 5 && (
        <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-[#E2E8F0]">
          {areaRankings.length - 5} more area{areaRankings.length - 5 !== 1 ? 's' : ''} in the data
        </p>
      )}
    </div>
  )
}

// ─── 4. "Your salary vs benchmark" widget ────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

// Returns what percentage of values in sortedArr are below `value`
function percentileRank(sortedArr: number[], value: number): number {
  if (sortedArr.length === 0) return 0
  const below = sortedArr.filter(v => v < value).length
  return Math.round((below / sortedArr.length) * 100)
}

export function YourSalaryWidget({ stats }: { stats: BenchmarkStats }) {
  const [rawInput, setRawInput] = useState('')

  const { min, max, p25, p75, median, sortedSalaries } = stats
  if (min === max || !sortedSalaries || sortedSalaries.length === 0) return null

  const userSalary = parseInt(rawInput.replace(/[^0-9]/g, ''), 10)
  const hasValue = !isNaN(userSalary) && userSalary > 0

  const range = max - min
  const toPercent = (v: number) => clamp(((v - min) / range) * 100, 0, 100)

  const p25pct  = toPercent(p25)
  const p75pct  = toPercent(p75)
  const medpct  = toPercent(median)
  const iqrW    = p75pct - p25pct
  const userPct = hasValue ? toPercent(userSalary) : null

  const pctRank = hasValue ? percentileRank(sortedSalaries, userSalary) : null
  const diffFromMedian = hasValue ? userSalary - median : null
  const diffPct = diffFromMedian !== null && median > 0
    ? Math.round(Math.abs(diffFromMedian) / median * 100)
    : 0

  const aboveMedian = diffFromMedian !== null && diffFromMedian >= 0

  // Contextual message
  let message = ''
  let messageColor = 'text-slate-600'
  if (hasValue && pctRank !== null) {
    if (pctRank >= 75) {
      message = `You're in the top ${100 - pctRank}% of tutors for this profile. Strong negotiating position.`
      messageColor = 'text-[#059669]'
    } else if (pctRank >= 50) {
      message = `You're above the median — earning more than ${pctRank}% of tutors matching these filters.`
      messageColor = 'text-[#059669]'
    } else if (pctRank >= 25) {
      message = `You're below the median. Market data suggests room to negotiate upward.`
      messageColor = 'text-amber-600'
    } else {
      message = `You're in the bottom quarter. Consider negotiating — the median is ${formatBDT(median)}.`
      messageColor = 'text-red-500'
    }
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
      <SectionHeading>Your Salary vs Benchmark</SectionHeading>
      <p className="text-xs text-slate-400 mb-4">
        Enter your current or expected monthly salary to see where you stand.
      </p>

      {/* Input */}
      <div className="relative mb-6">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold select-none">৳</span>
        <input
          type="text"
          inputMode="numeric"
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          placeholder="e.g. 8000"
          className="w-full pl-8 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-100 transition-colors"
        />
        {hasValue && (
          <button
            onClick={() => setRawInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {/* Range bar with user marker */}
      <div className="mb-5">
        {/* Top labels */}
        <div className="relative h-5 mb-2 text-[10px] text-slate-400">
          <span className="absolute left-0">{formatBDT(min)}</span>
          <span
            className="absolute -translate-x-1/2 font-semibold text-[#059669]"
            style={{ left: `${medpct}%` }}
          >
            {formatBDT(median)}
          </span>
          <span className="absolute right-0">{formatBDT(max)}</span>
        </div>

        {/* Bar */}
        <div className="relative h-2 bg-[#E2E8F0] rounded-full">
          {/* IQR fill */}
          <div
            className="absolute top-0 h-full rounded-full bg-[#059669]/20"
            style={{ left: `${p25pct}%`, width: `${iqrW}%` }}
          />
          {/* Median tick */}
          <div
            className="absolute bg-[#059669] w-0.5 rounded-full -translate-x-1/2"
            style={{ left: `${medpct}%`, top: '-5px', height: '22px' }}
          />
          {/* User marker */}
          {hasValue && userPct !== null && (
            <div
              className="absolute -translate-x-1/2 transition-all duration-300"
              style={{ left: `${userPct}%`, top: '-8px' }}
            >
              {/* Diamond marker */}
              <div className="w-4 h-4 bg-slate-700 rotate-45 rounded-sm shadow-md" />
            </div>
          )}
        </div>

        {/* P25/P75 labels */}
        <div className="relative h-4 mt-2 text-[10px] text-slate-400">
          <span className="absolute -translate-x-1/2" style={{ left: `${p25pct}%` }}>
            P25 {formatBDT(p25)}
          </span>
          <span className="absolute -translate-x-1/2" style={{ left: `${p75pct}%` }}>
            P75 {formatBDT(p75)}
          </span>
        </div>
      </div>

      {/* Result stats */}
      {hasValue && pctRank !== null && diffFromMedian !== null && (
        <div className="mt-6 space-y-3">
          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Percentile</p>
              <p className="text-lg font-bold text-slate-800 tabular-nums">{pctRank}<span className="text-sm font-semibold">th</span></p>
            </div>
            <div className={`border rounded-xl p-3 text-center ${aboveMedian ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-xs text-slate-500 mb-0.5">vs Median</p>
              <p className={`text-lg font-bold tabular-nums ${aboveMedian ? 'text-[#059669]' : 'text-red-500'}`}>
                {aboveMedian ? '+' : '−'}{diffPct}%
              </p>
            </div>
            <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Your salary</p>
              <p className="text-sm font-bold text-slate-800 tabular-nums">{formatBDT(userSalary)}</p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <p className={`text-xs font-medium leading-relaxed ${messageColor}`}>
              {message}
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-4 bg-[#059669] rounded" />
          <span className="text-[10px] text-slate-400">Median</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 bg-[#059669]/20 rounded" />
          <span className="text-[10px] text-slate-400">Middle 50%</span>
        </div>
        {hasValue && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-slate-700 rotate-45 rounded-sm" />
            <span className="text-[10px] text-slate-400">Your salary</span>
          </div>
        )}
      </div>
    </div>
  )
}
