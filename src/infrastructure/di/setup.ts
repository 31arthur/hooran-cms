/**
 * Dependency Injection Setup
 *
 * This file initializes the DI container with all repository implementations
 * at application startup. This is the central configuration point for
 * dependency injection in the application.
 *
 * **Architecture:**
 * - Registers concrete implementations (Firebase repositories)
 * - Maps them to interface symbols (DI_TYPES)
 * - Enables the rest of the application to resolve dependencies
 *
 * **Usage:**
 * Call `initializeDependencies()` once at app startup (in src/main.tsx)
 */

import { DIContainer, DI_TYPES } from '@/domain/di'
import {
  FirebaseProjectRepository,
  FirebaseSchemaRepository,
  FirebaseContentRepository,
} from '@/infrastructure/repositories'
import { FirebaseAuditRepository } from '@/infrastructure/repositories/FirebaseAuditRepository'
import { FirebaseUserRepository } from '@/infrastructure/repositories/FirebaseUserRepository'
import { FirebaseAuditLogRepository } from '@/infrastructure/repositories/FirebaseAuditLogRepository'
import { FirebaseProjectRecordsRepository } from '@/infrastructure/repositories/FirebaseProjectRecordsRepository'
import { FirebaseMediaRepository } from '@/infrastructure/repositories/FirebaseMediaRepository'
import { ContentManagementUseCase } from '@/application/usecases/ContentManagementUseCase'
import { SchemaManagementUseCase } from '@/application/usecases/SchemaManagementUseCase'
import { AuditRetrievalUseCase } from '@/application/usecases/AuditRetrievalUseCase'
import { AuditLoggingUseCase } from '@/application/usecases/AuditLoggingUseCase'
import { MediaManagementUseCase } from '@/application/usecases/MediaManagementUseCase'
import { AuthUseCase } from '@/application/usecases/AuthUseCase'
import { PublicDataRetrievalUseCase } from '@/application/usecases/PublicDataRetrievalUseCase'
import { SettingsManagementUseCase } from '@/application/usecases/SettingsManagementUseCase'
import { UserManagementUseCase } from '@/application/usecases/UserManagementUseCase'
import { DashboardDataUseCase } from '@/application/usecases/DashboardDataUseCase'
import { FirebaseInitializer } from '@/infrastructure/config'

/**
 * Initialize all dependencies for production environment
 *
 * This function registers all repository implementations in the DI container.
 * It should be called once during application startup, before any components
 * attempt to resolve dependencies.
 *
 * @example
 * ```typescript
 * // In src/main.tsx
 * import { initializeDependencies } from '@/infrastructure/di/setup'
 *
 * // Initialize DI container before rendering
 * initializeDependencies()
 *
 * // Now render the app
 * ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
 * ```
 */
