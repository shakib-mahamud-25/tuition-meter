'use client'

import { useState } from 'react'
import { SearchableSelect } from '../ui/SearchableSelect'
import { MultiSelect } from '../ui/MultiSelect'
import { AREAS, STUDENT_LEVELS, CURRICULUMS, ACADEMIC_YEARS, SUBJECTS, UNIVERSITIES, DEPARTMENTS } from '../../lib/data'
import type { BenchmarkFilters, StudentLevel, Curriculum, AcademicYear } from '../../lib/types'

interface FilterSidebarProps {
  filters: BenchmarkFilters
  onFiltersChange: (filters: BenchmarkFilters) => void
  onApply: () => void
  onClear: () => void
  activeFilterCount: number
  loading: boolean
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  activeFilterCount,
  loading,
}: FilterSidebarProps) {
  const [local, setLocal] = useState<BenchmarkFilters>(filters)

  const update = (key: keyof BenchmarkFilters, value: unknown) => {
    setLocal(prev => ({ ...prev, [key]: value || undefined }))
  }

  const handleApply = () => {
    onFiltersChange(local)
    onApply()
  }

  const handleClear = () => {
    setLocal({})
    onFiltersChange({})
    onClear()
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
        <h2 className="font-semibold text-slate-800 text-sm">Filters</h2>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-red-500 transition-colors"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Location */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Location</p>
          <SearchableSelect
            options={AREAS}
            value={local.area || ''}
            onChange={v => update('area', v)}
            placeholder="Search area..."
          />
        </div>

        {/* Student */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Student</p>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Level</label>
              <select
                value={local.student_level || ''}
                onChange={e => update('student_level', e.target.value as StudentLevel)}
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Any level</option>
                {STUDENT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Curriculum</label>
              <select
                value={local.curriculum || ''}
                onChange={e => update('curriculum', e.target.value as Curriculum)}
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Any curriculum</option>
                {CURRICULUMS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Subjects</p>
          <div className="relative">
            <MultiSelect
              options={SUBJECTS}
              value={local.subjects || []}
              onChange={v => update('subjects', v.length > 0 ? v : undefined)}
              placeholder="Any subject"
            />
          </div>
        </div>

        {/* Tutor */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tutor Background</p>
          <div className="space-y-2">
            <SearchableSelect
              options={UNIVERSITIES}
              value={local.university || ''}
              onChange={v => update('university', v)}
              placeholder="University..."
            />
            <SearchableSelect
              options={DEPARTMENTS}
              value={local.department || ''}
              onChange={v => update('department', v)}
              placeholder="Department..."
            />
            <div>
              <label className="block text-xs text-slate-600 mb-1">Academic Year</label>
              <select
                value={local.academic_year || ''}
                onChange={e => update('academic_year', e.target.value as AcademicYear)}
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Any year</option>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Schedule</p>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Days per week</label>
            <div className="grid grid-cols-6 gap-1">
              {[2, 3, 4, 5, 6, 7].map(d => (
                <button
                  key={d}
                  onClick={() => update('days_per_week', local.days_per_week === d ? undefined : d)}
                  className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                    local.days_per_week === d
                      ? 'bg-[#059669] text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-[#E2E8F0]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={handleApply}
          disabled={loading}
          className="w-full py-3 bg-[#059669] hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Fetching...
            </span>
          ) : 'Apply Filters'}
        </button>
      </div>
    </div>
  )
}
