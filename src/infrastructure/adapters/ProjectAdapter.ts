/**
 * Project Adapter
 *
 * Handles conversion between Firebase Firestore data structures and domain entities.
 * This adapter is the ONLY place where Firebase-specific types (Timestamp, DocumentSnapshot)
 * are converted to/from clean domain entities.
 *
 * **Framework Independence:**
 * By isolating Firebase type conversions here, we ensure that:
 * - Domain entities remain database-agnostic
 * - Business logic never touches Firebase types
 * - Database migration becomes straightforward
 */

import type { DocumentData } from 'firebase/firestore'
import type { Project, ProjectMetadata } from '@/domain/entities'

/**
 * Convert Firestore Timestamp to JavaScript Date
 *
 * Handles both Timestamp objects and potential null/undefined values
 */
function timestampToDate(timestamp: any): Date | undefined {
  if (!timestamp) return undefined

  // Check if it's a Firestore Timestamp
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }

  // If it's already a Date
  if (timestamp instanceof Date) {
    return timestamp
  }

  // Fallback
  return undefined
}

/**
 * ProjectAdapter Class
 *
 * Provides static methods for converting between Firebase data and Project entities
 */
export class ProjectAdapter {
  /**
   * Convert Firestore document data to Project domain entity
   *
   * This method performs the critical translation from Firebase-specific types
   * to clean, database-agnostic domain entities.
   *
   * @param docId - The Firestore document ID
   * @param data - The raw Firestore document data
   * @returns Project domain entity
   */
  static toEntity(docId: string, data: DocumentData): Project {
    return {
      projectId: docId,
      name: data.name || '',
      slug: data.slug || docId,
      status: data.status || 'Active',
      description: data.description || '',
      createdBy: data.createdBy || data.created_by,
      owner_id: data.owner_id, // Legacy field
      createdAt: timestampToDate(data.created_at || data.createdAt),
      updatedAt: timestampToDate(data.updated_at || data.updatedAt),
    }
  }

  /**
   * Convert multiple Firestore documents to Project entities
   *
   * @param documents - Array of [docId, data] tuples
   * @returns Array of Project domain entities
   */
  static toEntityList(documents: Array<[string, DocumentData]>): Project[] {
    return documents.map(([docId, data]) => this.toEntity(docId, data))
  }

  /**
   * Convert Project metadata to Firestore update data
   *
   * Prepares data for Firestore updateDoc() calls.
   * Note: This does NOT include serverTimestamp() as that should be added
   * by the repository layer.
   *
   * @param metadata - Project metadata from domain layer
   * @returns Object ready for Firestore update
   */
  static toFirestoreUpdate(metadata: ProjectMetadata): Record<string, any> {
    return {
      name: metadata.name,
      status: metadata.status,
      // Note: updated_at should be added by repository using serverTimestamp()
    }
  }

  /**
   * Convert Project creation data to Firestore document data
   *
   * @param projectName - Project name
   * @param projectSlug - Project slug
   * @param userId - Creating user ID
   * @returns Object ready for Firestore setDoc()
   */
  static toFirestoreCreate(
    projectName: string,
    projectSlug: string,
    userId: string
  ): Record<string, any> {
    return {
      name: projectName,
      slug: projectSlug,
      status: 'Active',
      description: '',
      createdBy: userId,
      // Note: created_at and updated_at should be added by repository using serverTimestamp()
    }
  }
}
