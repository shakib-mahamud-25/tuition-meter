'use client'

import { useState, useCallback, useEffect } from 'react'
import { fetchBenchmarkData } from '../lib/benchmark'
import { trackBenchmarkSearch, trackBenchmarkResultView } from '../lib/analytics'
import type { BenchmarkFilters, BenchmarkStats } from '../lib/types'

interface UseBenchmarkReturn {
  filters: BenchmarkFilters
  stats: BenchmarkStats | null
  loading: boolean
  error: string | null
  filtersApplied: boolean
  activeFilterCount: number
  setFilters: (filters: BenchmarkFilters) => void
  runBenchmark: () => Promise<void>
  clearFilters: () => void
}

export function useBenchmark(): UseBenchmarkReturn {
  const [filters, setFiltersState] = useState<BenchmarkFilters>({})
  const [stats, setStats] = useState<BenchmarkStats | null>(null)
  const [loading, setLoading] = useState(true) // true on mount — fetching immediately
  const [error, setError] = useState<string | null>(null)
  const [filtersApplied, setFiltersApplied] = useState(true) // treat initial load as applied

  const activeFilterCount = Object.values(filters).filter(v =>
    v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  ).length

  const setFilters = useCallback((f: BenchmarkFilters) => {
    setFiltersState(f)
  }, [])

  const runBenchmark = useCallback(async (filtersToRun?: BenchmarkFilters) => {
    const f = filtersToRun ?? filters
    setLoading(true)
    setError(null)
    setFiltersApplied(true)
    try {
      await trackBenchmarkSearch(f)
      const result = await fetchBenchmarkData(f)
      setStats(result)
      if (result.sample_size > 0) {
        await trackBenchmarkResultView(result)
      }
    } catch {
      setError('Unable to fetch benchmark data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Auto-run on mount with empty filters (shows all data by default)
  useEffect(() => {
    runBenchmark({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearFilters = useCallback(async () => {
    setFiltersState({})
    setError(null)
    // Re-run with empty filters to restore default view
    setLoading(true)
    setFiltersApplied(true)
    try {
      const result = await fetchBenchmarkData({})
      setStats(result)
    } catch {
      setError('Unable to fetch benchmark data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    filters,
    stats,
    loading,
    error,
    filtersApplied,
    activeFilterCount,
    setFilters,
    runBenchmark,
    clearFilters,
  }
}
