/**
 * Audit Log Repository Interface
 *
 * Defines the contract for audit log persistence operations.
 * Follows Clean Architecture - this is a domain-layer abstraction.
 *
 * **Framework Independence:**
 * All methods use domain entities (AuditLog) - no Firebase types!
 *
 * **Implementation:**
 * Implemented by FirebaseAuditLogRepository in infrastructure layer.
 */

import type { AuditLog, CreateAuditLogInput, AuditLogFilters } from '../entities/AuditLog'

export interface IAuditLogRepository {
  /**
   * Create a new audit log entry
   *
   * @param input - Audit log data
   * @returns Promise<AuditLog> - Created audit log with generated ID
   */
  createAuditLog(input: CreateAuditLogInput): Promise<AuditLog>

  /**
   * Get audit logs with filters
   *
   * @param filters - Filter options
   * @returns Promise<AuditLog[]> - Filtered audit logs
   */
  getAuditLogs(filters: AuditLogFilters): Promise<AuditLog[]>

  /**
   * Get audit logs for a specific project
   *
   * @param projectId - Project ID
   * @param filters - Additional filter options
   * @returns Promise<AuditLog[]> - Project audit logs
   */
  getAuditLogsByProject(projectId: string, filters?: AuditLogFilters): Promise<AuditLog[]>

  /**
   * Get audit logs for a specific user
   *
   * @param userId - User ID
   * @param filters - Additional filter options
   * @returns Promise<AuditLog[]> - User audit logs
   */
  getAuditLogsByUser(userId: string, filters?: AuditLogFilters): Promise<AuditLog[]>

  /**
   * Get audit logs for a specific resource
   *
   * @param resourceType - Resource type
   * @param resourceId - Resource ID
   * @param filters - Additional filter options
   * @returns Promise<AuditLog[]> - Resource audit logs
   */
  getAuditLogsByResource(
    resourceType: string,
    resourceId: string,
    filters?: AuditLogFilters
  ): Promise<AuditLog[]>

  /**
   * Get audit log by ID
   *
   * @param id - Audit log ID
   * @returns Promise<AuditLog | null> - Audit log or null
   */
  getAuditLogById(id: string): Promise<AuditLog | null>

  /**
   * Delete audit logs older than specified date
   * (For maintenance/cleanup)
   *
   * @param beforeDate - Delete logs before this date
   * @returns Promise<number> - Number of deleted logs
   */
  deleteAuditLogsBefore(beforeDate: Date): Promise<number>

  /**
   * Get count of audit logs matching filters
   *
   * @param filters - Filter options
   * @returns Promise<number> - Count of matching logs
   */
  countAuditLogs(filters: AuditLogFilters): Promise<number>
}
