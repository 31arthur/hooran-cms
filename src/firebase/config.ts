/**
 * Firebase Configuration
 *
 * Simple and direct Firebase initialization using environment variables.
 * This file exports Firebase service instances that are ready to use.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

/**
 * Firebase configuration from environment variables
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase configuration is missing. Please check your .env file and ensure all VITE_FIREBASE_* variables are set.'
  )
}

// Initialize Firebase
console.log('🔥 Initializing Firebase...')
export const app: FirebaseApp = initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)

console.log('✅ Firebase initialized successfully')
console.log('📊 Firebase Project ID:', firebaseConfig.projectId)

// Export instances with alternative names for convenience
export const firestore = db
export const firebaseAuth = auth
export const firebaseStorage = storage
export const firebaseApp = app

// Export types for convenience
export type { FirebaseApp, Auth, Firestore, FirebaseStorage }
