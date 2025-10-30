/**
 * Dependency Injection Types
 *
 * This file defines all injection tokens (symbols) used throughout the application
 * for dependency injection. Using TypeScript symbols instead of string literals
 * provides compile-time safety and prevents naming collisions.
 *
 * **Why Symbols?**
 * - Symbols are guaranteed to be unique
 * - Type-safe: TypeScript can enforce correct usage
 * - No magic strings: Refactoring-friendly
 * - Clear intent: Explicit dependency declarations
 *
 * **Usage:**
 * ```typescript
 * import { DIContainer } from '@/domain/di'
 * import { DI_TYPES } from '@/domain/di/diTypes'
 * import type { IProjectRepository } from '@/domain/repositories'
 *
 * // Register implementation
 * DIContainer.register<IProjectRepository>(DI_TYPES.ProjectRepository, new FirebaseProjectRepository())
 *
 * // Resolve dependency
 * const projectRepo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)
 * ```
 */

/**
 * Repository Injection Tokens
 *
 * Symbols for repository implementations
 */
export const DI_TYPES = {
  // ============================================================================
  // REPOSITORIES
  // ============================================================================

  /**
   * Project Repository
   * Implementation: IProjectRepository
   */
  ProjectRepository: Symbol.for('IProjectRepository'),

  /**
   * Schema Repository
   * Implementation: ISchemaRepository
   */
  SchemaRepository: Symbol.for('ISchemaRepository'),

  /**
   * Content Repository
   * Implementation: IContentRepository
   */
  ContentRepository: Symbol.for('IContentRepository'),

  /**
   * Audit Repository
   * Implementation: IAuditRepository
   * Handles audit logging operations
   */
  AuditRepository: Symbol.for('IAuditRepository'),

  /**
   * User Repository
   * Implementation: IUserRepository
   * Handles user management operations
   */
  UserRepository: Symbol.for('IUserRepository'),

  /**
   * Project Records Repository
   * Implementation: IProjectRecordsRepository
   * Handles project-collection associations
   */
  ProjectRecordsRepository: Symbol.for('IProjectRecordsRepository'),

  /**
   * Media Repository
   * Implementation: IMediaRepository
   * Handles media file storage and retrieval (Firebase Storage)
   */
  MediaRepository: Symbol.for('IMediaRepository'),

  // ============================================================================
  // USE CASES / APPLICATION SERVICES
  // ============================================================================

  /**
   * Project Selection Use Case
   * Implementation: IProjectSelectionUseCase
   * Handles project selection, access control, and project management
   */
  ProjectSelectionUseCase: Symbol.for('IProjectSelectionUseCase'),

  /**
   * Content Management Use Case
   * Implementation: IContentManagementUseCase
   * Handles content CRUD, publishing, and validation
   */
  ContentManagementUseCase: Symbol.for('IContentManagementUseCase'),

  /**
   * Schema Management Use Case
   * Implementation: ISchemaManagementUseCase
   * Handles schema/collection definition management
   */
  SchemaManagementUseCase: Symbol.for('ISchemaManagementUseCase'),

  /**
   * User Management Use Case
   * Implementation: IUserManagementUseCase
   * Handles user management and project assignments
   */
  UserManagementUseCase: Symbol.for('IUserManagementUseCase'),

  /**
   * Authentication Use Case
   * Implementation: IAuthUseCase
   * Handles authentication, session initialization, and role validation
   */
  AuthUseCase: Symbol.for('IAuthUseCase'),

  /**
   * Public Data Retrieval Use Case
   * Implementation: IPublicDataRetrievalUseCase
   * Handles unauthenticated public access to published content
   */
  PublicDataRetrievalUseCase: Symbol.for('IPublicDataRetrievalUseCase'),

  /**
   * Audit Retrieval Use Case
   * Implementation: IAuditRetrievalUseCase
   * Handles audit log retrieval and analysis (separated from audit log creation)
   */
  AuditRetrievalUseCase: Symbol.for('IAuditRetrievalUseCase'),

  /**
   * Settings Management Use Case
   * Implementation: ISettingsManagementUseCase
   * Handles project metadata updates, project creation, and system settings with audit logging
   */
  SettingsManagementUseCase: Symbol.for('ISettingsManagementUseCase'),

  /**
   * Dashboard Data Use Case
   * Implementation: IDashboardDataUseCase
   * Handles dashboard-specific data aggregation, metrics, and widget logic
   */
  DashboardDataUseCase: Symbol.for('IDashboardDataUseCase'),

  /**
   * Audit Logging Use Case
   * Implementation: IAuditLoggingUseCase
   * Handles audit log creation and querying with access control
   */
  AuditLoggingUseCase: Symbol.for('IAuditLoggingUseCase'),

  /**
   * Media Management Use Case
   * Implementation: IMediaManagementUseCase
   * Handles media file upload, retrieval, and deletion
   */
  MediaManagementUseCase: Symbol.for('IMediaManagementUseCase'),

  /**
   * Audit Log Repository
   * Implementation: IAuditLogRepository
   * Handles audit log persistence
   */
  IAuditLogRepository: Symbol.for('IAuditLogRepository'),

  // ============================================================================
  // INFRASTRUCTURE SERVICES
  // ============================================================================

  /**
   * Database Initializer
   * Implementation: IDatabaseInitializer
   * Handles database connection initialization and lifecycle management
   */
  DatabaseInitializer: Symbol.for('IDatabaseInitializer'),

  // ============================================================================
  // ADDITIONAL SERVICES
  // ============================================================================

  /**
   * Audit Service
   * Handles audit logging
   */
  AuditService: Symbol.for('AuditService'),

  /**
   * User Service
   * Handles user-related operations
   */
  UserService: Symbol.for('UserService'),

  /**
   * System Settings Service
   * Handles system configuration
   */
  SystemSettingsService: Symbol.for('SystemSettingsService'),

  /**
   * Public API Service
   * Handles public API operations
   */
  PublicAPIService: Symbol.for('PublicAPIService'),
} as const

