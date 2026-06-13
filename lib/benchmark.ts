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
  writeBatch,
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
  HistogramBucket,
  BreakdownBar,
  AreaRanking,
  FilterCounts,
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
  if (!createdAt) return 1.0
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
  if (!createdAt) return Date.now()
  try {
    return createdAt instanceof Timestamp
      ? createdAt.toDate().getTime()
      : (createdAt as Date).getTime()
  } catch {
    return Date.now()
  }
}

// ─── Histogram builder ────────────────────────────────────────────────────────
// Produces 6–8 human-friendly salary buckets covering [min, max].
// Bucket boundaries are rounded to "nice" numbers so labels are readable.

function buildHistogram(sortedSalaries: number[]): HistogramBucket[] {
  if (sortedSalaries.length === 0) return []
  const min = sortedSalaries[0]
  const max = sortedSalaries[sortedSalaries.length - 1]
  if (min === max) {
    return [{ label: formatBDT(min), rangeMin: min, rangeMax: max, count: sortedSalaries.length }]
  }

  // Choose a "nice" step size that yields 6–8 buckets
  const rawRange = max - min
  const targetBuckets = 7
  const rawStep = rawRange / targetBuckets

  // Round step up to nearest nice number (500, 1000, 2000, 5000, 10000…)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const niceMultiples = [1, 2, 2.5, 5, 10]
  let step = magnitude * 10
  for (const m of niceMultiples) {
    const candidate = magnitude * m
    if (candidate >= rawStep) { step = candidate; break }
  }

  // First boundary: floor min to nearest step
  const firstBoundary = Math.floor(min / step) * step
  const boundaries: number[] = []
  let b = firstBoundary
  while (b <= max + step) {
    boundaries.push(b)
    b += step
    if (boundaries.length > 12) break // safety cap
  }

  // Build buckets
  const buckets: HistogramBucket[] = []
  for (let i = 0; i < boundaries.length - 1; i++) {
    const rangeMin = boundaries[i]
    const rangeMax = boundaries[i + 1]
    const count = sortedSalaries.filter(s =>
      i === boundaries.length - 2 ? s >= rangeMin && s <= rangeMax : s >= rangeMin && s < rangeMax
    ).length
    // Only include buckets that overlap [min, max]
    if (rangeMax < min || rangeMin > max) continue
    const kLabel = (v: number) => v >= 1000 ? `${v / 1000 % 1 === 0 ? v / 1000 : (v / 1000).toFixed(1)}k` : v.toString()
    buckets.push({
      label: `৳${kLabel(rangeMin)}–৳${kLabel(rangeMax)}`,
      rangeMin,
      rangeMax,
      count,
    })
  }
  return buckets
}

// ─── Breakdown builder ────────────────────────────────────────────────────────
// Groups records by a string key and computes average salary per group.

function buildBreakdown(
  records: TuitionRecord[],
  key: keyof Pick<TuitionRecord, 'student_level' | 'curriculum'>
): BreakdownBar[] {
  const groups: Record<string, number[]> = {}
  for (const r of records) {
    const k = r[key] as string
    if (!k) continue
    if (!groups[k]) groups[k] = []
    groups[k].push(r.salary)
  }
  return Object.entries(groups)
    .map(([label, salaries]) => ({
      label,
      average: Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length),
      count: salaries.length,
    }))
    .sort((a, b) => b.average - a.average)
}

// ─── Area ranking builder ─────────────────────────────────────────────────────

function buildAreaRankings(records: TuitionRecord[]): AreaRanking[] {
  const groups: Record<string, number[]> = {}
  for (const r of records) {
    if (!r.area) continue
    if (!groups[r.area]) groups[r.area] = []
    groups[r.area].push(r.salary)
  }
  return Object.entries(groups)
    .map(([area, salaries]) => ({
      area,
      average: Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length),
      count: salaries.length,
    }))
    .sort((a, b) => b.average - a.average)
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

  // Date window filter
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

  const emptyViz = {
    histogram: [] as HistogramBucket[],
    levelBreakdown: [] as BreakdownBar[],
    curriculumBreakdown: [] as BreakdownBar[],
    areaRankings: [] as AreaRanking[],
    sortedSalaries: [] as number[],
  }

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
      ...emptyViz,
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
    // ── Visualisation data ────────────────────────────────────────────────────
    histogram: buildHistogram(salaries),
    levelBreakdown: buildBreakdown(records, 'student_level'),
    curriculumBreakdown: buildBreakdown(records, 'curriculum'),
    areaRankings: buildAreaRankings(records),
    sortedSalaries: salaries,
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

// ─── Fetch approved options ───────────────────────────────────────────────────

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
    return {
      areas: [...AREAS].sort(),
      subjects: [...SUBJECTS].sort(),
      universities: [...UNIVERSITIES].sort(),
      departments: [...DEPARTMENTS].sort(),
    }
  }
}

// ─── Filter counts ────────────────────────────────────────────────────────────

