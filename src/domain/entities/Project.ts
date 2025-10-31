/**
 * Project Entity
 *
 * Domain entity representing a project in the CMS.
 * This is a clean, database-agnostic representation of a project.
 *
 * **Framework Independence:**
 * This entity contains NO Firebase-specific types (no Timestamp, no DocumentReference, etc.).
 * All date/time fields use native JavaScript Date type.
 */

export type ProjectStatus = 'Active' | 'Draft' | 'Archived'

export interface Project {
  /**
   * Unique project identifier (also used as slug)
   */
  projectId: string

  /**
   * Human-readable project name
   */
  name: string

  /**
   * Project slug (URL-friendly identifier)
   */
  slug?: string

  /**
   * Project status
   */
  status: ProjectStatus

  /**
   * Optional project description
   */
  description?: string

  /**
   * User ID of the project creator
   */
  createdBy?: string

  /**
   * Legacy owner ID field (for backward compatibility)
   * @deprecated Use createdBy instead
   */
  owner_id?: string

  /**
   * Project creation timestamp
   */
  createdAt?: Date

  /**
   * Last update timestamp
   */
  updatedAt?: Date

  /**
   * Array of schema IDs associated with this project
   * Schemas are stored in root-level 'schemas' collection
   */
  schemas?: string[]

  /**
   * Array of table IDs associated with this project
   * Tables are stored in root-level 'tables' collection
   * Note: table IDs match schema IDs (one table per schema)
   */
  tables?: string[]
}

/**
 * Project metadata for update operations
 */
export interface ProjectMetadata {
  name: string
  status: ProjectStatus
}
