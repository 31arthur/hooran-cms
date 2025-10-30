/**
 * Dashboard Data Transfer Objects (DTOs)
 *
 * These DTOs provide specialized data structures for dashboard widgets and summaries.
 * They follow the Single Responsibility Principle by providing focused data views
 * for specific dashboard use cases.
 *
 * **Why Dashboard DTOs?**
 * - Specialized for dashboard visualization needs
 * - Pre-aggregated data to minimize UI calculations
 * - Clear contracts between dashboard use case and UI
 * - Easy to extend with new dashboard metrics
 */

/**
 * PublicationStatusDTO
 *
 * Summary of content publication status for dashboard display.
 * Used in the "Published vs. Draft Status" widget.
 *
 * **Usage:**
 * - Dashboard status widget
 * - Publication metrics card
 * - Content health overview
 *
 * @example
 * ```typescript
 * const status: PublicationStatusDTO = {
 *   total: 150,
 *   published: 120,
 *   draft: 25,
 *   archived: 5,
 *   publishedPercentage: 80,
 *   lastPublished: new Date('2025-01-15')
 * }
 * ```
 */
export interface PublicationStatusDTO {
  /**
   * Total number of content entries
   */
  total: number

  /**
   * Number of published entries
   */
  published: number

  /**
   * Number of draft entries
   */
  draft: number

  /**
   * Number of archived entries
   */
  archived: number

  /**
   * Percentage of published content (0-100)
   */
  publishedPercentage: number

  /**
   * Last publication timestamp
   */
  lastPublished?: Date

  /**
   * Breakdown by collection (optional)
   */
  byCollection?: Array<{
    collectionId: string
    collectionName: string
    published: number
    draft: number
  }>
}

/**
 * DashboardSummaryDTO
 *
 * Complete dashboard overview with all key metrics.
 *
 * **Usage:**
 * - Main dashboard page
 * - Executive summary
 * - System health overview
 */
export interface DashboardSummaryDTO {
  /**
   * Publication status summary
   */
  publicationStatus: PublicationStatusDTO

  /**
   * Recent activity summary
   */
  recentActivity: {
    totalActions: number
    todayActions: number
    weekActions: number
  }

  /**
   * System health indicators
   */
  systemHealth: {
    criticalIssues: number
    warnings: number
    lastError?: Date
  }

  /**
   * User activity metrics
   */
  userActivity?: {
    activeUsers: number
    totalUsers: number
  }
}

/**
 * RecentActivityDTO
 *
 * Recent system activity for dashboard feed.
 *
 * **Usage:**
 * - Recent activity widget
 * - Activity timeline
 * - Notification center
 */
export interface RecentActivityDTO {
  /**
   * Activity type
   */
  type: 'content' | 'schema' | 'user' | 'system'

  /**
   * Activity action
   */
  action: string

  /**
   * Human-readable description
   */
  description: string

  /**
   * User who performed the action
   */
  userId: string

  /**
   * User display name
   */
  userName?: string

  /**
   * Timestamp
   */
  timestamp: Date

  /**
   * Resource affected
   */
  resourceId?: string

  /**
   * Resource name
   */
  resourceName?: string
}

/**
 * SystemHealthDTO
 *
 * System health metrics for dashboard monitoring.
 *
 * **Usage:**
 * - System health widget
 * - Error monitoring dashboard
 * - Admin alerts
 */
export interface SystemHealthDTO {
  /**
   * Overall health status
   */
  status: 'healthy' | 'warning' | 'critical'

  /**
   * Number of critical issues
   */
  criticalIssues: number

  /**
   * Number of warnings
   */
  warnings: number

  /**
   * Recent critical errors
   */
  recentErrors: Array<{
    message: string
    timestamp: Date
    userId?: string
  }>

  /**
   * Last error timestamp
   */
  lastError?: Date

  /**
   * Time period for metrics
   */
  period: {
    hours: number
    start: Date
    end: Date
  }
}

/**
 * ContentMetricsDTO
 *
 * Content-related metrics for dashboard analytics.
 *
 * **Usage:**
 * - Content analytics widget
 * - Growth charts
 * - Content health metrics
 */
export interface ContentMetricsDTO {
  /**
   * Total content entries
   */
  totalEntries: number

  /**
   * Entries created this week
   */
  thisWeek: number

  /**
   * Entries created this month
   */
  thisMonth: number

  /**
   * Growth rate (percentage)
   */
  growthRate: number

  /**
   * Most active collections
   */
  topCollections: Array<{
    collectionId: string
    collectionName: string
    entryCount: number
  }>

  /**
   * Content by status
   */
  byStatus: {
    published: number
    draft: number
    archived: number
  }
}

/**
 * QuickStatsDTO
 *
 * Quick statistics for dashboard cards.
 *
 * **Usage:**
 * - Dashboard stat cards
 * - Overview metrics
 * - KPI displays
 */
export interface QuickStatsDTO {
  /**
   * Statistic label
   */
  label: string

  /**
   * Current value
   */
  value: number

  /**
   * Previous value for comparison
   */
  previousValue?: number

  /**
   * Change percentage
   */
  changePercentage?: number

  /**
   * Trend direction
   */
  trend?: 'up' | 'down' | 'stable'

  /**
   * Additional context
   */
  context?: string

  /**
   * Icon or color hint
   */
  hint?: 'success' | 'warning' | 'danger' | 'info'
}
