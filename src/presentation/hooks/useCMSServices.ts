/**
 * CMS Services Hook
 *
 * Provides centralized access to all Use Cases via the Dependency Injection container.
 * This hook serves as the single entry point for front-end components to access
 * business logic, ensuring complete decoupling from infrastructure implementations.
 *
 * **Architecture Benefits:**
 * - Single source of truth for Use Case resolution
 * - Front-end components depend only on Use Case interfaces
 * - Complete Dependency Inversion Principle (DIP) compliance
 * - Easy mocking for testing (mock the DI container)
 * - Type-safe access to all Use Cases
 *
 * **Usage:**
 * ```typescript
 * import { useCMSServices } from '@/presentation/hooks/useCMSServices'
 *
 * function MyComponent() {
 *   const { contentManagement, schemaManagement, auth } = useCMSServices()
 *
 *   const handleSave = async () => {
 *     await contentManagement.updateContentEntry(...)
 *   }
 *
 *   return <div>...</div>
 * }
 * ```
 *
 * **CRITICAL:**
 * Components using this hook should NEVER import:
 * - *Service.ts files (old service layer)
 * - Firebase*Repository.ts files (infrastructure layer)
 * - Direct Firebase SDK imports
 *
 * Only import Use Case interfaces from @/application/usecases
 */

import { useMemo } from 'react'
import { DIContainer, DI_TYPES } from '@/domain/di'
import type {
  IContentManagementUseCase,
  ISchemaManagementUseCase,
  IAuthUseCase,
  IPublicDataRetrievalUseCase,
  IAuditRetrievalUseCase,
  ISettingsManagementUseCase,
  IUserManagementUseCase,
  IDashboardDataUseCase,
} from '@/application/usecases'
import type { IAuditLoggingUseCase } from '@/application/usecases/AuditLoggingUseCase'
import type { IMediaManagementUseCase } from '@/application/usecases/IMediaManagementUseCase'

/**
 * CMS Services Return Type
 *
 * Provides typed access to all available Use Cases
 */
export interface CMSServices {
  /**
   * Content Management Use Case
   *
   * Handles content CRUD operations, publishing, validation, and batch operations
   */
  contentManagement: IContentManagementUseCase

  /**
   * Schema Management Use Case
   *
   * Handles schema/collection definition management
   */
  schemaManagement: ISchemaManagementUseCase

  /**
   * Authentication Use Case
   *
   * Handles user authentication, session management, and role validation
   */
  auth: IAuthUseCase

  /**
   * Public Data Retrieval Use Case
   *
   * Handles unauthenticated access to published content
   */
  publicData: IPublicDataRetrievalUseCase

  /**
   * Audit Retrieval Use Case
   *
   * Handles audit log retrieval and analysis
   */
  auditRetrieval: IAuditRetrievalUseCase

  /**
   * Settings Management Use Case
   *
   * Handles project metadata, project creation, and system settings
   */
  settingsManagement: ISettingsManagementUseCase

  /**
   * User Management Use Case
   *
   * Handles user management, role assignments, and project assignments
   */
  userManagement: IUserManagementUseCase

  /**
   * Dashboard Data Use Case
   *
   * Handles dashboard-specific data aggregation, metrics, and widget logic
   */
  dashboardData: IDashboardDataUseCase

  /**
   * Audit Logging Use Case
   *
   * Handles audit log creation and querying with access control
   */
  auditLogging: IAuditLoggingUseCase

  /**
   * Media Management Use Case
   *
   * Handles media file upload, retrieval, deletion, and metadata updates
   */
  mediaManagement: IMediaManagementUseCase
}

