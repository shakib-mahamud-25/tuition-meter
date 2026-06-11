'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useSubmitForm } from '../../hooks/useSubmitForm'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { MultiSelect } from '../../components/ui/MultiSelect'
import { CURRICULUMS, STUDENT_LEVELS, ACADEMIC_YEARS, HOURS_PER_SESSION } from '../../lib/data'
import type { Curriculum, StudentLevel, AcademicYear, HoursPerSession } from '../../lib/types'

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5">
      <h2 className="font-semibold text-slate-800 text-base border-b border-[#E2E8F0] pb-3">{title}</h2>
      {children}
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-500">{msg}</p>
}

export default function SubmitPage() {
  const {
    form, errors, submitting, submitted, options, optionsLoading,
    update, handleSubmit, reset,
    addCustomArea, addCustomSubject, addCustomUniversity, addCustomDepartment,
  } = useSubmitForm()

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Submission received</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Your salary report has been submitted for review. Once approved, it will contribute to the benchmark data.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 border border-[#E2E8F0] text-slate-700 font-semibold text-sm rounded-xl hover:border-[#059669] hover:text-[#059669] transition-colors"
          >
            Submit Another
          </button>
          <Link
            href="/benchmark"
            className="px-6 py-3 bg-[#059669] text-white font-semibold text-sm rounded-xl hover:bg-emerald-500 transition-colors"
          >
            View Benchmarks →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Submit Your Tuition Salary</h1>
        <p className="text-slate-500 mt-1.5 text-sm">
          All submissions are anonymous and go through moderation before appearing in benchmarks.
        </p>
      </div>

      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        value={form.honeypot}
        onChange={e => update('honeypot', e.target.value)}
        autoComplete="off"
      />

      <div className="space-y-5">
        {/* Monthly Salary */}
        <FormSection title="Monthly Salary">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Monthly salary <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm select-none">৳</span>
              <input
                type="number"
                value={form.salary}
                onChange={e => update('salary', e.target.value)}
                placeholder="e.g. 8000"
                min={500}
                max={500000}
                className={`w-full pl-8 pr-4 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors
                  ${errors.salary ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-[#E2E8F0] focus:border-[#059669] focus:ring-emerald-100'}`}
              />
            </div>
            <FieldError msg={errors.salary} />
          </div>
        </FormSection>

        {/* Tuition Details */}
        <FormSection title="Tuition Details">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Area <span className="text-red-400">*</span>
            </label>
            <SearchableSelect
              options={options?.areas || []}
              value={form.area}
              onChange={v => update('area', v)}
              placeholder={optionsLoading ? 'Loading...' : 'Search area...'}
              allowCustom
              onAddNew={addCustomArea}
              disabled={optionsLoading}
            />
            <FieldError msg={errors.area} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Curriculum <span className="text-red-400">*</span>
              </label>
              <select
                value={form.curriculum}
                onChange={e => update('curriculum', e.target.value as Curriculum)}
                className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 transition-colors
                  ${errors.curriculum ? 'border-red-400 focus:ring-red-200' : 'border-[#E2E8F0] focus:border-[#059669] focus:ring-emerald-100'}`}
              >
                <option value="">Select curriculum</option>
                {CURRICULUMS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <FieldError msg={errors.curriculum} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Student Level <span className="text-red-400">*</span>
              </label>
              <select
                value={form.student_level}
                onChange={e => update('student_level', e.target.value as StudentLevel)}
                className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 transition-colors
                  ${errors.student_level ? 'border-red-400 focus:ring-red-200' : 'border-[#E2E8F0] focus:border-[#059669] focus:ring-emerald-100'}`}
              >
                <option value="">Select level</option>
                {STUDENT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <FieldError msg={errors.student_level} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Subjects <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <MultiSelect
                options={options?.subjects || []}
                value={form.subjects}
                onChange={v => update('subjects', v)}
                placeholder={optionsLoading ? 'Loading...' : 'Select subjects...'}
                allowCustom
                onAddNew={addCustomSubject}
              />
            </div>
            <FieldError msg={errors.subjects} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Days per week <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[2, 3, 4, 5, 6, 7].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => update('days_per_week', d.toString())}
                  className={`py-2.5 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500
                    ${form.days_per_week === d.toString()
                      ? 'bg-[#059669] text-white'
                      : 'bg-white border border-[#E2E8F0] text-slate-600 hover:border-[#059669] hover:text-[#059669]'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <FieldError msg={errors.days_per_week} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Hours per session <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {HOURS_PER_SESSION.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => update('hours_per_session', h as HoursPerSession)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500
                    ${form.hours_per_session === h
                      ? 'bg-[#059669] text-white'
                      : 'bg-white border border-[#E2E8F0] text-slate-600 hover:border-[#059669] hover:text-[#059669]'
                    }`}
                >
                  {h} hr{h !== '1' ? 's' : ''}
                </button>
              ))}
            </div>
            <FieldError msg={errors.hours_per_session} />
          </div>
        </FormSection>

        {/* University Background */}
        <FormSection title="Your University Background">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              University <span className="text-red-400">*</span>
            </label>
            <SearchableSelect
              options={options?.universities || []}
              value={form.university}
              onChange={v => update('university', v)}
              placeholder={optionsLoading ? 'Loading...' : 'Search university...'}
              allowCustom
              onAddNew={addCustomUniversity}
              disabled={optionsLoading}
            />
            <FieldError msg={errors.university} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Department <span className="text-red-400">*</span>
            </label>
            <SearchableSelect
              options={options?.departments || []}
              value={form.department}
              onChange={v => update('department', v)}
              placeholder={optionsLoading ? 'Loading...' : 'Search department...'}
              allowCustom
              onAddNew={addCustomDepartment}
              disabled={optionsLoading}
            />
            <FieldError msg={errors.department} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Academic Year <span className="text-red-400">*</span>
            </label>
            <select
              value={form.academic_year}
              onChange={e => update('academic_year', e.target.value as AcademicYear)}
              className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 transition-colors
                ${errors.academic_year ? 'border-red-400 focus:ring-red-200' : 'border-[#E2E8F0] focus:border-[#059669] focus:ring-emerald-100'}`}
            >
              <option value="">Select academic year</option>
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <FieldError msg={errors.academic_year} />
          </div>
        </FormSection>

        {/* Privacy note */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" className="mt-0.5 flex-shrink-0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="text-blue-700 text-xs leading-relaxed">
            Your submission is fully anonymous. No personal information is collected. Reports are reviewed before appearing in benchmarks.
          </p>
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-[#059669] hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : 'Submit Salary Report'}
        </button>
      </div>
    </div>
  )
}
