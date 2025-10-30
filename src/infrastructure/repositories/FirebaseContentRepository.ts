/**
 * Firebase Content Repository
 *
 * Concrete implementation of IContentRepository using Firebase Firestore.
 * This is the ONLY place in the application where Content-related Firebase SDK calls occur.
 *
 * **CRITICAL: Framework Independence**
 * This class:
 * - Implements IContentRepository interface
 * - Contains ALL Firebase-specific code for content
 * - Converts Firebase types to domain entities using ContentAdapter
 * - Handles Firebase-specific errors
 * - Is completely replaceable without affecting business logic
 *
 * **Firestore Structure:**
 * projects/{projectId}/data/{collectionId}/entries/{entryId}
 *   - projectId: string (multi-tenancy enforcement)
 *   - collectionId: string (table/collection name)
 *   - data: Record<string, any> (schema-defined fields)
 *   - status: 'draft' | 'published' | 'archived'
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 *   - createdBy: string
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { IContentRepository } from '@/domain/repositories'
import type {
  ContentEntry,
  CreateContentEntryInput,
  UpdateContentEntryInput,
  GetContentEntriesOptions,
} from '@/domain/entities'
import { ContentAdapter } from '@/infrastructure/adapters/ContentAdapter'
import { AuditService } from '@/services'

/**
 * FirebaseContentRepository
 *
 * Implements the IContentRepository interface using Firebase Firestore as the data store.
 */
