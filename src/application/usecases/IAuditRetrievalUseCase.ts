/**
 * IAuditRetrievalUseCase Interface
 *
 * Defines the contract for audit log retrieval and analysis operations.
 * Separates audit log querying from audit log creation (IAuditRepository).
 *
 * **Architecture - Clean Architecture Application Layer:**
 * This use case enforces the SRP by separating READ operations from WRITE operations:
 * - IAuditRepository: CREATE audit logs (logAction)
 * - IAuditRetrievalUseCase: READ and ANALYZE audit logs
 *
 * **Key Principles:**
 * - Single Responsibility: Only audit log retrieval and filtering
 * - Dependency Inversion: Depends on IAuditRepository abstraction
 * - Business Logic: What constitutes "critical" logs, filtering rules, etc.
 * - Framework Independence: Returns domain entities, not Firestore types
 *
 * **Design Rationale:**
 * The old AuditService violated SRP by mixing:
 * 1. Audit log creation (logAction)
 * 2. Simple retrieval (getProjectAuditLogs)
 * 3. Complex filtering (getRecentCriticalLogs with business logic)
 *
 * This interface isolates the RETRIEVAL concern with its business rules.
 */

import type { AuditLogEntry } from '@/domain/entities'

/**
 * Critical Log Result
 *
 * Enriched audit log with severity classification
 */
export interface CriticalLogResult {
  log: AuditLogEntry
  severity: 'critical' | 'warning' | 'info'
  reason: string // Why this log is considered critical
}

/**
 * Audit Log Statistics
 *
 * Aggregated statistics for audit logs
 */
export interface AuditLogStatistics {
  totalCount: number
  actionCounts: Record<string, number>
  userCounts: Record<string, number>
  recentActivityCount: number // Last 24 hours
}

/**
 * IAuditRetrievalUseCase
 *
 * Application-layer interface for audit log retrieval and analysis operations.
 */
export interface IAuditRetrievalUseCase {
  /**
   * Get audit logs for a specific project
   *
   * Business Rules:
   * - User must have access to the project
   * - Super users can access all projects
   * - Admin users can only access their assigned projects
   * - Returns logs ordered by timestamp (newest first)
   *
   * @param projectId - The project ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @param limit - Maximum number of logs to retrieve (default: 100)
   * @returns Promise<AuditLogEntry[]> - Array of audit logs
   * @throws Error if user lacks access
   */
  getProjectAuditLogs(
    projectId: string,
    userId: string,
    userRole: string,
    limit?: number
  ): Promise<AuditLogEntry[]>

  /**
   * Get audit logs for a specific resource
   *
   * Business Rules:
   * - Retrieves all audit log entries for a specific resource
   * - Filters by projectId, resourceType, and resourceId
   * - Returns complete history for the resource
   * - Ordered by timestamp (newest first)
   *
   * @param projectId - The project ID
   * @param resourceType - The type of resource
   * @param resourceId - The ID of the specific resource
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @param limit - Maximum number of logs to retrieve (default: 50)
   * @returns Promise<AuditLogEntry[]> - Array of audit logs for the resource
   */
  getResourceAuditLogs(
    projectId: string,
    resourceType: string,
    resourceId: string,
    userId: string,
    userRole: string,
    limit?: number
  ): Promise<AuditLogEntry[]>

  /**
   * Get audit logs for a specific user
   *
   * Business Rules:
   * - Super users can view logs for any user
   * - Admin users can view logs for users in their projects
   * - Regular users can only view their own logs
   * - Returns logs scoped to the project
   *
   * @param projectId - The project ID
   * @param targetUserId - The user ID to fetch logs for
   * @param requestingUserId - The ID of the user making the request
   * @param requestingUserRole - The role of the requesting user
   * @param limit - Maximum number of logs to retrieve (default: 50)
   * @returns Promise<AuditLogEntry[]> - Array of audit logs for the user
   * @throws Error if user lacks permission
   */
  getUserAuditLogs(
    projectId: string,
    targetUserId: string,
    requestingUserId: string,
    requestingUserRole: string,
    limit?: number
  ): Promise<AuditLogEntry[]>

  /**
   * Get recent critical audit logs (Super users only)
   *
   * **CRITICAL BUSINESS LOGIC:**
   * This method implements complex filtering logic to identify "critical" logs
   * across the entire system (not project-scoped).
   *
   * **Critical Log Criteria:**
   * - DELETE actions (potentially destructive)
   * - SCHEMA_DELETE actions (critical schema changes)
   * - Logs with error/failed indicators in details
   * - Failed authentication attempts
   * - Logs with details.status === 'error' or details.severity === 'critical'
   *
   * **Business Rules:**
   * - ONLY accessible to Super users (highest privilege)
   * - System-wide view (not project-scoped)
   * - Used for monitoring application health
   * - Helps identify security issues and system failures
   *
   * **Use Cases:**
   * - Dashboard health widget for Super users
   * - Security monitoring and incident detection
   * - System-wide failure tracking
   * - Administrative oversight
   *
   * @param userId - The Super user ID requesting the logs
   * @param userRole - Must be 'Super' role
   * @param limit - Maximum number of logs to retrieve (default: 10)
   * @returns Promise<CriticalLogResult[]> - Array of critical logs with severity classification
   * @throws Error if user is not Super role
   *
   * @example
   * ```typescript
   * // In Dashboard component for Super users
   * const criticalLogs = await auditRetrievalUseCase.getRecentCriticalLogs(
   *   currentUser.uid,
   *   'Super',
   *   5
   * )
   *
   * criticalLogs.forEach(({ log, severity, reason }) => {
   *   console.log(`${severity}: ${log.action} - ${reason}`)
   * })
   * ```
   */
  getRecentCriticalLogs(
    userId: string,
    userRole: string,
    limit?: number
  ): Promise<CriticalLogResult[]>

  /**
   * Get audit log statistics for a project
   *
   * Business Rules:
   * - Aggregates audit log data for analytics
   * - Returns counts by action type and user
   * - Includes recent activity metrics
   *
   * @param projectId - The project ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<AuditLogStatistics> - Aggregated statistics
   */
  getAuditLogStatistics(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<AuditLogStatistics>
}
