/**
 * Schema Management Use Case Interface
 *
 * Defines the application-layer contract for schema/collection management operations.
 * Schemas define the structure of content collections (content types).
 *
 * **Clean Architecture - Application Layer:**
 * Orchestrates schema operations, enforces business rules, and coordinates
 * between schema repository and content repository.
 *
 * **Key Principles:**
 * - Methods accept and return ONLY domain entities or primitives
 * - NO Firebase, UI, or infrastructure types
 * - Pure business operations with validation
 */

import type {
  SchemaDefinition,
  CreateSchemaInput,
  UpdateSchemaInput,
  SchemaField,
} from '@/domain/entities'

/**
 * Schema with Content Count
 *
 * Schema information enriched with content statistics
 */
export interface SchemaWithStats {
  schema: SchemaDefinition
  contentCount: number
  draftCount: number
  publishedCount: number
}

/**
 * Schema Deletion Result
 *
 * Result of schema deletion validation
 */
export interface SchemaDeletionResult {
  canDelete: boolean
  reason?: string
  contentCount?: number
}

/**
 * ISchemaManagementUseCase
 *
 * Application-layer interface for schema management operations.
 */
export interface ISchemaManagementUseCase {
  /**
   * Get all schemas for a project
   *
   * Business Rules:
   * - User must have access to the project
   * - Returns schemas with metadata
   * - Ordered by creation date (newest first)
   *
   * @param projectId - The project ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<SchemaDefinition[]> - List of schemas
   * @throws Error if user lacks access
   */
  getSchemasForProject(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<SchemaDefinition[]>

  /**
   * Get schemas with content statistics
   *
   * Business Rules:
   * - Includes content count for each schema
   * - Useful for dashboard and overview pages
   *
   * @param projectId - The project ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<SchemaWithStats[]> - Schemas with statistics
   */
  getSchemasWithStats(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<SchemaWithStats[]>

  /**
   * Get a schema by ID
   *
   * Business Rules:
   * - Validates user has access to the project
   * - Returns null if schema doesn't exist
   * - Validates schema belongs to correct project
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<SchemaDefinition | null> - Schema or null
   */
  getSchemaById(
    projectId: string,
    schemaId: string,
    userId: string,
    userRole: string
  ): Promise<SchemaDefinition | null>

  /**
   * Create a new schema
   *
   * Business Rules:
   * - Only Admin or Super users can create schemas
   * - Schema ID must be unique within project
   * - Schema ID must be valid (lowercase, alphanumeric, underscores)
   * - Must have at least one field
   * - Field names must be unique within schema
   * - Creates audit log entry
   *
   * @param projectId - The project ID
   * @param schemaData - The schema definition data
   * @param userId - The user creating the schema
   * @param userRole - The user's role
   * @returns Promise<string> - The created schema ID
   * @throws Error if validation fails or user lacks permission
   */
  createSchema(
    projectId: string,
    schemaData: CreateSchemaInput,
    userId: string,
    userRole: string
  ): Promise<string>

  /**
   * Update an existing schema
   *
   * Business Rules:
   * - Only Admin or Super users can update schemas
   * - Cannot change schema ID
   * - Field name changes require migration plan
   * - System schemas may have restrictions
   * - Creates audit log entry with field changes
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to update
   * @param updates - The fields to update
   * @param userId - The user performing the update
   * @param userRole - The user's role
   * @returns Promise<void>
   * @throws Error if validation fails or user lacks permission
   */
  updateSchema(
    projectId: string,
    schemaId: string,
    updates: UpdateSchemaInput,
    userId: string,
    userRole: string
  ): Promise<void>

  /**
   * Delete a schema
   *
   * Business Rules:
   * - Only Super users can delete schemas
   * - DESTRUCTIVE operation
   * - Cannot delete if content entries exist
   * - Cannot delete system schemas
   * - Creates audit log entry
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to delete
   * @param userId - The Super user performing the deletion
   * @returns Promise<void>
   * @throws Error if content exists, schema is system, or user lacks permission
   */
  deleteSchema(projectId: string, schemaId: string, userId: string): Promise<void>

  /**
   * Validate schema deletion
   *
   * Business Rules:
   * - Checks if schema can be safely deleted
   * - Returns reason if deletion not allowed
   * - Used to show warnings before deletion
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to check
   * @returns Promise<SchemaDeletionResult> - Validation result
   */
  validateSchemaDeletion(
    projectId: string,
    schemaId: string
  ): Promise<SchemaDeletionResult>

  /**
   * Validate schema structure
   *
   * Business Rules:
   * - Validates field names are unique
   * - Validates field types are supported
   * - Validates required constraints
   * - Returns detailed validation errors
   *
   * @param schemaData - The schema data to validate
   * @returns Promise<{ isValid: boolean; errors: string[] }> - Validation result
   */
  validateSchemaStructure(schemaData: {
    fields: SchemaField[]
  }): Promise<{ isValid: boolean; errors: string[] }>

  /**
   * Check if schema ID is available
   *
   * Business Rules:
   * - Schema IDs must be unique within a project
   * - Used during schema creation
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to check
   * @returns Promise<boolean> - True if ID is available
   */
  isSchemaIdAvailable(projectId: string, schemaId: string): Promise<boolean>

  /**
   * Get field suggestions based on field type
   *
   * Business Rules:
   * - Returns recommended field configurations
   * - Based on field type and common patterns
   * - Helps users configure fields correctly
   *
   * @param fieldType - The field type (text, richtext, number, etc.)
   * @returns Promise<Partial<SchemaField>> - Suggested field configuration
   */
  getFieldSuggestions(fieldType: string): Promise<Partial<SchemaField>>
}
