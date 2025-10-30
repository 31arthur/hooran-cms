/**
 * Firebase Audit Repository Implementation
 *
 * Concrete implementation of IAuditRepository using Firebase Firestore.
 * This is the ONLY place where Firebase SDK calls for audit logs should exist.
 *
 * **Clean Architecture - Infrastructure Layer:**
 * - Implements IAuditRepository interface from core layer
 * - Contains ALL Firebase SDK logic for audit operations
 * - Uses AuditAdapter to convert Firebase types to domain entities
 * - Maintains framework independence by keeping Firebase isolated
 *
 * **Firestore Collection Structure:**
 * ```
 * audit_logs/{logId}
 * ```
 *
 * **IMPORTANT:** Audit logs are stored in a TOP-LEVEL collection (not project subcollection).
 * However, they MUST include `projectId` field for multi-tenancy filtering.
 * This matches the existing AuditService implementation.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type {
  IAuditRepository,
  AuditLogEntry,
  CreateAuditLogInput,
  AuditLogQueryOptions,
} from '@/domain/repositories'
import type { AuditAction, AuditResourceType } from '@/domain/repositories/IAuditRepository'
import { AuditAdapter } from '../adapters/AuditAdapter'

/**
 * FirebaseAuditRepository
 *
 * Handles all audit log operations with Firestore
 */
export class FirebaseAuditRepository implements IAuditRepository {
  /**
   * Log an action to the audit trail
   *
   * Creates a new audit log entry in the TOP-LEVEL audit_logs collection.
   * The projectId is stored as a field in the document for filtering.
   *
   * @param input - The audit log data to create
   * @returns Promise<string> - The created audit log ID
   */
  async logAction(input: CreateAuditLogInput): Promise<string> {
    try {
      // Validate projectId (MANDATORY for multi-tenancy)
      if (!input.projectId || typeof input.projectId !== 'string' || input.projectId.trim() === '') {
        throw new Error('Invalid audit log: projectId is required (Auditing Consistency)')
      }

      // Convert domain entity to Firestore document
      const auditData = AuditAdapter.toFirestore(input)

      // Add to TOP-LEVEL Firestore collection (not project subcollection)
      const auditLogsRef = collection(db, 'audit_logs')
      const docRef = await addDoc(auditLogsRef, auditData)

      console.log(`✅ FirebaseAuditRepository: Action logged successfully (ID: ${docRef.id})`)
      return docRef.id
    } catch (error) {
      console.error('❌ FirebaseAuditRepository: Failed to log audit action', error)
      // Don't throw - audit logging failures should not break application flow
      console.error('AUDIT LOG FAILURE:', {
        input,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return '' // Return empty string on failure
    }
  }

  /**
   * Get audit logs with filtering and pagination
   *
   * @param options - Query options for filtering logs
   * @returns Promise<AuditLogEntry[]> - Array of audit log entries
   */
  async getAuditLogs(options: AuditLogQueryOptions): Promise<AuditLogEntry[]> {
    try {
      // Use TOP-LEVEL collection
      const auditLogsRef = collection(db, 'audit_logs')
      const constraints: QueryConstraint[] = []

      // Filter by project (MANDATORY for multi-tenancy when provided)
      if (options.projectId) {
        constraints.push(where('projectId', '==', options.projectId))
      }

      // Filter by user
      if (options.userId) {
        constraints.push(where('userId', '==', options.userId))
      }

      // Filter by action
      if (options.action) {
        constraints.push(where('action', '==', options.action))
      }

      // Filter by resource type
      if (options.resourceType) {
        constraints.push(where('resourceType', '==', options.resourceType))
      }

      // Filter by resource ID
      if (options.resourceId) {
        constraints.push(where('resourceId', '==', options.resourceId))
      }

      // Filter by date range
      if (options.startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(options.startDate)))
      }

      if (options.endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(options.endDate)))
      }

      // Order by timestamp (newest first by default)
      constraints.push(orderBy('timestamp', 'desc'))

      // Limit results
      if (options.limit) {
        constraints.push(limit(options.limit))
      }

      // Execute query
      const q = query(auditLogsRef, ...constraints)
      const querySnapshot = await getDocs(q)

      // Convert to domain entities
      const logs: AuditLogEntry[] = []
      querySnapshot.forEach((docSnap) => {
        const log = AuditAdapter.toEntity(docSnap.id, docSnap.data())
        logs.push(log)
      })

