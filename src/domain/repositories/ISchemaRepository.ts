/**
 * ISchemaRepository Interface
 *
 * Repository contract for schema data operations.
 * This interface defines the contract for all schema-related data access,
 * completely decoupled from any specific database implementation.
 *
 * **Framework Independence:**
 * - All methods use clean domain entities (SchemaDefinition, CreateSchemaInput, UpdateSchemaInput)
 * - NO Firebase-specific types allowed (no Timestamp, DocumentReference, etc.)
 * - All implementations must convert database-specific types to domain entities
 *
 * **Purpose:**
 * This interface shields the business logic from the underlying data store,
 * allowing the application to switch databases without changing business logic.
 */

import type {
  SchemaDefinition,
  CreateSchemaInput,
  UpdateSchemaInput,
} from '../entities/SchemaDefinition'

export interface ISchemaRepository {
  /**
   * Get all schemas for a project
   *
   * @param projectId - The project ID
   * @returns Promise<SchemaDefinition[]> - Array of schemas
   */
  getSchemasForProject(projectId: string): Promise<SchemaDefinition[]>

  /**
   * Get all schemas for a project (alias)
   *
   * Retrieves all schema definitions for a given project.
   * This is an alias for getSchemasForProject() to support
   * different naming conventions across use cases.
   *
   * @param projectId - The project ID
   * @returns Promise<SchemaDefinition[]> - Array of schemas
   */
  getSchemas(projectId: string): Promise<SchemaDefinition[]>

  /**
   * Get a schema by ID
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID
   * @returns Promise<SchemaDefinition | null> - The schema or null if not found
   */
  getSchemaById(projectId: string, schemaId: string): Promise<SchemaDefinition | null>

  /**
   * Get schema definition with project context validation
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID
   * @returns Promise<SchemaDefinition> - The validated schema
   * @throws Error if schema not found or project mismatch
   */
  getSchemaDefinition(projectId: string, schemaId: string): Promise<SchemaDefinition>

  /**
   * Create a new schema
   *
   * @param projectId - The project ID
   * @param schemaData - The schema data
   * @param userId - The user ID creating the schema
   * @returns Promise<string> - The created schema ID
   */
  createSchema(
    projectId: string,
    schemaData: CreateSchemaInput,
    userId: string
  ): Promise<string>

  /**
   * Update an existing schema
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to update
   * @param updates - The fields to update
   * @param userId - The user ID performing the update
   * @returns Promise<void>
   */
  updateSchema(
    projectId: string,
    schemaId: string,
    updates: UpdateSchemaInput,
    userId: string
  ): Promise<void>

  /**
   * Delete a schema
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to delete
   * @param collectionId - The collection ID (for content validation)
   * @param userId - The user ID performing the deletion
   * @returns Promise<void>
   */
  deleteSchema(
    projectId: string,
    schemaId: string,
    collectionId: string,
    userId: string
  ): Promise<void>

  /**
   * Check if a schema exists
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to check
   * @returns Promise<boolean> - True if schema exists
   */
  schemaExists(projectId: string, schemaId: string): Promise<boolean>

  /**
   * Check if a schema name already exists in the project
   * Used for real-time duplicate name validation
   *
   * @param projectId - The project ID
   * @param schemaName - The schema name to check
   * @param excludeSchemaId - Optional schema ID to exclude (for edit mode)
   * @returns Promise<boolean> - True if name exists
   */
  schemaNameExists(
    projectId: string,
    schemaName: string,
    excludeSchemaId?: string
  ): Promise<boolean>
}
