import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from './firebase/config'
import type {
  TuitionRecord,
  BenchmarkFilters,
  BenchmarkStats,
  ConfidenceLevel,
  SiteStats,
} from './types'

// Linear interpolation percentile
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

export function calculateBenchmark(salaries: number[]): BenchmarkStats {
  const sorted = [...salaries].sort((a, b) => a - b)
  const n = sorted.length

  const average = n > 0 ? sorted.reduce((a, b) => a + b, 0) / n : 0
  const median = percentile(sorted, 50)
  const p25 = percentile(sorted, 25)
  const p75 = percentile(sorted, 75)
  const min = sorted[0] ?? 0
  const max = sorted[n - 1] ?? 0

  let confidence: ConfidenceLevel = 'low'
  if (n >= 50) confidence = 'high'
  else if (n >= 10) confidence = 'medium'

  return {
    sample_size: n,
    average: Math.round(average),
    median: Math.round(median),
    min,
    max,
    p25: Math.round(p25),
    p75: Math.round(p75),
    confidence,
  }
}

export function generateInsight(stats: BenchmarkStats): string {
  if (stats.sample_size === 0) {
    return 'No data matches your filters. Try broadening your search.'
  }
  if (stats.confidence === 'low') {
    return `Data is limited (${stats.sample_size} report${stats.sample_size === 1 ? '' : 's'}). Interpret results carefully — more submissions are needed for reliable benchmarks.`
  }
  const fmt = (n: number) => n.toLocaleString('en-BD')
  return `Most tutors matching these criteria earn between ৳${fmt(stats.p25)} and ৳${fmt(stats.p75)} BDT per month, with a median of ৳${fmt(stats.median)} BDT.`
}

export async function fetchBenchmarkData(
  filters: BenchmarkFilters
): Promise<BenchmarkStats> {
  const db = await getDb()
  const recordsRef = collection(db, 'tuition_records')
  const q = query(recordsRef, where('status', '==', 'approved'))
  const snap = await getDocs(q)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 18)

  const records: TuitionRecord[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<TuitionRecord, 'id'>),
  }))

  const filtered = records.filter((r) => {
    // Date filter
    const createdAt = r.created_at instanceof Date
      ? r.created_at
      : (r.created_at as { toDate(): Date }).toDate()
    if (createdAt < cutoff) return false

    // Area
    if (filters.area && r.area !== filters.area) return false
    // Student level
    if (filters.student_level && r.student_level !== filters.student_level) return false
    // Curriculum
    if (filters.curriculum && r.curriculum !== filters.curriculum) return false
    // University
    if (filters.university && r.university !== filters.university) return false
    // Department
    if (filters.department && r.department !== filters.department) return false
    // Academic year
    if (filters.academic_year && r.academic_year !== filters.academic_year) return false
    // Days per week
    if (filters.days_per_week && r.days_per_week !== filters.days_per_week) return false
    // Subjects (at least one match)
    if (filters.subjects && filters.subjects.length > 0) {
      const hasMatch = filters.subjects.some((s) => r.subjects.includes(s))
      if (!hasMatch) return false
    }
    return true
  })

  const salaries = filtered.map((r) => r.salary)
  return calculateBenchmark(salaries)
}

export async function fetchSiteStats(): Promise<SiteStats> {
  const db = await getDb()
  const q = query(collection(db, 'tuition_records'), where('status', '==', 'approved'))
  const snap = await getDocs(q)
  const records = snap.docs.map((d) => d.data() as TuitionRecord)

  const areas = new Set(records.map((r) => r.area))
  const universities = new Set(records.map((r) => r.university))
  const subjects = new Set(records.flatMap((r) => r.subjects))

  return {
    total_reports: records.length,
    areas_covered: areas.size,
    universities_covered: universities.size,
    subjects_covered: subjects.size,
  }
}

export async function submitTuitionRecord(
  data: Omit<TuitionRecord, 'id' | 'status' | 'created_at'>
): Promise<void> {
  const db = await getDb()
  await addDoc(collection(db, 'tuition_records'), {
    ...data,
    status: 'approved',
    created_at: serverTimestamp(),
  })
}

export async function submitPendingItem(
  collectionName: string,
  value: string
): Promise<void> {
  const db = await getDb()
  await addDoc(collection(db, collectionName), {
    value,
    status: 'pending',
    submitted_at: serverTimestamp(),
  })
}

export async function fetchApprovedItems(col: string): Promise<string[]> {
  const db = await getDb()
  const q = query(collection(db, col), where('status', '==', 'approved'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data().value as string)
}
