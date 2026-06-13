'use client'

import { useState, useEffect } from 'react'
import { SearchableSelect } from '../ui/SearchableSelect'
import { MultiSelect } from '../ui/MultiSelect'
import { AREAS, STUDENT_LEVELS, CURRICULUMS, ACADEMIC_YEARS, SUBJECTS, UNIVERSITIES, DEPARTMENTS } from '../../lib/data'
import { fetchApprovedOptions, fetchFilterCounts } from '../../lib/benchmark'
import type { BenchmarkFilters, StudentLevel, Curriculum, AcademicYear, ApprovedOptions, FilterCounts } from '../../lib/types'

interface FilterSidebarProps {
  filters: BenchmarkFilters
  onFiltersChange: (filters: BenchmarkFilters) => void
  // FIX #1: onApply now receives the latest local filters directly so the
  // parent can pass them straight to runBenchmark without waiting for state flush
  onApply: (latestFilters: BenchmarkFilters) => void
  onClear: () => void
  activeFilterCount: number
  loading: boolean
}

// ─── Helper: append count label if count > 0 ─────────────────────────────────

function withCount(label: string, count: number | undefined): string {
  if (!count) return label
  return `${label} (${count})`
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

  const [options, setOptions] = useState<ApprovedOptions>({
    areas: [...AREAS].sort(),
    subjects: [...SUBJECTS].sort(),
    universities: [...UNIVERSITIES].sort(),
    departments: [...DEPARTMENTS].sort(),
  })

  const [counts, setCounts] = useState<FilterCounts | null>(null)

  useEffect(() => {
    fetchApprovedOptions().then(setOptions).catch(() => {})
    fetchFilterCounts().then(setCounts).catch(() => {})
  }, [])

  const update = (key: keyof BenchmarkFilters, value: unknown) => {
    setLocal(prev => ({ ...prev, [key]: value || undefined }))
  }

  const handleApply = () => {
    // Sync parent state AND pass local directly to onApply in the same tick
    onFiltersChange(local)
    onApply(local)
  }

  const handleClear = () => {
    setLocal({})
    onFiltersChange({})
    onClear()
  }

  // Build option lists with counts appended to labels
  const areasWithCounts = options.areas.map(a => ({
    value: a,
    label: withCount(a, counts?.areas[a]),
  }))

  const subjectsWithCounts = options.subjects.map(s => ({
    value: s,
    label: withCount(s, counts?.subjects[s]),
  }))

  const universitiesWithCounts = options.universities.map(u => ({
    value: u,
    label: withCount(u, counts?.universities[u]),
  }))

  const departmentsWithCounts = options.departments.map(d => ({
    value: d,
    label: withCount(d, counts?.departments[d]),
  }))

  const studentLevelsWithCounts = [...STUDENT_LEVELS].map(l => ({
    value: l,
    label: withCount(l, counts?.student_levels[l]),
  }))

  const curriculumsWithCounts = [...CURRICULUMS].map(c => ({
    value: c,
    label: withCount(c, counts?.curricula[c]),
  }))

  const academicYearsWithCounts = [...ACADEMIC_YEARS].map(y => ({
    value: y,
    label: withCount(y, counts?.academic_years[y]),
  }))

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
            options={areasWithCounts.map(o => o.label)}
            valueOptions={areasWithCounts.map(o => o.value)}
            value={local.area ? withCount(local.area, counts?.areas[local.area]) : ''}
            onChange={v => {
              // v is the label (with count); extract the raw value
              const match = areasWithCounts.find(o => o.label === v)
              update('area', match ? match.value : v)
            }}
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
                {studentLevelsWithCounts.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
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
                {curriculumsWithCounts.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Subjects</p>
          <MultiSelect
            options={subjectsWithCounts.map(o => o.label)}
            valueOptions={subjectsWithCounts.map(o => o.value)}
            value={(local.subjects || []).map(s => withCount(s, counts?.subjects[s]))}
            onChange={labelValues => {
              // labelValues are labels (with counts); map back to raw values
              const rawValues = labelValues.map(lv => {
                const match = subjectsWithCounts.find(o => o.label === lv)
                return match ? match.value : lv
              })
              update('subjects', rawValues.length > 0 ? rawValues : undefined)
            }}
            placeholder="Any subject"
          />
        </div>

        {/* Tutor Background */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tutor Background</p>
          <div className="space-y-2">
            <SearchableSelect
              options={universitiesWithCounts.map(o => o.label)}
              valueOptions={universitiesWithCounts.map(o => o.value)}
              value={local.university ? withCount(local.university, counts?.universities[local.university]) : ''}
              onChange={v => {
                const match = universitiesWithCounts.find(o => o.label === v)
                update('university', match ? match.value : v)
              }}
              placeholder="University..."
            />
            <SearchableSelect
              options={departmentsWithCounts.map(o => o.label)}
              valueOptions={departmentsWithCounts.map(o => o.value)}
              value={local.department ? withCount(local.department, counts?.departments[local.department]) : ''}
              onChange={v => {
                const match = departmentsWithCounts.find(o => o.label === v)
                update('department', match ? match.value : v)
              }}
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
                {academicYearsWithCounts.map(y => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
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
              {[2, 3, 4, 5, 6, 7].map(d => {
                const count = counts?.days_per_week[d]
                return (
                  <button
                    key={d}
                    onClick={() => update('days_per_week', local.days_per_week === d ? undefined : d)}
                    title={count ? `${count} reports` : undefined}
                    className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                      local.days_per_week === d
                        ? 'bg-[#059669] text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-[#E2E8F0]'
                    }`}
                  >
                    {d}
                  </button>
                )
              })}
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
