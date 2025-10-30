/**
 * Database Initializer Interface
 *
 * Defines the contract for database initialization in the application.
 * This abstraction decouples the application from specific database implementations
 * (Firebase, PostgreSQL, in-memory, etc.) and enables easy testing.
 *
 * **Why This Abstraction?**
 * - **Testability:** Easy to substitute with mock implementations in tests
 * - **Flexibility:** Can swap Firebase for other databases without changing app code
 * - **Explicit Lifecycle:** Clear initialization contract
 * - **Dependency Inversion:** Application depends on interface, not Firebase
 *
 * **Architecture Pattern:**
 * This follows the Dependency Inversion Principle (DIP) by:
 * 1. High-level modules (Application) depend on abstraction (IDatabaseInitializer)
 * 2. Low-level modules (FirebaseInitializer) implement the abstraction
 * 3. Both depend on the abstraction, not on each other
 *
 * **Usage:**
 * ```typescript
 * // In main.tsx
 * const dbInitializer = DIContainer.resolve<IDatabaseInitializer>(
 *   DI_TYPES.DatabaseInitializer
 * )
 * await dbInitializer.initialize()
 * ```
 *
 * **Testing:**
 * ```typescript
 * // In tests
 * DIContainer.register(
 *   DI_TYPES.DatabaseInitializer,
 *   new MockDatabaseInitializer()
 * )
 * ```
 */

/**
 * Database Configuration
 *
 * Generic configuration interface that can be extended for specific databases.
 */
export interface DatabaseConfig {
  /**
   * Database environment (development, staging, production)
   */
  environment: 'development' | 'staging' | 'production'

  /**
   * Whether to enable debug logging
   */
  enableLogging?: boolean

  /**
   * Additional configuration options
   */
  [key: string]: any
}

/**
 * Database Connection Status
 *
 * Represents the current state of the database connection.
 */
export type DatabaseStatus =
  | 'NOT_INITIALIZED'
  | 'INITIALIZING'
  | 'READY'
  | 'ERROR'
  | 'DISCONNECTED'

/**
 * Database Status Values
 */
export const DatabaseStatus = {
  NOT_INITIALIZED: 'NOT_INITIALIZED' as const,
  INITIALIZING: 'INITIALIZING' as const,
  READY: 'READY' as const,
  ERROR: 'ERROR' as const,
  DISCONNECTED: 'DISCONNECTED' as const,
} as const

/**
 * Database Health Check Result
 *
 * Information about database health and connectivity.
 */
export interface DatabaseHealthCheck {
  /**
   * Current status
   */
  status: DatabaseStatus

  /**
   * Optional error message if status is ERROR
   */
  error?: string

  /**
   * Timestamp of last successful operation
   */
  lastSuccessfulOperation?: Date

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>
}

/**
 * IDatabaseInitializer
 *
 * Core interface for database initialization and lifecycle management.
 *
 * **Contract:**
 * - `initialize()` must be idempotent (safe to call multiple times)
 * - `isInitialized()` must accurately reflect initialization state
 * - `disconnect()` should gracefully close all connections
 * - `healthCheck()` should provide current connection status
 */
export interface IDatabaseInitializer {
  /**
   * Initialize the database connection
   *
   * This method should:
   * 1. Load configuration
   * 2. Establish connection
   * 3. Verify connectivity
   * 4. Set up any required listeners or indexes
   *
   * **MUST be idempotent** - calling multiple times should not cause errors.
   *
   * @throws Error if initialization fails
   * @returns Promise<void> resolves when initialization is complete
   *
   * @example
   * ```typescript
   * try {
   *   await dbInitializer.initialize()
   *   console.log('Database ready')
   * } catch (error) {
   *   console.error('Database init failed:', error)
   * }
   * ```
   */
  initialize(): Promise<void>

  /**
   * Check if database is initialized and ready
   *
   * @returns boolean - true if database is ready for operations
   *
   * @example
   * ```typescript
   * if (dbInitializer.isInitialized()) {
   *   // Safe to perform database operations
   * }
   * ```
   */
  isInitialized(): boolean

  /**
   * Get current database status
   *
   * @returns DatabaseStatus - current state
   */
  getStatus(): DatabaseStatus

  /**
   * Perform health check on database connection
   *
   * Verifies the database is reachable and functioning properly.
   *
   * @returns Promise<DatabaseHealthCheck> - health status
   *
   * @example
   * ```typescript
   * const health = await dbInitializer.healthCheck()
   * if (health.status === DatabaseStatus.READY) {
   *   console.log('Database healthy')
   * }
   * ```
   */
  healthCheck(): Promise<DatabaseHealthCheck>

  /**
   * Disconnect from database
   *
   * Gracefully closes all connections and cleans up resources.
   * Should be called during application shutdown.
   *
   * @returns Promise<void> resolves when disconnection is complete
   *
   * @example
   * ```typescript
   * // In cleanup/shutdown
   * await dbInitializer.disconnect()
   * ```
   */
  disconnect(): Promise<void>

  /**
   * Get database configuration
   *
   * Returns the current configuration (with sensitive data removed).
   *
   * @returns DatabaseConfig - sanitized configuration
   */
  getConfig(): DatabaseConfig
}

/**
 * Mock Database Initializer
 *
 * No-op implementation for testing that doesn't require a real database.
 *
 * **Usage in Tests:**
 * ```typescript
 * beforeEach(() => {
 *   DIContainer.clear()
 *   DIContainer.register(
 *     DI_TYPES.DatabaseInitializer,
 *     new MockDatabaseInitializer()
 *   )
 * })
 * ```
 */
export class MockDatabaseInitializer implements IDatabaseInitializer {
  private status: DatabaseStatus = DatabaseStatus.NOT_INITIALIZED
  private config: DatabaseConfig = {
    environment: 'development',
    enableLogging: false,
  }

  async initialize(): Promise<void> {
    console.log('📋 MockDatabaseInitializer: Initializing (no-op)')
    this.status = DatabaseStatus.READY
  }

  isInitialized(): boolean {
    return this.status === DatabaseStatus.READY
  }

  getStatus(): DatabaseStatus {
    return this.status
  }

  async healthCheck(): Promise<DatabaseHealthCheck> {
    return {
      status: this.status,
      lastSuccessfulOperation: new Date(),
      metadata: {
        type: 'mock',
        message: 'Mock database always healthy',
      },
    }
  }

  async disconnect(): Promise<void> {
    console.log('📋 MockDatabaseInitializer: Disconnecting (no-op)')
    this.status = DatabaseStatus.DISCONNECTED
  }

  getConfig(): DatabaseConfig {
    return this.config
  }
}
