'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getDb, getAuthInstance } from '@/lib/firebase/config';
import type { User } from 'firebase/auth';
import { PendingItem } from '@/lib/types';

type Queue = 'pending_areas' | 'pending_subjects' | 'pending_universities' | 'pending_departments';

const QUEUES: { key: Queue; label: string }[] = [
  { key: 'pending_areas', label: 'Areas' },
  { key: 'pending_subjects', label: 'Subjects' },
  { key: 'pending_universities', label: 'Universities' },
  { key: 'pending_departments', label: 'Departments' },
];

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const authInstance = await getAuthInstance();
      const cred = await signInWithEmailAndPassword(authInstance, email, password);
      onLogin(cred.user);
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 rounded-lg bg-[#059669] flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L2 5v4c0 4.5 3.5 7.5 7 9 3.5-1.5 7-4.5 7-9V5L9 1z" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Access</h1>
          <p className="text-[#94A3B8] text-sm mt-1">TuitionMeter Moderation Panel</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-3 py-2.5 bg-white/10 border border-white/10 rounded text-white text-sm placeholder-[#475569] focus:outline-none focus:border-[#059669] transition-colors"
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-3 py-2.5 bg-white/10 border border-white/10 rounded text-white text-sm placeholder-[#475569] focus:outline-none focus:border-[#059669] transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-[#059669] hover:bg-[#047857] disabled:opacity-60 text-white font-semibold rounded text-sm transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Queue Panel ─────────────────────────────────────────────────────────────
function QueuePanel({ queueKey, label }: { queueKey: Queue; label: string }) {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const q = query(
        collection(db, queueKey),
        where('status', '==', 'pending'),
        orderBy('submitted_at', 'desc')
      );
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PendingItem, 'id'>) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [queueKey]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    setProcessing(id);
    try {
      const db = await getDb();
      await updateDoc(doc(db, queueKey, id), { status: action });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm">
          {label}
          <span className="ml-2 bg-white/10 text-[#94A3B8] text-xs px-2 py-0.5 rounded-full">
            {loading ? '…' : items.length}
          </span>
        </h3>
        <button onClick={fetchItems} className="text-[#94A3B8] hover:text-white text-xs transition-colors">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-8 text-center text-[#475569] text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="text-[#059669] text-xs font-medium">All clear</div>
          <div className="text-[#475569] text-xs mt-1">No pending items</div>
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.value}</p>
                <p className="text-[#475569] text-xs mt-0.5">
                  {item.submitted_at instanceof Timestamp
                    ? item.submitted_at.toDate().toLocaleDateString('en-GB')
                    : new Date(item.submitted_at as Date).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAction(item.id!, 'approved')}
                  disabled={processing === item.id}
                  className="px-3 py-1.5 bg-[#059669]/20 hover:bg-[#059669]/40 text-[#059669] text-xs font-semibold rounded transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(item.id!, 'rejected')}
                  disabled={processing === item.id}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let unsub: () => void;
    (async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const authInstance = await getAuthInstance();
      unsub = onAuthStateChanged(authInstance, (u) => {
        setUser(u);
        setAuthLoading(false);
      });
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  async function handleSignOut() {
    const { signOut } = await import('firebase/auth');
    const authInstance = await getAuthInstance();
    await signOut(authInstance);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginForm onLogin={setUser} />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[#059669] text-xs font-bold tracking-wider uppercase mb-1">Admin Panel</div>
          <h1 className="text-xl font-bold text-white">Moderation Queue</h1>
          <p className="text-[#475569] text-xs mt-0.5">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[#94A3B8] text-sm rounded transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {QUEUES.map((q) => (
          <QueuePanel key={q.key} queueKey={q.key} label={q.label} />
        ))}
      </div>

      <p className="mt-8 text-[#334155] text-xs text-center">
        TuitionMeter Admin Panel · Approve or reject community-submitted items
      </p>
    </div>
  );
}
