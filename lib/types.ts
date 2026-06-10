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
  created_at: Timestamp | Date
  honeypot?: string
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
