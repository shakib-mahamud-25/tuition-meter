'use client'

import { useState } from 'react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import MultiSelect from '@/components/ui/MultiSelect'
import type { BenchmarkFilters, Curriculum, StudentLevel, AcademicYear } from '@/lib/types'
import { AREAS, UNIVERSITIES, DEPARTMENTS, SUBJECTS, CURRICULUMS, STUDENT_LEVELS, ACADEMIC_YEARS } from '@/lib/data'

interface FilterSidebarProps {
  onApply: (filters: BenchmarkFilters) => void
  loading: boolean
}

const defaultFilters: BenchmarkFilters = {}

export default function FilterSidebar({ onApply, loading }: FilterSidebarProps) {
  const [local, setLocal] = useState<BenchmarkFilters>(defaultFilters)

  function set<K extends keyof BenchmarkFilters>(key: K, val: BenchmarkFilters[K]) {
    setLocal((prev) => ({ ...prev, [key]: val || undefined }))
  }

  function clearAll() {
    setLocal(defaultFilters)
  }

  const activeCount = Object.values(local).filter((v) =>
    v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  return (
    <aside className="bg-white border border-[#E2E8F0] rounded-xl p-5 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#059669] text-white text-xs font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-[#059669] hover:underline font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Location */}
        <section>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Location
          </label>
          <SearchableSelect
            options={AREAS}
            value={local.area ?? ''}
            onChange={(v) => set('area', v || undefined)}
            placeholder="Select area..."
          />
        </section>

        {/* Student */}
        <section>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Student Level
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-gray-700 bg-white hover:border-[#94A3B8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none transition-colors"
            value={local.student_level ?? ''}
            onChange={(e) => set('student_level', (e.target.value as StudentLevel) || undefined)}
          >
            <option value="">Any level</option>
            {STUDENT_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 mt-3">
            Curriculum
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-gray-700 bg-white hover:border-[#94A3B8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none transition-colors"
            value={local.curriculum ?? ''}
            onChange={(e) => set('curriculum', (e.target.value as Curriculum) || undefined)}
          >
            <option value="">Any curriculum</option>
            {CURRICULUMS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </section>

        {/* Subjects */}
        <section>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Subjects
          </label>
          <MultiSelect
            options={SUBJECTS}
            value={local.subjects ?? []}
            onChange={(v) => set('subjects', v.length > 0 ? v : undefined)}
            placeholder="Any subject..."
          />
        </section>

        {/* Tutor background */}
        <section>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Tutor's University
          </label>
          <SearchableSelect
            options={UNIVERSITIES}
            value={local.university ?? ''}
            onChange={(v) => set('university', v || undefined)}
            placeholder="Any university..."
          />

          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 mt-3">
            Department
          </label>
          <SearchableSelect
            options={DEPARTMENTS}
            value={local.department ?? ''}
            onChange={(v) => set('department', v || undefined)}
            placeholder="Any department..."
          />

          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 mt-3">
            Academic Year
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-gray-700 bg-white hover:border-[#94A3B8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none transition-colors"
            value={local.academic_year ?? ''}
            onChange={(e) => set('academic_year', (e.target.value as AcademicYear) || undefined)}
          >
            <option value="">Any year</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </section>

        {/* Schedule */}
        <section>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Days Per Week
          </label>
          <div className="grid grid-cols-6 gap-1">
            {[2, 3, 4, 5, 6, 7].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set('days_per_week', local.days_per_week === d ? undefined : d)}
                className={`py-1.5 rounded-md text-sm font-semibold border transition-colors ${
                  local.days_per_week === d
                    ? 'bg-[#059669] text-white border-[#059669]'
                    : 'bg-white text-gray-600 border-[#E2E8F0] hover:border-[#059669] hover:text-[#059669]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Apply button */}
      <button
        onClick={() => onApply(local)}
        disabled={loading}
        className="mt-6 w-full py-2.5 rounded-lg bg-[#059669] text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : 'Apply Filters'}
      </button>
    </aside>
  )
}
