import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Lazy sync initialization — only runs once
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp(firebaseConfig)
}

let dbInstance: Firestore | null = null
export async function getDb(): Promise<Firestore> {
  if (dbInstance) return dbInstance
  const app = getFirebaseApp()
  dbInstance = getFirestore(app)
  return dbInstance
}

let authInstance: Auth | null = null
export async function getAuthInstance(): Promise<Auth> {
  if (authInstance) return authInstance
  const app = getFirebaseApp()
  authInstance = getAuth(app)
  return authInstance
}

// Analytics — browser only, async, uses isSupported() guard
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(async ({ getAnalytics, isSupported }) => {
    const supported = await isSupported()
    if (supported) {
      const app = getFirebaseApp()
      getAnalytics(app)
    }
  }).catch(() => {
    // Analytics not critical — swallow errors
  })
}
