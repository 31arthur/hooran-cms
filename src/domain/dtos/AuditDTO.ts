/**
 * Audit Data Transfer Objects (DTOs)
 *
 * These DTOs provide simplified views of audit log data for specific UI needs.
 * They follow the Interface Segregation Principle (ISP) by exposing only
 * the data required for each specific use case.
 *
 * **Why DTOs?**
 * - Simplified audit trail display
 * - Reduced data transfer for dashboards
 * - Clear summary generation
 * - Easy to format for different UI contexts
 */

import type {
  AuditLogEntry,
  AuditAction,
  AuditResourceType,
} from '@/domain/repositories/IAuditRepository'

/**
 * AuditSummaryDTO
 *
 * Concise audit log information for dashboard widgets and activity feeds.
 * Contains only essential fields for displaying recent system activity.
 *
 * **Usage:**
 * - Dashboard "System Health" widget
 * - Recent activity sidebar
 * - Activity notifications
 * - Quick audit overviews
 *
 * @example
 * ```typescript
 * const recentActivity: AuditSummaryDTO[] = [
 *   {
 *     timestamp: new Date(),
 *     action: 'CREATE',
 *     summary: 'Created new content entry "My Article"'
 *   }
 * ]
 * ```
 */
export interface AuditSummaryDTO {
  /**
   * When the action occurred
   */
  timestamp: Date

  /**
   * Type of action performed
   */
  action: AuditAction

  /**
   * Human-readable summary of the action
   * Examples:
   * - "Created content entry 'Article Title'"
   * - "Updated project settings for 'Project Name'"
   * - "Published content 'Blog Post'"
   */
  summary: string

  /**
   * Optional: User who performed the action
   */
  userId?: string

  /**
   * Optional: Resource type affected
   */
  resourceType?: AuditResourceType
}

/**
 * AuditDetailDTO
 *
 * Complete audit log information for detailed audit trail views.
 * Includes all fields and metadata for compliance and investigation.
 *
 * **Usage:**
 * - Audit log page
 * - Compliance reports
 * - Security investigations
 * - Detailed activity history
 */
export interface AuditDetailDTO {
  /**
   * Unique audit log entry ID
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
   * Additional details about the action
   */
  details: Record<string, any>

  /**
   * Timestamp when the action occurred
   */
  timestamp: Date

  /**
   * Optional: IP address of the user
   */
  ipAddress?: string

  /**
   * Optional: User agent string
   */
  userAgent?: string
}

/**
 * AuditStatisticsDTO
 *
 * Aggregated audit statistics for dashboard metrics.
 *
 * **Usage:**
 * - Dashboard statistics cards
 * - Activity charts
 * - System health indicators
 */
export interface AuditStatisticsDTO {
  /**
   * Total number of actions in time period
   */
  totalActions: number

  /**
   * Breakdown by action type
   */
  actionBreakdown: Record<AuditAction, number>

  /**
   * Breakdown by resource type
   */
  resourceBreakdown: Record<AuditResourceType, number>

  /**
   * Most active users (user ID and action count)
   */
  topUsers: Array<{ userId: string; actionCount: number }>

  /**
   * Time period for these statistics
   */
  period: {
    start: Date
    end: Date
  }
}

/**
 * AuditMapper
 *
 * Static utility class for mapping AuditLogEntry domain entities to DTOs.
 * Centralizes the transformation logic to ensure consistency.
 */
