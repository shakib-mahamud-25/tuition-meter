import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { getDb } from './firebase/config'
import { AREAS, SUBJECTS, UNIVERSITIES, DEPARTMENTS } from './data'
import { getFirestoreErrorMessage } from './errors'
import type {
  BenchmarkFilters,
  BenchmarkStats,
  SiteStats,
  AdminStats,
  ApprovedOptions,
  TuitionRecord,
  ConfidenceLevel,
} from './types'

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatBDT(amount: number): string {
  return '৳' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

// ─── Statistics helpers ───────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  const frac = idx - lower
  return sorted[lower] + frac * (sorted[upper] - sorted[lower])
}

function getConfidence(sampleSize: number): ConfidenceLevel {
  if (sampleSize >= 50) return 'high'
  if (sampleSize >= 10) return 'medium'
  return 'low'
}

function getFreshnessWeight(createdAt: Timestamp | Date | null | undefined): number {
  if (!createdAt) return 1.0 // brand new record — treat as fully fresh
  const now = Date.now()
  let ts: number
  try {
    ts = createdAt instanceof Timestamp
      ? createdAt.toDate().getTime()
      : (createdAt as Date).getTime()
  } catch {
    return 1.0
  }
  if (isNaN(ts)) return 1.0
  const monthsAgo = (now - ts) / (1000 * 60 * 60 * 24 * 30)
  if (monthsAgo <= 3) return 1.0
  if (monthsAgo <= 6) return 0.9
  if (monthsAgo <= 12) return 0.7
  return 0.5
}

function getTimestamp(createdAt: Timestamp | Date | null | undefined): number {
  if (!createdAt) return Date.now() // null means just written — treat as now
  try {
    return createdAt instanceof Timestamp
      ? createdAt.toDate().getTime()
      : (createdAt as Date).getTime()
  } catch {
    return Date.now()
  }
}

// ─── Insight generation ───────────────────────────────────────────────────────

export function generateInsight(stats: BenchmarkStats): string {
  const { sample_size, confidence, p25, p75, median } = stats
  const low = formatBDT(p25)
  const high = formatBDT(p75)
  const med = formatBDT(median)

  if (confidence === 'low') {
    return `Data is limited — only ${sample_size} report${sample_size === 1 ? '' : 's'} match these filters. Results may not reflect the true market rate.`
  }

  if (confidence === 'medium') {
    return `Most tutors matching these criteria earn between ${low} and ${high} per month. The median salary is ${med}. 25% of tutors earn above ${high}. Confidence is moderate — based on ${sample_size} reports.`
  }

  return `Most tutors matching these criteria earn between ${low} and ${high} per month. The median salary is ${med}, with the top quartile earning ${high} or more. This benchmark is based on ${sample_size} reports — high confidence.`
}

// ─── Firestore service functions ──────────────────────────────────────────────

