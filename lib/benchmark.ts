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

// ─── Filter counts ────────────────────────────────────────────────────────────
// Counts how many approved records exist per option value, for use in the
// benchmark filter sidebar labels (e.g. "Bangla Medium (150)").
// Uses the same single-query + client-side approach as fetchBenchmarkData.

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

// ─── Fetch ALL records (for admin All Records tab) ────────────────────────────

export async function fetchAllRecords(): Promise<Array<TuitionRecord & { id: string }>> {
  const db = await getDb()
  const snap = await getDocs(collection(db, 'tuition_records'))
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as TuitionRecord) }))
    .sort((a, b) => {
      // Most recent first
      const ta = a.created_at instanceof Timestamp ? a.created_at.toMillis() : 0
      const tb = b.created_at instanceof Timestamp ? b.created_at.toMillis() : 0
      return tb - ta
    })
}

// ─── Update record fields (admin edit) ───────────────────────────────────────

export async function updateRecordFields(
  id: string,
  fields: Partial<Omit<TuitionRecord, 'id' | 'created_at' | 'source_version' | 'submitted_from'>>
): Promise<void> {
  const db = await getDb()
  await updateDoc(doc(db, 'tuition_records', id), { ...fields })
}

// ─── Fetch ALL items from a pending collection (admin "All" tabs) ─────────────

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

// ─── Update a pending item's value and/or status ──────────────────────────────

export async function updatePendingItem(
  collectionName: string,
  id: string,
  fields: Partial<Pick<PendingItemDoc, 'value' | 'status'>>
): Promise<void> {
  const db = await getDb()
  await updateDoc(doc(db, collectionName, id), { ...fields })
}

// ─── Find & Replace ───────────────────────────────────────────────────────────
// Replaces all occurrences of `findValue` (case-insensitive) with `replaceValue`
// across tuition_records AND the corresponding pending_* collection.
//
// fieldKey: which field in tuition_records to search ('area' | 'university' |
//           'department' | 'subjects')
// pendingCollection: the corresponding pending_* collection name
//
// For 'subjects', the field is an array — each element is checked individually.
// For all other fields, the field is a plain string.
//
// Returns the total number of documents updated.

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

  if (!findLower || !replaceClean) {
    throw new Error('Both find and replace values are required.')
  }
  if (findLower === replaceClean.toLowerCase()) {
    throw new Error('Find and replace values are identical.')
  }

  // ── 1. Update tuition_records ──────────────────────────────────────────────
  const recordsSnap = await getDocs(collection(db, 'tuition_records'))
  const recordBatch = writeBatch(db)
  let updatedRecords = 0

  for (const docSnap of recordsSnap.docs) {
    const data = docSnap.data() as TuitionRecord
    const ref = doc(db, 'tuition_records', docSnap.id)

    if (fieldKey === 'subjects') {
      // Array field: replace matching elements
      const original = Array.isArray(data.subjects) ? data.subjects : []
      const updated = original.map(s =>
        s.toLowerCase() === findLower ? replaceClean : s
      )
      const changed = updated.some((s, i) => s !== original[i])
      if (changed) {
        recordBatch.update(ref, { subjects: updated })
        updatedRecords++
      }
    } else {
      // String field: replace if it matches (case-insensitive)
      const current = (data[fieldKey] as string) || ''
      if (current.toLowerCase() === findLower) {
        recordBatch.update(ref, { [fieldKey]: replaceClean })
        updatedRecords++
      }
    }
  }

  await recordBatch.commit()

  // ── 2. Update corresponding pending_* collection ──────────────────────────
  const pendingCollection = FIELD_TO_PENDING[fieldKey]
  const pendingSnap = await getDocs(collection(db, pendingCollection))
  const pendingBatch = writeBatch(db)
  let updatedPendingItems = 0

  for (const docSnap of pendingSnap.docs) {
    const data = docSnap.data() as { value: string }
    if ((data.value || '').toLowerCase() === findLower) {
      const ref = doc(db, pendingCollection, docSnap.id)
      pendingBatch.update(ref, { value: replaceClean })
      updatedPendingItems++
    }
  }

  await pendingBatch.commit()

  return { updatedRecords, updatedPendingItems }
}

