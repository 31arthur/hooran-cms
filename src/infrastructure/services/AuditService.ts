/**
 * Audit Service
 *
 * Infrastructure-level service for audit logging.
 * This service provides a convenient static API for logging actions throughout the application.
 * It uses the DI container to access the audit repository.
 *
 * **Note:** This is a transitional service to maintain compatibility with existing code
 * that imports '@/services/AuditService'. In clean architecture, use cases should
 * interact directly with repositories via dependency injection.
 */

import { DIContainer } from '@/domain/di/DIContainer'
import { DI_TYPES as TYPES } from '@/domain/di/diTypes'
import type { IAuditRepository, CreateAuditLogInput } from '@/domain/repositories/IAuditRepository'

/**
 * AuditService
 *
 * Static utility service for audit logging operations.
 * Provides a simple interface for logging actions throughout the application.
 */
export class AuditService {
  /**
   * Get the audit repository from DI container
   */
  private static getRepository(): IAuditRepository {
    return DIContainer.resolve<IAuditRepository>(TYPES.AuditRepository)
  }

  /**
   * Log an action to the audit trail
   *
   * Creates a new audit log entry for the specified action.
   *
   * @param input - The audit log data
   * @returns Promise<string> - The created audit log entry ID
   *
   * @example
   * ```typescript
   * await AuditService.logAction({
   *   projectId: 'project-123',
   *   userId: 'user-456',
   *   action: 'CREATE',
   *   resourceType: 'CONTENT',
   *   resourceId: 'content-789',
   *   details: { title: 'New Article' },
   *   timestamp: new Date()
   * })
   * ```
   */
  static async logAction(input: CreateAuditLogInput): Promise<string> {
    try {
      const repository = this.getRepository()
      return await repository.logAction(input)
    } catch (error) {
      console.error('❌ AuditService: Failed to log action:', error)
      // Don't throw - audit logging failure shouldn't break the main operation
      return ''
    }
  }

  /**
   * Get recent audit logs for a project
   *
   * @param projectId - The project ID
   * @param limit - Maximum number of entries to return (default: 50)
   * @returns Promise<AuditLogEntry[]> - Array of recent audit log entries
   */
  static async getRecentAuditLogs(projectId: string, limit = 50) {
    const repository = this.getRepository()
    return await repository.getRecentAuditLogs(projectId, limit)
  }

  /**
   * Get audit logs for a specific resource
   *
   * @param projectId - The project ID
   * @param resourceType - The type of resource
   * @param resourceId - The resource ID
   * @returns Promise<AuditLogEntry[]> - Array of audit log entries for the resource
   */
  static async getResourceAuditTrail(
    projectId: string,
    resourceType: any,
    resourceId: string
  ) {
    const repository = this.getRepository()
    return await repository.getResourceAuditTrail(projectId, resourceType, resourceId)
  }

  /**
   * Get audit logs for a specific user
   *
   * @param userId - The user ID
   * @param projectId - Optional project ID to scope results
   * @param limit - Maximum number of entries to return
   * @returns Promise<AuditLogEntry[]> - Array of user's audit log entries
   */
  static async getUserAuditLogs(
    userId: string,
    projectId?: string,
    limit?: number
  ) {
    const repository = this.getRepository()
    return await repository.getUserAuditLogs(userId, projectId, limit)
  }
}
