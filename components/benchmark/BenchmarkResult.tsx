import ConfidenceBadge from '@/components/ui/ConfidenceBadge'
import SalaryRangeBar from './SalaryRangeBar'
import { generateInsight } from '@/lib/benchmark'
import type { BenchmarkStats } from '@/lib/types'

interface BenchmarkResultProps {
  stats: BenchmarkStats | null
  loading: boolean
  hasQueried: boolean
}

function fmtBDT(n: number) {
  return '৳' + n.toLocaleString('en-BD')
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-8 w-2/3" />
      <div className="skeleton h-3 w-1/4" />
    </div>
  )
}

const STAT_CARDS = [
  { key: 'average', label: 'Average', fmt: fmtBDT },
  { key: 'median', label: 'Median', fmt: fmtBDT },
  { key: 'sample_size', label: 'Sample Size', fmt: (n: number) => `${n} reports` },
  { key: 'min', label: 'Lowest', fmt: fmtBDT },
  { key: 'max', label: 'Highest', fmt: fmtBDT },
  {
    key: 'iqr',
    label: 'IQR Range',
    fmt: (_: number, s: BenchmarkStats) => `${fmtBDT(s.p25)} – ${fmtBDT(s.p75)}`,
  },
] as const

export default function BenchmarkResult({ stats, loading, hasQueried }: BenchmarkResultProps) {
  // Skeleton state
  if (loading) {
    return (
      <div>
        <div className="skeleton h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="skeleton h-4 w-32 mb-4" />
          <div className="skeleton h-8 w-full mb-3" />
          <div className="skeleton h-4 w-full" />
        </div>
      </div>
    )
  }

  // Empty state — nothing queried yet
  if (!hasQueried) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">Set your filters to get started</h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
          Select your location, student level, subjects, and other criteria on the left, then click <strong>Apply Filters</strong> to see benchmark data.
        </p>
      </div>
    )
  }

  // Zero results
  if (stats && stats.sample_size === 0) {
    return (
      <div className="bg-white border border-red-100 rounded-xl p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">No data found</h3>
        <p className="text-slate-500 text-sm">
          No tuition records match your current filters. Try broadening your search criteria.
        </p>
      </div>
    )
  }

  if (!stats) return null

  const insight = generateInsight(stats)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <ConfidenceBadge level={stats.confidence} sampleSize={stats.sample_size} />
        <h2 className="font-bold text-gray-900 text-xl">Benchmark Results</h2>
      </div>

      {/* Insight box */}
      <div className="bg-[#D1FAE5]/40 border border-[#059669]/20 rounded-xl px-5 py-4 flex gap-3 items-start">
        <svg className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-700 leading-relaxed tabular-nums">{insight}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map(({ key, label, fmt }) => {
          const val = key === 'iqr' ? 0 : (stats as unknown as Record<string, number>)[key]
          const display = key === 'iqr'
            ? `${fmtBDT(stats.p25)} – ${fmtBDT(stats.p75)}`
            : (fmt as (n: number) => string)(val)
          return (
            <div key={key} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className="text-2xl font-extrabold text-gray-900 tabular-nums leading-tight">{display}</p>
            </div>
          )
        })}
      </div>

      {/* Range bar card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Salary Distribution</h3>
        <SalaryRangeBar stats={stats} />
      </div>
    </div>
  )
}
