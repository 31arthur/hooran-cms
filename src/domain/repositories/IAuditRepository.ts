/**
 * Audit Repository Interface
 *
 * Defines the contract for audit logging operations.
 * This interface enables clean separation between audit logging business logic
 * and the actual persistence mechanism.
 *
 * **Framework Independence:**
 * - Methods accept and return only domain entities or primitives
 * - NO Firebase types (no Timestamp, DocumentReference, etc.)
 * - Completely database-agnostic
 *
 * **Purpose:**
 * Audit logs provide traceability for all critical operations in the system,
 * including who performed what action, when, and with what data.
 */

/**
 * Audit Action Types
 *
 * Defines the types of actions that can be logged.
 * These match the actions from AuditService for compatibility.
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SCHEMA_CREATE'
  | 'SCHEMA_UPDATE'
  | 'SCHEMA_DELETE'
  | 'USER_ASSIGNMENT'
  | 'PROJECT_CREATE'
  | 'PROJECT_UPDATE'
  | 'PUBLISH'
  | 'UNPUBLISH'
  | 'ARCHIVE'
  | 'RESTORE'

/**
 * Audit Resource Types
 *
 * Defines the types of resources that can be audited.
 * These match the resource types from AuditService for compatibility.
 */
export type AuditResourceType =
  | 'CONTENT'
  | 'SCHEMA'
  | 'USER_ROLE'
  | 'PROJECT'
  | 'AUTH'
  | 'SYSTEM_SETTINGS'
  | 'API_KEY'

/**
 * Audit Log Entry
 *
 * Domain entity representing a single audit log entry
 */
export interface AuditLogEntry {
  /**
   * Unique identifier for the audit entry
   */
  id: string

  /**
   * Project ID (for multi-tenancy scoping)
   */
  projectId: string

  /**
   * User ID who performed the action
   */
  userId: string

  /**
   * Type of action performed
   */
  action: AuditAction

  /**
   * Type of resource affected
   */
  resourceType: AuditResourceType

  /**
   * ID of the resource affected
   */
  resourceId: string

  /**
   * Additional details about the action (JSON-serializable)
   */
  details: Record<string, any>

  /**
   * Timestamp when the action occurred
   */
  timestamp: Date

  /**
   * IP address of the user (optional)
   */
  ipAddress?: string

  /**
   * User agent string (optional)
   */
  userAgent?: string
}

/**
 * Create Audit Log Input
 *
 * Data required to create a new audit log entry
 */
export interface CreateAuditLogInput {
  projectId: string
  userId: string
  action: AuditAction
  resourceType: AuditResourceType
  resourceId: string
  details: Record<string, any>
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

/**
 * Audit Log Query Options
 *
 * Options for querying audit logs
 */
export interface AuditLogQueryOptions {
  /**
   * Project ID to filter by
   */
  projectId?: string

  /**
   * User ID to filter by
   */
  userId?: string

  /**
   * Action type to filter by
   */
  action?: AuditAction

  /**
   * Resource type to filter by
   */
  resourceType?: AuditResourceType

  /**
   * Resource ID to filter by
   */
  resourceId?: string

  /**
   * Start date for time range filter
   */
  startDate?: Date

  /**
   * End date for time range filter
   */
  endDate?: Date

  /**
   * Maximum number of results to return
   */
  limit?: number

  /**
   * Offset for pagination
   */
  offset?: number
}

/**
 * IAuditRepository
 *
 * Repository interface for audit logging operations
 */
export interface IAuditRepository {
  /**
   * Log an action to the audit trail
   *
   * Creates a new audit log entry for the specified action.
   * This is the primary method for recording all system activities.
   *
   * @param input - The audit log data
   * @returns Promise<string> - The created audit log entry ID
   */
  logAction(input: CreateAuditLogInput): Promise<string>

  /**
   * Get audit logs based on query options
   *
   * Retrieves audit log entries matching the specified criteria.
   * Used for audit trail viewing and compliance reporting.
   *
   * @param options - Query options for filtering
   * @returns Promise<AuditLogEntry[]> - Array of matching audit log entries
   */
  getAuditLogs(options: AuditLogQueryOptions): Promise<AuditLogEntry[]>

  /**
   * Get audit logs for a specific resource
   *
   * Retrieves the complete audit trail for a specific resource.
   * Useful for showing the history of changes to a particular item.
   *
   * @param projectId - The project ID
   * @param resourceType - The type of resource
   * @param resourceId - The resource ID
   * @returns Promise<AuditLogEntry[]> - Array of audit log entries for the resource
   */
  getResourceAuditTrail(
    projectId: string,
    resourceType: AuditResourceType,
    resourceId: string
  ): Promise<AuditLogEntry[]>

  /**
   * Get recent audit logs for a project
   *
   * Retrieves the most recent audit log entries for a project.
   * Used for dashboard and activity feed displays.
   *
   * @param projectId - The project ID
   * @param limit - Maximum number of entries to return (default: 50)
   * @returns Promise<AuditLogEntry[]> - Array of recent audit log entries
   */
  getRecentAuditLogs(projectId: string, limit?: number): Promise<AuditLogEntry[]>

  /**
   * Get audit logs for a specific user
   *
   * Retrieves all actions performed by a specific user.
   * Used for user activity tracking and compliance.
   *
   * @param userId - The user ID
   * @param projectId - Optional project ID to scope results
   * @param limit - Maximum number of entries to return
   * @returns Promise<AuditLogEntry[]> - Array of user's audit log entries
   */
  getUserAuditLogs(
    userId: string,
    projectId?: string,
    limit?: number
  ): Promise<AuditLogEntry[]>

  /**
   * Delete old audit logs
   *
   * Removes audit log entries older than the specified date.
   * Used for compliance with data retention policies.
   *
   * @param beforeDate - Delete entries before this date
   * @param projectId - Optional project ID to scope deletion
   * @returns Promise<number> - Number of deleted entries
   */
  deleteOldAuditLogs(beforeDate: Date, projectId?: string): Promise<number>

  /**
   * Count audit logs matching criteria
   *
   * Returns the total number of audit log entries matching the query.
   * Used for pagination and statistics.
   *
   * @param options - Query options for filtering
   * @returns Promise<number> - Total count of matching entries
   */
  countAuditLogs(options: AuditLogQueryOptions): Promise<number>

  /**
   * Get audit logs for a specific project (alias for common use case)
   *
   * Convenience method for retrieving all audit logs for a project.
   *
   * @param projectId - The project ID
   * @param limit - Maximum number of entries to return
   * @returns Promise<AuditLogEntry[]> - Array of audit log entries
   */
  getAuditLogsForProject(projectId: string, limit?: number): Promise<AuditLogEntry[]>

  /**
   * Get audit logs for a specific resource (alias for common use case)
   *
   * Convenience method for retrieving audit logs for a specific resource.
   *
   * @param projectId - The project ID
   * @param resourceId - The resource ID
   * @param resourceType - Optional resource type filter
   * @returns Promise<AuditLogEntry[]> - Array of audit log entries
   */
  getAuditLogsForResource(
    projectId: string,
    resourceId: string,
    resourceType?: AuditResourceType
  ): Promise<AuditLogEntry[]>
}
