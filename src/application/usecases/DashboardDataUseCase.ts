/**
 * Dashboard Data Use Case Implementation
 *
 * Implements dashboard-specific business logic for widgets and metrics.
 * This Use Case aggregates data from multiple repositories and transforms
 * it into dashboard-optimized DTOs.
 *
 * **Single Responsibility Principle (SRP):**
 * This class is solely responsible for dashboard data aggregation and metrics,
 * separating it from core CRUD operations in other use cases.
 *
 * **Open/Closed Principle (OCP):**
 * New dashboard widgets can be added as new methods without modifying
 * existing functionality.
 */

import type { IDashboardDataUseCase } from './IDashboardDataUseCase'
import type {
  PublicationStatusDTO,
  DashboardSummaryDTO,
  RecentActivityDTO,
  SystemHealthDTO,
  ContentMetricsDTO,
  AuditSummaryDTO,
} from '@/domain/dtos'
import { AuditMapper } from '@/domain/dtos'
import type {
  IContentRepository,
  IAuditRepository,
  IUserRepository,
  ISchemaRepository,
} from '@/domain/repositories'

/**
 * DashboardDataUseCase
 *
 * Orchestrates dashboard data retrieval and metric calculations.
 */
export class DashboardDataUseCase implements IDashboardDataUseCase {
  private contentRepository: IContentRepository
  private auditRepository: IAuditRepository
  private userRepository: IUserRepository
  private schemaRepository: ISchemaRepository

  constructor(
    contentRepository: IContentRepository,
    auditRepository: IAuditRepository,
    userRepository: IUserRepository,
    schemaRepository: ISchemaRepository
  ) {
    this.contentRepository = contentRepository
    this.auditRepository = auditRepository
    this.userRepository = userRepository
    this.schemaRepository = schemaRepository
  }

  /**
   * Get publication status summary
   *
   * Implements the "Published vs. Draft Status" widget logic.
   */
  async getPublicationStatusSummary(
    projectId: string,
    includeCollectionBreakdown: boolean = false
  ): Promise<PublicationStatusDTO> {
    try {
      console.log('📊 DashboardDataUseCase: Getting publication status summary', { projectId })

      // Get all schemas/collections for this project
      const schemas = await this.schemaRepository.getSchemas(projectId)

      let totalPublished = 0
      let totalDraft = 0
      let totalArchived = 0
      let lastPublishedDate: Date | undefined

      const collectionBreakdown: Array<{
        collectionId: string
        collectionName: string
        published: number
        draft: number
      }> = []

      // Aggregate content across all collections
      for (const schema of schemas) {
        const allContent = await this.contentRepository.getContentEntries(
          projectId,
          schema.collectionId || schema.id,
          { limit: 1000 } // Get all content for accurate counts
        )

        const published = allContent.filter((c) => c.status === 'published')
        const draft = allContent.filter((c) => c.status === 'draft')
        const archived = allContent.filter((c) => c.status === 'archived')

        totalPublished += published.length
        totalDraft += draft.length
        totalArchived += archived.length

        // Find most recent publication
        for (const content of published) {
          if (content.publishedAt) {
            if (!lastPublishedDate || content.publishedAt > lastPublishedDate) {
              lastPublishedDate = content.publishedAt
            }
          }
        }

        // Add to breakdown if requested
        if (includeCollectionBreakdown) {
          collectionBreakdown.push({
            collectionId: schema.collectionId || schema.id,
            collectionName: schema.collectionName || schema.name,
            published: published.length,
            draft: draft.length,
          })
        }
      }

      const total = totalPublished + totalDraft + totalArchived
      const publishedPercentage = total > 0 ? Math.round((totalPublished / total) * 100) : 0

      const result: PublicationStatusDTO = {
        total,
        published: totalPublished,
        draft: totalDraft,
        archived: totalArchived,
        publishedPercentage,
        lastPublished: lastPublishedDate,
      }

      if (includeCollectionBreakdown && collectionBreakdown.length > 0) {
        result.byCollection = collectionBreakdown
      }

      console.log('✅ DashboardDataUseCase: Publication status calculated', result)

      return result
    } catch (error) {
      console.error('❌ DashboardDataUseCase: Failed to get publication status', error)
      throw error
    }
  }

