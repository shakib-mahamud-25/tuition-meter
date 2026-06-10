'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import { BenchmarkFilters, BenchmarkStats } from '@/lib/types';
import { fetchBenchmarkData } from '@/lib/benchmark';
import FilterSidebar from '@/components/benchmark/FilterSidebar';
import BenchmarkResult from '@/components/benchmark/BenchmarkResult';

export default function BenchmarkPage() {
  const [filters, setFilters] = useState<BenchmarkFilters>({});
  const [stats, setStats] = useState<BenchmarkStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  const handleApply = useCallback(async () => {
    setLoading(true);
    setFiltersApplied(true);
    try {
      const result = await fetchBenchmarkData(filters);
      setStats(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFiltersChange = useCallback((newFilters: BenchmarkFilters) => {
    setFilters(newFilters);
  }, []);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[#059669] text-xs font-bold tracking-wider uppercase mb-2">Salary Benchmark</div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">
          Find Your Market Rate
        </h1>
        <p className="text-[#64748B] text-sm max-w-xl">
          Filter by area, student level, curriculum, and university to see aggregated salary data from the last 18 months.
        </p>
        {activeFilterCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-[#D1FAE5] text-[#059669] text-xs font-semibold px-3 py-1 rounded-full">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 2h10M3 6h6M5 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Filter sidebar */}
        <FilterSidebar
          filters={filters}
          onChange={handleFiltersChange}
          onApply={handleApply}
        />

        {/* Results */}
        <div>
          <BenchmarkResult
            stats={stats}
            loading={loading}
            filtersApplied={filtersApplied}
          />
        </div>
      </div>
    </div>
  );
}
