import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { type Firestore } from 'firebase/firestore';
import { type Auth } from 'firebase/auth';
import { type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _analytics: Analytics | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

export async function getDb(): Promise<Firestore> {
  if (!_db) {
    const { getFirestore } = await import('firebase/firestore');
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}

export async function getAuthInstance(): Promise<Auth> {
  if (!_auth) {
    const { getAuth } = await import('firebase/auth');
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

export async function getAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null; // don't run on server
  if (!_analytics) {
    const { getAnalytics: initAnalytics, isSupported } = await import('firebase/analytics');
    const supported = await isSupported();
    if (supported) {
      _analytics = initAnalytics(getFirebaseApp());
    }
  }
  return _analytics;
}

// Auto-initialize analytics when this module loads in the browser
if (typeof window !== 'undefined') {
  getAnalytics();
}