  /**
   * Get recent critical logs
   *
   * Implements the "System Health/Errors" widget logic.
   */
  async getRecentCriticalLogs(
    projectId: string,
    limit: number = 3,
    hoursBack: number = 24
  ): Promise<AuditSummaryDTO[]> {
    try {
      console.log('📊 DashboardDataUseCase: Getting recent critical logs', {
        projectId,
        limit,
        hoursBack,
      })

      // Calculate time window
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - hoursBack * 60 * 60 * 1000)

      // Get all audit logs for the project (this method needs to be added to IAuditRepository)
      // For now, we'll use a workaround by getting logs and filtering client-side
      const allLogs = await this.auditRepository.getAuditLogs({
        projectId,
        limit: 100,
        startDate,
        endDate,
      })

      // Filter for critical actions (errors, failures, deletions)
      const criticalActions = new Set([
        'DELETE',
        'ARCHIVE',
        'SCHEMA_DELETE',
        'PROJECT_DELETE',
        'ERROR',
        'FAILURE',
      ])

      const criticalLogs = allLogs
        .filter((log) => {
          // Check if action is critical
          if (criticalActions.has(log.action as any)) return true

          // Check if details contain error information
          if (log.details?.error || log.details?.failed) return true

          return false
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)

      // Map to AuditSummaryDTO
      const summaries = AuditMapper.toSummaryDTOList(criticalLogs)

      console.log(`✅ DashboardDataUseCase: Found ${summaries.length} critical logs`)

      return summaries
    } catch (error) {
      console.error('❌ DashboardDataUseCase: Failed to get critical logs', error)
      throw error
    }
  }

  /**
   * Get system health summary
   */
  async getSystemHealth(projectId: string, hoursBack: number = 24): Promise<SystemHealthDTO> {
    try {
      console.log('📊 DashboardDataUseCase: Getting system health', { projectId, hoursBack })

      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - hoursBack * 60 * 60 * 1000)

      // Get recent logs
      const recentLogs = await this.auditRepository.getAuditLogs({
        projectId,
        limit: 100,
        startDate,
        endDate,
      })

      // Count critical issues and warnings
      let criticalIssues = 0
      let warnings = 0
      const recentErrors: Array<{ message: string; timestamp: Date; userId?: string }> = []
      let lastError: Date | undefined

      for (const log of recentLogs) {
        const isCritical =
          log.action === 'DELETE' ||
          log.action === 'ARCHIVE' ||
          log.details?.error ||
          log.details?.failed

        if (isCritical) {
          criticalIssues++

          if (recentErrors.length < 5) {
            recentErrors.push({
              message: log.details?.error || log.details?.change_summary || 'Unknown error',
              timestamp: log.timestamp,
              userId: log.userId,
            })
          }

          if (!lastError || log.timestamp > lastError) {
            lastError = log.timestamp
          }
        } else if (log.action === 'UPDATE' && log.details?.warnings) {
          warnings++
        }
      }

      // Determine overall status
      let status: 'healthy' | 'warning' | 'critical'
      if (criticalIssues > 5) {
        status = 'critical'
      } else if (criticalIssues > 0 || warnings > 10) {
        status = 'warning'
      } else {
        status = 'healthy'
      }

      const result: SystemHealthDTO = {
        status,
        criticalIssues,
        warnings,
        recentErrors,
        lastError,
        period: {
          hours: hoursBack,
          start: startDate,
          end: endDate,
        },
      }

      console.log('✅ DashboardDataUseCase: System health calculated', {
        status,
        criticalIssues,
        warnings,
      })

      return result
    } catch (error) {
      console.error('❌ DashboardDataUseCase: Failed to get system health', error)
      throw error
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(
    projectId: string,
    limit: number = 10,
    hoursBack: number = 72
  ): Promise<RecentActivityDTO[]> {
    try {
      console.log('📊 DashboardDataUseCase: Getting recent activity', {
        projectId,
        limit,
        hoursBack,
      })

      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - hoursBack * 60 * 60 * 1000)

      const recentLogs = await this.auditRepository.getAuditLogs({
        projectId,
        limit: limit * 2, // Get more to filter and deduplicate
        startDate,
        endDate,
      })

      // Convert to RecentActivityDTO
      const activities: RecentActivityDTO[] = []

      for (const log of recentLogs.slice(0, limit)) {
        // Determine activity type
        let type: 'content' | 'schema' | 'user' | 'system'
        if (log.resourceType === 'CONTENT') type = 'content'
        else if (log.resourceType === 'SCHEMA') type = 'schema'
        else if (log.resourceType === 'USER_ROLE')
          type = 'user'
        else type = 'system'

        // Get user name if possible
        let userName: string | undefined
        try {
          const user = await this.userRepository.getUserById(log.userId)
          userName = user?.displayName || user?.name || user?.email
        } catch {
          // User lookup failed, skip name
        }

        activities.push({
          type,
          action: log.action,
          description:
            log.details?.change_summary ||
            `${log.action} ${log.resourceType}`.toLowerCase(),
          userId: log.userId,
          userName,
          timestamp: log.timestamp,
          resourceId: log.resourceId,
          resourceName: log.details?.name || log.details?.title,
        })
      }

      console.log(`✅ DashboardDataUseCase: Found ${activities.length} recent activities`)

      return activities
    } catch (error) {
      console.error('❌ DashboardDataUseCase: Failed to get recent activity', error)
      throw error
    }
  }

