/**
 * Content Management Use Case Interface
 *
 * Defines the application-layer contract for content management operations.
 * This interface represents high-level business operations for creating, reading,
 * updating, and deleting content entries within collections.
 *
 * **Clean Architecture - Application Layer:**
 * This use case orchestrates content operations, applying business rules and
 * coordinating between repositories without knowing about UI or database details.
 *
 * **Key Principles:**
 * - Methods accept and return ONLY domain entities or primitives
 * - NO Firebase types (no Timestamp, DocumentReference, etc.)
 * - NO UI types (no React components, events, etc.)
 * - NO infrastructure concerns (no database-specific logic)
 * - Pure business operations with validation and rules
 *
 * **Business Operations:**
 * - Content CRUD operations
 * - Schema validation
 * - Status workflows (draft → published)
 * - Batch operations
 * - Access control validation
 */

import type {
  ContentEntry,
  CreateContentEntryInput,
  UpdateContentEntryInput,
  GetContentEntriesOptions,
  SchemaDefinition,
} from '@/domain/entities'

/**
 * Content Entry with Schema
 *
 * Enriched content entry that includes its schema definition
 * for validation and display purposes.
 */
export interface ContentEntryWithSchema {
  entry: ContentEntry
  schema: SchemaDefinition
}

/**
 * Content List Result
 *
 * Result of content listing operations with pagination info
 */
export interface ContentListResult {
  entries: ContentEntry[]
  totalCount: number
  hasMore: boolean
}

/**
 * Content Validation Result
 *
 * Result of content validation against schema
 */
export interface ContentValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}

/**
 * Batch Operation Result
 *
 * Result of batch operations (e.g., bulk publish)
 */
export interface BatchOperationResult {
  successCount: number
  failureCount: number
  errors: Array<{
    entryId: string
    error: string
  }>
}

/**
 * IContentManagementUseCase
 *
 * Application-layer interface defining all business operations
 * related to content management.
 */
export interface IContentManagementUseCase {
  /**
   * Get content entries for a collection
   *
   * Business Rules:
   * - User must have access to the project
   * - Filters results based on user role and permissions
   * - Supports search and filtering
   * - Returns full ContentEntry entities with data field
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param options - Query options (limit, search, filters)
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<ContentEntry[]> - List of full content entries
   * @throws Error if user lacks access
   */
  getContentEntries(
    projectId: string,
    collectionId: string,
    options: GetContentEntriesOptions,
    userId: string,
    userRole: string
  ): Promise<ContentEntry[]>

  /**
   * Get published content only
   *
   * Business Rules:
   * - Returns only entries with status 'published'
   * - Used for public-facing content retrieval
   * - Applies same access controls as getContentEntries
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @returns Promise<ContentEntry[]> - List of published entries
   */
  getPublishedContent(projectId: string, collectionId: string): Promise<ContentEntry[]>

  /**
   * Get draft content only
   *
   * Business Rules:
   * - Returns only entries with status 'draft'
   * - Used for editorial workflows
   * - Requires Admin or Super role
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<ContentEntry[]> - List of draft entries
   * @throws Error if user lacks permission
   */
  getDraftContent(
    projectId: string,
    collectionId: string,
    userId: string,
    userRole: string
  ): Promise<ContentEntry[]>

  /**
   * Get a single content entry by ID
   *
   * Business Rules:
   * - Validates user has access to the project
   * - Returns null if entry doesn't exist or user lacks access
   * - Includes schema information for validation
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryId - The entry ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<ContentEntryWithSchema | null> - Entry with schema or null
   */
  getContentEntryById(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string,
    userRole: string
  ): Promise<ContentEntryWithSchema | null>