export async function fetchBenchmarkData(
  filters: BenchmarkFilters
): Promise<BenchmarkStats> {
  const db = await getDb()
  const q = query(
    collection(db, 'tuition_records'),
    where('status', '==', 'approved')
  )
  const snapshot = await getDocs(q)

  const now = Date.now()
  const cutoff = now - 18 * 30 * 24 * 60 * 60 * 1000

  let records = snapshot.docs.map(d => ({
    id: d.id,
    ...(d.data() as TuitionRecord),
  }))

  // Date window filter — null created_at (brand-new record) always passes
  records = records.filter(r => {
    const ts = getTimestamp(r.created_at)
    return ts >= cutoff
  })

  // Apply all other filters client-side
  if (filters.area) records = records.filter(r => r.area === filters.area)
  if (filters.student_level) records = records.filter(r => r.student_level === filters.student_level)
  if (filters.curriculum) records = records.filter(r => r.curriculum === filters.curriculum)
  if (filters.university) records = records.filter(r => r.university === filters.university)
  if (filters.department) records = records.filter(r => r.department === filters.department)
  if (filters.academic_year) records = records.filter(r => r.academic_year === filters.academic_year)
  if (filters.days_per_week) records = records.filter(r => r.days_per_week === filters.days_per_week)
  if (filters.subjects && filters.subjects.length > 0) {
    records = records.filter(r =>
      filters.subjects!.some(s => r.subjects.includes(s))
    )
  }

  const salaries = records.map(r => r.salary).sort((a, b) => a - b)
  const sample_size = salaries.length

  if (sample_size === 0) {
    return {
      sample_size: 0,
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      p25: 0,
      p75: 0,
      confidence: 'low',
    }
  }

  // Freshness-weighted average
  let weightedSum = 0
  let totalWeight = 0
  for (const r of records) {
    const w = getFreshnessWeight(r.created_at)
    weightedSum += r.salary * w
    totalWeight += w
  }
  const average = Math.round(weightedSum / totalWeight)

  return {
    sample_size,
    average,
    median: Math.round(percentile(salaries, 50)),
    min: salaries[0],
    max: salaries[salaries.length - 1],
    p25: Math.round(percentile(salaries, 25)),
    p75: Math.round(percentile(salaries, 75)),
    confidence: getConfidence(sample_size),
  }
}

// ─── Suspicious detection ─────────────────────────────────────────────────────

function isSuspicious(data: { salary: number; student_level: string }): boolean {
  if (data.salary > 100000) return true
  if (data.salary < 1000) return true
  if (data.student_level === 'Preschool' && data.salary > 30000) return true
  if (typeof window !== 'undefined') {
    const lastSubmit = sessionStorage.getItem('tm_last_submit')
    if (lastSubmit && Date.now() - parseInt(lastSubmit) < 60000) return true
  }
  return false
}

// ─── Submit tuition record ────────────────────────────────────────────────────

export async function submitTuitionRecord(
  data: Omit<TuitionRecord, 'id' | 'status' | 'is_suspicious' | 'created_at' | 'source_version' | 'submitted_from'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb()
    const suspicious = isSuspicious({ salary: data.salary, student_level: data.student_level })
    await addDoc(collection(db, 'tuition_records'), {
      ...data,
      status: 'pending',
      is_suspicious: suspicious,
      source_version: 'v2.0',
      submitted_from: 'web',
      created_at: serverTimestamp(),
    })
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tm_last_submit', Date.now().toString())
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: getFirestoreErrorMessage(error) }
  }
}

// ─── Submit pending item ──────────────────────────────────────────────────────

export async function submitPendingItem(
  collectionName: 'pending_areas' | 'pending_subjects' | 'pending_universities' | 'pending_departments',
  value: string
): Promise<void> {
  const db = await getDb()
  await addDoc(collection(db, collectionName), {
    value,
    status: 'pending',
    submitted_at: serverTimestamp(),
  })
}

// ─── Approve / reject pending item ───────────────────────────────────────────

export async function approvePendingItem(collectionName: string, id: string): Promise<void> {
  const db = await getDb()
  await updateDoc(doc(db, collectionName, id), { status: 'approved' })
}

export async function rejectPendingItem(collectionName: string, id: string): Promise<void> {
  const db = await getDb()
  await updateDoc(doc(db, collectionName, id), { status: 'rejected' })
}

export async function approveRecord(id: string): Promise<void> {
  const db = await getDb()
  await updateDoc(doc(db, 'tuition_records', id), { status: 'approved' })
}

export async function rejectRecord(id: string): Promise<void> {
  const db = await getDb()
  await updateDoc(doc(db, 'tuition_records', id), { status: 'rejected' })
}

// ─── Approve / reject ALL items in a queue ───────────────────────────────────

export async function approveAllInQueue(
  collectionName: string,
  ids: string[]
): Promise<void> {
  const db = await getDb()
  await Promise.all(
    ids.map(id => updateDoc(doc(db, collectionName, id), { status: 'approved' }))
  )
}

