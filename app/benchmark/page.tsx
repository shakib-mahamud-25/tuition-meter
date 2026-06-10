'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import FilterSidebar from '@/components/benchmark/FilterSidebar'
import BenchmarkResult from '@/components/benchmark/BenchmarkResult'
import { fetchBenchmarkData } from '@/lib/benchmark'
import type { BenchmarkFilters, BenchmarkStats } from '@/lib/types'

export default function BenchmarkPage() {
  const [stats, setStats] = useState<BenchmarkStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasQueried, setHasQueried] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApply(filters: BenchmarkFilters) {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBenchmarkData(filters)
      setStats(result)
      setHasQueried(true)
    } catch (e) {
      console.error(e)
      setError('Failed to load benchmark data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Salary Benchmark</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
          Set your filters and apply to see aggregated salary statistics from the community database. Data is sourced from voluntary, anonymous submissions.
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <FilterSidebar onApply={handleApply} loading={loading} />
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <BenchmarkResult stats={stats} loading={loading} hasQueried={hasQueried} />
        </div>
      </div>
    </div>
  )
}