      return logs
    } catch (error) {
      console.error('Failed to get audit logs:', error)
      throw new Error(`Failed to get audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get audit trail for a specific resource
   *
   * Returns all audit logs for a specific resource in chronological order
   *
   * @param projectId - The project ID
   * @param resourceType - The type of resource
   * @param resourceId - The resource ID
   * @returns Promise<AuditLogEntry[]> - Chronological audit trail
   */
  async getResourceAuditTrail(
    projectId: string,
    resourceType: AuditResourceType,
    resourceId: string
  ): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      projectId,
      resourceType,
      resourceId,
    })
  }

  /**
   * Get user's recent activity
   *
   * Returns recent actions by a specific user
   *
   * @param projectId - The project ID
   * @param userId - The user ID
   * @param limitCount - Maximum number of entries to return
   * @returns Promise<AuditLogEntry[]> - Recent user activity
   */
  async getUserActivity(
    projectId: string,
    userId: string,
    limitCount: number = 50
  ): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      projectId,
      userId,
      limit: limitCount,
    })
  }

  /**
   * Get logs for specific action type
   *
   * Returns all logs for a specific action (CREATE, UPDATE, DELETE, etc.)
   *
   * @param projectId - The project ID
   * @param action - The action type
   * @param limitCount - Maximum number of entries to return
   * @returns Promise<AuditLogEntry[]> - Logs for the action
   */
  async getActionLogs(
    projectId: string,
    action: AuditAction,
    limitCount: number = 100
  ): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      projectId,
      action,
      limit: limitCount,
    })
  }

  /**
   * Get recent audit logs
   *
   * Returns the most recent audit logs for a project
   *
   * @param projectId - The project ID
   * @param limitCount - Maximum number of entries to return
   * @returns Promise<AuditLogEntry[]> - Recent logs
   */
  async getRecentLogs(projectId: string, limitCount: number = 50): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      projectId,
      limit: limitCount,
    })
  }

  /**
   * Get logs within date range
   *
   * Returns audit logs between two dates
   *
   * @param projectId - The project ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @returns Promise<AuditLogEntry[]> - Logs in date range
   */
  async getLogsByDateRange(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      projectId,
      startDate,
      endDate,
    })
  }

  /**
   * Search audit logs
   *
   * Search logs by action, resource type, or user
   *
   * @param projectId - The project ID
   * @param searchParams - Search parameters
   * @returns Promise<AuditLogEntry[]> - Matching logs
   */
  async searchLogs(
    projectId: string,
    searchParams: {
      userId?: string
      action?: AuditAction
      resourceType?: AuditResourceType
      startDate?: Date
      endDate?: Date
    }
  ): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      projectId,
      ...searchParams,
    })
  }

  /**
   * Count audit logs
   *
   * Returns the count of audit logs matching the criteria
   * Note: This is a simplified implementation. For production, consider using
   * Firestore count() queries (requires specific indexes) or aggregation queries.
   *
   * @param options - Query options for filtering
   * @returns Promise<number> - Count of matching logs
   */
  async countLogs(options: AuditLogQueryOptions): Promise<number> {
    try {
      const logs = await this.getAuditLogs({ ...options, limit: undefined })
      return logs.length
    } catch (error) {
      console.error('Failed to count audit logs:', error)
      return 0
    }
  }

  /**
   * Get recent audit logs for a project (required by IAuditRepository)
   *
   * @param projectId - The project ID
   * @param limitCount - Maximum number of entries to return
   * @returns Promise<AuditLogEntry[]> - Recent audit logs
   */
  async getRecentAuditLogs(projectId: string, limitCount = 50): Promise<AuditLogEntry[]> {
    return this.getRecentLogs(projectId, limitCount)
  }

  /**
   * Get audit logs for a specific user (required by IAuditRepository)
   *
   * @param userId - The user ID
   * @param projectId - Optional project ID to scope results
   * @param limitCount - Maximum number of entries to return
   * @returns Promise<AuditLogEntry[]> - User's audit logs
   */
  async getUserAuditLogs(
    userId: string,
    projectId?: string,
    limitCount?: number
  ): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      userId,
      projectId,
      limit: limitCount,
    })
  }

  /**
   * Delete old audit logs (required by IAuditRepository)
   *
   * @param beforeDate - Delete entries before this date
   * @param projectId - Optional project ID to scope deletion
   * @returns Promise<number> - Number of deleted entries
   */
  async deleteOldAuditLogs(_beforeDate: Date, _projectId?: string): Promise<number> {
    console.warn('deleteOldAuditLogs not implemented - skipping for now')
    return 0
  }

  /**
   * Count audit logs matching criteria (required by IAuditRepository)
   *
   * @param options - Query options for filtering
   * @returns Promise<number> - Total count of matching entries
   */
  async countAuditLogs(options: AuditLogQueryOptions): Promise<number> {
    return this.countLogs(options)
  }

  /**
   * Get audit logs for a specific project (required by IAuditRepository)
   *
   * @param projectId - The project ID
   * @param limitCount - Maximum number of entries to return
   * @returns Promise<AuditLogEntry[]> - Array of audit log entries
   */
  async getAuditLogsForProject(projectId: string, limitCount?: number): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      projectId,
      limit: limitCount,
    })
  }

  /**
   * Get audit logs for a specific resource (required by IAuditRepository)
   *
   * @param projectId - The project ID
   * @param resourceId - The resource ID
   * @param resourceType - Optional resource type filter
   * @returns Promise<AuditLogEntry[]> - Array of audit log entries
   */
  async getAuditLogsForResource(
    projectId: string,
    resourceId: string,
    resourceType?: AuditResourceType
  ): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      projectId,
      resourceId,
      resourceType,
    })
  }
}
