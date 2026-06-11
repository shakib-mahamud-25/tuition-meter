'use client'

import { useState, useCallback } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtersApplied, setFiltersApplied] = useState(false)

  const activeFilterCount = Object.values(filters).filter(v =>
    v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  ).length

  const setFilters = useCallback((f: BenchmarkFilters) => {
    setFiltersState(f)
  }, [])

  const runBenchmark = useCallback(async () => {
    setLoading(true)
    setError(null)
    setFiltersApplied(true)
    try {
      await trackBenchmarkSearch(filters)
      const result = await fetchBenchmarkData(filters)
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

  const clearFilters = useCallback(() => {
    setFiltersState({})
    setStats(null)
    setFiltersApplied(false)
    setError(null)
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
