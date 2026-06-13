import { Timestamp } from 'firebase/firestore'

export type Curriculum = 'Bangla Medium' | 'English Version' | 'English Medium'

export type StudentLevel =
  | 'Preschool'
  | 'Class 1–2'
  | 'Class 3–5'
  | 'Class 6–8'
  | 'Class 9–10'
  | 'SSC Candidate'
  | 'Class 11–12'
  | 'HSC Candidate'
  | 'Admission Candidate'

export type AcademicYear =
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '4th Year'
  | 'Masters'
  | 'Graduate'

export type HoursPerSession = '1' | '1.5' | '2' | '2.5' | '3+'

export type RecordStatus = 'approved' | 'pending' | 'rejected'

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export type QueueType = 'areas' | 'subjects' | 'universities' | 'departments'

export interface TuitionRecord {
  id?: string
  salary: number
  area: string
  student_level: StudentLevel
  curriculum: Curriculum
  subjects: string[]
  days_per_week: number
  hours_per_session: HoursPerSession
  university: string
  department: string
  academic_year: AcademicYear
  status: RecordStatus
  is_suspicious: boolean
  created_at: Timestamp | Date
  source_version: string
  submitted_from: string
}

export interface PendingItem {
  id?: string
  value: string
  submitted_at: Timestamp | Date
  status: 'pending' | 'approved' | 'rejected'
}

export interface BenchmarkFilters {
  area?: string
  student_level?: StudentLevel
  curriculum?: Curriculum
  subjects?: string[]
  university?: string
  department?: string
  academic_year?: AcademicYear
  days_per_week?: number
}

export interface BenchmarkStats {
  sample_size: number
  average: number
  median: number
  min: number
  max: number
  p25: number
  p75: number
  confidence: ConfidenceLevel
}

export interface SiteStats {
  total_reports: number
  areas_covered: number
  universities_covered: number
  subjects_covered: number
  highest_salary: number
  lowest_salary: number
  avg_salary: number
}

export interface AdminStats {
  total_reports: number
  approved_reports: number
  pending_reports: number
  rejected_reports: number
  areas_covered: number
  universities_covered: number
  subjects_covered: number
  median_salary: number
}

export interface ApprovedOptions {
  areas: string[]
  subjects: string[]
  universities: string[]
  departments: string[]
}

export interface SubmitFormData {
  salary: string
  area: string
  curriculum: Curriculum | ''
  student_level: StudentLevel | ''
  subjects: string[]
  days_per_week: string
  hours_per_session: HoursPerSession | ''
  university: string
  department: string
  academic_year: AcademicYear | ''
  honeypot: string
}

// ─── Filter counts: number of approved reports per option value ───────────────
// Used by FilterSidebar to show "Bangla Medium (150)" style labels.
export interface FilterCounts {
  areas: Record<string, number>
  subjects: Record<string, number>
  universities: Record<string, number>
  departments: Record<string, number>
  curricula: Record<string, number>
  student_levels: Record<string, number>
  academic_years: Record<string, number>
  days_per_week: Record<number, number>
}
