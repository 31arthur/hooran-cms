/**
 * Content Adapter
 *
 * Handles conversion between Firebase Firestore data structures and ContentEntry entities.
 * This adapter is the ONLY place where Firebase-specific types are converted to/from
 * clean domain entities for content.
 *
 * **Framework Independence:**
 * By isolating Firebase type conversions here, we ensure that:
 * - Domain entities remain database-agnostic
 * - Business logic never touches Firebase types
 * - Database migration becomes straightforward
 */

import type { DocumentData } from 'firebase/firestore'
import type {
  ContentEntry,
  CreateContentEntryInput,
  UpdateContentEntryInput,
} from '@/domain/entities'

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date()

  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }

  if (timestamp instanceof Date) {
    return timestamp
  }

  return new Date()
}

/**
 * ContentAdapter Class
 *
 * Provides static methods for converting between Firebase data and ContentEntry entities
 */
export class ContentAdapter {
  /**
   * Convert Firestore document data to ContentEntry domain entity
   *
   * This method performs the critical translation from Firebase-specific types
   * to clean, database-agnostic domain entities.
   *
   * @param docId - The Firestore document ID
   * @param data - The raw Firestore document data
   * @param projectId - Project ID for context
   * @param collectionId - Collection ID for context
   * @returns ContentEntry domain entity
   */
  static toEntity(
    docId: string,
    data: DocumentData,
    projectId: string,
    collectionId: string
  ): ContentEntry {
    return {
      id: docId,
      projectId: projectId,
      collectionId: collectionId,
      data: data.data || {},
      status: data.status || 'draft',
      createdAt: timestampToDate(data.createdAt || data.created_at),
      updatedAt: timestampToDate(data.updatedAt || data.updated_at),
      createdBy: data.createdBy || data.created_by || '',
      updatedBy: data.updatedBy || data.updated_by,
    }
  }

  /**
   * Convert multiple Firestore documents to ContentEntry entities
   *
   * @param documents - Array of [docId, data] tuples
   * @param projectId - Project ID for context
   * @param collectionId - Collection ID for context
   * @returns Array of ContentEntry domain entities
   */
  static toEntityList(
    documents: Array<[string, DocumentData]>,
    projectId: string,
    collectionId: string
  ): ContentEntry[] {
    return documents.map(([docId, data]) =>
      this.toEntity(docId, data, projectId, collectionId)
    )
  }

  /**
   * Convert CreateContentEntryInput to Firestore document data
   *
   * @param input - Create content entry input from domain layer
   * @param projectId - Project ID for multi-tenancy
   * @param collectionId - Collection ID
   * @param userId - Creating user ID
   * @returns Object ready for Firestore addDoc()
   */
  static toFirestoreCreate(
    input: CreateContentEntryInput,
    projectId: string,
    collectionId: string,
    userId: string
  ): Record<string, any> {
    return {
      projectId: projectId, // CRITICAL: Multi-tenancy enforcement
      collectionId: collectionId,
      data: input.data,
      status: input.status || 'draft',
      createdBy: userId,
      // Note: createdAt and updatedAt should be added by repository using serverTimestamp()
    }
  }

  /**
   * Convert UpdateContentEntryInput to Firestore update data
   *
   * @param updates - Update content entry input from domain layer
   * @param userId - Updating user ID
   * @returns Object ready for Firestore updateDoc()
   */
  static toFirestoreUpdate(
    updates: UpdateContentEntryInput,
    userId: string
  ): Record<string, any> {
    const updateData: Record<string, any> = {
      updatedBy: userId,
      // Note: updatedAt should be added by repository using serverTimestamp()
    }

    if (updates.data !== undefined) {
      updateData.data = updates.data
    }

    if (updates.status !== undefined) {
      updateData.status = updates.status
    }

    return updateData
  }
}