  /**
   * Get content metrics
   */
  async getContentMetrics(projectId: string): Promise<ContentMetricsDTO> {
    try {
      console.log('📊 DashboardDataUseCase: Getting content metrics', { projectId })

      const schemas = await this.schemaRepository.getSchemas(projectId)

      let totalEntries = 0
      let thisWeek = 0
      let thisMonth = 0
      let publishedCount = 0
      let draftCount = 0
      let archivedCount = 0

      const collectionCounts: Map<string, { name: string; count: number }> = new Map()

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      for (const schema of schemas) {
        const entries = await this.contentRepository.getContentEntries(
          projectId,
          schema.collectionId || schema.id,
          { limit: 1000 }
        )

        totalEntries += entries.length
        collectionCounts.set(schema.collectionId || schema.id, {
          name: schema.collectionName || schema.name,
          count: entries.length,
        })

        for (const entry of entries) {
          // Count by status
          if (entry.status === 'published') publishedCount++
          else if (entry.status === 'draft') draftCount++
          else if (entry.status === 'archived') archivedCount++

          // Count by time period
          if (entry.createdAt >= weekAgo) thisWeek++
          if (entry.createdAt >= monthAgo) thisMonth++
        }
      }

      // Calculate growth rate (simple calculation)
      const growthRate =
        thisMonth > 0 ? Math.round((thisWeek / (thisMonth / 4)) * 100 - 100) : 0

      // Get top 5 collections
      const topCollections = Array.from(collectionCounts.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([collectionId, { name, count }]) => ({
          collectionId,
          collectionName: name,
          entryCount: count,
        }))

      const result: ContentMetricsDTO = {
        totalEntries,
        thisWeek,
        thisMonth,
        growthRate,
        topCollections,
        byStatus: {
          published: publishedCount,
          draft: draftCount,
          archived: archivedCount,
        },
      }

      console.log('✅ DashboardDataUseCase: Content metrics calculated', result)

      return result
    } catch (error) {
      console.error('❌ DashboardDataUseCase: Failed to get content metrics', error)
      throw error
    }
  }

  /**
   * Get complete dashboard summary
   */
  async getDashboardSummary(projectId: string): Promise<DashboardSummaryDTO> {
    try {
      console.log('📊 DashboardDataUseCase: Getting complete dashboard summary', { projectId })

      // Execute all data fetches in parallel for performance
      const [publicationStatus, systemHealth, recentLogs] = await Promise.all([
        this.getPublicationStatusSummary(projectId),
        this.getSystemHealth(projectId, 24),
        this.auditRepository.getAuditLogs({
          projectId,
          limit: 100,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }),
      ])

      // Calculate activity metrics from recent logs
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const todayActions = recentLogs.filter((log) => log.timestamp >= today).length
      const weekActions = recentLogs.filter((log) => log.timestamp >= weekAgo).length

      const summary: DashboardSummaryDTO = {
        publicationStatus,
        recentActivity: {
          totalActions: recentLogs.length,
          todayActions,
          weekActions,
        },
        systemHealth: {
          criticalIssues: systemHealth.criticalIssues,
          warnings: systemHealth.warnings,
          lastError: systemHealth.lastError,
        },
      }

      console.log('✅ DashboardDataUseCase: Dashboard summary complete')

      return summary
    } catch (error) {
      console.error('❌ DashboardDataUseCase: Failed to get dashboard summary', error)
      throw error
    }
  }
}
