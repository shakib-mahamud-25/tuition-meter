'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useBenchmark } from '../../hooks/useBenchmark'
import { FilterSidebar } from '../../components/benchmark/FilterSidebar'
import { BenchmarkResult } from '../../components/benchmark/BenchmarkResult'
import type { BenchmarkFilters } from '../../lib/types'

export default function BenchmarkPage() {
  const {
    filters, stats, loading, error, filtersApplied, activeFilterCount,
    setFilters, runBenchmark, clearFilters,
  } = useBenchmark()

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // FIX #1: receive latestFilters from sidebar and pass directly to runBenchmark
  const handleApply = (latestFilters: BenchmarkFilters) => {
    runBenchmark(latestFilters)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Salary Benchmark</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Real tuition salary data from Bangladesh tutors.
          </p>
        </div>
        <button
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-slate-700 shadow-sm flex-shrink-0"
          onClick={() => setMobileFiltersOpen(o => !o)}
          aria-expanded={mobileFiltersOpen}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-[#059669] text-white text-xs font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden mb-5">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <FilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              onApply={(lf) => { handleApply(lf); setMobileFiltersOpen(false) }}
              onClear={clearFilters}
              activeFilterCount={activeFilterCount}
              loading={loading}
            />
          </div>
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Desktop sidebar */}
        <div className="w-72 flex-shrink-0 sticky top-24 hidden lg:block">
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApply}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
            loading={loading}
          />
        </div>

        {/* Results panel */}
        <div className="flex-1 min-w-0">
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-slate-500">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </span>
              <button
                onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
              >
                Clear all
              </button>
            </div>
          )}
          <BenchmarkResult
            stats={stats}
            loading={loading}
            filtersApplied={filtersApplied}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}