/**
 * Type-safe DI token type
 * This type ensures that only valid symbols from DI_TYPES can be used
 */
export type DIToken = typeof DI_TYPES[keyof typeof DI_TYPES]

/**
 * Type mapping for DI tokens to their corresponding types
 * This enables type-safe resolution with intellisense support
 *
 * Usage:
 * ```typescript
 * const repo = DIContainer.resolve<DITypeMap[typeof DI_TYPES.ProjectRepository]>(
 *   DI_TYPES.ProjectRepository
 * )
 * // repo is typed as IProjectRepository
 * ```
 */
export interface DITypeMap {
  // Repositories
  [DI_TYPES.ProjectRepository]: import('../repositories').IProjectRepository
  [DI_TYPES.SchemaRepository]: import('../repositories').ISchemaRepository
  [DI_TYPES.ContentRepository]: import('../repositories').IContentRepository
  [DI_TYPES.AuditRepository]: import('../repositories').IAuditRepository
  [DI_TYPES.UserRepository]: import('../repositories').IUserRepository
  [DI_TYPES.ProjectRecordsRepository]: import('../repositories/IProjectRecordsRepository').IProjectRecordsRepository
  [DI_TYPES.MediaRepository]: import('../repositories/IMediaRepository').IMediaRepository

  // Use Cases
  [DI_TYPES.ProjectSelectionUseCase]: import('../../application/usecases').IProjectSelectionUseCase
  [DI_TYPES.ContentManagementUseCase]: import('../../application/usecases').IContentManagementUseCase
  [DI_TYPES.SchemaManagementUseCase]: import('../../application/usecases').ISchemaManagementUseCase
  [DI_TYPES.UserManagementUseCase]: import('../../application/usecases').IUserManagementUseCase
  [DI_TYPES.AuthUseCase]: import('../../application/usecases').IAuthUseCase
  [DI_TYPES.PublicDataRetrievalUseCase]: import('../../application/usecases').IPublicDataRetrievalUseCase
  [DI_TYPES.AuditRetrievalUseCase]: import('../../application/usecases').IAuditRetrievalUseCase
  [DI_TYPES.SettingsManagementUseCase]: import('../../application/usecases').ISettingsManagementUseCase
  [DI_TYPES.DashboardDataUseCase]: import('../../application/usecases').IDashboardDataUseCase
  [DI_TYPES.AuditLoggingUseCase]: import('../../application/usecases/AuditLoggingUseCase').IAuditLoggingUseCase
  [DI_TYPES.MediaManagementUseCase]: import('../../application/usecases/IMediaManagementUseCase').IMediaManagementUseCase
  [DI_TYPES.IAuditLogRepository]: import('../repositories/IAuditLogRepository').IAuditLogRepository

  // Infrastructure Services
  [DI_TYPES.DatabaseInitializer]: import('../../infrastructure/config').IDatabaseInitializer

  // Additional Services
  [DI_TYPES.AuditService]: any
  [DI_TYPES.UserService]: any
  [DI_TYPES.SystemSettingsService]: any
  [DI_TYPES.PublicAPIService]: any
}
