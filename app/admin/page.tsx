'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAdminQueue } from '../../hooks/useAdminQueue'
import { getAuthErrorMessage } from '../../lib/errors'
import {
  formatBDT, fetchAdminStats, fetchAllRecords, updateRecordFields,
  fetchApprovedOptions, fetchAllPendingItems, updatePendingItem,
  findAndReplace, fetchAllFieldValues, editFieldValue, deleteFieldValue, seedOptionLists,
} from '../../lib/benchmark'
import type { PendingItemDoc, FindReplaceField, ManagedField, FieldValueEntry } from '../../lib/benchmark'
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

const PENDING_COLLECTIONS: Record<string, string> = {
  areas: 'pending_areas',
  subjects: 'pending_subjects',
  universities: 'pending_universities',
  departments: 'pending_departments',
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

// ─── Shared status badge ──────────────────────────────────────────────────────

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

// ─── Salary Record Modal (view + edit) ───────────────────────────────────────

function RecordModal({
  record, options, onClose, onSaved,
}: {
  record: TuitionRecord & { id: string }
  options: ApprovedOptions
  onClose: () => void
  onSaved: (updated: TuitionRecord & { id: string }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [draft, setDraft] = useState<TuitionRecord & { id: string }>({ ...record })

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
    ? <div className="flex flex-wrap gap-1.5">
        {options.subjects.map(s => {
          const on = (draft.subjects || []).includes(s)
          return <button key={s} type="button"
            onClick={() => setDraft(d => ({ ...d, subjects: on ? d.subjects.filter(x => x !== s) : [...d.subjects, s] }))}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${on ? 'bg-[#059669] border-[#059669] text-white' : 'border-[#1E3A8A]/60 text-slate-400 hover:border-slate-400'}`}>
            {s}
          </button>
        })}
      </div>
    : <span>{(draft.subjects || []).join(', ') || '—'}</span>

  const daysEl = () => editing
    ? <div className="flex gap-1.5">{[2,3,4,5,6,7].map(d =>
        <button key={d} type="button" onClick={() => setDraft(dr => ({ ...dr, days_per_week: d }))}
          className={`w-9 py-1.5 text-sm rounded-lg border transition-colors ${draft.days_per_week === d ? 'bg-[#059669] border-[#059669] text-white' : 'border-[#1E3A8A]/60 text-slate-400'}`}>{d}</button>)}</div>
    : <span>{draft.days_per_week}</span>

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, source_version, submitted_from, ...fields } = draft
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
            ? <select value={draft.area} onChange={e => setDraft(d => ({ ...d, area: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#059669]">
                {options.areas.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            : <span>{draft.area}</span>)}
          {F('Curriculum', sel('curriculum', [...CURRICULUMS]))}
          {F('Student Level', sel('student_level', [...STUDENT_LEVELS]))}
          {F('Subjects', subjectsEl())}
          {F('Days per Week', daysEl())}
          {F('Hours per Session', sel('hours_per_session', [...HOURS_PER_SESSION]))}
          {F('University', editing
            ? <select value={draft.university} onChange={e => setDraft(d => ({ ...d, university: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#059669]">
                {options.universities.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            : <span>{draft.university}</span>)}
          {F('Department', editing
            ? <select value={draft.department} onChange={e => setDraft(d => ({ ...d, department: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#059669]">
                {options.departments.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
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
          {F('Submitted', <span>{formatDate(draft.created_at)}</span>)}
          {F('Source', <span className="text-slate-400">{draft.source_version} · {draft.submitted_from}</span>)}
        </div>
      </div>
    </div>
  )
}

// ─── Pending Item Modal (view + edit for areas/subjects/universities/depts) ───

function PendingItemModal({
  item, collectionKey, onClose, onSaved,
}: {
  item: PendingItemDoc
  collectionKey: string
  onClose: () => void
  onSaved: (updated: PendingItemDoc) => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [draft, setDraft] = useState<PendingItemDoc>({ ...item })

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const collectionName = PENDING_COLLECTIONS[collectionKey]
  const typeLabel = collectionKey.slice(0, -1)

  const handleSave = async () => {
    if (!draft.value.trim()) { setSaveError('Value cannot be empty.'); return }
    setSaving(true); setSaveError('')
    try {
      await updatePendingItem(collectionName, item.id, { value: draft.value.trim(), status: draft.status })
      onSaved(draft); setEditing(false)
    } catch { setSaveError('Save failed. Please try again.')
    } finally { setSaving(false) }
  }

  const F = (label: string, content: React.ReactNode) => (
    <div className="py-2.5 border-b border-[#1E3A8A]/30 last:border-0">
      <p className="text-slate-500 text-xs uppercase tracking-wide mb-1 font-medium">{label}</p>
      <div className="text-white text-sm">{content}</div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A8A]/40">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-semibold text-base capitalize">{typeLabel} Entry</h2>
            <StatusBadge status={draft.status} />
          </div>
          <div className="flex items-center gap-2">
            {!editing
              ? <button onClick={() => setEditing(true)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors">Edit</button>
              : <>
                  <button onClick={() => { setEditing(false); setDraft({ ...item }); setSaveError('') }} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors">Cancel</button>
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
          {F('Value', editing
            ? <input type="text" value={draft.value} onChange={e => setDraft(d => ({ ...d, value: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#059669]"/>
            : <span className="font-medium">{draft.value}</span>)}
          {F('Status', editing
            ? <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as PendingItemDoc['status'] }))}
                className="w-full bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#059669]">
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            : <StatusBadge status={draft.status} />)}
          {F('Submitted', <span>{formatDate(draft.submitted_at)}</span>)}
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function AdminStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-xl p-4">
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

// ─── Queue Panel (moderation tab) ─────────────────────────────────────────────

function QueuePanel({
  title, queueType, items, loading, processing, bulkProcessing,
  onApprove, onReject, onApproveAll, onRejectAll, onRefresh,
  onViewRecord, onViewPendingItem,
}: {
  title: string
  queueType: string
  items: (TuitionRecord & { id: string })[]
  loading: boolean
  processing: string | null
  bulkProcessing: string | null
  onApprove: (type: string, id: string) => void
  onReject: (type: string, id: string) => void
  onApproveAll: (type: string) => void
  onRejectAll: (type: string) => void
  onRefresh: (type: string) => void
  onViewRecord: (r: TuitionRecord & { id: string }) => void
  onViewPendingItem: (item: PendingItemDoc, collectionKey: string) => void
}) {
  const isBulkBusy = bulkProcessing === queueType
  const isRecord = queueType === 'records'

  return (
    <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1E3A8A]/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">{title}</h3>
            {items.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-amber-500 text-white text-xs font-bold rounded-full">{items.length}</span>
            )}
          </div>
          <button onClick={() => onRefresh(queueType)} disabled={loading}
            className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50">
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>
        {items.length > 1 && (
          <div className="flex gap-2">
            <button onClick={() => onApproveAll(queueType)} disabled={isBulkBusy || !!processing}
              className="flex-1 py-2 bg-[#059669]/20 hover:bg-[#059669]/30 border border-[#059669]/40 text-[#059669] text-xs font-semibold rounded-lg transition-colors disabled:opacity-40">
              {isBulkBusy
                ? <span className="flex items-center justify-center gap-1.5"><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Processing...</span>
                : `✓ Approve All (${items.length})`}
            </button>
            <button onClick={() => onRejectAll(queueType)} disabled={isBulkBusy || !!processing}
              className="flex-1 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 text-red-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40">
              {isBulkBusy ? '...' : `✕ Reject All (${items.length})`}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="px-5 py-8 text-center text-slate-500 text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="mx-auto mb-2"><polyline points="20 6 9 17 4 12"/></svg>
          <p className="text-slate-500 text-sm">All clear</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1E3A8A]/30 max-h-80 overflow-y-auto">
          {items.map(item => {
            const suspicious = (item as unknown as { is_suspicious?: boolean }).is_suspicious
            const customValue = (item as unknown as { value?: string }).value
            const isItemBusy = processing === item.id || isBulkBusy
            return (
              <div key={item.id}
                className={`px-5 py-4 transition-opacity ${isItemBusy ? 'opacity-40' : ''} ${suspicious ? 'bg-amber-950/30 border-l-2 border-amber-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <button className="flex-1 min-w-0 text-left"
                    onClick={() => isRecord
                      ? onViewRecord(item)
                      : onViewPendingItem(item as unknown as PendingItemDoc, queueType)}>
                    {suspicious && <span className="inline-block text-xs text-amber-400 font-semibold mb-1.5">⚠ Suspicious</span>}
                    {customValue ? (
                      <p className="text-white text-sm font-medium hover:text-[#059669] transition-colors">
                        {customValue}
                        <span className="ml-2 text-[10px] text-slate-500 font-normal">tap to edit</span>
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-white text-sm font-semibold hover:text-[#059669] transition-colors">
                          {formatBDT((item as unknown as { salary?: number }).salary || 0)}/mo
                          <span className="ml-2 text-[10px] text-slate-500 font-normal">tap to view</span>
                        </p>
                        <p className="text-slate-400 text-xs">
                          {(item as unknown as { area?: string }).area} · {(item as unknown as { student_level?: string }).student_level} · {(item as unknown as { curriculum?: string }).curriculum}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {(item as unknown as { university?: string }).university} — {(item as unknown as { department?: string }).department}
                        </p>
                      </div>
                    )}
                  </button>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => onApprove(queueType, item.id!)} disabled={isItemBusy}
                      className="px-3 py-1.5 bg-[#059669] hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                      {processing === item.id ? '...' : 'Approve'}
                    </button>
                    <button onClick={() => onReject(queueType, item.id!)} disabled={isItemBusy}
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
    </div>
  )
}

// ─── All Items Panel — generic for all 5 types ───────────────────────────────

type AllPanelType = 'records' | 'areas' | 'subjects' | 'universities' | 'departments'

const ALL_PANEL_CONFIG: Record<AllPanelType, { title: string; isRecord: boolean; collectionName: string }> = {
  records:     { title: 'Salary Reports',  isRecord: true,  collectionName: 'tuition_records' },
  areas:       { title: 'All Areas',        isRecord: false, collectionName: 'pending_areas' },
  subjects:    { title: 'All Subjects',     isRecord: false, collectionName: 'pending_subjects' },
  universities:{ title: 'All Universities', isRecord: false, collectionName: 'pending_universities' },
  departments: { title: 'All Departments',  isRecord: false, collectionName: 'pending_departments' },
}

function AllItemsPanel({
  panelType,
  onViewRecord,
  onViewPendingItem,
}: {
  panelType: AllPanelType
  onViewRecord: (r: TuitionRecord & { id: string }) => void
  onViewPendingItem: (item: PendingItemDoc, collectionKey: string) => void
}) {
  const cfg = ALL_PANEL_CONFIG[panelType]
  const [records, setRecords] = useState<Array<TuitionRecord & { id: string }>>([])
  const [pendingItems, setPendingItems] = useState<PendingItemDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (cfg.isRecord) {
        const all = await fetchAllRecords()
        setRecords(all)
      } else {
        const all = await fetchAllPendingItems(cfg.collectionName)
        setPendingItems(all)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [cfg.isRecord, cfg.collectionName])

  useEffect(() => { load() }, [load])

  const filteredRecords = records.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return r.area?.toLowerCase().includes(q) || r.university?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) || r.student_level?.toLowerCase().includes(q) ||
        r.curriculum?.toLowerCase().includes(q)
    }
    return true
  })

  const filteredItems = pendingItems.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (search.trim()) return item.value.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const count = cfg.isRecord ? filteredRecords.length : filteredItems.length

  return (
    <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1E3A8A]/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">{cfg.title}</h3>
            <span className="text-slate-400 text-xs">({count})</span>
          </div>
          <button onClick={load} disabled={loading}
            className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50">
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={cfg.isRecord ? 'Search area, university, level...' : 'Search value...'}
            className="flex-1 px-3 py-1.5 bg-[#0F172A] border border-[#1E3A8A]/40 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669]"/>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-1.5 bg-[#0F172A] border border-[#1E3A8A]/40 rounded-lg text-sm text-white focus:outline-none focus:border-[#059669]">
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-8 text-center text-slate-500 text-sm">Loading...</div>
      ) : count === 0 ? (
        <div className="px-5 py-8 text-center text-slate-500 text-sm">No records found</div>
      ) : cfg.isRecord ? (
        <div className="divide-y divide-[#1E3A8A]/30 max-h-[480px] overflow-y-auto">
          {filteredRecords.map(r => (
            <button key={r.id} onClick={() => onViewRecord(r)}
              className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors group">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
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
      ) : (
        <div className="divide-y divide-[#1E3A8A]/30 max-h-[480px] overflow-y-auto">
          {filteredItems.map(item => (
            <button key={item.id} onClick={() => onViewPendingItem(item, panelType)}
              className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors group">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium group-hover:text-[#059669] transition-colors">
                      {item.value}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">{formatDate(item.submitted_at)}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" className="flex-shrink-0 group-hover:stroke-[#059669] transition-colors"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Find & Replace Panel ─────────────────────────────────────────────────────

const FIND_REPLACE_FIELDS: { value: FindReplaceField; label: string; description: string }[] = [
  { value: 'area',        label: 'Areas',        description: 'area field in salary reports + pending_areas' },
  { value: 'university',  label: 'Universities',  description: 'university field in salary reports + pending_universities' },
  { value: 'department',  label: 'Departments',   description: 'department field in salary reports + pending_departments' },
  { value: 'subjects',    label: 'Subjects',      description: 'subjects array in salary reports + pending_subjects' },
]

function FindReplacePanel() {
  const [field, setField] = useState<FindReplaceField>('university')
  const [findValue, setFindValue] = useState('')
  const [replaceValue, setReplaceValue] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ updatedRecords: number; updatedPendingItems: number } | null>(null)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const selectedField = FIND_REPLACE_FIELDS.find(f => f.value === field)!

  const handleRun = async () => {
    setError('')
    setResult(null)

    if (!findValue.trim()) { setError('Enter a value to find.'); return }
    if (!replaceValue.trim()) { setError('Enter a replacement value.'); return }
    if (findValue.trim().toLowerCase() === replaceValue.trim().toLowerCase()) {
      setError('Find and replace values are the same.')
      return
    }
    if (!confirmed) { setError('Check the confirmation box before running.'); return }

    setRunning(true)
    try {
      const res = await findAndReplace(field, findValue.trim(), replaceValue.trim())
      setResult(res)
      setFindValue('')
      setReplaceValue('')
      setConfirmed(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  const handleReset = () => {
    setFindValue('')
    setReplaceValue('')
    setResult(null)
    setError('')
    setConfirmed(false)
  }

  return (
    <div className="max-w-2xl">
      {/* Info banner */}
      <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-700/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              <path d="M11 8v3M11 14h.01" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-1">Fix duplicate or inconsistent values</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              This tool replaces all occurrences of a value across every salary report and its matching option list.
              Matching is case-insensitive — <span className="text-slate-300">"shahbag"</span>, <span className="text-slate-300">"Shahbag"</span>, and <span className="text-slate-300">"SHAHBAG"</span> are all treated as the same.
              The replacement is written exactly as you type it.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E3A8A]/40">
          <h3 className="text-white font-semibold text-sm">Find &amp; Replace</h3>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Field selector */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Field</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FIND_REPLACE_FIELDS.map(f => (
                <button
                  key={f.value}
                  onClick={() => { setField(f.value); handleReset() }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                    field === f.value
                      ? 'bg-[#059669] border-[#059669] text-white'
                      : 'border-[#1E3A8A]/60 text-slate-400 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-slate-600 text-xs mt-2">Affects: {selectedField.description}</p>
          </div>

          {/* Find input */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Find (exact value, case-insensitive)</label>
            <input
              type="text"
              value={findValue}
              onChange={e => { setFindValue(e.target.value); setResult(null); setError(''); setConfirmed(false) }}
              placeholder={field === 'university' ? 'e.g. Dhaka University' : field === 'area' ? 'e.g. shahbag' : 'Value to find...'}
              className="w-full px-3.5 py-2.5 bg-[#0F172A] border border-[#1E3A8A]/40 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669]"
            />
          </div>

          {/* Replace input */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Replace with</label>
            <input
              type="text"
              value={replaceValue}
              onChange={e => { setReplaceValue(e.target.value); setResult(null); setError(''); setConfirmed(false) }}
              placeholder={field === 'university' ? 'e.g. University of Dhaka' : field === 'area' ? 'e.g. Shahbag' : 'Replacement value...'}
              className="w-full px-3.5 py-2.5 bg-[#0F172A] border border-[#1E3A8A]/40 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669]"
            />
          </div>

          {/* Preview */}
          {findValue.trim() && replaceValue.trim() && (
            <div className="bg-[#0F172A] border border-[#1E3A8A]/40 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Preview</p>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-red-400 font-mono bg-red-950/30 px-2 py-0.5 rounded">
                  &ldquo;{findValue.trim()}&rdquo;
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                <span className="text-emerald-400 font-mono bg-emerald-950/30 px-2 py-0.5 rounded">
                  &ldquo;{replaceValue.trim()}&rdquo;
                </span>
              </div>
              <p className="text-slate-600 text-xs mt-2">
                in all <span className="text-slate-400">{selectedField.label.toLowerCase()}</span> fields across salary reports and option lists
              </p>
            </div>
          )}

          {/* Confirmation checkbox */}
          {findValue.trim() && replaceValue.trim() && (
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border transition-colors ${
                    confirmed ? 'bg-[#059669] border-[#059669]' : 'border-[#1E3A8A]/60 bg-[#0F172A]'
                  }`}
                >
                  {confirmed && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" className="absolute inset-0.5">
                      <polyline points="2 6 5 9 10 3"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-slate-400 text-xs leading-relaxed">
                I understand this will permanently update all matching records in the database. This action cannot be undone.
              </span>
            </label>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Success result */}
          {result && (
            <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p className="text-emerald-400 text-sm font-semibold">Replacement complete</p>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <p>
                  <span className="text-white tabular-nums font-semibold">{result.updatedRecords}</span> salary report{result.updatedRecords !== 1 ? 's' : ''} updated
                </p>
                <p>
                  <span className="text-white tabular-nums font-semibold">{result.updatedPendingItems}</span> option list entr{result.updatedPendingItems !== 1 ? 'ies' : 'y'} updated
                </p>
              </div>
            </div>
          )}

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={running || !findValue.trim() || !replaceValue.trim() || !confirmed}
            className="w-full py-3 bg-[#059669] hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {running ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Running...
              </span>
            ) : 'Run Find & Replace'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field Values Panel ──────────────────────────────────────────────────────────────────────────────
// Shows ALL values from pending_* collections regardless of status or usage.
// Admin can edit (rename + sync to all records) or delete any value.

const FIELD_VALUE_TABS: { key: ManagedField; label: string }[] = [
  { key: 'area',        label: 'Areas' },
  { key: 'university',  label: 'Universities' },
  { key: 'department',  label: 'Departments' },
  { key: 'subjects',    label: 'Subjects' },
]

type ActionMode = { type: 'edit'; entry: FieldValueEntry } | { type: 'delete'; entry: FieldValueEntry } | null

function FieldValuesPanel() {
  const [activeField, setActiveField] = useState<ManagedField>('university')
  const [allValues, setAllValues] = useState<Record<ManagedField, FieldValueEntry[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Active action (edit or delete) — only one at a time
  const [action, setAction] = useState<ActionMode>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Edit draft value
  const [editDraft, setEditDraft] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAllFieldValues()
      setAllValues(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const resetAction = () => { setAction(null); setActionError(''); setEditDraft('') }

  const startEdit = (entry: FieldValueEntry) => {
    setSuccessMsg('')
    setAction({ type: 'edit', entry })
    setEditDraft(entry.value)
    setActionError('')
  }

  const startDelete = (entry: FieldValueEntry) => {
    setSuccessMsg('')
    setAction({ type: 'delete', entry })
    setActionError('')
  }

  const handleEdit = async () => {
    if (!action || action.type !== 'edit') return
    const newVal = editDraft.trim()
    if (!newVal) { setActionError('Value cannot be empty.'); return }
    if (newVal.toLowerCase() === action.entry.value.toLowerCase()) { setActionError('No change detected.'); return }

    setBusy(true); setActionError('')
    try {
      const result = await editFieldValue(activeField, action.entry.id, action.entry.value, newVal)
      setSuccessMsg(`“${action.entry.value}” renamed to “${newVal}” · ${result.updatedRecords} record${result.updatedRecords !== 1 ? 's' : ''} updated`)
      resetAction()
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Edit failed.')
    } finally { setBusy(false) }
  }

  const handleDelete = async () => {
    if (!action || action.type !== 'delete') return
    setBusy(true); setActionError('')
    try {
      const result = await deleteFieldValue(activeField, action.entry.id, action.entry.value)
      setSuccessMsg(`“${action.entry.value}” deleted · ${result.updatedRecords} record${result.updatedRecords !== 1 ? 's' : ''} updated`)
      resetAction()
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Delete failed.')
    } finally { setBusy(false) }
  }

  // ── Seed state ──────────────────────────────────────────────────────────────
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ total: number; skipped: number } | null>(null)
  const [seedError, setSeedError] = useState('')
  const [seedConfirmed, setSeedConfirmed] = useState(false)

  const handleSeed = async () => {
    if (!seedConfirmed) { setSeedError('Check the confirmation box first.'); return }
    setSeeding(true); setSeedError(''); setSeedResult(null)
    try {
      const res = await seedOptionLists()
      const total = res.areas.written + res.subjects.written + res.universities.written + res.departments.written
      const skipped = res.areas.skipped + res.subjects.skipped + res.universities.skipped + res.departments.skipped
      setSeedResult({ total, skipped })
      setSeedConfirmed(false)
      await load()
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : 'Seeding failed.')
    } finally { setSeeding(false) }
  }

  const currentList = allValues ? allValues[activeField] : []
  const filtered = currentList.filter(e =>
    e.value.toLowerCase().includes(search.toLowerCase())
  )

  const STATUS_BADGE: Record<string, string> = {
    approved: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40',
    pending:  'bg-amber-900/40  text-amber-400  border border-amber-700/40',
    rejected: 'bg-red-900/40   text-red-400   border border-red-700/40',
  }

  return (
    <div className="max-w-2xl">
      {/* Info banner */}
      <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-700/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-1">Manage all field values</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Shows every value in the option lists (all statuses). <span className="text-slate-300">Edit</span> renames a value and syncs the change across all salary records.
              <span className="text-slate-300"> Delete</span> removes it from the list and blanks it in any record that used it.
            </p>
          </div>
        </div>
      </div>

      {/* ── Seed Option Lists ── one-time migration ──────────────────────────── */}
      <div className="bg-[#1E293B] border border-amber-700/30 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-amber-700/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-1">Seed option lists from defaults</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              One-time operation. Writes all preloaded areas, subjects, universities and departments
              from the codebase into Firestore so they appear here and can be managed.
              Already-existing values are skipped automatically.
            </p>
          </div>
        </div>

        {seedResult && (
          <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl px-4 py-3 mb-4">
            <p className="text-emerald-400 text-xs font-semibold mb-0.5">Seeding complete</p>
            <p className="text-slate-400 text-xs">
              {seedResult.total} value{seedResult.total !== 1 ? 's' : ''} written &middot; {seedResult.skipped} already existed and were skipped
            </p>
          </div>
        )}

        {seedError && (
          <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-400 text-xs">{seedError}</p>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer select-none mb-4">
          <div className="relative flex-shrink-0 mt-0.5">
            <input type="checkbox" checked={seedConfirmed} onChange={e => { setSeedConfirmed(e.target.checked); setSeedError('') }} className="sr-only"/>
            <div className={`w-4 h-4 rounded border transition-colors ${seedConfirmed ? 'bg-[#059669] border-[#059669]' : 'border-[#1E3A8A]/60 bg-[#0F172A]'}`}>
              {seedConfirmed && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" className="absolute inset-0.5">
                  <polyline points="2 6 5 9 10 3"/>
                </svg>
              )}
            </div>
          </div>
          <span className="text-slate-400 text-xs leading-relaxed">
            I understand this writes the default option lists to Firestore. Safe to run multiple times — duplicates are skipped.
          </span>
        </label>

        <button
          onClick={handleSeed}
          disabled={seeding || !seedConfirmed}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {seeding ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Seeding...
            </span>
          ) : 'Seed Option Lists'}
        </button>
      </div>

      <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl overflow-hidden">
        {/* Field type selector */}
        <div className="flex border-b border-[#1E3A8A]/40">
          {FIELD_VALUE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveField(tab.key); setSearch(''); setSuccessMsg(''); resetAction() }}
              className={`flex-1 py-3 text-xs font-semibold transition-colors border-r border-[#1E3A8A]/40 last:border-r-0 ${
                activeField === tab.key ? 'bg-[#0F172A] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
              {allValues && (
                <span className="ml-1.5 text-slate-500 font-normal">({allValues[tab.key].length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search + refresh */}
        <div className="px-5 py-4 border-b border-[#1E3A8A]/40 flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${FIELD_VALUE_TABS.find(t => t.key === activeField)?.label.toLowerCase()}...`}
            className="flex-1 px-3 py-2 bg-[#0F172A] border border-[#1E3A8A]/40 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669]"
          />
          <button onClick={load} disabled={loading}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
            {loading ? '...' : '↻'}
          </button>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="mx-5 mt-4 bg-emerald-950/30 border border-emerald-700/40 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-emerald-400 text-xs font-medium">{successMsg}</p>
            <button onClick={() => setSuccessMsg('\')} className="text-slate-500 hover:text-white text-lg leading-none ml-4">×</button>
          </div>
        )}

        {/* Action panel — edit or delete confirmation */}
        {action && (
          <div className={`mx-5 mt-4 rounded-xl px-4 py-4 border ${
            action.type === 'edit'
              ? 'bg-blue-950/30 border-blue-800/50'
              : 'bg-red-950/30 border-red-800/50'
          }`}>
            {action.type === 'edit' ? (
              <>
                <p className="text-white text-sm font-semibold mb-3">
                  Rename “{action.entry.value}”
                </p>
                <input
                  type="text"
                  value={editDraft}
                  onChange={e => { setEditDraft(e.target.value); setActionError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') resetAction() }}
                  autoFocus
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E3A8A]/60 rounded-lg text-sm text-white focus:outline-none focus:border-[#059669] mb-3"
                />
                <p className="text-slate-500 text-xs mb-3 leading-relaxed">
                  This will update the value in the option list and rename it across all salary records.
                </p>
                {actionError && <p className="text-red-400 text-xs mb-3">{actionError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleEdit} disabled={busy}
                    className="px-4 py-2 bg-[#059669] hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                    {busy ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Saving...
                      </span>
                    ) : 'Save & Sync'}
                  </button>
                  <button onClick={resetAction} disabled={busy}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-white text-sm font-semibold mb-1">Delete “{action.entry.value}”?</p>
                <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                  This removes the entry from the option list and blanks the field in any records that used it. Cannot be undone.
                </p>
                {actionError && <p className="text-red-400 text-xs mb-3">{actionError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleDelete} disabled={busy}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                    {busy ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Deleting...
                      </span>
                    ) : 'Yes, delete'}
                  </button>
                  <button onClick={resetAction} disabled={busy}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Value list */}
        {loading ? (
          <div className="px-5 py-10 text-center text-slate-500 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500 text-sm">
            {search ? 'No values match your search.' : 'No values found.'}
          </div>
        ) : (
          <div className="divide-y divide-[#1E3A8A]/30 max-h-[480px] overflow-y-auto">
            {filtered.map(entry => {
              const isActive = action && action.entry.id === entry.id
              return (
                <div key={entry.id}
                  className={`flex items-center justify-between px-5 py-3.5 gap-3 transition-colors ${
                    isActive
                      ? action.type === 'edit' ? 'bg-blue-950/20' : 'bg-red-950/20'
                      : 'hover:bg-white/5'
                  }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-medium truncate">{entry.value}</p>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[entry.status] || STATUS_BADGE.pending}`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {entry.count > 0
                        ? `${entry.count} record${entry.count !== 1 ? 's' : ''}`
                        : 'not used in any record'}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {/* Edit button */}
                    <button
                      onClick={() => isActive && action.type === 'edit' ? resetAction() : startEdit(entry)}
                      disabled={busy}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 ${
                        isActive && action.type === 'edit'
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-[#1E3A8A]/60 text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}>
                      Edit
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => isActive && action.type === 'delete' ? resetAction() : startDelete(entry)}
                      disabled={busy}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 ${
                        isActive && action.type === 'delete'
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'border-red-900/50 text-red-400 hover:bg-red-950/40 hover:border-red-700'
                      }`}>
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[#1E3A8A]/40">
            <p className="text-xs text-slate-600">
              {filtered.length} value{filtered.length !== 1 ? 's' : ''}{search ? ` matching “${search}”` : ' total'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type AdminTab = 'queues' | 'all-records' | 'find-replace' | 'field-values'

function Dashboard({ userEmail, onSignOut }: { userEmail: string; onSignOut: () => void }) {
  const { items, loading, processing, bulkProcessing, approve, reject, approveAll, rejectAll, refresh, refreshAll } = useAdminQueue()
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('queues')
  const [options, setOptions] = useState<ApprovedOptions>({ areas: [], subjects: [], universities: [], departments: [] })

  const [selectedRecord, setSelectedRecord] = useState<(TuitionRecord & { id: string }) | null>(null)
  const [selectedPendingItem, setSelectedPendingItem] = useState<{ item: PendingItemDoc; collectionKey: string } | null>(null)

  useEffect(() => {
    refreshAll()
    fetchAdminStats().then(setAdminStats).catch(() => {})
    fetchApprovedOptions().then(setOptions).catch(() => {})
  }, [refreshAll])

  const totalPending = Object.values(items).reduce((sum, arr) => sum + arr.length, 0)

  const queuePanels: { title: string; queueType: string }[] = [
    { title: 'Salary Reports',  queueType: 'records' },
    { title: 'New Areas',        queueType: 'areas' },
    { title: 'New Subjects',     queueType: 'subjects' },
    { title: 'New Universities', queueType: 'universities' },
    { title: 'New Departments',  queueType: 'departments' },
  ]

  const allPanels: AllPanelType[] = ['records', 'areas', 'subjects', 'universities', 'departments']

  const handleViewPendingItem = useCallback((item: PendingItemDoc, collectionKey: string) => {
    setSelectedPendingItem({ item, collectionKey })
  }, [])

  const handleRecordSaved = useCallback((updated: TuitionRecord & { id: string }) => {
    setSelectedRecord(updated)
    fetchAdminStats().then(setAdminStats).catch(() => {})
  }, [])

  const handlePendingItemSaved = useCallback((updated: PendingItemDoc) => {
    setSelectedPendingItem(prev => prev ? { ...prev, item: updated } : null)
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">
            Admin Panel
            {totalPending > 0 && (
              <span className="ml-3 inline-flex items-center justify-center px-2.5 py-1 bg-amber-500 text-white text-sm font-bold rounded-full">
                {totalPending} pending
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{userEmail}</p>
        </div>
        <button onClick={onSignOut} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
          Sign Out
        </button>
      </div>

      {/* Stats */}
      {adminStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <AdminStatCard label="Total Reports"   value={adminStats.total_reports.toString()} />
          <AdminStatCard label="Approved"         value={adminStats.approved_reports.toString()} />
          <AdminStatCard label="Pending"          value={adminStats.pending_reports.toString()} />
          <AdminStatCard label="Rejected"         value={adminStats.rejected_reports.toString()} />
          <AdminStatCard label="Areas"            value={adminStats.areas_covered.toString()} />
          <AdminStatCard label="Universities"     value={adminStats.universities_covered.toString()} />
          <AdminStatCard label="Subjects"         value={adminStats.subjects_covered.toString()} />
          <AdminStatCard label="Median Salary"    value={formatBDT(adminStats.median_salary)} />
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-[#1E293B] border border-[#1E3A8A]/40 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('queues')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'queues' ? 'bg-[#059669] text-white' : 'text-slate-400 hover:text-white'}`}>
          Moderation Queues
          {totalPending > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-amber-500 text-white text-xs font-bold rounded-full">{totalPending}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('all-records')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'all-records' ? 'bg-[#059669] text-white' : 'text-slate-400 hover:text-white'}`}>
          All Records
        </button>
        <button onClick={() => setActiveTab('find-replace')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'find-replace' ? 'bg-[#059669] text-white' : 'text-slate-400 hover:text-white'}`}>
          Find &amp; Replace
        </button>
        <button onClick={() => setActiveTab('field-values')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'field-values' ? 'bg-[#059669] text-white' : 'text-slate-400 hover:text-white'}`}>
          Field Values
        </button>
      </div>

      {/* Moderation Queues tab */}
      {activeTab === 'queues' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {queuePanels.map(({ title, queueType }) => (
            <QueuePanel
              key={queueType}
              title={title}
              queueType={queueType}
              items={items[queueType] || []}
              loading={loading[queueType] || false}
              processing={processing}
              bulkProcessing={bulkProcessing}
              onApprove={approve}
              onReject={reject}
              onApproveAll={approveAll}
              onRejectAll={rejectAll}
              onRefresh={refresh}
              onViewRecord={setSelectedRecord}
              onViewPendingItem={handleViewPendingItem}
            />
          ))}
        </div>
      )}

      {/* All Records tab */}
      {activeTab === 'all-records' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {allPanels.map(pt => (
            <AllItemsPanel
              key={pt}
              panelType={pt}
              onViewRecord={setSelectedRecord}
              onViewPendingItem={handleViewPendingItem}
            />
          ))}
        </div>
      )}

      {/* Find & Replace tab */}
      {activeTab === 'find-replace' && <FindReplacePanel />}

      {/* Field Values tab */}
      {activeTab === 'field-values' && <FieldValuesPanel />}

      {/* Salary record modal */}
      {selectedRecord && (
        <RecordModal
          record={selectedRecord}
          options={options}
          onClose={() => setSelectedRecord(null)}
          onSaved={handleRecordSaved}
        />
      )}

      {/* Pending item modal */}
      {selectedPendingItem && (
        <PendingItemModal
          item={selectedPendingItem.item}
          collectionKey={selectedPendingItem.collectionKey}
          onClose={() => setSelectedPendingItem(null)}
          onSaved={handlePendingItemSaved}
        />
      )}
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
