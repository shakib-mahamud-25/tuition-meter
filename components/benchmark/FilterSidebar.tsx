'use client';

import { useState } from 'react';
import { BenchmarkFilters, Curriculum, StudentLevel, AcademicYear } from '@/lib/types';
import { AREAS, UNIVERSITIES, DEPARTMENTS, SUBJECTS, CURRICULUMS, STUDENT_LEVELS, ACADEMIC_YEARS } from '@/lib/data';
import SearchableSelect from '@/components/ui/SearchableSelect';
import MultiSelect from '@/components/ui/MultiSelect';

interface FilterSidebarProps {
  filters: BenchmarkFilters;
  onChange: (filters: BenchmarkFilters) => void;
  onApply: () => void;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-[#475569] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-[#CBD5E1] rounded text-sm bg-white text-[#0F172A] focus:outline-none focus:border-[#059669] transition-colors"
      >
        <option value="">{placeholder || `All ${label}s`}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, onApply }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState<BenchmarkFilters>(filters);

  function update(partial: Partial<BenchmarkFilters>) {
    const updated = { ...localFilters, ...partial };
    setLocalFilters(updated);
  }

  function handleApply() {
    // Remove empty values
    const cleaned: BenchmarkFilters = {};
    if (localFilters.area) cleaned.area = localFilters.area;
    if (localFilters.student_level) cleaned.student_level = localFilters.student_level;
    if (localFilters.curriculum) cleaned.curriculum = localFilters.curriculum;
    if (localFilters.subjects?.length) cleaned.subjects = localFilters.subjects;
    if (localFilters.university) cleaned.university = localFilters.university;
    if (localFilters.department) cleaned.department = localFilters.department;
    if (localFilters.academic_year) cleaned.academic_year = localFilters.academic_year;
    if (localFilters.days_per_week) cleaned.days_per_week = localFilters.days_per_week;
    onChange(cleaned);
    onApply();
  }

  function handleClear() {
    setLocalFilters({});
    onChange({});
    onApply();
  }

  const hasFilters = Object.values(localFilters).some(
    (v) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  );

  return (
    <aside className="bg-white border border-[#E2E8F0] rounded-xl p-5 sticky top-20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-[#0F172A] text-sm">Filters</h2>
        {hasFilters && (
          <button
            onClick={handleClear}
            className="text-xs text-[#94A3B8] hover:text-[#0F172A] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterSection title="Location">
        <SearchableSelect
          options={AREAS}
          value={localFilters.area || ''}
          onChange={(v) => update({ area: v })}
          placeholder="Search area..."
          id="filter-area"
        />
      </FilterSection>

      <FilterSection title="Student">
        <SelectField
          label="Level"
          value={localFilters.student_level || ''}
          options={STUDENT_LEVELS}
          onChange={(v) => update({ student_level: v as StudentLevel || undefined })}
          placeholder="All levels"
        />
        <SelectField
          label="Curriculum"
          value={localFilters.curriculum || ''}
          options={CURRICULUMS}
          onChange={(v) => update({ curriculum: v as Curriculum || undefined })}
          placeholder="All curricula"
        />
      </FilterSection>

      <FilterSection title="Subjects">
        <MultiSelect
          options={SUBJECTS}
          value={localFilters.subjects || []}
          onChange={(v) => update({ subjects: v })}
          placeholder="Add subjects..."
          id="filter-subjects"
        />
      </FilterSection>

      <FilterSection title="Tutor">
        <SearchableSelect
          options={UNIVERSITIES}
          value={localFilters.university || ''}
          onChange={(v) => update({ university: v })}
          placeholder="Search university..."
          id="filter-university"
        />
        <div className="mt-3">
          <SearchableSelect
            options={DEPARTMENTS}
            value={localFilters.department || ''}
            onChange={(v) => update({ department: v })}
            placeholder="Search department..."
            id="filter-dept"
          />
        </div>
        <div className="mt-3">
          <SelectField
            label="Academic Year"
            value={localFilters.academic_year || ''}
            options={ACADEMIC_YEARS}
            onChange={(v) => update({ academic_year: v as AcademicYear || undefined })}
            placeholder="All years"
          />
        </div>
      </FilterSection>

      <FilterSection title="Schedule">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Days per week</label>
          <select
            value={localFilters.days_per_week || ''}
            onChange={(e) => update({ days_per_week: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-[#CBD5E1] rounded text-sm bg-white text-[#0F172A] focus:outline-none focus:border-[#059669] transition-colors"
          >
            <option value="">Any</option>
            {[2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>{d} days/week</option>
            ))}
          </select>
        </div>
      </FilterSection>

      <button
        onClick={handleApply}
        className="w-full py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold rounded transition-colors"
      >
        Apply Filters
      </button>
    </aside>
  );
}
