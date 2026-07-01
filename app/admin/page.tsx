'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAdminQueue } from '../../hooks/useAdminQueue'
import { getAuthErrorMessage } from '../../lib/errors'
import {
  formatBDT, fetchAdminStats, fetchAllRecords, updateRecordFields,
  fetchApprovedOptions,
} from '../../lib/benchmark'
import { trackAdminLogin, trackAdminLogout } from '../../lib/analytics'
import { STUDENT_LEVELS, CURRICULUMS, ACADEMIC_YEARS, HOURS_PER_SESSION } from '../../lib/data'
import type { AdminStats, TuitionRecord, ApprovedOptions } from '../../lib/types'
import { Timestamp } from 'firebase/firestore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: unknown): string {
  if (!ts) return '—'
  try {
    const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts as string)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

function formatDateTime(ts: unknown): string {
  if (!ts) return '—'
  try {
    const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts as string)
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter your email and password.'); return }
    setLoading(true); setError('')
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { getAuthInstance } = await import('../../lib/firebase/config')
      const auth = await getAuthInstance()
      await signInWithEmailAndPassword(auth, email, password)
      await trackAdminLogin(); onLogin()
    } catch (e) { setError(getAuthErrorMessage(e))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-10 h-10 rounded-xl bg-[#059669] flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="9" width="3" height="7" rx="1" fill="white"/>
              <rect x="7.5" y="5" width="3" height="11" rx="1" fill="white"/>
              <rect x="13" y="2" width="3" height="14" rx="1" fill="white"/>
            </svg>
          </div>
          <h1 className="text-white font-bold text-xl">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">TuitionMeter</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com" onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-3.5 py-2.5 bg-[#0F172A] border border-[#1E3A8A]/40 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-900"/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#0F172A] border border-[#1E3A8A]/40 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-900"/>
          </div>
          {error && <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 bg-[#059669] hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    approved: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
    pending:  'bg-amber-900/40  text-amber-400  border-amber-700/40',
    rejected: 'bg-red-900/40   text-red-400   border-red-700/40',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${cfg[status] || 'border-slate-700 text-slate-400'}`}>
      {status}
    </span>
  )
}

// ─── Field editor — dropdown OR free text, used inside RecordModal ────────────
// This is the mechanism that gives full control over submitted data: every
// area/university/department value can be picked from the live dropdown list
// or typed manually, so typos, casing issues, and near-duplicate values
// (e.g. "Dhaka University" vs "University of Dhaka") can be fixed at review.

function FieldEditor({
  label, value, options, onChange, freeTextPlaceholder,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  freeTextPlaceholder?: string
}) {
  const inOptions = options.includes(value)
  const [mode, setMode] = useState<'dropdown' | 'text'>(inOptions || options.length === 0 ? 'dropdown' : 'text')

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-slate-500 text-xs uppercase tracking-wide font-medium">{label}</p>
        {options.length > 0 && (
          <button
            type="button"
            onClick={() => setMode(m => m === 'dropdown' ? 'text' : 'dropdown')}
            className="text-[10px] text-slate-500 hover:text-[#059669] transition-colors underline decoration-dotted"
          >
            {mode === 'dropdown' ? 'type manually' : 'choose from list'}
          </button>
        )}
      </div>
      {mode === 'dropdown' && options.length > 0 ? (
        <select
          value={inOptions ? value : ''}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#059669]"
        >
          <option value="" disabled>Select {label.toLowerCase()}...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
          {!inOptions && value && <option value={value}>{value} (current)</option>}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={freeTextPlaceholder || `Type ${label.toLowerCase()}...`}
          className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669]"
        />
      )}
    </div>
  )
}

// ─── Record Modal — view + edit, used by BOTH Moderation Queue and All Reports ─

function RecordModal({
  record, options, onClose, onSaved, onApprove, onReject, processing,
}: {
  record: TuitionRecord & { id: string }
  options: ApprovedOptions
  onClose: () => void
  onSaved: (updated: TuitionRecord & { id: string }) => void
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  processing?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [draft, setDraft] = useState<TuitionRecord & { id: string }>({ ...record })

  useEffect(() => {
    setDraft({ ...record })
    setEditing(false)
    setSaveError('')
  }, [record])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const F = (label: string, content: React.ReactNode) => (
    <div className="py-2.5 border-b border-[#1E3A8A]/30 last:border-0">
      <p className="text-slate-500 text-xs uppercase tracking-wide mb-1 font-medium">{label}</p>
      <div className="text-white text-sm">{content}</div>
    </div>
  )

  const sel = (key: keyof TuitionRecord, opts: string[]) => editing
    ? <select value={String(draft[key] ?? '')} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
        className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#059669]">
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    : <span>{String(draft[key] ?? '—')}</span>

  const num = (key: keyof TuitionRecord) => editing
    ? <input type="number" value={Number(draft[key] ?? 0)} onChange={e => setDraft(d => ({ ...d, [key]: parseInt(e.target.value) || 0 }))}
        className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#059669]"/>
    : <span>{String(draft[key] ?? '—')}</span>

  const subjectsEl = () => editing
    ? (
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {options.subjects.map(s => {
            const on = (draft.subjects || []).includes(s)
            return <button key={s} type="button"
              onClick={() => setDraft(d => ({ ...d, subjects: on ? d.subjects.filter(x => x !== s) : [...d.subjects, s] }))}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${on ? 'bg-[#059669] border-[#059669] text-white' : 'border-[#1E3A8A]/60 text-slate-400 hover:border-slate-400'}`}>
              {s}
            </button>
          })}
        </div>
        <input
          type="text"
          placeholder="Type a subject and press Enter to add..."
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const val = (e.target as HTMLInputElement).value.trim()
              if (val && !draft.subjects.includes(val)) {
                setDraft(d => ({ ...d, subjects: [...d.subjects, val] }))
              }
              ;(e.target as HTMLInputElement).value = ''
            }
          }}
          className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669]"
        />
        {draft.subjects.filter(s => !options.subjects.includes(s)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {draft.subjects.filter(s => !options.subjects.includes(s)).map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300">
                {s}
                <button type="button" onClick={() => setDraft(d => ({ ...d, subjects: d.subjects.filter(x => x !== s) }))} className="hover:text-white">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    )
    : <span>{(draft.subjects || []).join(', ') || '—'}</span>

  const daysEl = () => editing
    ? <div className="flex gap-1.5 flex-wrap">{[1,2,3,4,5,6,7].map(d =>
        <button key={d} type="button" onClick={() => setDraft(dr => ({ ...dr, days_per_week: d }))}
          className={`w-9 py-1.5 text-sm rounded-lg border transition-colors ${draft.days_per_week === d ? 'bg-[#059669] border-[#059669] text-white' : 'border-[#1E3A8A]/60 text-slate-400'}`}>{d}</button>)}</div>
    : <span>{draft.days_per_week}</span>

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      const fields = {
        salary: draft.salary,
        area: draft.area,
        curriculum: draft.curriculum,
        student_level: draft.student_level,
        subjects: draft.subjects,
        days_per_week: draft.days_per_week,
        hours_per_session: draft.hours_per_session,
        university: draft.university,
        department: draft.department,
        academic_year: draft.academic_year,
        status: draft.status,
        is_suspicious: draft.is_suspicious,
      }
      await updateRecordFields(record.id, fields)
      onSaved(draft); setEditing(false)
    } catch { setSaveError('Save failed. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A8A]/40 sticky top-0 bg-[#1E293B] z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-semibold text-base">Salary Report</h2>
            <StatusBadge status={draft.status} />
            {draft.is_suspicious && <span className="text-xs text-amber-400 font-semibold">⚠ Suspicious</span>}
          </div>
          <div className="flex items-center gap-2">
            {!editing
              ? <button onClick={() => setEditing(true)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors">Edit</button>
              : <>
                  <button onClick={() => { setEditing(false); setDraft({ ...record }); setSaveError('') }} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-[#059669] hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">{saving ? 'Saving...' : 'Save'}</button>
                </>
            }
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {saveError && <p className="text-red-400 text-xs mb-3 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">{saveError}</p>}

          {F('Monthly Salary', editing ? num('salary') : <span className="text-xl font-bold text-[#059669]">{formatBDT(draft.salary)}</span>)}

          {F('Area', editing
            ? <FieldEditor label="Area" value={draft.area} options={options.areas} onChange={v => setDraft(d => ({ ...d, area: v }))} />
            : <span>{draft.area}</span>)}

          {F('Curriculum', sel('curriculum', [...CURRICULUMS]))}
          {F('Student Level', sel('student_level', [...STUDENT_LEVELS]))}
          {F('Subjects', subjectsEl())}
          {F('Days per Week', daysEl())}
          {F('Hours per Session', sel('hours_per_session', [...HOURS_PER_SESSION]))}

          {F('University', editing
            ? <FieldEditor label="University" value={draft.university} options={options.universities} onChange={v => setDraft(d => ({ ...d, university: v }))} />
            : <span>{draft.university}</span>)}

          {F('Department', editing
            ? <FieldEditor label="Department" value={draft.department} options={options.departments} onChange={v => setDraft(d => ({ ...d, department: v }))} />
            : <span>{draft.department}</span>)}

          {F('Academic Year', sel('academic_year', [...ACADEMIC_YEARS]))}

          {F('Status', editing
            ? <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as TuitionRecord['status'] }))}
                className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#059669]">
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            : <StatusBadge status={draft.status} />)}

          {F('Submitted', <span>{formatDateTime(draft.created_at)}</span>)}
          {F('Source', <span className="text-slate-400">{draft.source_version} · {draft.submitted_from}</span>)}
        </div>

        {!editing && draft.status === 'pending' && onApprove && onReject && (
          <div className="px-6 py-4 border-t border-[#1E3A8A]/40 flex gap-2 sticky bottom-0 bg-[#1E293B]">
            <button
              onClick={() => onApprove(record.id)}
              disabled={processing}
              className="flex-1 py-2.5 bg-[#059669] hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {processing ? 'Processing...' : '✓ Approve'}
            </button>
            <button
              onClick={() => onReject(record.id)}
              disabled={processing}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-red-900 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              ✕ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard stat card ────────────────────────────────────────────────────────

function AdminStatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`bg-[#1E293B] border rounded-xl p-4 ${accent ? 'border-[#059669]/40' : 'border-[#1E3A8A]/40'}`}>
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ? 'text-[#059669]' : 'text-white'}`}>{value}</p>
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminStats()
      setStats(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const approvalRate = stats && stats.total_reports > 0
    ? Math.round((stats.approved_reports / stats.total_reports) * 100)
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white text-lg font-semibold">Overview</h2>
        <button onClick={load} disabled={loading}
          className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50">
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      {loading && !stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-xl p-4 animate-pulse">
              <div className="h-3 w-16 bg-slate-700 rounded mb-2"/>
              <div className="h-6 w-12 bg-slate-700 rounded"/>
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <AdminStatCard label="Total Reports" value={stats.total_reports.toString()} />
            <AdminStatCard label="Approved" value={stats.approved_reports.toString()} accent />
            <AdminStatCard label="Pending" value={stats.pending_reports.toString()} />
            <AdminStatCard label="Rejected" value={stats.rejected_reports.toString()} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <AdminStatCard label="Areas" value={stats.areas_covered.toString()} />
            <AdminStatCard label="Universities" value={stats.universities_covered.toString()} />
            <AdminStatCard label="Subjects" value={stats.subjects_covered.toString()} />
            <AdminStatCard label="Median Salary" value={formatBDT(stats.median_salary)} accent />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminStatCard label="Approval Rate" value={`${approvalRate}%`} />
            <AdminStatCard label="Awaiting Review" value={stats.pending_reports.toString()} accent={stats.pending_reports > 0} />
          </div>

          {stats.pending_reports > 0 && (
            <div className="mt-6 bg-amber-950/30 border border-amber-800/40 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-sm font-semibold mb-0.5">
                  {stats.pending_reports} report{stats.pending_reports !== 1 ? 's' : ''} waiting for review
                </p>
                <p className="text-slate-400 text-xs">Head to the Moderation Queue tab to approve or reject them.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-slate-500 text-sm">Could not load stats.</p>
      )}
    </div>
  )
}

// ─── Moderation Queue Tab — salary reports only ────────────────────────────────

function ModerationQueueTab() {
  const { items, loading, processing, bulkProcessing, approve, reject, approveAll, rejectAll, refresh } = useAdminQueue()
  const [options, setOptions] = useState<ApprovedOptions>({ areas: [], subjects: [], universities: [], departments: [] })
  const [selectedRecord, setSelectedRecord] = useState<(TuitionRecord & { id: string }) | null>(null)

  useEffect(() => {
    refresh()
    fetchApprovedOptions().then(setOptions).catch(() => {})
  }, [refresh])

  const handleApprove = async (id: string) => {
    await approve(id)
    setSelectedRecord(null)
  }

  const handleReject = async (id: string) => {
    await reject(id)
    setSelectedRecord(null)
  }

  const handleRecordSaved = useCallback((updated: TuitionRecord & { id: string }) => {
    setSelectedRecord(updated)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-white text-lg font-semibold">Salary Reports</h2>
          {items.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-amber-500 text-white text-xs font-bold rounded-full">{items.length}</span>
          )}
        </div>
        <button onClick={refresh} disabled={loading}
          className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50">
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      {items.length > 1 && (
        <div className="flex gap-2 mb-5">
          <button onClick={approveAll} disabled={bulkProcessing || !!processing}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[#059669]/20 hover:bg-[#059669]/30 border border-[#059669]/40 text-[#059669] text-sm font-semibold rounded-lg transition-colors disabled:opacity-40">
            {bulkProcessing ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Processing...
              </span>
            ) : `✓ Approve All (${items.length})`}
          </button>
          <button onClick={rejectAll} disabled={bulkProcessing || !!processing}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 text-red-400 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40">
            {bulkProcessing ? '...' : `✕ Reject All (${items.length})`}
          </button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl px-5 py-10 text-center text-slate-500 text-sm">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl px-5 py-12 text-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="mx-auto mb-3"><polyline points="20 6 9 17 4 12"/></svg>
          <p className="text-slate-400 text-sm font-medium">All caught up</p>
          <p className="text-slate-600 text-xs mt-1">No reports waiting for review.</p>
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl overflow-hidden divide-y divide-[#1E3A8A]/30">
          {items.map(item => {
            const isBusy = processing === item.id || bulkProcessing
            return (
              <div key={item.id} className={`px-5 py-4 transition-opacity ${isBusy ? 'opacity-40' : ''} ${item.is_suspicious ? 'bg-amber-950/20 border-l-2 border-amber-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <button className="flex-1 min-w-0 text-left" onClick={() => setSelectedRecord(item)}>
                    {item.is_suspicious && <span className="inline-block text-xs text-amber-400 font-semibold mb-1.5">⚠ Suspicious</span>}
                    <p className="text-white text-sm font-semibold hover:text-[#059669] transition-colors">
                      {formatBDT(item.salary)}/mo
                      <span className="ml-2 text-[10px] text-slate-500 font-normal">tap to view & edit</span>
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.area} · {item.student_level} · {item.curriculum}</p>
                    <p className="text-slate-500 text-xs">{item.university} — {item.department}</p>
                    <p className="text-slate-600 text-[11px] mt-1">{formatDate(item.created_at)}</p>
                  </button>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => approve(item.id!)} disabled={isBusy}
                      className="px-3 py-1.5 bg-[#059669] hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                      {processing === item.id ? '...' : 'Approve'}
                    </button>
                    <button onClick={() => reject(item.id!)} disabled={isBusy}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-red-900 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedRecord && (
        <RecordModal
          record={selectedRecord}
          options={options}
          onClose={() => setSelectedRecord(null)}
          onSaved={handleRecordSaved}
          onApprove={handleApprove}
          onReject={handleReject}
          processing={processing === selectedRecord.id}
        />
      )}
    </div>
  )
}

