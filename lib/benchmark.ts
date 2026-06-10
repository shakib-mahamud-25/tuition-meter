import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from './firebase/config';
import {
  BenchmarkFilters,
  BenchmarkStats,
  ConfidenceLevel,
  SiteStats,
  TuitionRecord,
} from './types';

// ─── Benchmark Calculation ────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function getConfidence(n: number): ConfidenceLevel {
  if (n >= 50) return 'high';
  if (n >= 10) return 'medium';
  return 'low';
}

export function calculateBenchmark(salaries: number[]): BenchmarkStats {
  const sorted = [...salaries].sort((a, b) => a - b);
  const n = sorted.length;

  if (n === 0) {
    return { sample_size: 0, average: 0, median: 0, min: 0, max: 0, p25: 0, p75: 0, confidence: 'low' };
  }

  const sum = sorted.reduce((acc, v) => acc + v, 0);

  return {
    sample_size: n,
    average: Math.round(sum / n),
    median: Math.round(percentile(sorted, 50)),
    min: sorted[0],
    max: sorted[n - 1],
    p25: Math.round(percentile(sorted, 25)),
    p75: Math.round(percentile(sorted, 75)),
    confidence: getConfidence(n),
  };
}

// ─── Firestore Queries ────────────────────────────────────────────────────────

const EIGHTEEN_MONTHS_MS = 18 * 30 * 24 * 60 * 60 * 1000;

export async function fetchBenchmarkData(filters: BenchmarkFilters): Promise<BenchmarkStats> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - EIGHTEEN_MONTHS_MS);
  const cutoffTimestamp = Timestamp.fromDate(cutoff);

  const constraints: Parameters<typeof query>[1][] = [
    where('status', '==', 'approved'),
    where('created_at', '>=', cutoffTimestamp),
  ];

  if (filters.area) constraints.push(where('area', '==', filters.area));
  if (filters.student_level) constraints.push(where('student_level', '==', filters.student_level));
  if (filters.curriculum) constraints.push(where('curriculum', '==', filters.curriculum));
  if (filters.university) constraints.push(where('university', '==', filters.university));
  if (filters.department) constraints.push(where('department', '==', filters.department));
  if (filters.academic_year) constraints.push(where('academic_year', '==', filters.academic_year));
  if (filters.days_per_week) constraints.push(where('days_per_week', '==', filters.days_per_week));

  const q = query(collection(db, 'tuition_records'), ...constraints);
  const snap = await getDocs(q);

  let docs = snap.docs;

  if (filters.subjects && filters.subjects.length > 0) {
    docs = docs.filter((d) => {
      const record = d.data() as TuitionRecord;
      return filters.subjects!.some((s) => record.subjects.includes(s));
    });
  }

  const salaries = docs.map((d) => (d.data() as TuitionRecord).salary);
  return calculateBenchmark(salaries);
}

export async function fetchSiteStats(): Promise<SiteStats> {
  try {
    const db = await getDb();
    const approvedQ = query(collection(db, 'tuition_records'), where('status', '==', 'approved'));
    const snap = await getDocs(approvedQ);
    const records = snap.docs.map((d) => d.data() as TuitionRecord);

    return {
      total_reports: records.length,
      areas_covered: new Set(records.map((r) => r.area)).size,
      universities_covered: new Set(records.map((r) => r.university)).size,
      subjects_covered: new Set(records.flatMap((r) => r.subjects)).size,
    };
  } catch {
    return { total_reports: 0, areas_covered: 0, universities_covered: 0, subjects_covered: 0 };
  }
}

export async function submitTuitionRecord(
  data: Omit<TuitionRecord, 'id' | 'created_at' | 'status'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    await addDoc(collection(db, 'tuition_records'), {
      ...data,
      status: 'approved',
      created_at: serverTimestamp(),
    });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Submission failed. Please try again.' };
  }
}

export async function submitPendingItem(
  collectionName: 'pending_areas' | 'pending_subjects' | 'pending_universities' | 'pending_departments',
  value: string
): Promise<void> {
  const db = await getDb();
  await addDoc(collection(db, collectionName), {
    value,
    status: 'pending',
    submitted_at: serverTimestamp(),
  });
}

export function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateInsight(stats: BenchmarkStats): string {
  if (stats.sample_size === 0) return 'No data matches your filters. Try broadening your search.';
  if (stats.confidence === 'low') {
    return `Data is limited (${stats.sample_size} report${stats.sample_size > 1 ? 's' : ''}). Interpret results carefully.`;
  }
  return `Most tutors matching these criteria earn between ${formatBDT(stats.p25)} and ${formatBDT(stats.p75)} BDT per month, with a median of ${formatBDT(stats.median)} BDT.`;
}