export class FirebaseContentRepository implements IContentRepository {
  /**
   * Get content entries for a collection
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param options - Query options (limit, search, filters)
   * @returns Promise<ContentEntry[]> - Array of content entries
   * @throws Error if Firestore query fails
   */
  async getContentEntries(
    projectId: string,
    collectionId: string,
    options: GetContentEntriesOptions
  ): Promise<ContentEntry[]> {
    try {
      console.log(`📋 FirebaseContentRepository: Fetching content for ${collectionId}`)

      // Validate input
      if (!projectId || !collectionId) {
        throw new Error('Invalid input: projectId and collectionId are required')
      }

      const { limit = 50, search, filterField, filterValue } = options

      // Get project-scoped collection reference
      // Path: projects/{projectId}/data/{collectionId}/entries
      const projectDocRef = doc(db, 'projects', projectId)
      const collectionDocRef = doc(projectDocRef, 'data', collectionId)
      const dataCollectionRef = collection(collectionDocRef, 'entries')

      // Build query constraints
      const constraints: any[] = []

      // Add filter constraint
      if (filterField && filterValue !== undefined && filterValue !== null && filterValue !== '') {
        constraints.push(where(filterField, '==', filterValue))
      }

      // Add search constraint (prefix matching on data.title)
      if (search && search.trim() !== '') {
        const searchTerm = search.trim()
        constraints.push(where('data.title', '>=', searchTerm))
        constraints.push(where('data.title', '<=', searchTerm + '\uf8ff'))
        constraints.push(orderBy('data.title', 'asc'))
      } else {
        constraints.push(orderBy('createdAt', 'desc'))
      }

      // Add limit
      constraints.push(firestoreLimit(limit))

      // Execute query
      const contentQuery = query(dataCollectionRef, ...constraints)
      const querySnapshot = await getDocs(contentQuery)

      // Convert to domain entities using adapter
      const entries: ContentEntry[] = []
      querySnapshot.forEach((docSnap) => {
        const entry = ContentAdapter.toEntity(docSnap.id, docSnap.data(), projectId, collectionId)
        entries.push(entry)
      })

      console.log(`✅ FirebaseContentRepository: Fetched ${entries.length} entries`)
      return entries
    } catch (error) {
      console.error('❌ FirebaseContentRepository: Error fetching content entries:', error)
      throw new Error(
        `Failed to fetch content entries: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get a single content entry by ID
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param entryId - The entry ID
   * @returns Promise<ContentEntry | null> - The content entry or null if not found
   * @throws Error if Firestore read fails
   */
  async getContentEntryById(
    projectId: string,
    collectionId: string,
    entryId: string
  ): Promise<ContentEntry | null> {
    try {
      console.log(`📋 FirebaseContentRepository: Fetching entry ${entryId}`)

      // Validate input
      if (!projectId || !collectionId || !entryId) {
        throw new Error('Invalid input: projectId, collectionId, and entryId are required')
      }

      // Get document reference with proper path structure
      // Path: projects/{projectId}/data/{collectionId}/entries/{entryId}
      const projectDocRef = doc(db, 'projects', projectId)
      const collectionDocRef = doc(projectDocRef, 'data', collectionId)
      const entriesCollectionRef = collection(collectionDocRef, 'entries')
      const entryDocRef = doc(entriesCollectionRef, entryId)

      // Fetch document
      const docSnap = await getDoc(entryDocRef)

      if (!docSnap.exists()) {
        console.log(`⚠️ FirebaseContentRepository: Entry ${entryId} not found`)
        return null
      }

      // Convert to domain entity using adapter
      const entry = ContentAdapter.toEntity(docSnap.id, docSnap.data(), projectId, collectionId)
      console.log(`✅ FirebaseContentRepository: Fetched entry ${entryId}`)
      return entry
    } catch (error) {
      console.error(`❌ FirebaseContentRepository: Error fetching entry ${entryId}:`, error)
      throw new Error(
        `Failed to fetch entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Create a new content entry
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param entryData - The content entry data
   * @param userId - The user ID creating the entry
   * @returns Promise<string> - The created entry ID
   * @throws Error if validation fails or creation fails
   */
  async createContentEntry(
    projectId: string,
    collectionId: string,
    entryData: CreateContentEntryInput,
    userId: string
  ): Promise<string> {
    try {
      console.log(`💾 FirebaseContentRepository: Creating entry in ${collectionId}`)

      // Validate input
      if (!projectId || !collectionId || !entryData || !userId) {
        throw new Error('Invalid input: all parameters are required')
      }

      if (!entryData.data || typeof entryData.data !== 'object') {
        throw new Error('Invalid entry data: The "data" field is required and must be an object')
      }

      // Get project-scoped collection reference
      // Path: projects/{projectId}/data/{collectionId}/entries
      const projectDocRef = doc(db, 'projects', projectId)
      const collectionDocRef = doc(projectDocRef, 'data', collectionId)
      const dataCollectionRef = collection(collectionDocRef, 'entries')

      // Prepare entry document using adapter
      const entryDocument = {
        ...ContentAdapter.toFirestoreCreate(entryData, projectId, collectionId, userId),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Create document
      const docRef = await addDoc(dataCollectionRef, entryDocument)
      const contentId = docRef.id
      console.log(`✅ FirebaseContentRepository: Entry created with ID: ${contentId}`)

      // Audit logging
      try {
        await AuditService.logAction({
          projectId,
          userId,
          action: 'CREATE',
          resourceType: 'CONTENT',
          resourceId: contentId,
          details: {
            collectionId,
            status: entryData.status || 'draft',
            dataPreview: Object.keys(entryData.data).length > 0
              ? `Fields: ${Object.keys(entryData.data).join(', ')}`
              : 'No fields',
          },
          timestamp: new Date(),
        })
        console.log('✅ FirebaseContentRepository: Audit log created')
      } catch (auditError) {
        console.error('❌ FirebaseContentRepository: Audit logging failed:', auditError)
      }

      return contentId
    } catch (error) {
      console.error('❌ FirebaseContentRepository: Error creating entry:', error)
      throw new Error(
        `Failed to create content entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Update an existing content entry
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param entryId - The entry ID to update
   * @param updates - The fields to update
   * @param userId - The user ID performing the update
   * @returns Promise<void>
   * @throws Error if entry not found or update fails
   */
  async updateContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    updates: UpdateContentEntryInput,
    userId: string
  ): Promise<void> {
    try {
      console.log(`💾 FirebaseContentRepository: Updating entry ${entryId}`)

      // Validate input
      if (!projectId || !collectionId || !entryId || !userId) {
        throw new Error('Invalid input: all parameters are required')
      }

      // Fetch existing entry to track changes
      const existingEntry = await this.getContentEntryById(projectId, collectionId, entryId)
      if (!existingEntry) {
        throw new Error(`Entry "${entryId}" not found in collection "${collectionId}"`)
      }

      // Track field changes for audit
      const fieldChanges: string[] = []
      const changeDetails: Record<string, any> = {}

      if (updates.data) {
        Object.keys(updates.data).forEach((key) => {
          const oldValue = existingEntry.data?.[key]
          const newValue = updates.data![key]
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            fieldChanges.push(key)
            changeDetails[key] = { old: oldValue, new: newValue }
          }
        })
      }

      if (updates.status && updates.status !== existingEntry.status) {
        fieldChanges.push('status')
        changeDetails.status = { old: existingEntry.status, new: updates.status }
      }

      // Prepare update data using adapter
      const updateData = {
        ...ContentAdapter.toFirestoreUpdate(updates, userId),
        updatedAt: serverTimestamp(),
      }

      // Update Firestore with proper path structure
      // Path: projects/{projectId}/data/{collectionId}/entries/{entryId}
      const projectDocRef = doc(db, 'projects', projectId)
      const collectionDocRef = doc(projectDocRef, 'data', collectionId)
      const entriesCollectionRef = collection(collectionDocRef, 'entries')
      const entryDocRef = doc(entriesCollectionRef, entryId)
      await updateDoc(entryDocRef, updateData)
      console.log(`✅ FirebaseContentRepository: Entry ${entryId} updated`)

      // Audit logging
      try {
        await AuditService.logAction({
          projectId,
          userId,
          action: 'UPDATE',
          resourceType: 'CONTENT',
          resourceId: entryId,
          details: {
            collectionId,
            field_changes: fieldChanges,
            changes: changeDetails,
            change_summary: fieldChanges.length > 0
              ? `Updated ${fieldChanges.length} field(s): ${fieldChanges.join(', ')}`
              : 'No field changes detected',
          },
          timestamp: new Date(),
        })
        console.log('✅ FirebaseContentRepository: Audit log created')
      } catch (auditError) {
        console.error('❌ FirebaseContentRepository: Audit logging failed:', auditError)
      }
    } catch (error) {
      console.error(`❌ FirebaseContentRepository: Error updating entry ${entryId}:`, error)
      throw new Error(
        `Failed to update entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Delete a content entry
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param entryId - The entry ID to delete
   * @param userId - The user ID performing the deletion
   * @returns Promise<void>
   * @throws Error if entry not found or deletion fails
   */
  async deleteContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string
  ): Promise<void> {
    try {
      console.log(`🗑️ FirebaseContentRepository: Deleting entry ${entryId}`)

      // Validate input
      if (!projectId || !collectionId || !entryId || !userId) {
        throw new Error('Invalid input: all parameters are required')
      }

      // Fetch existing entry to capture details for audit log
      const existingEntry = await this.getContentEntryById(projectId, collectionId, entryId)
      if (!existingEntry) {
        throw new Error(`Entry "${entryId}" not found in collection "${collectionId}"`)
      }

      // Extract entry name for audit log
      const entryName =
        existingEntry.data?.title ||
        existingEntry.data?.name ||
        existingEntry.data?.label ||
        `Entry ${entryId.substring(0, 8)}`

      // Delete from Firestore with proper path structure
      // Path: projects/{projectId}/data/{collectionId}/entries/{entryId}
      const projectDocRef = doc(db, 'projects', projectId)
      const collectionDocRef = doc(projectDocRef, 'data', collectionId)
      const entriesCollectionRef = collection(collectionDocRef, 'entries')
      const entryDocRef = doc(entriesCollectionRef, entryId)
      await deleteDoc(entryDocRef)
      console.log(`✅ FirebaseContentRepository: Entry ${entryId} deleted`)

      // Audit logging
      try {
        await AuditService.logAction({
          projectId,
          userId,
          action: 'DELETE',
          resourceType: 'CONTENT',
          resourceId: entryId,
          details: {
            collection: collectionId,
            entry_name: entryName,
            entry_status: existingEntry.status || 'unknown',
            field_count: Object.keys(existingEntry.data || {}).length,
            deleted_data: existingEntry.data,
          },
          timestamp: new Date(),
        })
        console.log('✅ FirebaseContentRepository: Audit log created')
      } catch (auditError) {
        console.error('❌ FirebaseContentRepository: Audit logging failed:', auditError)
      }
    } catch (error) {
      console.error(`❌ FirebaseContentRepository: Error deleting entry ${entryId}:`, error)
      throw new Error(
        `Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Batch update content status
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param contentIds - Array of content entry IDs to update
   * @param status - The new status
   * @param userId - The user ID performing the update
   * @returns Promise<void>
   * @throws Error if any update fails
   */
  async batchUpdateContentStatus(
    projectId: string,
    collectionId: string,
    contentIds: string[],
    status: 'published' | 'draft',
    userId: string
  ): Promise<void> {
    try {
      console.log(`💾 FirebaseContentRepository: Batch updating ${contentIds.length} entries`)

      // Validate input
      if (!projectId || !collectionId || !userId) {
        throw new Error('Invalid input: projectId, collectionId, and userId are required')
      }

      if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
        throw new Error('contentIds must be a non-empty array')
      }

      if (status !== 'published' && status !== 'draft') {
        throw new Error('status must be either "published" or "draft"')
      }

      // Process each entry sequentially
      const results: Array<{ id: string; success: boolean; error?: string }> = []

      for (const entryId of contentIds) {
        try {
          // Fetch existing entry
          const existingEntry = await this.getContentEntryById(projectId, collectionId, entryId)
          if (!existingEntry) {
            console.warn(`⚠️ Entry "${entryId}" not found, skipping`)
            results.push({ id: entryId, success: false, error: 'Entry not found' })
            continue
          }

          // Skip if status is already the same
          if (existingEntry.status === status) {
            console.log(`⚠️ Entry ${entryId} already has status "${status}", skipping`)
            results.push({ id: entryId, success: true })
            continue
          }

          const oldStatus = existingEntry.status

          // Update status
          const projectDocRef = doc(db, 'projects', projectId)
          const entryDocRef = doc(projectDocRef, 'data', collectionId, entryId)
          await updateDoc(entryDocRef, {
            status,
            updatedAt: serverTimestamp(),
            updatedBy: userId,
          })

          console.log(`✅ Entry ${entryId} status updated to "${status}"`)

          // Audit logging
          try {
            const entryName =
              existingEntry.data?.title ||
              existingEntry.data?.name ||
              `Entry ${entryId.substring(0, 8)}`

            await AuditService.logAction({
              projectId,
              userId,
              action: 'UPDATE',
              resourceType: 'CONTENT',
              resourceId: entryId,
              details: {
                collection: collectionId,
                entry_name: entryName,
                update_type: 'batch_status_update',
                field_changes: ['status'],
                changes: { status: { old: oldStatus, new: status } },
              },
              timestamp: new Date(),
            })
          } catch (auditError) {
            console.error(`⚠️ Audit logging failed for entry ${entryId}:`, auditError)
          }

          results.push({ id: entryId, success: true })
        } catch (error) {
          console.error(`❌ Failed to update entry ${entryId}:`, error)
          results.push({
            id: entryId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Check if any updates failed
      const failedUpdates = results.filter((r) => !r.success)
      if (failedUpdates.length > 0) {
        throw new Error(
          `Batch update partially failed: ${failedUpdates.length} of ${contentIds.length} entries failed`
        )
      }

      console.log(`✅ FirebaseContentRepository: Successfully batch updated ${results.length} entries`)
    } catch (error) {
      console.error('❌ FirebaseContentRepository: Batch update failed:', error)
      throw new Error(
        `Failed to batch update content status: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get published content by collection (PUBLIC API)
   *
   * Retrieves ONLY published content entries from a specific collection.
   * This method is designed for unauthenticated public access.
   *
   * **Security:**
   * - Returns ONLY entries with status: 'published'
   * - No authentication required
   * - Project-scoped for multi-tenancy
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param limit - Maximum number of entries to return (default: 50)
   * @returns Promise<ContentEntry[]> - Array of published content entries
   */
  async getPublishedContentByCollection(
    projectId: string,
    collectionId: string,
    limit: number = 50
  ): Promise<ContentEntry[]> {
    // Validate inputs
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      throw new Error('Invalid project ID: Project ID is required for public API operations')
    }

    if (!collectionId || typeof collectionId !== 'string' || collectionId.trim() === '') {
      throw new Error('Invalid collection ID: Collection ID is required')
    }

    try {
      console.log('📊 FirebaseContentRepository: Fetching published content', {
        projectId,
        collectionId,
        limit,
      })

      // Reference to collection
      const projectDocRef = doc(db, 'projects', projectId)
      const dataCollectionRef = collection(projectDocRef, 'data', collectionId, 'entries')

      // Query ONLY published entries
      const publishedQuery = query(
        dataCollectionRef,
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      )

      const querySnapshot = await getDocs(publishedQuery)

      // Convert to domain entities
      const entries: ContentEntry[] = []
      querySnapshot.forEach((docSnap) => {
        const entry = ContentAdapter.toEntity(docSnap.id, docSnap.data(), projectId, collectionId)
        entries.push(entry)
      })

      console.log(`✅ FirebaseContentRepository: Fetched ${entries.length} published entries`)
      return entries
    } catch (error) {
      console.error('❌ FirebaseContentRepository: Failed to fetch published content', error)
      throw new Error(
        `Failed to fetch published content: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Count content entries in a collection
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param status - Optional status filter
   * @returns Promise<number> - Total count of entries
   */
  async countContentEntries(
    projectId: string,
    collectionId: string,
    status?: 'draft' | 'published' | 'archived'
  ): Promise<number> {
    try {
      console.log(`📊 FirebaseContentRepository: Counting entries in ${collectionId}`)

      // Get project-scoped collection reference
      // Path: projects/{projectId}/data/{collectionId}/entries
      const projectDocRef = doc(db, 'projects', projectId)
      const collectionDocRef = doc(projectDocRef, 'data', collectionId)
      const dataCollectionRef = collection(collectionDocRef, 'entries')

      // Build query constraints
      const constraints: any[] = []

      // Add status filter if provided
      if (status) {
        constraints.push(where('status', '==', status))
      }

      // Execute query
      const contentQuery = query(dataCollectionRef, ...constraints)
      const querySnapshot = await getDocs(contentQuery)

      const count = querySnapshot.size
      console.log(`✅ FirebaseContentRepository: Counted ${count} entries`)
      return count
    } catch (error) {
      console.error('❌ FirebaseContentRepository: Error counting entries:', error)
      throw new Error(
        `Failed to count content entries: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
