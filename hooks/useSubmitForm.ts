'use client'

import { useState, useCallback, useEffect } from 'react'
import { submitTuitionRecord, fetchApprovedOptions } from '../lib/benchmark'
import { trackSalarySubmit, trackCustomItemAdded } from '../lib/analytics'
import type { SubmitFormData, ApprovedOptions, Curriculum, StudentLevel, AcademicYear, HoursPerSession, TuitionRecord } from '../lib/types'

const initialForm: SubmitFormData = {
  salary: '',
  area: '',
  curriculum: '',
  student_level: '',
  subjects: [],
  days_per_week: '',
  hours_per_session: '',
  university: '',
  department: '',
  academic_year: '',
  honeypot: '',
}

interface UseSubmitFormReturn {
  form: SubmitFormData
  errors: Partial<Record<keyof SubmitFormData, string>>
  submitting: boolean
  submitted: boolean
  options: ApprovedOptions | null
  optionsLoading: boolean
  update: (field: keyof SubmitFormData, value: unknown) => void
  handleSubmit: () => Promise<void>
  reset: () => void
  addCustomArea: (value: string) => Promise<void>
  addCustomSubject: (value: string) => Promise<void>
  addCustomUniversity: (value: string) => Promise<void>
  addCustomDepartment: (value: string) => Promise<void>
}

// ─── Custom value handling ─────────────────────────────────────────────────────
// A custom area/subject/university/department typed by the user no longer
// writes to a separate pending_* collection. It simply becomes the value of
// that field on the form, and gets submitted as part of the record itself.
// Once an admin approves the record, fetchApprovedOptions() picks it up
// automatically (it derives the dropdown list live from approved records).
// This keeps the dropdown options list in this local session in sync
// optimistically, so the user can see and use their own new entry right away.

export function useSubmitForm(): UseSubmitFormReturn {
  const [form, setForm] = useState<SubmitFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof SubmitFormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [options, setOptions] = useState<ApprovedOptions | null>(null)
  const [optionsLoading, setOptionsLoading] = useState(true)

  useEffect(() => {
    fetchApprovedOptions()
      .then(setOptions)
      .catch(() => setOptions(null))
      .finally(() => setOptionsLoading(false))
  }, [])

  const update = useCallback((field: keyof SubmitFormData, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }, [])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SubmitFormData, string>> = {}
    const salary = parseInt(form.salary)
    if (!form.salary || isNaN(salary) || salary < 500 || salary > 500000) {
      newErrors.salary = 'Enter a salary between ৳500 and ৳500,000'
    }
    if (!form.area) newErrors.area = 'Select an area'
    if (!form.curriculum) newErrors.curriculum = 'Select a curriculum'
    if (!form.student_level) newErrors.student_level = 'Select a student level'
    if (form.subjects.length === 0) newErrors.subjects = 'Select at least one subject'
    if (!form.days_per_week) newErrors.days_per_week = 'Select days per week'
    if (!form.hours_per_session) newErrors.hours_per_session = 'Select hours per session'
    if (!form.university) newErrors.university = 'Select a university'
    if (!form.department) newErrors.department = 'Select a department'
    if (!form.academic_year) newErrors.academic_year = 'Select academic year'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = useCallback(async () => {
    if (form.honeypot) return
    if (!validate()) return

    setSubmitting(true)
    try {
      const record = {
        salary: parseInt(form.salary),
        area: form.area,
        curriculum: form.curriculum as Curriculum,
        student_level: form.student_level as StudentLevel,
        subjects: form.subjects,
        days_per_week: parseInt(form.days_per_week),
        hours_per_session: form.hours_per_session as HoursPerSession,
        university: form.university,
        department: form.department,
        academic_year: form.academic_year as AcademicYear,
      }
      const result = await submitTuitionRecord(record)
      if (result.success) {
        await trackSalarySubmit(record as Partial<TuitionRecord>)
        setSubmitted(true)
      } else {
        setErrors({ salary: result.error || 'Submission failed. Please try again.' })
      }
    } catch {
      setErrors({ salary: 'Submission failed. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }, [form])

  const reset = useCallback(() => {
    setForm(initialForm)
    setErrors({})
    setSubmitted(false)
  }, [])

  // Custom value handlers — purely local now. No Firestore write happens here;
  // the value is submitted as part of the record in handleSubmit() above, and
  // becomes a permanent dropdown option once an admin approves that record.

  const addCustomArea = useCallback(async (value: string) => {
    await trackCustomItemAdded('area', value)
    setOptions(prev => prev ? { ...prev, areas: [...new Set([...prev.areas, value])].sort() } : prev)
    update('area', value)
  }, [update])

  const addCustomSubject = useCallback(async (value: string) => {
    await trackCustomItemAdded('subject', value)
    setOptions(prev => prev ? { ...prev, subjects: [...new Set([...prev.subjects, value])].sort() } : prev)
    update('subjects', [...form.subjects, value])
  }, [update, form.subjects])

  const addCustomUniversity = useCallback(async (value: string) => {
    await trackCustomItemAdded('university', value)
    setOptions(prev => prev ? { ...prev, universities: [...new Set([...prev.universities, value])].sort() } : prev)
    update('university', value)
  }, [update])

  const addCustomDepartment = useCallback(async (value: string) => {
    await trackCustomItemAdded('department', value)
    setOptions(prev => prev ? { ...prev, departments: [...new Set([...prev.departments, value])].sort() } : prev)
    update('department', value)
  }, [update])

  return {
    form, errors, submitting, submitted, options, optionsLoading,
    update, handleSubmit, reset,
    addCustomArea, addCustomSubject, addCustomUniversity, addCustomDepartment,
  }
}
