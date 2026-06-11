interface FirebaseError {
  code?: string
  message?: string
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return typeof error === 'object' && error !== null && 'code' in error
}

export function getFirestoreErrorMessage(error: unknown): string {
  if (!isFirebaseError(error)) return 'Something went wrong. Please try again.'
  switch (error.code) {
    case 'permission-denied':
      return "You don't have permission to do that."
    case 'unavailable':
      return 'Data is temporarily unavailable. Please try again.'
    case 'deadline-exceeded':
      return 'Connection timed out. Check your internet and retry.'
    case 'unauthenticated':
      return 'Please log in to continue.'
    case 'not-found':
      return 'The requested data could not be found.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export function getAuthErrorMessage(error: unknown): string {
  if (!isFirebaseError(error)) return 'Login failed. Please try again.'
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Connection failed. Check your internet and retry.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    default:
      return 'Login is currently unavailable. Please try again.'
  }
}

export function isPermissionError(error: unknown): boolean {
  return isFirebaseError(error) && error.code === 'permission-denied'
}

export function isNetworkError(error: unknown): boolean {
  return (
    isFirebaseError(error) &&
    (error.code === 'unavailable' || error.code === 'deadline-exceeded')
  )
}
