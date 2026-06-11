import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { SalaryRangeBar } from './SalaryRangeBar'
import { formatBDT, generateInsight } from '../../lib/benchmark'
import type { BenchmarkStats } from '../../lib/types'

interface BenchmarkResultProps {
  stats: BenchmarkStats | null
  loading: boolean
  filtersApplied: boolean
  error: string | null
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <div className="skeleton h-3 w-24 rounded mb-3" />
      <div className="skeleton h-7 w-32 rounded" />
    </div>
  )
}

export function BenchmarkResult({ stats, loading, filtersApplied, error }: BenchmarkResultProps) {
  // Empty state — only shown if somehow filtersApplied is false and not loading
  if (!filtersApplied && !loading) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="skeleton h-4 w-full rounded mb-2" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#DC2626">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-slate-700 font-medium mb-1">Could not load benchmark data</p>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    )
  }

  // Zero results
  if (stats && stats.sample_size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#D97706">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-slate-700 font-medium mb-2">No data for these filters</p>
        <p className="text-slate-400 text-sm max-w-xs">
          Not enough reports match your criteria yet. Try fewer filters, or be the first to submit a salary for this category.
        </p>
      </div>
    )
  }

  if (!stats) return null

  const insight = generateInsight(stats)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ConfidenceBadge confidence={stats.confidence} sampleSize={stats.sample_size} />
      </div>

      {/* Insight box */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <p className="text-[#059669] text-sm leading-relaxed font-medium">{insight}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Weighted Average" value={formatBDT(stats.average)} sub="freshness-adjusted" />
        <StatCard label="Median Salary" value={formatBDT(stats.median)} sub="unweighted" />
        <StatCard label="Sample Size" value={stats.sample_size.toString()} sub="matching reports" />
        <StatCard label="Lowest" value={formatBDT(stats.min)} />
        <StatCard label="Highest" value={formatBDT(stats.max)} />
        <StatCard label="IQR Range" value={`${formatBDT(stats.p25)} – ${formatBDT(stats.p75)}`} sub="middle 50%" />
      </div>

      {/* Range bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <p className="text-sm font-semibold text-slate-700 mb-5">Salary Distribution</p>
        <SalaryRangeBar stats={stats} />
      </div>
    </div>
  )
}
