/**
 * IContentRepository Interface
 *
 * Repository contract for content data operations.
 * This interface defines the contract for all content-related data access,
 * completely decoupled from any specific database implementation.
 *
 * **Framework Independence:**
 * - All methods use clean domain entities (ContentEntry, CreateContentEntryInput, etc.)
 * - NO Firebase-specific types allowed (no Timestamp, DocumentReference, etc.)
 * - All implementations must convert database-specific types to domain entities
 *
 * **Purpose:**
 * This interface shields the business logic from the underlying data store,
 * allowing the application to switch databases without changing business logic.
 */

import type {
  ContentEntry,
  CreateContentEntryInput,
  UpdateContentEntryInput,
  GetContentEntriesOptions,
} from '../entities/ContentEntry'

export interface IContentRepository {
  /**
   * Get content entries for a collection
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param options - Query options (limit, search, filters)
   * @returns Promise<ContentEntry[]> - Array of content entries
   */
  getContentEntries(
    projectId: string,
    collectionId: string,
    options: GetContentEntriesOptions
  ): Promise<ContentEntry[]>

  /**
   * Get a single content entry by ID
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param entryId - The entry ID
   * @returns Promise<ContentEntry | null> - The content entry or null if not found
   */
  getContentEntryById(
    projectId: string,
    collectionId: string,
    entryId: string
  ): Promise<ContentEntry | null>

  /**
   * Create a new content entry
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param entryData - The content entry data
   * @param userId - The user ID creating the entry
   * @returns Promise<string> - The created entry ID
   */
  createContentEntry(
    projectId: string,
    collectionId: string,
    entryData: CreateContentEntryInput,
    userId: string
  ): Promise<string>

  /**
   * Update an existing content entry
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param entryId - The entry ID to update
   * @param updates - The fields to update
   * @param userId - The user ID performing the update
   * @returns Promise<void>
   */
  updateContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    updates: UpdateContentEntryInput,
    userId: string
  ): Promise<void>

  /**
   * Delete a content entry
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param entryId - The entry ID to delete
   * @param userId - The user ID performing the deletion
   * @returns Promise<void>
   */
  deleteContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string
  ): Promise<void>

  /**
   * Batch update content status
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param contentIds - Array of content entry IDs to update
   * @param status - The new status
   * @param userId - The user ID performing the update
   * @returns Promise<void>
   */
  batchUpdateContentStatus(
    projectId: string,
    collectionId: string,
    contentIds: string[],
    status: 'published' | 'draft',
    userId: string
  ): Promise<void>

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
  getPublishedContentByCollection(
    projectId: string,
    collectionId: string,
    limit?: number
  ): Promise<ContentEntry[]>

  /**
   * Count content entries in a collection
   *
   * Returns the total number of content entries in a collection,
   * optionally filtered by status.
   *
   * @param projectId - The project ID
   * @param collectionId - The collection ID
   * @param status - Optional status filter ('draft' | 'published' | 'archived')
   * @returns Promise<number> - Total count of entries
   */
  countContentEntries(
    projectId: string,
    collectionId: string,
    status?: 'draft' | 'published' | 'archived'
  ): Promise<number>
}
