'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SearchableSelect from '@/components/ui/SearchableSelect'
import MultiSelect from '@/components/ui/MultiSelect'
import { submitTuitionRecord, submitPendingItem, fetchApprovedItems } from '@/lib/benchmark'
import { AREAS, UNIVERSITIES, DEPARTMENTS, SUBJECTS, CURRICULUMS, STUDENT_LEVELS, ACADEMIC_YEARS, HOURS_OPTIONS } from '@/lib/data'
import type { SubmitFormData, Curriculum, StudentLevel, AcademicYear, HoursPerSession } from '@/lib/types'

const DEFAULT_FORM: SubmitFormData = {
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

export default function SubmitPage() {
  const [form, setForm] = useState<SubmitFormData>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof SubmitFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Dynamic approved items
  const [areaOptions, setAreaOptions] = useState<string[]>(AREAS)
  const [subjectOptions, setSubjectOptions] = useState<string[]>(SUBJECTS)
  const [universityOptions, setUniversityOptions] = useState<string[]>(UNIVERSITIES)
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(DEPARTMENTS)

  useEffect(() => {
    async function loadApproved() {
      try {
        const [areas, subjects, universities, departments] = await Promise.all([
          fetchApprovedItems('pending_areas'),
          fetchApprovedItems('pending_subjects'),
          fetchApprovedItems('pending_universities'),
          fetchApprovedItems('pending_departments'),
        ])
        setAreaOptions([...new Set([...AREAS, ...areas])])
        setSubjectOptions([...new Set([...SUBJECTS, ...subjects])])
        setUniversityOptions([...new Set([...UNIVERSITIES, ...universities])])
        setDepartmentOptions([...new Set([...DEPARTMENTS, ...departments])])
      } catch {
        // Non-critical — use static defaults
      }
    }
    loadApproved()
  }, [])

  function set<K extends keyof SubmitFormData>(key: K, val: SubmitFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof SubmitFormData, string>> = {}
    const salary = parseInt(form.salary, 10)
    if (!form.salary || isNaN(salary)) e.salary = 'Please enter your monthly salary.'
    else if (salary < 500) e.salary = 'Minimum salary is ৳500.'
    else if (salary > 500000) e.salary = 'Maximum salary is ৳500,000.'
    if (!form.area) e.area = 'Please select an area.'
    if (!form.curriculum) e.curriculum = 'Please select a curriculum.'
    if (!form.student_level) e.student_level = 'Please select a student level.'
    if (form.subjects.length === 0) e.subjects = 'Please select at least one subject.'
    if (!form.days_per_week) e.days_per_week = 'Please select days per week.'
    if (!form.hours_per_session) e.hours_per_session = 'Please select hours per session.'
    if (!form.university) e.university = 'Please select your university.'
    if (!form.department) e.department = 'Please select your department.'
    if (!form.academic_year) e.academic_year = 'Please select your academic year.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    // Honeypot check
    if (form.honeypot) return

    if (!validate()) return
    setLoading(true)
    setGeneralError(null)

    try {
      await submitTuitionRecord({
        salary: parseInt(form.salary, 10),
        area: form.area,
        curriculum: form.curriculum as Curriculum,
        student_level: form.student_level as StudentLevel,
        subjects: form.subjects,
        days_per_week: parseInt(form.days_per_week, 10),
        hours_per_session: form.hours_per_session as HoursPerSession,
        university: form.university,
        department: form.department,
        academic_year: form.academic_year as AcademicYear,
      })
      setSuccess(true)
    } catch (e) {
      console.error(e)
      setGeneralError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddNew(collection: string, value: string) {
    try {
      await submitPendingItem(collection, value)
    } catch {
      // Non-critical
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Submission Received!</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Thank you for contributing. Your anonymous data helps tutors across Bangladesh understand market rates better.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setForm(DEFAULT_FORM); setSuccess(false) }}
            className="px-6 py-2.5 rounded-lg bg-[#F1F5F9] text-gray-700 font-semibold text-sm hover:bg-[#E2E8F0] transition-colors"
          >
            Submit Another
          </button>
          <Link
            href="/benchmark"
            className="px-6 py-2.5 rounded-lg bg-[#059669] text-white font-semibold text-sm hover:bg-emerald-600 transition-colors text-center"
          >
            View Benchmarks
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Submit Tuition Salary</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Completely anonymous. No name, phone, email, or identity collected — ever.
        </p>
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        style={{ display: 'none' }}
        tabIndex={-1}
        value={form.honeypot}
        onChange={(e) => set('honeypot', e.target.value)}
        autoComplete="off"
      />

      {generalError && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {generalError}
        </div>
      )}

      <div className="space-y-8">
        {/* Section: Monthly Salary */}
        <section className="bg-white border border-[#E2E8F0] rounded-xl p-6">
          <h2 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#D1FAE5] text-[#059669] text-xs font-bold flex items-center justify-center">1</span>
            Monthly Salary
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monthly earnings from this tuition (BDT)
            </label>
            <div className="flex items-center rounded-lg border border-[#E2E8F0] overflow-hidden focus-within:border-[#059669] focus-within:ring-1 focus-within:ring-[#059669] transition-colors">
              <span className="px-3 py-2.5 bg-[#F8FAFC] text-gray-500 text-sm font-medium border-r border-[#E2E8F0] flex-shrink-0">৳</span>
              <input
                type="number"
                min={500}
                max={500000}
                className="flex-1 px-3 py-2.5 text-sm outline-none bg-white tabular-nums"
                placeholder="e.g. 5000"
                value={form.salary}
                onChange={(e) => set('salary', e.target.value)}
              />
            </div>
            {errors.salary && <p className="mt-1 text-xs text-red-500">{errors.salary}</p>}
          </div>
        </section>

        {/* Section: Tuition Details */}
        <section className="bg-white border border-[#E2E8F0] rounded-xl p-6">
          <h2 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#D1FAE5] text-[#059669] text-xs font-bold flex items-center justify-center">2</span>
            Tuition Details
          </h2>
          <div className="space-y-4">
            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Area</label>
              <SearchableSelect
                options={areaOptions}
                value={form.area}
                onChange={(v) => set('area', v)}
                placeholder="Select area..."
                allowCustom
                onAddNew={(v) => handleAddNew('pending_areas', v)}
              />
              {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area}</p>}
            </div>

            {/* Curriculum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Curriculum</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-gray-700 bg-white hover:border-[#94A3B8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none transition-colors"
                value={form.curriculum}
                onChange={(e) => set('curriculum', e.target.value as Curriculum | '')}
              >
                <option value="">Select curriculum...</option>
                {CURRICULUMS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.curriculum && <p className="mt-1 text-xs text-red-500">{errors.curriculum}</p>}
            </div>

            {/* Student Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Level</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-gray-700 bg-white hover:border-[#94A3B8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none transition-colors"
                value={form.student_level}
                onChange={(e) => set('student_level', e.target.value as StudentLevel | '')}
              >
                <option value="">Select level...</option>
                {STUDENT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.student_level && <p className="mt-1 text-xs text-red-500">{errors.student_level}</p>}
            </div>

            {/* Subjects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subjects (select all that apply)</label>
              <MultiSelect
                options={subjectOptions}
                value={form.subjects}
                onChange={(v) => set('subjects', v)}
                placeholder="Search and select subjects..."
                allowCustom
                onAddNew={(v) => handleAddNew('pending_subjects', v)}
              />
              {errors.subjects && <p className="mt-1 text-xs text-red-500">{errors.subjects}</p>}
            </div>

            {/* Days per week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Days Per Week</label>
              <div className="grid grid-cols-6 gap-2">
                {[2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set('days_per_week', String(d))}
                    className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      form.days_per_week === String(d)
                        ? 'bg-[#059669] text-white border-[#059669]'
                        : 'bg-white text-gray-600 border-[#E2E8F0] hover:border-[#059669] hover:text-[#059669]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {errors.days_per_week && <p className="mt-1 text-xs text-red-500">{errors.days_per_week}</p>}
            </div>

            {/* Hours per session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hours Per Session</label>
              <div className="flex flex-wrap gap-2">
                {HOURS_OPTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => set('hours_per_session', h)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      form.hours_per_session === h
                        ? 'bg-[#059669] text-white border-[#059669]'
                        : 'bg-white text-gray-600 border-[#E2E8F0] hover:border-[#059669] hover:text-[#059669]'
                    }`}
                  >
                    {h} hr{h === '1' ? '' : 's'}
                  </button>
                ))}
              </div>
              {errors.hours_per_session && <p className="mt-1 text-xs text-red-500">{errors.hours_per_session}</p>}
            </div>
          </div>
        </section>

        {/* Section: University Background */}
        <section className="bg-white border border-[#E2E8F0] rounded-xl p-6">
          <h2 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#D1FAE5] text-[#059669] text-xs font-bold flex items-center justify-center">3</span>
            Your University Background
          </h2>
          <div className="space-y-4">
            {/* University */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">University</label>
              <SearchableSelect
                options={universityOptions}
                value={form.university}
                onChange={(v) => set('university', v)}
                placeholder="Search university..."
                allowCustom
                onAddNew={(v) => handleAddNew('pending_universities', v)}
              />
              {errors.university && <p className="mt-1 text-xs text-red-500">{errors.university}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <SearchableSelect
                options={departmentOptions}
                value={form.department}
                onChange={(v) => set('department', v)}
                placeholder="Search department..."
                allowCustom
                onAddNew={(v) => handleAddNew('pending_departments', v)}
              />
              {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-gray-700 bg-white hover:border-[#94A3B8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none transition-colors"
                value={form.academic_year}
                onChange={(e) => set('academic_year', e.target.value as AcademicYear | '')}
              >
                <option value="">Select year...</option>
                {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.academic_year && <p className="mt-1 text-xs text-red-500">{errors.academic_year}</p>}
            </div>
          </div>
        </section>

        {/* Privacy notice + Submit */}
        <div className="space-y-4">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            By submitting, you confirm this data is accurate. No personal information is collected.
            See our <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
          </p>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#059669] text-white font-bold text-base hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Anonymously'}
          </button>
        </div>
      </div>
    </div>
  )
}
