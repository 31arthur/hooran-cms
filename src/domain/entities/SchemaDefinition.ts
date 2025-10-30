/**
 * Schema Definition Entity
 *
 * Domain entity representing a schema (collection definition) in the CMS.
 * This is a clean, database-agnostic representation of a schema.
 *
 * **Framework Independence:**
 * This entity contains NO Firebase-specific types (no Timestamp, no DocumentReference, etc.).
 * All date/time fields use native JavaScript Date type.
 */

/**
 * Field types supported by the schema system
 *
 * Complete list of data types for content modeling
 */
export type SchemaFieldType =
  | 'text'              // Short string, single line
  | 'email'             // Email address input
  | 'url'               // URL input
  | 'textarea'          // Multi-line text input
  | 'richtext'          // Long-form content with formatting (Markdown/HTML)
  | 'number'            // Whole integers only
  | 'float'             // Decimal numbers (floating point)
  | 'boolean'           // True or False
  | 'date'              // Date only (no time) - ISO 8601
  | 'time'              // Time only (no date)
  | 'datetime'          // Full timestamp - ISO 8601
  | 'currency'          // Number with mandatory currency code
  | 'media'             // General file uploads (PDF, ZIP, DOC)
  | 'photo'             // Single optimized image upload
  | 'multiplePhotos'    // Multiple image uploads (gallery)
  | 'video'             // Single video - embed links or hosted file
  | 'multipleVideos'    // Multiple video uploads
  | 'multipleMedia'     // Multiple general file uploads
  | 'json'              // Raw data structure
  | 'uid'               // Auto-generated unique identifier
  | 'select'            // Pre-defined list of choices (Dropdown) - alias for enum
  | 'enum'              // Pre-defined list of choices (Dropdown)
  | 'reference'         // Single relation - link to one entry
  | 'multiReference'    // Multiple relations - link to multiple entries
  | 'svg'               // SVG code/file upload

/**
 * Field definition within a schema
 */
export interface SchemaField {
  /**
   * Unique field name (used as key in data objects)
   */
  name: string

  /**
   * Field type
   */
  type: SchemaFieldType

  /**
   * Human-readable label for the field
   */
  label: string

  /**
   * Whether this field is required
   */
  required?: boolean

  /**
   * Field-specific options (e.g., choices for select, validation rules)
   */
  options?: Record<string, any>

  /**
   * Default value for the field
   */
  defaultValue?: any

  /**
   * Help text or description for the field
   */
  helpText?: string

  /**
   * Validation rules for the field
   */
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    maxItems?: number
    pattern?: string
    custom?: string
  }

  /**
   * Maximum length for text fields
   */
  maxLength?: number

  /**
   * Minimum length for text fields
   */
  minLength?: number

  /**
   * Whether this field is unique
   */
  unique?: boolean

  /**
   * Whether this field is indexed
   */
  indexed?: boolean
}

/**
 * Schema Definition Entity
 */
export interface SchemaDefinition {
  /**
   * Unique schema identifier (also used as collection ID)
   */
  id: string

  /**
   * Project this schema belongs to
   */
  projectId: string

  /**
   * Human-readable schema name
   */
  name: string

  /**
   * Collection ID (typically same as id, but can be aliased)
   */
  collectionId?: string

  /**
   * Collection name (typically same as name, but can be aliased)
   */
  collectionName?: string

  /**
   * Optional schema description
   */
  description?: string

  /**
   * Array of field definitions
   */
  fields: SchemaField[]

  /**
   * Field name to use as display field (e.g., "title", "name")
   */
  displayField?: string

  /**
   * Whether this is a system schema (cannot be deleted)
   */
  isSystem?: boolean

  /**
   * Schema creation timestamp
   */
  createdAt?: Date

  /**
   * Last update timestamp
   */
  updatedAt?: Date

  /**
   * User ID of the schema creator
   */
  createdBy?: string

  /**
   * User ID of last updater
   */
  updatedBy?: string
}

/**
 * Input for creating a new schema
 */
export interface CreateSchemaInput {
  id: string
  name: string
  description?: string
  fields: SchemaField[]
  displayField?: string
  isSystem?: boolean
}

/**
 * Input for updating an existing schema
 */
export interface UpdateSchemaInput {
  name?: string
  description?: string
  fields?: SchemaField[]
  displayField?: string
  isSystem?: boolean
}
