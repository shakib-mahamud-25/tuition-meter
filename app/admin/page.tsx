'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAdminQueue } from '../../hooks/useAdminQueue'
import { getAuthErrorMessage } from '../../lib/errors'
import { formatBDT, fetchAdminStats } from '../../lib/benchmark'
import { trackAdminLogin, trackAdminLogout } from '../../lib/analytics'
import type { AdminStats, TuitionRecord } from '../../lib/types'

// ─── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter your email and password.'); return }
    setLoading(true)
    setError('')
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { getAuthInstance } = await import('../../lib/firebase/config')
      const auth = await getAuthInstance()
      await signInWithEmailAndPassword(auth, email, password)
      await trackAdminLogin()
      onLogin()
    } catch (e) {
      setError(getAuthErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-10 h-10 rounded-xl bg-[#059669] flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="9" width="3" height="7" rx="1" fill="white" />
              <rect x="7.5" y="5" width="3" height="11" rx="1" fill="white" />
              <rect x="13" y="2" width="3" height="14" rx="1" fill="white" />
            </svg>
          </div>
          <h1 className="text-white font-bold text-xl">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">TuitionMeter</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-3.5 py-2.5 bg-[#0F172A] border border-[#1E3A8A]/40 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-900"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#0F172A] border border-[#1E3A8A]/40 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-900"
            />
          </div>
          {error && (
            <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-[#059669] hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function AdminStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-xl p-4">
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

// ─── Queue Panel ───────────────────────────────────────────────────────────────

function QueuePanel({
  title,
  queueType,
  items,
  loading,
  processing,
  bulkProcessing,
  onApprove,
  onReject,
  onApproveAll,
  onRejectAll,
  onRefresh,
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
}) {
  const isBulkBusy = bulkProcessing === queueType

  return (
    <div className="bg-[#1E293B] border border-[#1E3A8A]/40 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1E3A8A]/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">{title}</h3>
            {items.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={() => onRefresh(queueType)}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>

        {/* Bulk actions — only show when there are items */}
        {items.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => onApproveAll(queueType)}
              disabled={isBulkBusy || !!processing}
              className="flex-1 py-2 bg-[#059669]/20 hover:bg-[#059669]/30 border border-[#059669]/40 text-[#059669] text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
            >
              {isBulkBusy ? (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : `✓ Approve All (${items.length})`}
            </button>
            <button
              onClick={() => onRejectAll(queueType)}
              disabled={isBulkBusy || !!processing}
              className="flex-1 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 text-red-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
            >
              {isBulkBusy ? '...' : `✕ Reject All (${items.length})`}
            </button>
          </div>
        )}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="px-5 py-8 text-center text-slate-500 text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="mx-auto mb-2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-slate-500 text-sm">All clear</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1E3A8A]/30 max-h-80 overflow-y-auto">
          {items.map(item => {
            const suspicious = (item as unknown as { is_suspicious?: boolean }).is_suspicious
            const value = (item as unknown as { value?: string }).value
            const isItemBusy = processing === item.id || isBulkBusy
            return (
              <div
                key={item.id}
                className={`px-5 py-4 transition-opacity ${isItemBusy ? 'opacity-40' : ''} ${suspicious ? 'bg-amber-950/30 border-l-2 border-amber-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {suspicious && (
                      <span className="inline-block text-xs text-amber-400 font-semibold mb-1.5">⚠ Suspicious</span>
                    )}
                    {value ? (
                      <p className="text-white text-sm font-medium">{value}</p>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-white text-sm font-semibold">
                          {formatBDT((item as unknown as { salary?: number }).salary || 0)}/mo
                        </p>
                        <p className="text-slate-400 text-xs">
                          {(item as unknown as { area?: string }).area} · {(item as unknown as { student_level?: string }).student_level} · {(item as unknown as { curriculum?: string }).curriculum}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {(item as unknown as { university?: string }).university} — {(item as unknown as { department?: string }).department}
                        </p>
                        <p className="text-slate-600 text-xs">
                          {(item as unknown as { days_per_week?: number }).days_per_week}d/wk · {(item as unknown as { hours_per_session?: string }).hours_per_session}hr/session
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => onApprove(queueType, item.id!)}
                      disabled={isItemBusy}
                      className="px-3 py-1.5 bg-[#059669] hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {processing === item.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => onReject(queueType, item.id!)}
                      disabled={isItemBusy}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-red-900 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ userEmail, onSignOut }: { userEmail: string; onSignOut: () => void }) {
  const {
    items, loading, processing, bulkProcessing,
    approve, reject, approveAll, rejectAll,
    refresh, refreshAll,
  } = useAdminQueue()
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    refreshAll()
    fetchAdminStats().then(setAdminStats).catch(() => {})
  }, [refreshAll])

  const queuePanels = [
    { title: 'Salary Reports', queueType: 'records' },
    { title: 'New Areas', queueType: 'areas' },
    { title: 'New Subjects', queueType: 'subjects' },
    { title: 'New Universities', queueType: 'universities' },
    { title: 'New Departments', queueType: 'departments' },
  ]

  const totalPending = Object.values(items).reduce((sum, arr) => sum + arr.length, 0)

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
        <button
          onClick={onSignOut}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Stats grid */}
      {adminStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <AdminStatCard label="Total Reports" value={adminStats.total_reports.toString()} />
          <AdminStatCard label="Approved" value={adminStats.approved_reports.toString()} />
          <AdminStatCard label="Pending" value={adminStats.pending_reports.toString()} />
          <AdminStatCard label="Rejected" value={adminStats.rejected_reports.toString()} />
          <AdminStatCard label="Areas" value={adminStats.areas_covered.toString()} />
          <AdminStatCard label="Universities" value={adminStats.universities_covered.toString()} />
          <AdminStatCard label="Subjects" value={adminStats.subjects_covered.toString()} />
          <AdminStatCard label="Median Salary" value={formatBDT(adminStats.median_salary)} />
        </div>
      )}

      {/* Moderation queues */}
      <h2 className="text-white font-semibold text-lg mb-4">Moderation Queues</h2>
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
          />
        ))}
      </div>
    </div>
  )
}

// ─── Root Admin Page ───────────────────────────────────────────────────────────

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
        unsubscribe = onAuthStateChanged(auth, (u) => {
          setUser(u ? { email: u.email || '' } : null)
          setChecking(false)
        })
      } catch {
        setChecking(false)
      }
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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Checking session...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={() => {}} />
  }

  return <Dashboard userEmail={user.email} onSignOut={handleSignOut} />
}
