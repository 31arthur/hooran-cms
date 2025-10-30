/**
 * Firebase Database Initializer
 *
 * Concrete implementation of IDatabaseInitializer for Firebase.
 * Handles Firebase App initialization, Firestore, Auth, and Storage setup.
 *
 * **Responsibilities:**
 * - Initialize Firebase App with configuration
 * - Set up Firestore, Auth, and Storage instances
 * - Connect to emulators in development mode
 * - Provide health checks and status monitoring
 * - Manage lifecycle (initialization and cleanup)
 *
 * **Architecture:**
 * This class isolates all Firebase-specific initialization logic,
 * making it easy to:
 * - Test components without real Firebase
 * - Swap to different database providers
 * - Mock database for unit tests
 * - Control initialization timing
 */

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  limit,
  query,
  type Firestore,
} from 'firebase/firestore'
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage'
import type {
  IDatabaseInitializer,
  DatabaseConfig,
  DatabaseStatus,
  DatabaseHealthCheck,
} from './IDatabaseInitializer'
import { DatabaseStatus as Status } from './IDatabaseInitializer'

/**
 * Firebase Configuration Interface
 *
 * Extends base DatabaseConfig with Firebase-specific options.
 */
export interface FirebaseConfig extends DatabaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  useEmulators?: boolean
  emulatorHosts?: {
    auth?: string
    firestore?: string
    storage?: string
  }
}

/**
 * FirebaseInitializer
 *
 * Manages Firebase initialization and lifecycle.
 */
export class FirebaseInitializer implements IDatabaseInitializer {
  private status: DatabaseStatus = Status.NOT_INITIALIZED
  private config: FirebaseConfig
  private app: FirebaseApp | null = null
  private auth: Auth | null = null
  private firestore: Firestore | null = null
  private storage: FirebaseStorage | null = null
  private initializationError: Error | null = null

  /**
   * Constructor
   *
   * @param config - Firebase configuration
   */
  constructor(config?: Partial<FirebaseConfig>) {
    // Load configuration from environment variables or provided config
    this.config = this.loadConfiguration(config)
  }

  /**
   * Load Firebase configuration
   *
   * Loads from environment variables and merges with provided config.
   *
   * @param providedConfig - Optional configuration overrides
   * @returns Complete Firebase configuration
   */
  private loadConfiguration(providedConfig?: Partial<FirebaseConfig>): FirebaseConfig {
    const envConfig: FirebaseConfig = {
      environment: (import.meta.env.MODE as any) || 'development',
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      useEmulators: import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true',
      enableLogging: import.meta.env.DEV === true,
      emulatorHosts: {
        auth: import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099',
        firestore: import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080',
        storage: import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199',
      },
    }

    return { ...envConfig, ...providedConfig }
  }

  /**
   * Validate Firebase configuration
   *
   * Ensures all required Firebase config values are present.
   *
   * @throws Error if configuration is invalid
   */
  private validateConfiguration(): void {
    const requiredKeys: Array<keyof FirebaseConfig> = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
    ]

    const missingKeys = requiredKeys.filter((key) => !this.config[key])

