'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'

interface PendingItem {
  id: string
  value: string
  submitted_at: { toDate(): Date } | Date
}

interface QueuePanelProps {
  title: string
  collectionName: string
}

function formatDate(ts: { toDate(): Date } | Date): string {
  const date = typeof (ts as { toDate?: unknown }).toDate === 'function'
    ? (ts as { toDate(): Date }).toDate()
    : (ts as Date)
  return date.toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
}

function QueuePanel({ title, collectionName }: QueuePanelProps) {
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { getDb } = await import('@/lib/firebase/config')
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const db = await getDb()
      const q = query(collection(db, collectionName), where('status', '==', 'pending'))
      const snap = await getDocs(q)
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PendingItem, 'id'>) })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [collectionName])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setActionLoading(id)
    try {
      const { getDb } = await import('@/lib/firebase/config')
      const { doc, updateDoc } = await import('firebase/firestore')
      const db = await getDb()
      await updateDoc(doc(db, collectionName, id), { status })
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-base">{title}</h3>
        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-semibold">
          {items.length} pending
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-10 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-4">No pending items</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 bg-white/5 rounded-lg px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.value}</p>
                <p className="text-slate-500 text-xs">{formatDate(item.submitted_at)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => updateStatus(item.id, 'approved')}
                  disabled={actionLoading === item.id}
                  className="px-3 py-1 rounded-md bg-[#059669] text-white text-xs font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(item.id, 'rejected')}
                  disabled={actionLoading === item.id}
                  className="px-3 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function check() {
      try {
        const { getAuthInstance } = await import('@/lib/firebase/config')
        const { onAuthStateChanged } = await import('firebase/auth')
        const auth = await getAuthInstance()
        const unsub = onAuthStateChanged(auth, (user) => {
          setLoggedIn(!!user)
          setCheckingAuth(false)
        })
        return unsub
      } catch {
        setCheckingAuth(false)
      }
    }
    check()
  }, [])

  async function handleLogin() {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const { getAuthInstance } = await import('@/lib/firebase/config')
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const auth = await getAuthInstance()
      await signInWithEmailAndPassword(auth, email, password)
      setLoggedIn(true)
    } catch {
      setAuthError('Invalid email or password.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      const { getAuthInstance } = await import('@/lib/firebase/config')
      const { signOut } = await import('firebase/auth')
      const auth = await getAuthInstance()
      await signOut(auth)
      setLoggedIn(false)
    } catch (e) {
      console.error(e)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="w-8 h-8 rounded-md bg-[#059669] flex items-center justify-center text-white font-bold">T</span>
            <span className="text-white font-bold text-xl tracking-tight">
              Tuition<span className="text-[#059669]">Meter</span>
            </span>
          </div>
          <h2 className="text-white font-bold text-xl text-center mb-6">Admin Sign In</h2>

          {authError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {authError}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none transition-colors"
            />
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full py-3 rounded-lg bg-[#059669] text-white font-semibold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {authLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-extrabold text-2xl">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve pending submissions</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Queues */}
      <div className="grid md:grid-cols-2 gap-5">
        <QueuePanel title="Areas" collectionName="pending_areas" />
        <QueuePanel title="Subjects" collectionName="pending_subjects" />
        <QueuePanel title="Universities" collectionName="pending_universities" />
        <QueuePanel title="Departments" collectionName="pending_departments" />
      </div>
    </div>
  )
}
