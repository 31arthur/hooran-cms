/**
 * Dashboard Data Use Case Interface
 *
 * Defines the contract for dashboard-specific business logic and data aggregation.
 * This Use Case is responsible for all dashboard widgets, metrics, and summaries.
 *
 * **Why a Dedicated Dashboard Use Case?**
 * - **Single Responsibility:** Dashboard logic separated from CRUD operations
 * - **Open/Closed Principle:** Easy to add new widgets without modifying core use cases
 * - **Testability:** Dashboard metrics can be tested independently
 * - **Performance:** Optimized queries for dashboard-specific needs
 *
 * **Architecture Pattern:**
 * This Use Case aggregates data from multiple repositories and transforms it
 * into dashboard-specific DTOs, keeping the presentation layer simple and focused.
 *
 * **Business Rules:**
 * - Publication status includes percentage calculations
 * - System health based on recent critical audit logs
 * - Recent activity limited to configurable time windows
 * - All metrics filtered by project for multi-tenancy
 */

import type {
  PublicationStatusDTO,
  DashboardSummaryDTO,
  RecentActivityDTO,
  SystemHealthDTO,
  ContentMetricsDTO,
  AuditSummaryDTO,
} from '@/domain/dtos'

/**
 * IDashboardDataUseCase
 *
 * Application-layer interface for dashboard data retrieval and aggregation.
 */
export interface IDashboardDataUseCase {
  /**
   * Get publication status summary
   *
   * Calculates total, published, draft, and archived content counts
   * with percentage calculations for the "Published vs. Draft Status" widget.
   *
   * **Business Logic:**
   * - Aggregates content across all collections in the project
   * - Calculates published percentage
   * - Finds most recent publication timestamp
   * - Optional: Breaks down by collection
   *
   * **Widget:** "Published vs. Draft Status"
   *
   * @param projectId - The project ID to get status for
   * @param includeCollectionBreakdown - Whether to include per-collection breakdown
   * @returns Promise<PublicationStatusDTO> - Publication status summary
   *
   * @example
   * ```typescript
   * const status = await dashboardUseCase.getPublicationStatusSummary('project-1')
   * console.log(`${status.publishedPercentage}% published`)
   * ```
   */
  getPublicationStatusSummary(
    projectId: string,
    includeCollectionBreakdown?: boolean
  ): Promise<PublicationStatusDTO>

  /**
   * Get recent critical logs for system health widget
   *
   * Retrieves and summarizes recent critical audit logs for the
   * "System Health/Errors" widget. Returns human-readable summaries.
   *
   * **Business Logic:**
   * - Filters audit logs for critical actions (errors, failures)
   * - Limits to recent time window (default: 24 hours)
   * - Returns top N most recent (default: 3)
   * - Generates human-readable summaries
   *
   * **Widget:** "System Health/Errors"
   *
   * @param projectId - The project ID to get logs for
   * @param limit - Maximum number of logs to return (default: 3)
   * @param hoursBack - Time window in hours (default: 24)
   * @returns Promise<AuditSummaryDTO[]> - Critical audit log summaries
   *
   * @example
   * ```typescript
   * const criticalLogs = await dashboardUseCase.getRecentCriticalLogs('project-1', 3)
   * // Returns top 3 critical logs from last 24 hours
   * ```
   */
  getRecentCriticalLogs(
    projectId: string,
    limit?: number,
    hoursBack?: number
  ): Promise<AuditSummaryDTO[]>

  /**
   * Get system health summary
   *
   * Provides overall system health status based on recent errors and warnings.
   *
   * **Business Logic:**
   * - Counts critical issues and warnings
   * - Determines overall health status
   * - Includes recent error messages
   * - Time-bounded analysis
   *
   * @param projectId - The project ID
   * @param hoursBack - Time window in hours (default: 24)
   * @returns Promise<SystemHealthDTO> - System health summary
   */
  getSystemHealth(projectId: string, hoursBack?: number): Promise<SystemHealthDTO>

  /**
   * Get recent activity
   *
   * Retrieves recent system activity across all resource types.
   *
   * **Business Logic:**
   * - Aggregates audit logs for recent actions
   * - Enriches with user names
   * - Categorizes by activity type
   * - Formats for timeline display
   *
   * @param projectId - The project ID
   * @param limit - Maximum number of activities (default: 10)
   * @param hoursBack - Time window in hours (default: 72)
   * @returns Promise<RecentActivityDTO[]> - Recent activities
   */
  getRecentActivity(
    projectId: string,
    limit?: number,
    hoursBack?: number
  ): Promise<RecentActivityDTO[]>

  /**
   * Get content metrics
   *
   * Provides content-related analytics for dashboard charts and widgets.
   *
   * **Business Logic:**
   * - Calculates content growth metrics
   * - Identifies top collections
   * - Breaks down by status
   * - Calculates trends
   *
   * @param projectId - The project ID
   * @returns Promise<ContentMetricsDTO> - Content metrics
   */
  getContentMetrics(projectId: string): Promise<ContentMetricsDTO>

  /**
   * Get complete dashboard summary
   *
   * Aggregates all dashboard data into a single DTO for efficiency.
   * Useful for loading all dashboard widgets in one request.
   *
   * **Business Logic:**
   * - Calls all other methods in parallel
   * - Aggregates results into complete summary
   * - Optimized for dashboard page load
   *
   * @param projectId - The project ID
   * @returns Promise<DashboardSummaryDTO> - Complete dashboard data
   */
  getDashboardSummary(projectId: string): Promise<DashboardSummaryDTO>
}
