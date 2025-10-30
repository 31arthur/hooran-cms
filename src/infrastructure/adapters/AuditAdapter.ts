/**
 * Audit Entity Adapter
 *
 * Converts between Firebase Firestore document data and clean AuditLogEntry domain entities.
 *
 * **Architectural Boundary:**
 * This adapter is the ONLY place where Firebase Timestamp types are converted to native Date types
 * for audit log entries. This maintains framework independence in the domain layer.
 */

import type { DocumentData } from 'firebase/firestore'
import type { AuditLogEntry } from '@/domain/repositories'

/**
 * Convert Firebase Firestore Timestamp to JavaScript Date
 *
 * Handles various timestamp formats from Firestore
 */
function timestampToDate(timestamp: any): Date {
  if (!timestamp) {
    return new Date()
  }

  // Firebase Timestamp object with toDate() method
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }

  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp
  }

  // Timestamp in milliseconds (number)
  if (typeof timestamp === 'number') {
    return new Date(timestamp)
  }

  // ISO string
  if (typeof timestamp === 'string') {
    return new Date(timestamp)
  }

  // Firestore server timestamp (seconds + nanoseconds)
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000)
  }

  // Fallback to current date
  console.warn('Unknown timestamp format:', timestamp)
  return new Date()
}

/**
 * AuditAdapter
 *
 * Handles conversion between Firebase documents and AuditLogEntry entities
 */
export class AuditAdapter {
  /**
   * Convert Firestore document to AuditLogEntry entity
   *
   * @param docId - The document ID from Firestore
   * @param data - The document data from Firestore
   * @returns Clean AuditLogEntry entity with native Date types
   */
  static toEntity(docId: string, data: DocumentData): AuditLogEntry {
    return {
      id: docId,
      projectId: data.projectId || '',
      userId: data.userId || '',
      action: data.action || 'UPDATE',
      resourceType: data.resourceType || 'CONTENT',
      resourceId: data.resourceId || '',
      details: data.details || {},
      timestamp: timestampToDate(data.timestamp || data.created_at || data.createdAt),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    }
  }

  /**
   * Convert AuditLogEntry entity to Firestore document data
   *
   * @param entry - The AuditLogEntry entity
   * @returns Document data ready for Firestore
   *
   * **IMPORTANT:** Uses camelCase field names (projectId, not project_id)
   * to match the existing AuditService implementation.
   */
  static toFirestore(entry: Omit<AuditLogEntry, 'id'>): DocumentData {
    const data: DocumentData = {
      projectId: entry.projectId,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details || {},
      timestamp: entry.timestamp,
    }

    // Only add optional fields if they have values (Firestore doesn't support undefined)
    if (entry.ipAddress !== undefined && entry.ipAddress !== null) {
      data.ipAddress = entry.ipAddress
    }
    if (entry.userAgent !== undefined && entry.userAgent !== null) {
      data.userAgent = entry.userAgent
    }

    return data
  }

  /**
   * Convert array of Firestore documents to AuditLogEntry entities
   *
   * @param docs - Array of [docId, data] tuples
   * @returns Array of clean AuditLogEntry entities
   */
  static toEntityArray(docs: Array<[string, DocumentData]>): AuditLogEntry[] {
    return docs.map(([docId, data]) => AuditAdapter.toEntity(docId, data))
  }
}