    if (missingKeys.length > 0) {
      const errorMessage =
        `Missing Firebase configuration for: ${missingKeys.join(', ')}\n` +
        'Please ensure all VITE_FIREBASE_* environment variables are set in your .env file.'

      console.error('❌ FirebaseInitializer:', errorMessage)

      // Throw in development, log in production
      if (import.meta.env.DEV) {
        throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`)
      }
    }
  }

  /**
   * Initialize Firebase App and services
   *
   * Sets up Firebase App, Firestore, Auth, and Storage.
   * Idempotent - safe to call multiple times.
   */
  async initialize(): Promise<void> {
    // If already initialized, return early (idempotent)
    if (this.status === Status.READY) {
      console.log('✅ FirebaseInitializer: Already initialized')
      return
    }

    // If currently initializing, throw error to prevent concurrent initialization
    if (this.status === Status.INITIALIZING) {
      throw new Error('Firebase initialization already in progress')
    }

    try {
      this.status = Status.INITIALIZING
      console.log('🔄 FirebaseInitializer: Starting initialization...')

      // Validate configuration
      this.validateConfiguration()

      // Initialize Firebase App
      this.app = initializeApp({
        apiKey: this.config.apiKey,
        authDomain: this.config.authDomain,
        projectId: this.config.projectId,
        storageBucket: this.config.storageBucket,
        messagingSenderId: this.config.messagingSenderId,
        appId: this.config.appId,
      })

      console.log('✅ FirebaseInitializer: Firebase App initialized')

      // Initialize services
      this.auth = getAuth(this.app)
      this.firestore = getFirestore(this.app)
      this.storage = getStorage(this.app)

      console.log('✅ FirebaseInitializer: Services initialized (Auth, Firestore, Storage)')

      // Connect to emulators if configured
      if (this.config.useEmulators) {
        await this.connectToEmulators()
      }

      // Verify connection with a simple health check
      await this.performInitialHealthCheck()

      this.status = Status.READY
      console.log('✅ FirebaseInitializer: Initialization complete')
    } catch (error) {
      this.status = Status.ERROR
      this.initializationError = error as Error
      console.error('❌ FirebaseInitializer: Initialization failed', error)
      throw error
    }
  }

  /**
   * Connect to Firebase Emulators
   *
   * Connects Auth, Firestore, and Storage to local emulators for development.
   */
  private async connectToEmulators(): Promise<void> {
    if (!this.auth || !this.firestore || !this.storage) {
      throw new Error('Services must be initialized before connecting to emulators')
    }

    const { auth: authHost, firestore: firestoreHost, storage: storageHost } =
      this.config.emulatorHosts!

    try {
      // Connect Auth Emulator
      if (authHost) {
        connectAuthEmulator(this.auth, `http://${authHost}`, { disableWarnings: true })
        console.log(`🔧 FirebaseInitializer: Connected to Auth Emulator (${authHost})`)
      }

      // Connect Firestore Emulator
      if (firestoreHost) {
        const [host, port] = firestoreHost.split(':')
        connectFirestoreEmulator(this.firestore, host, parseInt(port || '8080'))
        console.log(`🔧 FirebaseInitializer: Connected to Firestore Emulator (${firestoreHost})`)
      }

      // Connect Storage Emulator
      if (storageHost) {
        const [host, port] = storageHost.split(':')
        connectStorageEmulator(this.storage, host, parseInt(port || '9199'))
        console.log(`🔧 FirebaseInitializer: Connected to Storage Emulator (${storageHost})`)
      }

      console.log('✅ FirebaseInitializer: All emulators connected')
    } catch (error) {
      console.warn('⚠️ FirebaseInitializer: Error connecting to emulators', error)
      // Non-fatal: continue initialization even if emulators fail
    }
  }

  /**
   * Perform initial health check
   *
   * Verifies Firestore connectivity by attempting a simple query.
   */
  private async performInitialHealthCheck(): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized')
    }

    try {
      // Try to list collections (limited to 1) to verify connectivity
      const projectsRef = collection(this.firestore, 'projects')
      const q = query(projectsRef, limit(1))
      await getDocs(q)

      console.log('✅ FirebaseInitializer: Firestore connectivity verified')
    } catch (error) {
      console.warn('⚠️ FirebaseInitializer: Firestore health check failed', error)
      // Non-fatal: Firestore might be empty or permissions not set up yet
    }
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.status === Status.READY
  }

  /**
   * Get current database status
   */
  getStatus(): DatabaseStatus {
    return this.status
  }

  /**
   * Perform health check
   *
   * Verifies Firebase services are functional.
   */
  async healthCheck(): Promise<DatabaseHealthCheck> {
    const healthCheck: DatabaseHealthCheck = {
      status: this.status,
      metadata: {
        projectId: this.config.projectId,
        environment: this.config.environment,
        useEmulators: this.config.useEmulators,
      },
    }

    if (this.status === Status.ERROR && this.initializationError) {
      healthCheck.error = this.initializationError.message
      return healthCheck
    }

    if (this.status !== Status.READY) {
      healthCheck.error = `Database not ready: ${this.status}`
      return healthCheck
    }

    // Try a simple Firestore operation to verify connectivity
    try {
      if (this.firestore) {
        const projectsRef = collection(this.firestore, 'projects')
        const q = query(projectsRef, limit(1))
        await getDocs(q)
        healthCheck.lastSuccessfulOperation = new Date()
      }
    } catch (error) {
      healthCheck.status = Status.ERROR
      healthCheck.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return healthCheck
  }

  /**
   * Disconnect from Firebase
   *
   * Currently Firebase SDK doesn't require explicit disconnection,
   * but this method provides a hook for cleanup if needed.
   */
  async disconnect(): Promise<void> {
    console.log('📋 FirebaseInitializer: Disconnecting (Firebase SDK manages connections)')
    this.status = Status.DISCONNECTED
    // Firebase SDK manages connection lifecycle automatically
    // No explicit disconnect needed
  }

  /**
   * Get sanitized configuration
   *
   * Returns configuration with sensitive data removed.
   */
  getConfig(): DatabaseConfig {
    return {
      environment: this.config.environment,
      enableLogging: this.config.enableLogging,
      projectId: this.config.projectId,
      useEmulators: this.config.useEmulators,
      // Don't expose sensitive keys
    }
  }

  /**
   * Get Firebase App instance
   *
   * @throws Error if not initialized
   */
  getApp(): FirebaseApp {
    if (!this.app) {
      throw new Error('Firebase App not initialized. Call initialize() first.')
    }
    return this.app
  }

  /**
   * Get Auth instance
   *
   * @throws Error if not initialized
   */
  getAuth(): Auth {
    if (!this.auth) {
      throw new Error('Firebase Auth not initialized. Call initialize() first.')
    }
    return this.auth
  }

  /**
   * Get Firestore instance
   *
   * @throws Error if not initialized
   */
  getFirestore(): Firestore {
    if (!this.firestore) {
      throw new Error('Firestore not initialized. Call initialize() first.')
    }
    return this.firestore
  }

  /**
   * Get Storage instance
   *
   * @throws Error if not initialized
   */
  getStorage(): FirebaseStorage {
    if (!this.storage) {
      throw new Error('Firebase Storage not initialized. Call initialize() first.')
    }
    return this.storage
  }
}
