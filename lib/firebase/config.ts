import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp(firebaseConfig)
}

let _db: Firestore | null = null
export async function getDb(): Promise<Firestore> {
  if (_db) return _db
  const app = getFirebaseApp()
  _db = getFirestore(app)
  return _db
}

export async function getAuthInstance() {
  const { getAuth } = await import('firebase/auth')
  const app = getFirebaseApp()
  return getAuth(app)
}

export async function getAnalyticsInstance() {
  if (typeof window === 'undefined') return null
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics')
    const supported = await isSupported()
    if (!supported) return null
    const app = getFirebaseApp()
    return getAnalytics(app)
  } catch {
    return null
  }
}

// Auto-init analytics in browser
if (typeof window !== 'undefined') {
  getAnalyticsInstance().catch(() => {})
}