export class AuditMapper {
  /**
   * Generate human-readable summary from audit log entry
   *
   * Creates concise, user-friendly descriptions of actions.
   *
   * @param entry - The audit log entry
   * @returns Human-readable summary
   */
  private static generateSummary(entry: AuditLogEntry): string {
    const { action, resourceType, details } = entry

    // Extract meaningful information from details
    const resourceName = details?.name || details?.title || details?.email || ''
    const changeFields = details?.changed_fields?.join(', ') || ''

    // Generate summary based on action and resource type
    switch (action) {
      case 'CREATE':
        return `Created ${resourceType.toLowerCase()}${resourceName ? ` "${resourceName}"` : ''}`

      case 'UPDATE':
        if (changeFields) {
          return `Updated ${resourceType.toLowerCase()} (${changeFields})${resourceName ? ` for "${resourceName}"` : ''}`
        }
        return `Updated ${resourceType.toLowerCase()}${resourceName ? ` "${resourceName}"` : ''}`

      case 'DELETE':
        return `Deleted ${resourceType.toLowerCase()}${resourceName ? ` "${resourceName}"` : ''}`

      case 'PUBLISH':
        return `Published ${resourceType.toLowerCase()}${resourceName ? ` "${resourceName}"` : ''}`

      case 'UNPUBLISH':
        return `Unpublished ${resourceType.toLowerCase()}${resourceName ? ` "${resourceName}"` : ''}`

      case 'USER_ASSIGNMENT':
        const assignedUser = details?.assigned_user_email || details?.assigned_user_id || ''
        return `Assigned user${assignedUser ? ` "${assignedUser}"` : ''} to project`

      case 'LOGIN':
        return 'User logged in'

      case 'LOGOUT':
        return 'User logged out'

      case 'SCHEMA_CREATE':
        return `Created schema${resourceName ? ` "${resourceName}"` : ''}`

      case 'SCHEMA_UPDATE':
        return `Updated schema${resourceName ? ` "${resourceName}"` : ''}`

      case 'SCHEMA_DELETE':
        return `Deleted schema${resourceName ? ` "${resourceName}"` : ''}`

      case 'PROJECT_CREATE':
        return `Created project${resourceName ? ` "${resourceName}"` : ''}`

      case 'PROJECT_UPDATE':
        return `Updated project${resourceName ? ` "${resourceName}"` : ''}`

      case 'ARCHIVE':
        return `Archived ${resourceType.toLowerCase()}${resourceName ? ` "${resourceName}"` : ''}`

      case 'RESTORE':
        return `Restored ${resourceType.toLowerCase()}${resourceName ? ` "${resourceName}"` : ''}`

      default:
        return `Performed ${action} on ${resourceType.toLowerCase()}`
    }
  }

  /**
   * Convert AuditLogEntry entity to AuditSummaryDTO
   *
   * Extracts only the fields needed for summaries and widgets.
   *
   * @param entry - The full audit log entry
   * @returns Simplified summary DTO
   */
  static toSummaryDTO(entry: AuditLogEntry): AuditSummaryDTO {
    return {
      timestamp: entry.timestamp,
      action: entry.action,
      summary: AuditMapper.generateSummary(entry),
      userId: entry.userId,
      resourceType: entry.resourceType,
    }
  }

  /**
   * Convert array of AuditLogEntry entities to AuditSummaryDTO array
   *
   * @param entries - Array of audit log entries
   * @returns Array of summary DTOs
   */
  static toSummaryDTOList(entries: AuditLogEntry[]): AuditSummaryDTO[] {
    return entries.map((e) => AuditMapper.toSummaryDTO(e))
  }

  /**
   * Convert AuditLogEntry entity to AuditDetailDTO
   *
   * Includes all fields for detailed audit views.
   *
   * @param entry - The full audit log entry
   * @returns Detailed audit DTO
   */
  static toDetailDTO(entry: AuditLogEntry): AuditDetailDTO {
    return {
      id: entry.id,
      projectId: entry.projectId,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details,
      timestamp: entry.timestamp,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    }
  }

  /**
   * Convert array of AuditLogEntry entities to AuditDetailDTO array
   *
   * @param entries - Array of audit log entries
   * @returns Array of detail DTOs
   */
  static toDetailDTOList(entries: AuditLogEntry[]): AuditDetailDTO[] {
    return entries.map((e) => AuditMapper.toDetailDTO(e))
  }

  /**
   * Generate statistics from audit log entries
   *
   * @param entries - Array of audit log entries
   * @param startDate - Start of time period
   * @param endDate - End of time period
   * @returns Aggregated statistics DTO
   */
  static toStatisticsDTO(
    entries: AuditLogEntry[],
    startDate: Date,
    endDate: Date
  ): AuditStatisticsDTO {
    const actionBreakdown: Record<string, number> = {}
    const resourceBreakdown: Record<string, number> = {}
    const userActions: Record<string, number> = {}

    // Aggregate data
    for (const entry of entries) {
      // Count actions
      actionBreakdown[entry.action] = (actionBreakdown[entry.action] || 0) + 1

      // Count resources
      resourceBreakdown[entry.resourceType] =
        (resourceBreakdown[entry.resourceType] || 0) + 1

      // Count user actions
      userActions[entry.userId] = (userActions[entry.userId] || 0) + 1
    }

    // Get top users
    const topUsers = Object.entries(userActions)
      .map(([userId, actionCount]) => ({ userId, actionCount }))
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 10)

    return {
      totalActions: entries.length,
      actionBreakdown: actionBreakdown as Record<AuditAction, number>,
      resourceBreakdown: resourceBreakdown as Record<AuditResourceType, number>,
      topUsers,
      period: {
        start: startDate,
        end: endDate,
      },
    }
  }
}
