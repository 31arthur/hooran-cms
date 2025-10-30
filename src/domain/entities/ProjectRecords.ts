/**
 * Project Records Entity
 *
 * Represents the collections (records) assigned to a project.
 * Stored in Firestore at: projects/{projectId}/records/metadata
 *
 * **Purpose:**
 * - Track which collections belong to which project
 * - Store collection metadata and schema references
 * - Enable efficient collection lookups per project
 *
 * **Collection Naming Convention:**
 * Schema document IDs follow the pattern: {projectName}_{collectionName}
 * Example: "real-estate_properties", "blog_articles"
 */

export interface ProjectRecords {
  /**
   * Project ID this records document belongs to
   */
  projectId: string

  /**
   * Array of collection references assigned to this project
   */
  collections: CollectionReference[]

  /**
   * When this records document was created
   */
  createdAt: Date

  /**
   * When this records document was last updated
   */
  updatedAt: Date

  /**
   * User who created this records document
   */
  createdBy: string

  /**
   * User who last updated this records document
   */
  updatedBy: string
}

/**
 * Collection Reference
 *
 * Reference to a collection schema assigned to a project
 */
export interface CollectionReference {
  /**
   * Schema document ID in the schemas collection
   * Format: {projectName}_{collectionName}
   * Example: "real-estate_properties"
   */
  schemaId: string

  /**
   * Human-readable collection name
   * Example: "Properties", "Blog Articles"
   */
  collectionName: string

  /**
   * Collection slug (URL-friendly version)
   * Example: "properties", "blog-articles"
   */
  collectionSlug: string

  /**
   * Optional description of the collection
   */
  description?: string

  /**
   * Icon name for UI display
   */
  icon?: string

  /**
   * Number of entries in this collection (cached for performance)
   */
  entryCount?: number

  /**
   * When this collection was added to the project
   */
  addedAt: Date

  /**
   * User who added this collection
   */
  addedBy: string

  /**
   * Whether this collection is active
   */
  isActive: boolean
}

/**
 * Create Project Records Input
 */
export interface CreateProjectRecordsInput {
  projectId: string
  collections?: CollectionReference[]
  createdBy: string
}

/**
 * Add Collection to Project Input
 */
export interface AddCollectionToProjectInput {
  projectId: string
  schemaId: string
  collectionName: string
  collectionSlug: string
  description?: string
  icon?: string
  addedBy: string
}

/**
 * Remove Collection from Project Input
 */
export interface RemoveCollectionFromProjectInput {
  projectId: string
  schemaId: string
  removedBy: string
}

/**
 * Update Collection Reference Input
 */
export interface UpdateCollectionReferenceInput {
  projectId: string
  schemaId: string
  updates: Partial<CollectionReference>
  updatedBy: string
}
