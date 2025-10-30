/**
 * Firebase Audit Log Repository Implementation
 *
 * Implements IAuditLogRepository using Firebase Firestore.
 * Stores audit logs in the 'audit_logs' collection.
 *
 * **Collection Structure:**
 * audit_logs/
 *   {auditLogId}/
 *     - action: string
 *     - resourceType: string
 *     - resourceId: string
 *     - projectId: string (optional, indexed)
 *     - userId: string (indexed)
 *     - userRole: string (indexed)
 *     - timestamp: Timestamp (indexed)
 *     - ... other fields
 *
 * **Indexes Required:**
 * - projectId + timestamp (desc)
 * - userId + timestamp (desc)
 * - resourceType + resourceId + timestamp (desc)
 * - projectId + userId + timestamp (desc)
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  type QueryConstraint,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository'
import type { AuditLog, CreateAuditLogInput, AuditLogFilters } from '@/domain/entities/AuditLog'

export class FirebaseAuditLogRepository implements IAuditLogRepository {
  private readonly collectionName = 'audit_logs'

  /**
   * Create a new audit log entry
   */
  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
    try {
      const auditLogsRef = collection(db, this.collectionName)
      const newAuditLogRef = doc(auditLogsRef)

      const now = new Date()
      const auditLogData = {
        id: newAuditLogRef.id,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        resourceName: input.resourceName || null,
        projectId: input.projectId || null,
        userId: input.userId,
        userEmail: input.userEmail,
        userName: input.userName || null,
        userRole: input.userRole,
        timestamp: Timestamp.fromDate(now),
        changes: input.changes || null,
        metadata: input.metadata || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        status: input.status || 'success',
        errorMessage: input.errorMessage || null,
      }

      await setDoc(newAuditLogRef, auditLogData)

      console.log(`✅ FirebaseAuditLogRepository: Created audit log ${newAuditLogRef.id}`)

      return this.convertToAuditLog(auditLogData)
    } catch (error: any) {
      console.error('❌ FirebaseAuditLogRepository: Failed to create audit log', error)
      throw new Error(`Failed to create audit log: ${error.message}`)
    }
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: AuditLogFilters): Promise<AuditLog[]> {
    try {
      const constraints: QueryConstraint[] = []

      // Apply filters
      if (filters.projectId) {
        constraints.push(where('projectId', '==', filters.projectId))
      }

      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId))
      }

      if (filters.action) {
        constraints.push(where('action', '==', filters.action))
      }

      if (filters.resourceType) {
        constraints.push(where('resourceType', '==', filters.resourceType))
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status))
      }

      // Time range filtering
      const { startDate, endDate } = this.getDateRange(filters)

      if (startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)))
      }

      if (endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)))
      }

      // Order by timestamp (descending - newest first)
      constraints.push(orderBy('timestamp', 'desc'))

      // Limit
      if (filters.limit) {
        constraints.push(firestoreLimit(filters.limit))
      }

      const auditLogsRef = collection(db, this.collectionName)
      const q = query(auditLogsRef, ...constraints)
      const snapshot = await getDocs(q)

      const auditLogs = snapshot.docs.map((doc) => this.convertToAuditLog(doc.data()))

      console.log(`✅ FirebaseAuditLogRepository: Retrieved ${auditLogs.length} audit logs`)

      return auditLogs
    } catch (error: any) {
      console.error('❌ FirebaseAuditLogRepository: Failed to get audit logs', error)
      throw new Error(`Failed to get audit logs: ${error.message}`)
    }
  }

  /**
   * Get audit logs for a specific project
   */
  async getAuditLogsByProject(
    projectId: string,
    filters: AuditLogFilters = {}
  ): Promise<AuditLog[]> {
    return this.getAuditLogs({ ...filters, projectId })
  }

  /**
   * Get audit logs for a specific user
   */
  async getAuditLogsByUser(userId: string, filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    return this.getAuditLogs({ ...filters, userId })
  }

  /**
   * Get audit logs for a specific resource
   */
  async getAuditLogsByResource(
    resourceType: string,
    resourceId: string,
    filters: AuditLogFilters = {}
  ): Promise<AuditLog[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
      ]

      // Apply additional filters
      const { startDate, endDate } = this.getDateRange(filters)

      if (startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)))
      }

      if (endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)))
      }

      if (filters.limit) {
        constraints.push(firestoreLimit(filters.limit))
      }

      const auditLogsRef = collection(db, this.collectionName)
      const q = query(auditLogsRef, ...constraints)
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => this.convertToAuditLog(doc.data()))
    } catch (error: any) {
      console.error('❌ FirebaseAuditLogRepository: Failed to get audit logs by resource', error)
      throw new Error(`Failed to get audit logs by resource: ${error.message}`)
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    try {
      const auditLogRef = doc(db, this.collectionName, id)
      const snapshot = await getDoc(auditLogRef)

      if (!snapshot.exists()) {
        return null
      }

      return this.convertToAuditLog(snapshot.data())
    } catch (error: any) {
      console.error('❌ FirebaseAuditLogRepository: Failed to get audit log by ID', error)
      throw new Error(`Failed to get audit log by ID: ${error.message}`)
    }
  }

  /**
   * Delete audit logs older than specified date
   */
  async deleteAuditLogsBefore(beforeDate: Date): Promise<number> {
    try {
      const auditLogsRef = collection(db, this.collectionName)
      const q = query(
        auditLogsRef,
        where('timestamp', '<', Timestamp.fromDate(beforeDate)),
        firestoreLimit(500) // Batch delete limit
      )

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        return 0
      }

      const batch = writeBatch(db)
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      await batch.commit()

      console.log(`✅ FirebaseAuditLogRepository: Deleted ${snapshot.size} audit logs`)

      return snapshot.size
    } catch (error: any) {
      console.error('❌ FirebaseAuditLogRepository: Failed to delete audit logs', error)
      throw new Error(`Failed to delete audit logs: ${error.message}`)
    }
  }

  /**
   * Get count of audit logs matching filters
   */
  async countAuditLogs(filters: AuditLogFilters): Promise<number> {
    try {
      const logs = await this.getAuditLogs(filters)
      return logs.length
    } catch (error: any) {
      console.error('❌ FirebaseAuditLogRepository: Failed to count audit logs', error)
      throw new Error(`Failed to count audit logs: ${error.message}`)
    }
  }

  /**
   * Convert Firestore data to AuditLog entity
   */
  private convertToAuditLog(data: any): AuditLog {
    return {
      id: data.id,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      resourceName: data.resourceName || undefined,
      projectId: data.projectId || undefined,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName || undefined,
      userRole: data.userRole,
      timestamp: data.timestamp?.toDate() || new Date(),
      changes: data.changes || undefined,
      metadata: data.metadata || undefined,
      ipAddress: data.ipAddress || undefined,
      userAgent: data.userAgent || undefined,
      status: data.status || 'success',
      errorMessage: data.errorMessage || undefined,
    }
  }

  /**
   * Get date range from filters
   */
  private getDateRange(filters: AuditLogFilters): { startDate?: Date; endDate?: Date } {
    const now = new Date()

    // If timeRange is specified, calculate dates
    if (filters.timeRange) {
      let startDate: Date

      switch (filters.timeRange) {
        case '30m':
          startDate = new Date(now.getTime() - 30 * 60 * 1000)
          break
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      return { startDate, endDate: now }
    }

    // Use explicit dates if provided
    return {
      startDate: filters.startDate,
      endDate: filters.endDate,
    }
  }
}
