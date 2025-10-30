/**
 * Audit Log Domain Entity
 *
 * Represents an audit trail entry for tracking all operations in the system.
 * This is a database-agnostic entity that uses native JavaScript types.
 *
 * **Framework Independence:**
 * - Uses native Date type (not Firebase Timestamp)
 * - No Firebase-specific types
 * - Clean domain model
 *
 * **Audit Trail:**
 * - Tracks all create, update, delete operations
 * - Records user logins and authentication events
 * - Captures role changes and permission modifications
 * - Logs project and content changes
 */

/**
 * Audit Action Type
 *
 * Defines the types of actions that can be audited
 */
export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'role_change'
  | 'project_assign'
  | 'project_unassign'
  | 'permission_change'
  | 'view'

/**
 * Audit Resource Type
 *
 * Defines the types of resources that can be audited
 */
export type AuditResourceType =
  | 'user'
  | 'project'
  | 'content'
  | 'schema'
  | 'auth'
  | 'system'

/**
 * Audit Log Entity
 *
 * Complete audit trail entry with all metadata
 */
export interface AuditLog {
  /**
   * Unique audit log ID
   */
  id: string

  /**
   * Type of action performed
   */
  action: AuditAction

  /**
   * Type of resource affected
   */
  resourceType: AuditResourceType

  /**
   * ID of the resource affected (e.g., user ID, project ID, content ID)
   */
  resourceId: string

  /**
   * Name or description of the resource (for display purposes)
   */
  resourceName?: string

  /**
   * Project ID (if action is project-scoped)
   * Super users can see all projects, Admins only see their assigned projects
   */
  projectId?: string

  /**
   * User who performed the action
   */
  userId: string

  /**
   * User's email at the time of action
   */
  userEmail: string

  /**
   * User's display name at the time of action
   */
  userName?: string

  /**
   * User's role at the time of action
   */
  userRole: 'Super' | 'Admin' | 'User'

  /**
   * When the action occurred
   */
  timestamp: Date

  /**
   * Detailed changes (for update operations)
   * Format: { field: { from: oldValue, to: newValue } }
   */
  changes?: Record<string, { from: any; to: any }>

  /**
   * Additional metadata about the action
   */
  metadata?: Record<string, any>

  /**
   * IP address of the user (optional, for security auditing)
   */
  ipAddress?: string

  /**
   * User agent string (optional, for security auditing)
   */
  userAgent?: string

  /**
   * Result of the operation (success, failure, partial)
   */
  status: 'success' | 'failure' | 'partial'

  /**
   * Error message (if status is failure)
   */
  errorMessage?: string
}

/**
 * Create Audit Log Input
 *
 * Data required to create a new audit log entry
 */
export interface CreateAuditLogInput {
  action: AuditAction
  resourceType: AuditResourceType
  resourceId: string
  resourceName?: string
  projectId?: string
  userId: string
  userEmail: string
  userName?: string
  userRole: 'Super' | 'Admin' | 'User'
  changes?: Record<string, { from: any; to: any }>
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status?: 'success' | 'failure' | 'partial'
  errorMessage?: string
}

/**
 * Audit Log Filter Options
 *
 * Filtering options for querying audit logs
 */
export interface AuditLogFilters {
  /**
   * Filter by project ID
   */
  projectId?: string

  /**
   * Filter by user ID
   */
  userId?: string

  /**
   * Filter by action type
   */
  action?: AuditAction

  /**
   * Filter by resource type
   */
  resourceType?: AuditResourceType

  /**
   * Filter by time range (from)
   */
  startDate?: Date

  /**
   * Filter by time range (to)
   */
  endDate?: Date

  /**
   * Time filter preset (e.g., last 30 minutes, 1 hour, 24 hours, week)
   */
  timeRange?: '30m' | '1h' | '24h' | '7d' | '30d'

  /**
   * Filter by status
   */
  status?: 'success' | 'failure' | 'partial'

  /**
   * Limit number of results
   */
  limit?: number

  /**
   * Offset for pagination
   */
  offset?: number
}
