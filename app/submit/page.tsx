'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubmitFormData } from '@/lib/types';
import { AREAS, UNIVERSITIES, DEPARTMENTS, SUBJECTS, CURRICULUMS, STUDENT_LEVELS, ACADEMIC_YEARS, HOURS_PER_SESSION } from '@/lib/data';
import { submitTuitionRecord, submitPendingItem } from '@/lib/benchmark';
import SearchableSelect from '@/components/ui/SearchableSelect';
import MultiSelect from '@/components/ui/MultiSelect';

const DAYS = [2, 3, 4, 5, 6, 7];

const INITIAL: SubmitFormData = {
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
};

type Errors = Partial<Record<keyof SubmitFormData, string>>;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="pb-4 border-b border-[#E2E8F0] mb-5">
      <h2 className="font-semibold text-[#0F172A]">{title}</h2>
      {desc && <p className="text-xs text-[#94A3B8] mt-0.5">{desc}</p>}
    </div>
  );
}

export default function SubmitPage() {
  const [form, setForm] = useState<SubmitFormData>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  function update(field: keyof SubmitFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.salary || isNaN(Number(form.salary)) || Number(form.salary) < 500) {
      errs.salary = 'Enter a valid monthly salary (min ৳500)';
    }
    if (!form.area) errs.area = 'Please select an area';
    if (!form.curriculum) errs.curriculum = 'Please select a curriculum';
    if (!form.student_level) errs.student_level = 'Please select a student level';
    if (form.subjects.length === 0) errs.subjects = 'Add at least one subject';
    if (!form.days_per_week) errs.days_per_week = 'Select days per week';
    if (!form.hours_per_session) errs.hours_per_session = 'Select hours per session';
    if (!form.university) errs.university = 'Please select your university';
    if (!form.department) errs.department = 'Please select your department';
    if (!form.academic_year) errs.academic_year = 'Please select your academic year';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    // Honeypot check
    if (form.honeypot) return;

    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await submitTuitionRecord({
        salary: Number(form.salary),
        area: form.area,
        curriculum: form.curriculum as SubmitFormData['curriculum'] extends '' ? never : SubmitFormData['curriculum'],
        student_level: form.student_level as SubmitFormData['student_level'] extends '' ? never : SubmitFormData['student_level'],
        subjects: form.subjects,
        days_per_week: Number(form.days_per_week),
        hours_per_session: form.hours_per_session as SubmitFormData['hours_per_session'] extends '' ? never : SubmitFormData['hours_per_session'],
        university: form.university,
        department: form.department,
        academic_year: form.academic_year as SubmitFormData['academic_year'] extends '' ? never : SubmitFormData['academic_year'],
      } as Parameters<typeof submitTuitionRecord>[0]);

      if (result.success) {
        setSubmitted(true);
      } else {
        setErrors({ salary: result.error });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14l6 6L22 8" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-3">Salary submitted</h1>
        <p className="text-[#64748B] mb-8 text-sm leading-relaxed">
          Your anonymous report has been recorded. It contributes to market benchmarks for the tutoring community.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => { setForm(INITIAL); setSubmitted(false); }}
            className="px-5 py-2.5 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] text-sm font-semibold rounded-lg transition-colors"
          >
            Submit Another
          </button>
          <button
            onClick={() => router.push('/benchmark')}
            className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            View Benchmarks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[#059669] text-xs font-bold tracking-wider uppercase mb-2">Anonymous Submission</div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">Submit Tuition Salary</h1>
        <p className="text-[#64748B] text-sm">
          No name, phone, or email collected. One assignment = one submission.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-[#F0FDF4] border border-[#A7F3D0] text-[#059669] text-xs px-3 py-1.5 rounded-lg">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1a3 3 0 100 6 3 3 0 000-6zM1 10.5c0-2 2-3.5 5-3.5s5 1.5 5 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          </svg>
          Completely anonymous — no account required
        </div>
      </div>

      {/* Honeypot (hidden) */}
      <input
        type="text"
        name="website"
        value={form.honeypot}
        onChange={(e) => update('honeypot', e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">

        {/* Salary */}
        <div className="p-6">
          <SectionHeader title="Monthly Salary" desc="Your total monthly earnings for this assignment" />
          <div>
            <FieldLabel required>Monthly Salary (BDT)</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm font-medium">৳</span>
              <input
                type="number"
                value={form.salary}
                onChange={(e) => update('salary', e.target.value)}
                placeholder="e.g. 8000"
                min="500"
                className={`w-full pl-8 pr-3 py-2.5 border rounded text-sm bg-white text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none transition-colors tabular-nums ${
                  errors.salary ? 'border-red-400 focus:border-red-500' : 'border-[#CBD5E1] focus:border-[#059669]'
                }`}
              />
            </div>
            {errors.salary && <p className="mt-1 text-xs text-red-500">{errors.salary}</p>}
          </div>
        </div>

        {/* Assignment Details */}
        <div className="p-6">
          <SectionHeader title="Tuition Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <SearchableSelect
                options={AREAS}
                value={form.area}
                onChange={(v) => update('area', v)}
                label="Area"
                required
                placeholder="Search area..."
                allowCustom
                onAddNew={async (v) => { await submitPendingItem('pending_areas', v); }}
                addNewLabel="Add New Area"
                error={errors.area}
                id="area"
              />
            </div>
            <div>
              <FieldLabel required>Curriculum</FieldLabel>
              <select
                value={form.curriculum}
                onChange={(e) => update('curriculum', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded text-sm bg-white text-[#0F172A] focus:outline-none transition-colors ${
                  errors.curriculum ? 'border-red-400' : 'border-[#CBD5E1] focus:border-[#059669]'
                }`}
              >
                <option value="">Select curriculum</option>
                {CURRICULUMS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.curriculum && <p className="mt-1 text-xs text-red-500">{errors.curriculum}</p>}
            </div>
            <div>
              <FieldLabel required>Student Level</FieldLabel>
              <select
                value={form.student_level}
                onChange={(e) => update('student_level', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded text-sm bg-white text-[#0F172A] focus:outline-none transition-colors ${
                  errors.student_level ? 'border-red-400' : 'border-[#CBD5E1] focus:border-[#059669]'
                }`}
              >
                <option value="">Select level</option>
                {STUDENT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.student_level && <p className="mt-1 text-xs text-red-500">{errors.student_level}</p>}
            </div>
            <div className="sm:col-span-2">
              <MultiSelect
                options={SUBJECTS}
                value={form.subjects}
                onChange={(v) => update('subjects', v)}
                label="Subjects"
                required
                allowCustom
                onAddNew={async (v) => { await submitPendingItem('pending_subjects', v); }}
                error={errors.subjects}
                id="subjects"
              />
            </div>
            <div>
              <FieldLabel required>Days Per Week</FieldLabel>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update('days_per_week', d.toString())}
                    className={`w-10 h-10 rounded border text-sm font-medium transition-colors ${
                      form.days_per_week === d.toString()
                        ? 'bg-[#059669] border-[#059669] text-white'
                        : 'border-[#CBD5E1] text-[#475569] hover:border-[#059669] hover:text-[#059669]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {errors.days_per_week && <p className="mt-1 text-xs text-red-500">{errors.days_per_week}</p>}
            </div>
            <div>
              <FieldLabel required>Hours Per Session</FieldLabel>
              <div className="flex gap-2 flex-wrap">
                {HOURS_PER_SESSION.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => update('hours_per_session', h)}
                    className={`px-3 h-10 rounded border text-sm font-medium transition-colors ${
                      form.hours_per_session === h
                        ? 'bg-[#059669] border-[#059669] text-white'
                        : 'border-[#CBD5E1] text-[#475569] hover:border-[#059669] hover:text-[#059669]'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              {errors.hours_per_session && <p className="mt-1 text-xs text-red-500">{errors.hours_per_session}</p>}
            </div>
          </div>
        </div>

        {/* Tutor Info */}
        <div className="p-6">
          <SectionHeader title="Your University Background" desc="Helps build accurate salary benchmarks by institution" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <SearchableSelect
                options={UNIVERSITIES}
                value={form.university}
                onChange={(v) => update('university', v)}
                label="University"
                required
                placeholder="Search university..."
                allowCustom
                onAddNew={async (v) => { await submitPendingItem('pending_universities', v); }}
                addNewLabel="Add New University"
                error={errors.university}
                id="university"
              />
            </div>
            <div>
              <SearchableSelect
                options={DEPARTMENTS}
                value={form.department}
                onChange={(v) => update('department', v)}
                label="Department"
                required
                placeholder="Search department..."
                allowCustom
                onAddNew={async (v) => { await submitPendingItem('pending_departments', v); }}
                addNewLabel="Add New Department"
                error={errors.department}
                id="department"
              />
            </div>
            <div>
              <FieldLabel required>Academic Year</FieldLabel>
              <select
                value={form.academic_year}
                onChange={(e) => update('academic_year', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded text-sm bg-white text-[#0F172A] focus:outline-none transition-colors ${
                  errors.academic_year ? 'border-red-400' : 'border-[#CBD5E1] focus:border-[#059669]'
                }`}
              >
                <option value="">Select year</option>
                {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.academic_year && <p className="mt-1 text-xs text-red-500">{errors.academic_year}</p>}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0 text-[#94A3B8]">
              <path d="M7 1a6 6 0 100 12A6 6 0 007 1zm.5 9h-1V6.5h1V10zM7 5.25a.75.75 0 110-1.5.75.75 0 010 1.5z" fill="currentColor"/>
            </svg>
            <p className="text-xs text-[#64748B] leading-relaxed">
              By submitting, you confirm this is real data from an actual tuition assignment. Fake or inflated submissions harm the community.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-[#059669] hover:bg-[#047857] disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Anonymous Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