export async function rejectAllInQueue(
  collectionName: string,
  ids: string[]
): Promise<void> {
  const db = await getDb()
  await Promise.all(
    ids.map(id => updateDoc(doc(db, collectionName, id), { status: 'rejected' }))
  )
}

// ─── Fetch approved options (for submit form + benchmark filters) ─────────────
// Merges static base lists with admin-approved custom items from Firestore.
// pending_* collections are now publicly readable (firestore.rules updated).

export async function fetchApprovedOptions(): Promise<ApprovedOptions> {
  try {
    const db = await getDb()
    const [areasSnap, subjectsSnap, unisSnap, deptsSnap] = await Promise.all([
      getDocs(query(collection(db, 'pending_areas'), where('status', '==', 'approved'))),
      getDocs(query(collection(db, 'pending_subjects'), where('status', '==', 'approved'))),
      getDocs(query(collection(db, 'pending_universities'), where('status', '==', 'approved'))),
      getDocs(query(collection(db, 'pending_departments'), where('status', '==', 'approved'))),
    ])
    const merge = (base: string[], snap: typeof areasSnap) => {
      const extra = snap.docs.map(d => (d.data() as { value: string }).value)
      return [...new Set([...base, ...extra])].sort()
    }
    return {
      areas: merge(AREAS, areasSnap),
      subjects: merge(SUBJECTS, subjectsSnap),
      universities: merge(UNIVERSITIES, unisSnap),
      departments: merge(DEPARTMENTS, deptsSnap),
    }
  } catch {
    // Firestore unavailable — fall back to static lists
    return {
      areas: [...AREAS].sort(),
      subjects: [...SUBJECTS].sort(),
      universities: [...UNIVERSITIES].sort(),
      departments: [...DEPARTMENTS].sort(),
    }
  }
}

// ─── Site stats ───────────────────────────────────────────────────────────────

export async function fetchSiteStats(): Promise<SiteStats> {
  const db = await getDb()
  const snap = await getDocs(
    query(collection(db, 'tuition_records'), where('status', '==', 'approved'))
  )
  const records = snap.docs.map(d => d.data() as TuitionRecord)
  const areas = new Set(records.map(r => r.area))
  const universities = new Set(records.map(r => r.university))
  const subjects = new Set(records.flatMap(r => r.subjects))
  const salaries = records.map(r => r.salary).sort((a, b) => a - b)
  const avg = salaries.length > 0
    ? Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length)
    : 0

  return {
    total_reports: records.length,
    areas_covered: areas.size,
    universities_covered: universities.size,
    subjects_covered: subjects.size,
    highest_salary: salaries.length > 0 ? salaries[salaries.length - 1] : 0,
    lowest_salary: salaries.length > 0 ? salaries[0] : 0,
    avg_salary: avg,
  }
}

// ─── Admin stats ──────────────────────────────────────────────────────────────

export async function fetchAdminStats(): Promise<AdminStats> {
  const db = await getDb()
  const snap = await getDocs(collection(db, 'tuition_records'))
  const records = snap.docs.map(d => d.data() as TuitionRecord)

  const approved = records.filter(r => r.status === 'approved')
  const salaries = approved.map(r => r.salary).sort((a, b) => a - b)

  return {
    total_reports: records.length,
    approved_reports: approved.length,
    pending_reports: records.filter(r => r.status === 'pending').length,
    rejected_reports: records.filter(r => r.status === 'rejected').length,
    areas_covered: new Set(approved.map(r => r.area)).size,
    universities_covered: new Set(approved.map(r => r.university)).size,
    subjects_covered: new Set(approved.flatMap(r => r.subjects)).size,
    median_salary: salaries.length > 0 ? Math.round(percentile(salaries, 50)) : 0,
  }
}

// ─── Fetch pending queues ─────────────────────────────────────────────────────

export async function fetchPendingQueue(
  collectionName: string
): Promise<Array<TuitionRecord & { id: string }>> {
  const db = await getDb()
  const snap = await getDocs(
    query(collection(db, collectionName), where('status', '==', 'pending'))
  )
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as TuitionRecord) }))
}
