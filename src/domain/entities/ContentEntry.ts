/**
 * Content Entry Entity
 *
 * Domain entity representing a content entry in the CMS.
 * This is a clean, database-agnostic representation of content.
 *
 * **Framework Independence:**
 * This entity contains NO Firebase-specific types (no Timestamp, no DocumentReference, etc.).
 * All date/time fields use native JavaScript Date type.
 */

/**
 * Content entry status
 */
export type ContentStatus = 'draft' | 'published' | 'archived'

/**
 * Content Entry Entity
 */
export interface ContentEntry {
  /**
   * Unique entry identifier
   */
  id: string

  /**
   * Project this entry belongs to (foreign key)
   */
  projectId: string

  /**
   * Collection/schema this entry belongs to
   */
  collectionId: string

  /**
   * Dynamic content data (schema-defined fields)
   * Keys correspond to field names in the schema definition
   */
  data: Record<string, any>

  /**
   * Entry status
   */
  status?: ContentStatus

  /**
   * Creation timestamp
   */
  createdAt: Date

  /**
   * Last update timestamp
   */
  updatedAt: Date

  /**
   * User ID who created this entry
   */
  createdBy: string

  /**
   * User ID who last updated this entry
   */
  updatedBy?: string

  /**
   * When the entry was published (if status is 'published')
   */
  publishedAt?: Date
}

/**
 * Input for creating a new content entry
 */
export interface CreateContentEntryInput {
  data: Record<string, any>
  status?: ContentStatus
}

/**
 * Input for updating an existing content entry
 */
export interface UpdateContentEntryInput {
  data?: Record<string, any>
  status?: ContentStatus
}

/**
 * Options for querying content entries
 */
export interface GetContentEntriesOptions {
  /**
   * Maximum number of entries to return
   */
  limit: number

  /**
   * Search term for filtering entries
   */
  search?: string

  /**
   * Field name to filter by
   */
  filterField?: string

  /**
   * Value to match for the filter field
   */
  filterValue?: any
}