  /**
   * Create a new content entry
   *
   * Business Rules:
   * - User must have Admin or Super role
   * - Validates data against schema definition
   * - Enforces required fields
   * - Sets initial status (defaults to 'draft')
   * - Creates audit log entry
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryData - The content entry data
   * @param userId - The user creating the entry
   * @param userRole - The user's role
   * @returns Promise<string> - The created entry ID
   * @throws Error if validation fails or user lacks permission
   */
  createContentEntry(
    projectId: string,
    collectionId: string,
    entryData: CreateContentEntryInput,
    userId: string,
    userRole: string
  ): Promise<string>

  /**
   * Update an existing content entry
   *
   * Business Rules:
   * - User must have Admin or Super role
   * - Validates updated data against schema
   * - Tracks field changes
   * - Updates timestamp
   * - Creates audit log entry
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryId - The entry ID to update
   * @param updates - The fields to update
   * @param userId - The user performing the update
   * @param userRole - The user's role
   * @returns Promise<void>
   * @throws Error if validation fails or user lacks permission
   */
  updateContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    updates: UpdateContentEntryInput,
    userId: string,
    userRole: string
  ): Promise<void>

  /**
   * Delete a content entry
   *
   * Business Rules:
   * - User must have Admin or Super role
   * - DESTRUCTIVE operation
   * - Creates audit log entry with snapshot
   * - Cannot be undone
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryId - The entry ID to delete
   * @param userId - The user performing the deletion
   * @param userRole - The user's role
   * @returns Promise<void>
   * @throws Error if entry doesn't exist or user lacks permission
   */
  deleteContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string,
    userRole: string
  ): Promise<void>

  /**
   * Publish content entry (change status to 'published')
   *
   * Business Rules:
   * - Validates all required fields are present
   * - Changes status from 'draft' to 'published'
   * - Creates audit log entry
   * - May trigger notifications or webhooks
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryId - The entry ID to publish
   * @param userId - The user performing the publish
   * @param userRole - The user's role
   * @returns Promise<void>
   * @throws Error if validation fails or user lacks permission
   */
  publishContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string,
    userRole: string
  ): Promise<void>

  /**
   * Unpublish content entry (change status to 'draft')
   *
   * Business Rules:
   * - Changes status from 'published' to 'draft'
   * - Makes content unavailable to public
   * - Creates audit log entry
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryId - The entry ID to unpublish
   * @param userId - The user performing the unpublish
   * @param userRole - The user's role
   * @returns Promise<void>
   * @throws Error if user lacks permission
   */
  unpublishContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string,
    userRole: string
  ): Promise<void>

  /**
   * Batch publish multiple entries
   *
   * Business Rules:
   * - Validates each entry before publishing
   * - All entries must belong to same project/collection
   * - Continues on error (doesn't fail entire batch)
   * - Returns detailed results
   * - Creates individual audit log entries
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryIds - Array of entry IDs to publish
   * @param userId - The user performing the operation
   * @param userRole - The user's role
   * @returns Promise<BatchOperationResult> - Detailed results
   */
  batchPublishEntries(
    projectId: string,
    collectionId: string,
    entryIds: string[],
    userId: string,
    userRole: string
  ): Promise<BatchOperationResult>

  /**
   * Batch unpublish multiple entries
   *
   * Business Rules:
   * - Changes status from 'published' to 'draft' for all entries
   * - Continues on error
   * - Returns detailed results
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryIds - Array of entry IDs to unpublish
   * @param userId - The user performing the operation
   * @param userRole - The user's role
   * @returns Promise<BatchOperationResult> - Detailed results
   */
  batchUnpublishEntries(
    projectId: string,
    collectionId: string,
    entryIds: string[],
    userId: string,
    userRole: string
  ): Promise<BatchOperationResult>

  /**
   * Batch delete multiple entries
   *
   * Business Rules:
   * - DESTRUCTIVE operation
   * - User must have Super role for batch deletion
   * - Creates audit log entries for each deletion
   * - Continues on error
   * - Returns detailed results
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryIds - Array of entry IDs to delete
   * @param userId - The Super user performing the operation
   * @returns Promise<BatchOperationResult> - Detailed results
   * @throws Error if user is not Super role
   */
  batchDeleteEntries(
    projectId: string,
    collectionId: string,
    entryIds: string[],
    userId: string
  ): Promise<BatchOperationResult>

  /**
   * Batch update status for multiple entries
   *
   * **CRITICAL BUSINESS RULE - Auditing Consistency:**
   * This method MUST create an individual audit log for EACH entry updated.
   * This ensures complete audit trail and traceability for all status changes.
   *
   * Business Rules:
   * - Only Admin or Super users can batch update
   * - Processes each entry individually (not atomic)
   * - Continues on error (doesn't fail entire batch)
   * - Creates individual audit log for each successful update
   * - Skips entries that already have the target status
   * - Returns detailed results with success/failure counts
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryIds - Array of entry IDs to update
   * @param status - New status to apply ('published' or 'draft')
   * @param userId - The user performing the update
   * @returns Promise<void>
   * @throws Error if user lacks permission
   *
   * @example
   * ```typescript
   * await useCase.batchUpdateStatus(
   *   projectId,
   *   'articles',
   *   ['entry-1', 'entry-2', 'entry-3'],
   *   'published',
   *   userId
   * )
   * // Creates 3 individual audit logs (one per entry)
   * ```
   */
  batchUpdateStatus(
    projectId: string,
    collectionId: string,
    entryIds: string[],
    status: 'published' | 'draft',
    userId: string
  ): Promise<void>

  /**
   * Validate content entry against schema
   *
   * Business Rules:
   * - Checks all required fields are present
   * - Validates field types match schema definition
   * - Validates field constraints (min/max, patterns, etc.)
   * - Returns detailed validation errors
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryData - The entry data to validate
   * @returns Promise<ContentValidationResult> - Validation result with errors
   */
  validateContentEntry(
    projectId: string,
    collectionId: string,
    entryData: Record<string, any>
  ): Promise<ContentValidationResult>

  /**
   * Get content count for a collection
   *
   * Business Rules:
   * - Returns total number of entries
   * - Can filter by status
   * - Used for analytics and pagination
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param status - Optional status filter ('draft', 'published', 'archived')
   * @returns Promise<number> - Total count
   */
  getContentCount(
    projectId: string,
    collectionId: string,
    status?: 'draft' | 'published' | 'archived'
  ): Promise<number>

  /**
   * Search content across fields
   *
   * Business Rules:
   * - Searches across searchable fields (title, content, etc.)
   * - Returns ranked results
   * - Respects user permissions
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param searchTerm - The search term
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<ContentEntry[]> - Matching entries
   */
  searchContent(
    projectId: string,
    collectionId: string,
    searchTerm: string,
    userId: string,
    userRole: string
  ): Promise<ContentEntry[]>

  /**
   * Get schema definition by ID
   *
   * Retrieves the schema definition for a specific collection.
   * Used by UI components to render dynamic forms and tables.
   *
   * @param projectId - The project ID
   * @param schemaId - The schema/collection ID
   * @returns Promise<SchemaDefinition | null> - The schema definition or null if not found
   */
  getSchemaById(projectId: string, schemaId: string): Promise<SchemaDefinition | null>

  /**
   * Get content entries for a collection
   *
   * Alternative method name for getContentEntries.
   * Provides simplified interface for UI components.
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param options - Query options (limit, search, filters)
   * @returns Promise<ContentEntry[]> - List of content entries
   */
  getEntries(
    projectId: string,
    collectionId: string,
    options?: GetContentEntriesOptions
  ): Promise<ContentEntry[]>

  /**
   * Update a content entry
   *
   * Alternative method name for updateContentEntry.
   * Provides simplified interface without explicit user validation.
   *
   * @param projectId - The project ID
   * @param collectionId - The collection/schema ID
   * @param entryId - The entry ID to update
   * @param updates - The fields to update
   * @param userId - The user performing the update
   * @returns Promise<void>
   */
  updateEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    updates: UpdateContentEntryInput,
    userId: string
  ): Promise<void>
}