export async function fetchFilterCounts(): Promise<FilterCounts> {
  try {
    const db = await getDb()
    const snap = await getDocs(
      query(collection(db, 'tuition_records'), where('status', '==', 'approved'))
    )

    const areas: Record<string, number> = {}
    const subjects: Record<string, number> = {}
    const universities: Record<string, number> = {}
    const departments: Record<string, number> = {}
    const curricula: Record<string, number> = {}
    const student_levels: Record<string, number> = {}
    const academic_years: Record<string, number> = {}
    const days_per_week: Record<number, number> = {}

    for (const d of snap.docs) {
      const r = d.data() as TuitionRecord
      if (r.area) areas[r.area] = (areas[r.area] || 0) + 1
      if (r.university) universities[r.university] = (universities[r.university] || 0) + 1
      if (r.department) departments[r.department] = (departments[r.department] || 0) + 1
      if (r.curriculum) curricula[r.curriculum] = (curricula[r.curriculum] || 0) + 1
      if (r.student_level) student_levels[r.student_level] = (student_levels[r.student_level] || 0) + 1
      if (r.academic_year) academic_years[r.academic_year] = (academic_years[r.academic_year] || 0) + 1
      if (r.days_per_week) days_per_week[r.days_per_week] = (days_per_week[r.days_per_week] || 0) + 1
      if (Array.isArray(r.subjects)) {
        for (const s of r.subjects) {
          subjects[s] = (subjects[s] || 0) + 1
        }
      }
    }

    return { areas, subjects, universities, departments, curricula, student_levels, academic_years, days_per_week }
  } catch {
    return {
      areas: {}, subjects: {}, universities: {}, departments: {},
      curricula: {}, student_levels: {}, academic_years: {}, days_per_week: {},
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

// ─── Fetch ALL records ────────────────────────────────────────────────────────

export async function fetchAllRecords(): Promise<Array<TuitionRecord & { id: string }>> {
  const db = await getDb()
  const snap = await getDocs(collection(db, 'tuition_records'))
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as TuitionRecord) }))
    .sort((a, b) => {
      const ta = a.created_at instanceof Timestamp ? a.created_at.toMillis() : 0
      const tb = b.created_at instanceof Timestamp ? b.created_at.toMillis() : 0
      return tb - ta
    })
}

// ─── Update record fields ─────────────────────────────────────────────────────

export async function updateRecordFields(
  id: string,
  fields: Partial<Omit<TuitionRecord, 'id' | 'created_at' | 'source_version' | 'submitted_from'>>
): Promise<void> {
  const db = await getDb()
  await updateDoc(doc(db, 'tuition_records', id), { ...fields })
}

// ─── Fetch ALL items from a pending collection ────────────────────────────────

export interface PendingItemDoc {
  id: string
  value: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at?: Timestamp | null
}

export async function fetchAllPendingItems(
  collectionName: string
): Promise<PendingItemDoc[]> {
  const db = await getDb()
  const snap = await getDocs(collection(db, collectionName))
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<PendingItemDoc, 'id'>) }))
    .sort((a, b) => {
      const ta = a.submitted_at instanceof Timestamp ? a.submitted_at.toMillis() : 0
      const tb = b.submitted_at instanceof Timestamp ? b.submitted_at.toMillis() : 0
      return tb - ta
    })
}

// ─── Update a pending item ────────────────────────────────────────────────────

export async function updatePendingItem(
  collectionName: string,
  id: string,
  fields: Partial<Pick<PendingItemDoc, 'value' | 'status'>>
): Promise<void> {
  const db = await getDb()
  await updateDoc(doc(db, collectionName, id), { ...fields })
}

// ─── Find & Replace ───────────────────────────────────────────────────────────

export type FindReplaceField = 'area' | 'university' | 'department' | 'subjects'

const FIELD_TO_PENDING: Record<FindReplaceField, string> = {
  area: 'pending_areas',
  university: 'pending_universities',
  department: 'pending_departments',
  subjects: 'pending_subjects',
}

export async function findAndReplace(
  fieldKey: FindReplaceField,
  findValue: string,
  replaceValue: string
): Promise<{ updatedRecords: number; updatedPendingItems: number }> {
  const db = await getDb()
  const findLower = findValue.trim().toLowerCase()
  const replaceClean = replaceValue.trim()

  if (!findLower || !replaceClean) throw new Error('Both find and replace values are required.')
  if (findLower === replaceClean.toLowerCase()) throw new Error('Find and replace values are identical.')

  const recordsSnap = await getDocs(collection(db, 'tuition_records'))
  const recordBatch = writeBatch(db)
  let updatedRecords = 0

  for (const docSnap of recordsSnap.docs) {
    const data = docSnap.data() as TuitionRecord
    const ref = doc(db, 'tuition_records', docSnap.id)

    if (fieldKey === 'subjects') {
      const original = Array.isArray(data.subjects) ? data.subjects : []
      const updated = original.map(s => s.toLowerCase() === findLower ? replaceClean : s)
      if (updated.some((s, i) => s !== original[i])) {
        recordBatch.update(ref, { subjects: updated })
        updatedRecords++
      }
    } else {
      const current = (data[fieldKey] as string) || ''
      if (current.toLowerCase() === findLower) {
        recordBatch.update(ref, { [fieldKey]: replaceClean })
        updatedRecords++
      }
    }
  }

  await recordBatch.commit()

  const pendingSnap = await getDocs(collection(db, FIELD_TO_PENDING[fieldKey]))
  const pendingBatch = writeBatch(db)
  let updatedPendingItems = 0

  for (const docSnap of pendingSnap.docs) {
    const data = docSnap.data() as { value: string }
    if ((data.value || '').toLowerCase() === findLower) {
      pendingBatch.update(doc(db, FIELD_TO_PENDING[fieldKey], docSnap.id), { value: replaceClean })
      updatedPendingItems++
    }
  }

  await pendingBatch.commit()
  return { updatedRecords, updatedPendingItems }
}
