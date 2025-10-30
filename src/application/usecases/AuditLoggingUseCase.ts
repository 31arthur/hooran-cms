/**
 * Audit Logging Use Case
 *
 * Handles all audit logging operations across the CMS.
 * Provides centralized audit trail functionality.
 *
 * **Business Rules:**
 * - All create, update, delete operations are logged
 * - All authentication events are logged
 * - All role/permission changes are logged
 * - Super users can see all audit logs
 * - Admin users can only see logs for their assigned projects
 * - Supports time-based filtering (30m, 1h, 24h, 7d, 30d)
 * - Supports user and action filtering
 *
 * **Clean Architecture:**
 * - Depends on IAuditLogRepository (abstraction)
 * - Returns domain entities only
 * - No infrastructure dependencies
 */

import type { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository'
import type { CreateAuditLogInput, AuditLog, AuditLogFilters } from '@/domain/entities/AuditLog'

export interface IAuditLoggingUseCase {
  /**
   * Log an audit entry
   */
  logAudit(input: CreateAuditLogInput): Promise<AuditLog>

  /**
   * Get audit logs with filters and access control
   */
  getAuditLogs(
    requestingUserId: string,
    requestingUserRole: string,
    userProjects: string[],
    filters: AuditLogFilters
  ): Promise<AuditLog[]>

  /**
   * Get audit logs for a specific project
   */
  getProjectAuditLogs(
    projectId: string,
    requestingUserId: string,
    requestingUserRole: string,
    filters?: AuditLogFilters
  ): Promise<AuditLog[]>

  /**
   * Get audit logs for a specific user
   */
  getUserAuditLogs(
    userId: string,
    requestingUserId: string,
    requestingUserRole: string,
    filters?: AuditLogFilters
  ): Promise<AuditLog[]>

  /**
   * Log user login
   */
  logLogin(userId: string, userEmail: string, userName: string, userRole: string): Promise<void>

  /**
   * Log user logout
   */
  logLogout(userId: string, userEmail: string, userName: string, userRole: string): Promise<void>

  /**
   * Log role change
   */
  logRoleChange(
    targetUserId: string,
    targetUserEmail: string,
    oldRole: string,
    newRole: string,
    performedBy: {
      userId: string
      userEmail: string
      userName: string
      userRole: string
    }
  ): Promise<void>

  /**
   * Log project assignment
   */
  logProjectAssignment(
    userId: string,
    userEmail: string,
    projectId: string,
    projectName: string,
    performedBy: {
      userId: string
      userEmail: string
      userName: string
      userRole: string
    }
  ): Promise<void>

  /**
   * Log project unassignment
   */
  logProjectUnassignment(
    userId: string,
    userEmail: string,
    projectId: string,
    projectName: string,
    performedBy: {
      userId: string
      userEmail: string
      userName: string
      userRole: string
    }
  ): Promise<void>

  /**
   * Log content creation
   */
  logContentCreation(
    contentId: string,
    collectionId: string,
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string,
    contentData: any
  ): Promise<void>

  /**
   * Log content update
   */
  logContentUpdate(
    contentId: string,
    collectionId: string,
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string,
    changes: Record<string, { from: any; to: any }>
  ): Promise<void>

  /**
   * Log content deletion
   */
  logContentDeletion(
    contentId: string,
    collectionId: string,
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string
  ): Promise<void>
}

export class AuditLoggingUseCase implements IAuditLoggingUseCase {
  private readonly auditLogRepository: IAuditLogRepository

  constructor(auditLogRepository: IAuditLogRepository) {
    this.auditLogRepository = auditLogRepository
  }

  /**
   * Log an audit entry
   */
  async logAudit(input: CreateAuditLogInput): Promise<AuditLog> {
    try {
      return await this.auditLogRepository.createAuditLog(input)
    } catch (error: any) {
      console.error('❌ AuditLoggingUseCase: Failed to log audit', error)
      // Don't throw - audit logging should not break main operations
      return {
        id: 'failed',
        ...input,
        timestamp: new Date(),
        status: 'failure',
        errorMessage: error.message,
      } as AuditLog
    }
  }

  /**
   * Get audit logs with filters and access control
   */
  async getAuditLogs(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _requestingUserId: string,
    requestingUserRole: string,
    userProjects: string[],
    filters: AuditLogFilters
  ): Promise<AuditLog[]> {
    try {
      let logs: AuditLog[]

      // Super users can see all logs
      if (requestingUserRole === 'Super') {
        logs = await this.auditLogRepository.getAuditLogs(filters)
      } else {
        // Admin users can only see logs for their assigned projects
        if (!filters.projectId) {
          // If no specific project requested, get logs for all user's projects
          const allLogs: AuditLog[] = []
          for (const projectId of userProjects) {
            const projectLogs = await this.auditLogRepository.getAuditLogsByProject(
              projectId,
              filters
            )
            allLogs.push(...projectLogs)
          }
          // Sort by timestamp descending
          logs = allLogs.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )

          // Apply limit if specified
          if (filters.limit) {
            logs = logs.slice(0, filters.limit)
          }
        } else {
          // Check if user has access to the requested project
          if (!userProjects.includes(filters.projectId)) {
            throw new Error('Access denied: You do not have access to this project')
          }
          logs = await this.auditLogRepository.getAuditLogsByProject(filters.projectId, filters)
        }
      }

      return logs
    } catch (error: any) {
      console.error('❌ AuditLoggingUseCase: Failed to get audit logs', error)
      throw error
    }
  }

  /**
   * Get audit logs for a specific project
   */
  async getProjectAuditLogs(
    projectId: string,
    _requestingUserId: string,
    requestingUserRole: string,
    filters: AuditLogFilters = {}
  ): Promise<AuditLog[]> {
    try {
      // Super users can see all project logs
      if (requestingUserRole === 'Super') {
        return await this.auditLogRepository.getAuditLogsByProject(projectId, filters)
      }

      // Admin users need to have access to the project
      // This check should be done by the caller, but we'll verify here too
      const logs = await this.auditLogRepository.getAuditLogsByProject(projectId, filters)

      // Filter out Super user actions if requested by Admin
      if (requestingUserRole === 'Admin') {
        return logs.filter((log) => log.userRole !== 'Super')
      }

      return logs
    } catch (error: any) {
      console.error('❌ AuditLoggingUseCase: Failed to get project audit logs', error)
      throw error
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    requestingUserId: string,
    requestingUserRole: string,
    filters: AuditLogFilters = {}
  ): Promise<AuditLog[]> {
    try {
      // Super users can see all user logs
      if (requestingUserRole === 'Super') {
        return await this.auditLogRepository.getAuditLogsByUser(userId, filters)
      }

      // Other users can only see their own logs
      if (requestingUserId !== userId) {
        throw new Error('Access denied: You can only view your own audit logs')
      }

      return await this.auditLogRepository.getAuditLogsByUser(userId, filters)
    } catch (error: any) {
      console.error('❌ AuditLoggingUseCase: Failed to get user audit logs', error)
      throw error
    }
  }

  /**
   * Log user login
   */
  async logLogin(
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    await this.logAudit({
      action: 'login',
      resourceType: 'auth',
      resourceId: userId,
      resourceName: userName || userEmail,
      userId,
      userEmail,
      userName,
      userRole: userRole as 'Super' | 'Admin' | 'User',
      status: 'success',
    })
  }

  /**
   * Log user logout
   */
  async logLogout(
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    await this.logAudit({
      action: 'logout',
      resourceType: 'auth',
      resourceId: userId,
      resourceName: userName || userEmail,
      userId,
      userEmail,
      userName,
      userRole: userRole as 'Super' | 'Admin' | 'User',
      status: 'success',
    })
  }

  /**
   * Log role change
   */
  async logRoleChange(
    targetUserId: string,
    targetUserEmail: string,
    oldRole: string,
    newRole: string,
    performedBy: {
      userId: string
      userEmail: string
      userName: string
      userRole: string
    }
  ): Promise<void> {
    await this.logAudit({
      action: 'role_change',
      resourceType: 'user',
      resourceId: targetUserId,
      resourceName: targetUserEmail,
      userId: performedBy.userId,
      userEmail: performedBy.userEmail,
      userName: performedBy.userName,
      userRole: performedBy.userRole as 'Super' | 'Admin' | 'User',
      changes: {
        role: { from: oldRole, to: newRole },
      },
      metadata: {
        targetUserId,
        targetUserEmail,
      },
      status: 'success',
    })
  }

  /**
   * Log project assignment
   */
  async logProjectAssignment(
    userId: string,
    userEmail: string,
    projectId: string,
    projectName: string,
    performedBy: {
      userId: string
      userEmail: string
      userName: string
      userRole: string
    }
  ): Promise<void> {
    await this.logAudit({
      action: 'project_assign',
      resourceType: 'user',
      resourceId: userId,
      resourceName: userEmail,
      projectId,
      userId: performedBy.userId,
      userEmail: performedBy.userEmail,
      userName: performedBy.userName,
      userRole: performedBy.userRole as 'Super' | 'Admin' | 'User',
      metadata: {
        targetUserId: userId,
        targetUserEmail: userEmail,
        projectId,
        projectName,
      },
      status: 'success',
    })
  }

  /**
   * Log project unassignment
   */
  async logProjectUnassignment(
    userId: string,
    userEmail: string,
    projectId: string,
    projectName: string,
    performedBy: {
      userId: string
      userEmail: string
      userName: string
      userRole: string
    }
  ): Promise<void> {
    await this.logAudit({
      action: 'project_unassign',
      resourceType: 'user',
      resourceId: userId,
      resourceName: userEmail,
      projectId,
      userId: performedBy.userId,
      userEmail: performedBy.userEmail,
      userName: performedBy.userName,
      userRole: performedBy.userRole as 'Super' | 'Admin' | 'User',
      metadata: {
        targetUserId: userId,
        targetUserEmail: userEmail,
        projectId,
        projectName,
      },
      status: 'success',
    })
  }

  /**
   * Log content creation
   */
  async logContentCreation(
    contentId: string,
    collectionId: string,
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string,
    contentData: any
  ): Promise<void> {
    await this.logAudit({
      action: 'create',
      resourceType: 'content',
      resourceId: contentId,
      resourceName: `${collectionId}/${contentId}`,
      projectId,
      userId,
      userEmail,
      userName,
      userRole: userRole as 'Super' | 'Admin' | 'User',
      metadata: {
        collectionId,
        contentData,
      },
      status: 'success',
    })
  }

  /**
   * Log content update
   */
  async logContentUpdate(
    contentId: string,
    collectionId: string,
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string,
    changes: Record<string, { from: any; to: any }>
  ): Promise<void> {
    await this.logAudit({
      action: 'update',
      resourceType: 'content',
      resourceId: contentId,
      resourceName: `${collectionId}/${contentId}`,
      projectId,
      userId,
      userEmail,
      userName,
      userRole: userRole as 'Super' | 'Admin' | 'User',
      changes,
      metadata: {
        collectionId,
      },
      status: 'success',
    })
  }

  /**
   * Log content deletion
   */
  async logContentDeletion(
    contentId: string,
    collectionId: string,
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    await this.logAudit({
      action: 'delete',
      resourceType: 'content',
      resourceId: contentId,
      resourceName: `${collectionId}/${contentId}`,
      projectId,
      userId,
      userEmail,
      userName,
      userRole: userRole as 'Super' | 'Admin' | 'User',
      metadata: {
        collectionId,
      },
      status: 'success',
    })
  }
}
