'use client'

export const dynamic = 'force-dynamic'

import { useBenchmark } from '../../hooks/useBenchmark'
import { FilterSidebar } from '../../components/benchmark/FilterSidebar'
import { BenchmarkResult } from '../../components/benchmark/BenchmarkResult'

export default function BenchmarkPage() {
  const {
    filters, stats, loading, error, filtersApplied, activeFilterCount,
    setFilters, runBenchmark, clearFilters,
  } = useBenchmark()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Salary Benchmark</h1>
        <p className="text-slate-500 mt-1.5 text-sm">
          Filter by location, student profile, or your background to see real salary data.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 sticky top-24 hidden lg:block">
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            onApply={runBenchmark}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
            loading={loading}
          />
        </div>

        {/* Mobile filter (collapsible not implemented — sidebar shown below on mobile) */}
        <div className="lg:hidden w-full mb-4">
          <details className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            <summary className="px-5 py-4 font-semibold text-slate-800 text-sm cursor-pointer list-none flex items-center justify-between">
              <span>
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-[#059669] text-white text-xs font-bold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="border-t border-[#E2E8F0]">
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                onApply={runBenchmark}
                onClear={clearFilters}
                activeFilterCount={activeFilterCount}
                loading={loading}
              />
            </div>
          </details>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-xs text-slate-500">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
              <button
                onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
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