export function initializeDependencies(): void {
  console.log('🔧 Initializing DI Container for production...')

  try {
    // Step 0: Register database initializer FIRST
    // This must be registered before repositories that depend on it
    const dbInitializer = new FirebaseInitializer()
    DIContainer.register(DI_TYPES.DatabaseInitializer, dbInitializer)
    console.log('✅ Database initializer registered')

    // Step 1: Register repository implementations
    const projectRepo = new FirebaseProjectRepository()
    const schemaRepo = new FirebaseSchemaRepository()
    const contentRepo = new FirebaseContentRepository()
    const auditRepo = new FirebaseAuditRepository()
    const userRepo = new FirebaseUserRepository()
    const auditLogRepo = new FirebaseAuditLogRepository()
    const projectRecordsRepo = new FirebaseProjectRecordsRepository()
    const mediaRepo = new FirebaseMediaRepository()

    DIContainer.registerMany([
      [DI_TYPES.ProjectRepository, projectRepo],
      [DI_TYPES.SchemaRepository, schemaRepo],
      [DI_TYPES.ContentRepository, contentRepo],
      [DI_TYPES.AuditRepository, auditRepo],
      [DI_TYPES.UserRepository, userRepo],
      [DI_TYPES.IAuditLogRepository, auditLogRepo],
      [DI_TYPES.ProjectRecordsRepository, projectRecordsRepo],
      [DI_TYPES.MediaRepository, mediaRepo],
    ])

    // Step 2: Register use cases with constructor injection
    // This demonstrates the architectural fix: use cases depend on repository interfaces
    const contentManagementUseCase = new ContentManagementUseCase(
      contentRepo,
      schemaRepo,
      auditRepo
    )

    // Media management needs to be created first as schema management depends on it
    const mediaManagementUseCase = new MediaManagementUseCase(
      mediaRepo
    )

    const schemaManagementUseCase = new SchemaManagementUseCase(
      schemaRepo,
      contentRepo,
      auditRepo,
      mediaManagementUseCase
    )

    const authUseCase = new AuthUseCase(
      userRepo,
      auditRepo
    )

    const auditRetrievalUseCase = new AuditRetrievalUseCase(
      auditRepo
    )

    const publicDataRetrievalUseCase = new PublicDataRetrievalUseCase(
      contentRepo
    )

    const settingsManagementUseCase = new SettingsManagementUseCase(
      projectRepo,
      userRepo,
      auditRepo
    )

    const userManagementUseCase = new UserManagementUseCase(
      userRepo,
      projectRepo,
      auditRepo
    )

    const dashboardDataUseCase = new DashboardDataUseCase(
      contentRepo,
      auditRepo,
      userRepo,
      schemaRepo
    )

    const auditLoggingUseCase = new AuditLoggingUseCase(
      auditLogRepo
    )

    DIContainer.register(DI_TYPES.ContentManagementUseCase, contentManagementUseCase)
    DIContainer.register(DI_TYPES.SchemaManagementUseCase, schemaManagementUseCase)
    DIContainer.register(DI_TYPES.AuditRetrievalUseCase, auditRetrievalUseCase)
    DIContainer.register(DI_TYPES.AuditLoggingUseCase, auditLoggingUseCase)
    DIContainer.register(DI_TYPES.AuthUseCase, authUseCase)
    DIContainer.register(DI_TYPES.PublicDataRetrievalUseCase, publicDataRetrievalUseCase)
    DIContainer.register(DI_TYPES.SettingsManagementUseCase, settingsManagementUseCase)
    DIContainer.register(DI_TYPES.UserManagementUseCase, userManagementUseCase)
    DIContainer.register(DI_TYPES.DashboardDataUseCase, dashboardDataUseCase)
    DIContainer.register(DI_TYPES.MediaManagementUseCase, mediaManagementUseCase)

    console.log(`✅ DI Container initialized with ${DIContainer.count()} dependencies`)
    console.log('   Registered repositories:')
    console.log('   - ProjectRepository (Firebase)')
    console.log('   - SchemaRepository (Firebase)')
    console.log('   - ContentRepository (Firebase)')
    console.log('   - AuditRepository (Firebase)')
    console.log('   - UserRepository (Firebase)')
    console.log('   - AuditLogRepository (Firebase)')
    console.log('   - ProjectRecordsRepository (Firebase)')
    console.log('   - MediaRepository (Firebase Storage)')
    console.log('   Registered use cases:')
    console.log('   - ContentManagementUseCase')
    console.log('   - SchemaManagementUseCase')
    console.log('   - AuditRetrievalUseCase')
    console.log('   - AuditLoggingUseCase')
    console.log('   - AuthUseCase')
    console.log('   - PublicDataRetrievalUseCase')
    console.log('   - SettingsManagementUseCase')
    console.log('   - UserManagementUseCase')
    console.log('   - DashboardDataUseCase')
    console.log('   - MediaManagementUseCase')
  } catch (error) {
    console.error('❌ Failed to initialize DI Container:', error)
    throw new Error(
      `DI Container initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Clear all dependencies
 *
 * This is primarily useful for testing to ensure a clean state
 * between test cases.
 *
 * @example
 * ```typescript
 * // In test setup
 * import { clearDependencies } from '@/infrastructure/di/setup'
 *
 * beforeEach(() => {
 *   clearDependencies()
 *   // Register mock dependencies
 * })
 * ```
 */
export function clearDependencies(): void {
  DIContainer.clear()
  console.log('🧹 DI Container cleared')
}

/**
 * Check if dependencies are initialized
 *
 * @returns True if at least one dependency is registered
 */
export function isDependenciesInitialized(): boolean {
  return DIContainer.count() > 0
}

/**
 * Get count of registered dependencies
 *
 * @returns Number of registered dependencies
 */
export function getDependencyCount(): number {
  return DIContainer.count()
}