// ─── All Reports Tab — search any field, view, edit ────────────────────────────

function AllReportsTab() {
  const [records, setRecords] = useState<Array<TuitionRecord & { id: string }>>([])
  const [options, setOptions] = useState<ApprovedOptions>({ areas: [], subjects: [], universities: [], departments: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [selectedRecord, setSelectedRecord] = useState<(TuitionRecord & { id: string }) | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [all, opts] = await Promise.all([fetchAllRecords(), fetchApprovedOptions()])
      setRecords(all)
      setOptions(opts)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = records.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    const haystacks = [
      r.area, r.university, r.department, r.student_level, r.curriculum,
      r.academic_year, r.hours_per_session, String(r.salary), String(r.days_per_week),
      ...(r.subjects || []),
    ]
    return haystacks.some(h => h && h.toString().toLowerCase().includes(q))
  })

  const handleRecordSaved = useCallback((updated: TuitionRecord & { id: string }) => {
    setSelectedRecord(updated)
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-white text-lg font-semibold">All Reports</h2>
          <span className="text-slate-500 text-sm">({filtered.length})</span>
        </div>
        <button onClick={load} disabled={loading}
          className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50">
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search any field — area, university, subject, salary..."
          className="flex-1 px-4 py-2.5 bg-[#1E293B] border border-[#1E3A8A]/40 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669]"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2.5 bg-[#1E293B] border border-[#1E3A8A]/40 rounded-lg text-sm text-white focus:outline-none focus:border-[#059669]">
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl px-5 py-10 text-center text-slate-500 text-sm">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl px-5 py-12 text-center text-slate-500 text-sm">
          {search ? `No reports match "${search}"` : 'No reports found.'}
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl overflow-hidden divide-y divide-[#1E3A8A]/30 max-h-[640px] overflow-y-auto">
          {filtered.map(r => (
            <button key={r.id} onClick={() => setSelectedRecord(r)}
              className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors group">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white text-sm font-semibold group-hover:text-[#059669] transition-colors">
                      {formatBDT(r.salary)}/mo
                    </span>
                    <StatusBadge status={r.status} />
                    {r.is_suspicious && <span className="text-xs text-amber-400 font-semibold">⚠</span>}
                  </div>
                  <p className="text-slate-400 text-xs truncate">{r.area} · {r.student_level} · {r.curriculum}</p>
                  <p className="text-slate-500 text-xs truncate">{r.university} — {r.department} · {formatDate(r.created_at)}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" className="flex-shrink-0 group-hover:stroke-[#059669] transition-colors"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedRecord && (
        <RecordModal
          record={selectedRecord}
          options={options}
          onClose={() => setSelectedRecord(null)}
          onSaved={handleRecordSaved}
        />
      )}
    </div>
  )
}

// ─── Dashboard shell — tab switcher ────────────────────────────────────────────

type AdminTab = 'dashboard' | 'queue' | 'all-reports'

function Dashboard({ userEmail, onSignOut }: { userEmail: string; onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-0.5">{userEmail}</p>
        </div>
        <button onClick={onSignOut} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
          Sign Out
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-[#1E293B] border border-[#1E3A8A]/40 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-[#059669] text-white' : 'text-slate-400 hover:text-white'}`}>
          Dashboard
        </button>
        <button onClick={() => setActiveTab('queue')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'queue' ? 'bg-[#059669] text-white' : 'text-slate-400 hover:text-white'}`}>
          Moderation Queue
        </button>
        <button onClick={() => setActiveTab('all-reports')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'all-reports' ? 'bg-[#059669] text-white' : 'text-slate-400 hover:text-white'}`}>
          All Reports
        </button>
      </div>

      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'queue' && <ModerationQueueTab />}
      {activeTab === 'all-reports' && <AllReportsTab />}
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    ;(async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth')
        const { getAuthInstance } = await import('../../lib/firebase/config')
        const auth = await getAuthInstance()
        unsubscribe = onAuthStateChanged(auth, u => {
          setUser(u ? { email: u.email || '' } : null)
          setChecking(false)
        })
      } catch { setChecking(false) }
    })()
    return () => { if (unsubscribe) unsubscribe() }
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      const { signOut } = await import('firebase/auth')
      const { getAuthInstance } = await import('../../lib/firebase/config')
      const auth = await getAuthInstance()
      await signOut(auth)
      await trackAdminLogout()
    } catch {}
  }, [])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-slate-400 text-sm">Checking session...</div>
    </div>
  )

  if (!user) return <LoginScreen onLogin={() => {}} />
  return <Dashboard userEmail={user.email} onSignOut={handleSignOut} />
}