// ─── Field Values — fetch active values from approved records ─────────────────
// Returns distinct values actually present in approved tuition_records for
// each of the four managed fields. This is what the "Field Values" admin tab
// shows — the live data, not the pending_* option lists.

export type ManagedField = 'area' | 'university' | 'department' | 'subjects'

export interface FieldValueEntry {
  value: string
  count: number   // how many approved records reference this value
}

export async function fetchActiveFieldValues(): Promise<Record<ManagedField, FieldValueEntry[]>> {
  const db = await getDb()
  const snap = await getDocs(
    query(collection(db, 'tuition_records'), where('status', '==', 'approved'))
  )

  const counts: Record<ManagedField, Record<string, number>> = {
    area: {},
    university: {},
    department: {},
    subjects: {},
  }

  for (const d of snap.docs) {
    const r = d.data() as TuitionRecord
    const inc = (field: ManagedField, val: string) => {
      if (!val) return
      counts[field][val] = (counts[field][val] || 0) + 1
    }
    inc('area', r.area)
    inc('university', r.university)
    inc('department', r.department)
    if (Array.isArray(r.subjects)) {
      for (const s of r.subjects) inc('subjects', s)
    }
  }

  const toSorted = (map: Record<string, number>): FieldValueEntry[] =>
    Object.entries(map)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value))

  return {
    area:        toSorted(counts.area),
    university:  toSorted(counts.university),
    department:  toSorted(counts.department),
    subjects:    toSorted(counts.subjects),
  }
}

// ─── Delete a field value ─────────────────────────────────────────────────────
// Removes a value from:
//   1. Every tuition_record where it appears (blanks string fields; removes
//      the element from subjects arrays)
//   2. Every matching doc in the corresponding pending_* collection (any status)
//
// String fields (area, university, department) are set to '' on affected records
// so they remain valid documents. The admin can later use Find & Replace to
// assign a correct value.
//
// Returns counts of what was modified.

export async function deleteFieldValue(
  fieldKey: ManagedField,
  value: string
): Promise<{ updatedRecords: number; deletedPendingItems: number }> {
  const db = await getDb()
  const valueLower = value.trim().toLowerCase()

  if (!valueLower) throw new Error('Value is required.')

  // ── 1. Scrub from tuition_records ─────────────────────────────────────────
  const recordsSnap = await getDocs(collection(db, 'tuition_records'))
  const recordBatch = writeBatch(db)
  let updatedRecords = 0

  for (const docSnap of recordsSnap.docs) {
    const data = docSnap.data() as TuitionRecord
    const ref = doc(db, 'tuition_records', docSnap.id)

    if (fieldKey === 'subjects') {
      const original = Array.isArray(data.subjects) ? data.subjects : []
      const updated = original.filter(s => s.toLowerCase() !== valueLower)
      if (updated.length !== original.length) {
        recordBatch.update(ref, { subjects: updated })
        updatedRecords++
      }
    } else {
      const current = (data[fieldKey] as string) || ''
      if (current.toLowerCase() === valueLower) {
        recordBatch.update(ref, { [fieldKey]: '' })
        updatedRecords++
      }
    }
  }

  await recordBatch.commit()

  // ── 2. Delete from pending_* collection ───────────────────────────────────
  const FIELD_TO_PENDING_LOCAL: Record<ManagedField, string> = {
    area: 'pending_areas',
    university: 'pending_universities',
    department: 'pending_departments',
    subjects: 'pending_subjects',
  }
  const pendingCollection = FIELD_TO_PENDING_LOCAL[fieldKey]
  const pendingSnap = await getDocs(collection(db, pendingCollection))
  const pendingBatch = writeBatch(db)
  let deletedPendingItems = 0

  for (const docSnap of pendingSnap.docs) {
    const data = docSnap.data() as { value: string }
    if ((data.value || '').toLowerCase() === valueLower) {
      pendingBatch.delete(doc(db, pendingCollection, docSnap.id))
      deletedPendingItems++
    }
  }

  await pendingBatch.commit()

  return { updatedRecords, deletedPendingItems }
}
