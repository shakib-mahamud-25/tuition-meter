import { getAnalyticsInstance } from './firebase/config'
import type { BenchmarkFilters, BenchmarkStats, TuitionRecord } from './types'

async function track(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  try {
    const analytics = await getAnalyticsInstance()
    if (!analytics) return
    const { logEvent } = await import('firebase/analytics')
    logEvent(analytics, eventName, params)
  } catch {
    // Analytics failures are non-critical; silent no-op
  }
}

export async function trackBenchmarkSearch(filters: BenchmarkFilters): Promise<void> {
  await track('benchmark_search', {
    area: filters.area || '',
    curriculum: filters.curriculum || '',
    student_level: filters.student_level || '',
    university: filters.university || '',
  })
}

export async function trackBenchmarkResultView(stats: BenchmarkStats): Promise<void> {
  await track('benchmark_result_view', {
    sample_size: stats.sample_size,
    confidence: stats.confidence,
    has_filters: true,
  })
}

export async function trackSalarySubmit(data: Partial<TuitionRecord>): Promise<void> {
  await track('salary_submit', {
    curriculum: data.curriculum || '',
    student_level: data.student_level || '',
    area: data.area || '',
    days_per_week: data.days_per_week || 0,
  })
}

export async function trackCustomItemAdded(
  type: 'area' | 'subject' | 'university' | 'department',
  value: string
): Promise<void> {
  await track(`custom_${type}_added`, { value })
}

export async function trackAdminLogin(): Promise<void> {
  await track('admin_login')
}

export async function trackAdminLogout(): Promise<void> {
  await track('admin_logout')
}

export async function trackRecordApproved(recordId: string): Promise<void> {
  await track('record_approved', { record_id: recordId })
}

export async function trackRecordRejected(recordId: string): Promise<void> {
  await track('record_rejected', { record_id: recordId })
}
