/**
 * Firebase Configuration
 *
 * This file initializes Firebase services for Hooran CMS.
 * All configuration values are loaded from environment variables.
 *
 * Environment variables required:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 */

import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ]

  const missingKeys = requiredKeys.filter(
    (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
  )

  if (missingKeys.length > 0) {
    console.error(
      `Missing Firebase configuration for: ${missingKeys.join(', ')}\n` +
      'Please ensure all VITE_FIREBASE_* environment variables are set in your .env file.'
    )
    // Don't throw in production to prevent crashes, but log the error
    if (import.meta.env.DEV) {
      throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`)
    }
  }
}

// Validate configuration
validateFirebaseConfig()

// Initialize Firebase
let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  // Connect to Firebase Emulators in development if configured
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
    const firestoreEmulatorHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080'
    const storageEmulatorHost = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199'

    connectAuthEmulator(auth, `http://${authEmulatorHost}`)
    connectFirestoreEmulator(
      db,
      firestoreEmulatorHost.split(':')[0],
      parseInt(firestoreEmulatorHost.split(':')[1] || '8080')
    )
    connectStorageEmulator(
      storage,
      storageEmulatorHost.split(':')[0],
      parseInt(storageEmulatorHost.split(':')[1] || '9199')
    )

    console.log('🔧 Connected to Firebase Emulators')
  }

  console.log('✅ Firebase initialized successfully')
} catch (error) {
  console.error('❌ Error initializing Firebase:', error)
  throw error
}

// Export initialized services
export { app, auth, db, storage }

// Export Firebase instances with named exports for better tree-shaking
export const firestore = db
export const firebaseAuth = auth
export const firebaseStorage = storage
export const firebaseApp = app

// Export types for convenience
export type { FirebaseApp, Auth, Firestore, FirebaseStorage }