/**
 * useCMSServices Hook
 *
 * Resolves and returns all Use Cases from the DI container.
 * Results are memoized to prevent unnecessary re-resolution.
 *
 * @returns {CMSServices} All available Use Cases
 * @throws {Error} If any Use Case is not registered in the DI container
 *
 * @example
 * ```typescript
 * function ContentEditor() {
 *   const { contentManagement } = useCMSServices()
 *
 *   const handlePublish = async (contentId: string) => {
 *     await contentManagement.publishContentEntry(
 *       projectId,
 *       collectionId,
 *       contentId,
 *       userId
 *     )
 *   }
 *
 *   return <button onClick={() => handlePublish(id)}>Publish</button>
 * }
 * ```
 */
export function useCMSServices(): CMSServices {
  /**
   * Resolve all Use Cases from DI container
   * Memoized to ensure stable references across re-renders
   */
  const services = useMemo(() => {
    try {
      return {
        contentManagement: DIContainer.resolve<IContentManagementUseCase>(
          DI_TYPES.ContentManagementUseCase
        ),
        schemaManagement: DIContainer.resolve<ISchemaManagementUseCase>(
          DI_TYPES.SchemaManagementUseCase
        ),
        auth: DIContainer.resolve<IAuthUseCase>(DI_TYPES.AuthUseCase),
        publicData: DIContainer.resolve<IPublicDataRetrievalUseCase>(
          DI_TYPES.PublicDataRetrievalUseCase
        ),
        auditRetrieval: DIContainer.resolve<IAuditRetrievalUseCase>(
          DI_TYPES.AuditRetrievalUseCase
        ),
        settingsManagement: DIContainer.resolve<ISettingsManagementUseCase>(
          DI_TYPES.SettingsManagementUseCase
        ),
        userManagement: DIContainer.resolve<IUserManagementUseCase>(
          DI_TYPES.UserManagementUseCase
        ),
        dashboardData: DIContainer.resolve<IDashboardDataUseCase>(
          DI_TYPES.DashboardDataUseCase
        ),
        auditLogging: DIContainer.resolve<IAuditLoggingUseCase>(
          DI_TYPES.AuditLoggingUseCase
        ),
        mediaManagement: DIContainer.resolve<IMediaManagementUseCase>(
          DI_TYPES.MediaManagementUseCase
        ),
      }
    } catch (error) {
      console.error('❌ useCMSServices: Failed to resolve Use Cases from DI container', error)
      throw new Error(
        `Failed to initialize CMS services: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }, [])

  return services
}

/**
 * Individual Use Case Hooks
 *
 * These hooks provide direct access to specific Use Cases for components
 * that only need one or two services (reduces unnecessary dependencies).
 */

/**
 * Hook for content management operations only
 */
export function useContentManagement(): IContentManagementUseCase {
  const { contentManagement } = useCMSServices()
  return contentManagement
}

/**
 * Hook for schema management operations only
 */
export function useSchemaManagement(): ISchemaManagementUseCase {
  const { schemaManagement } = useCMSServices()
  return schemaManagement
}

/**
 * Hook for authentication operations only
 */
export function useAuth(): IAuthUseCase {
  const { auth } = useCMSServices()
  return auth
}

/**
 * Hook for user management operations only
 */
export function useUserManagement(): IUserManagementUseCase {
  const { userManagement } = useCMSServices()
  return userManagement
}

/**
 * Hook for settings management operations only
 */
export function useSettingsManagement(): ISettingsManagementUseCase {
  const { settingsManagement } = useCMSServices()
  return settingsManagement
}

/**
 * Hook for audit retrieval operations only
 */
export function useAuditRetrieval(): IAuditRetrievalUseCase {
  const { auditRetrieval } = useCMSServices()
  return auditRetrieval
}

/**
 * Hook for dashboard data operations only
 */
export function useDashboardData(): IDashboardDataUseCase {
  const { dashboardData } = useCMSServices()
  return dashboardData
}

/**
 * Hook for audit logging operations only
 */
export function useAuditLogging(): IAuditLoggingUseCase {
  const { auditLogging } = useCMSServices()
  return auditLogging
}

/**
 * Hook for media management operations only
 */
export function useMediaManagement(): IMediaManagementUseCase {
  const { mediaManagement } = useCMSServices()
  return mediaManagement
}
