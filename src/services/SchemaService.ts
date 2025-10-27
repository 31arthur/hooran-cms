/**
 * Schema Service
 *
 * Service class for managing project-scoped schemas (collection definitions).
 *
 * **IMPORTANT:** This service is exclusive to users with the 'Super' role.
 * All operations MUST include projectId for multi-tenancy scoping.
 *
 * Firestore Structure:
 * projects/{projectId}/schemas/{schemaId}
 *
 * Schema Document Fields:
 * - id: string (collectionId, serves as document ID)
 * - project_id: string (FK to projects collection)
 * - name: string (display name for the collection)
 * - fields: SchemaField[] (JSON array defining field structure)
 * - created_at: Timestamp
 * - updated_at: Timestamp
 */

import {
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import {
  getProjectScopedCollection,
  getProjectScopedDocRef,
  getServerTimestamp,
  validateProjectId,
  COLLECTIONS,
} from '@/firebase/utils'
import type { Schema, SchemaField } from '@/firebase/types'

/**
 * Input data for creating a new schema
 */
export interface CreateSchemaInput {
  id: string // collectionId - will be used as document ID
  name: string
  description?: string
  fields: SchemaField[]
  display_field?: string
  is_system?: boolean
}

/**
 * Input data for updating an existing schema
 */
export interface UpdateSchemaInput {
  name?: string
  description?: string
  fields?: SchemaField[]
  display_field?: string
  is_system?: boolean
}

/**
 * Schema Service Class
 *
 * Provides methods for CRUD operations on project-scoped schemas.
 */
class SchemaServiceClass {
  /**
   * Get all schemas for a specific project
   *
   * Retrieves all collection definitions (schemas) that belong to the specified project.
   * Results are ordered by creation date (newest first).
   *
   * **Requirements:**
   * - projectId MUST be provided for multi-tenancy scoping
   * - User MUST have 'Super' role (enforced at UI/route level)
   *
   * @param projectId - The project ID to fetch schemas for
   * @returns Promise<Schema[]> - Array of schema documents
   *
   * @throws Error if projectId is invalid
   *
   * @example
   * ```typescript
   * const { selectedProject } = useProject()
   * const schemas = await SchemaService.getSchemasForProject(selectedProject.projectId)
   * console.log(`Found ${schemas.length} schemas`)
   * ```
   */
  async getSchemasForProject(projectId: string): Promise<Schema[]> {
    // Validate project ID
    validateProjectId(projectId)

    try {
      // Get the schemas collection for this project
      const schemasCollection = getProjectScopedCollection(COLLECTIONS.SCHEMAS, projectId)

      // Create query to fetch all schemas, ordered by creation date
      const schemasQuery = query(schemasCollection, orderBy('created_at', 'desc'))

      // Execute query
      const querySnapshot = await getDocs(schemasQuery)

      // Map documents to Schema objects
      const schemas: Schema[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        schemas.push({
          id: doc.id,
          project_id: projectId,
          name: data.name || doc.id,
          description: data.description,
          fields: data.fields || [],
          display_field: data.display_field,
          is_system: data.is_system || false,
          created_at: data.created_at as Timestamp,
          updated_at: data.updated_at as Timestamp,
        })
      })

      console.log(`✅ Fetched ${schemas.length} schemas for project: ${projectId}`)
      return schemas
    } catch (error) {
      console.error('❌ Error fetching schemas for project:', projectId, error)
      throw new Error(`Failed to fetch schemas: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get a single schema by ID
   *
   * Retrieves a specific schema document from the project.
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID (collectionId)
   * @returns Promise<Schema | null> - The schema document or null if not found
   *
   * @throws Error if projectId or schemaId is invalid
   *
   * @example
   * ```typescript
   * const schema = await SchemaService.getSchemaById('project-123', 'articles')
   * if (schema) {
   *   console.log(`Schema: ${schema.name}`)
   * }
   * ```
   */
  async getSchemaById(projectId: string, schemaId: string): Promise<Schema | null> {
    validateProjectId(projectId)

    if (!schemaId || typeof schemaId !== 'string' || schemaId.trim() === '') {
      throw new Error('Invalid schema ID: Schema ID must be a non-empty string')
    }

    try {
      const schemaDocRef = getProjectScopedDocRef(COLLECTIONS.SCHEMAS, schemaId, projectId)
      const schemaDocSnap = await getDoc(schemaDocRef)

      if (!schemaDocSnap.exists()) {
        console.warn(`⚠️ Schema not found: ${schemaId} in project ${projectId}`)
        return null
      }

      const data = schemaDocSnap.data()
      return {
        id: schemaDocSnap.id,
        project_id: projectId,
        name: data.name || schemaDocSnap.id,
        description: data.description,
        fields: data.fields || [],
        display_field: data.display_field,
        is_system: data.is_system || false,
        created_at: data.created_at as Timestamp,
        updated_at: data.updated_at as Timestamp,
      }
    } catch (error) {
      console.error('❌ Error fetching schema:', schemaId, error)
      throw new Error(`Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a new collection schema
   *
   * Creates a new schema definition (collection structure) scoped to the specified project.
   *
   * **CRITICAL REQUIREMENTS:**
   * - projectId MUST be provided and will be enforced in the document
   * - userId MUST be provided for audit tracking
   * - schemaData.id will be used as the document ID (collectionId)
   * - The document MUST include project_id field for multi-tenancy
   *
   * **Validation:**
   * - Schema ID (collectionId) must be unique within the project
   * - Schema name must be provided
   * - Fields array must have at least one field
   *
   * @param projectId - The project ID (MANDATORY for multi-tenancy scoping)
   * @param schemaData - The schema definition data
   * @param userId - The ID of the user creating the schema (for audit tracking)
   * @returns Promise<string> - The ID of the created schema document
   *
   * @throws Error if validation fails or creation fails
   *
   * @example
   * ```typescript
   * const { selectedProject } = useProject()
   * const { currentUser } = useAuth()
   *
   * const newSchemaId = await SchemaService.createCollectionSchema(
   *   selectedProject.projectId,
   *   {
   *     id: 'articles',
   *     name: 'Articles',
   *     description: 'Blog articles and posts',
   *     fields: [
   *       { name: 'title', type: 'text', label: 'Title', required: true },
   *       { name: 'content', type: 'richtext', label: 'Content', required: true },
   *       { name: 'status', type: 'select', label: 'Status', options: {
   *         choices: [
   *           { label: 'Draft', value: 'draft' },
   *           { label: 'Published', value: 'published' }
   *         ]
   *       }}
   *     ],
   *     display_field: 'title'
   *   },
   *   currentUser.uid
   * )
   * console.log(`Schema created with ID: ${newSchemaId}`)
   * ```
   */
  async createCollectionSchema(
    projectId: string,
    schemaData: CreateSchemaInput,
    userId: string
  ): Promise<string> {
    // Validate inputs
    validateProjectId(projectId)

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID: User ID must be a non-empty string')
    }

    if (!schemaData.id || typeof schemaData.id !== 'string' || schemaData.id.trim() === '') {
      throw new Error('Invalid schema ID: Schema ID (collectionId) must be a non-empty string')
    }

    if (!schemaData.name || typeof schemaData.name !== 'string' || schemaData.name.trim() === '') {
      throw new Error('Invalid schema name: Schema name must be a non-empty string')
    }

    if (!Array.isArray(schemaData.fields) || schemaData.fields.length === 0) {
      throw new Error('Invalid fields: Schema must have at least one field')
    }

    // Validate that each field has required properties
    for (const field of schemaData.fields) {
      if (!field.name || !field.type || !field.label) {
        throw new Error(`Invalid field: Each field must have name, type, and label. Missing in field: ${JSON.stringify(field)}`)
      }
    }

    try {
      // Check if schema with this ID already exists
      const existingSchema = await this.getSchemaById(projectId, schemaData.id)
      if (existingSchema) {
        throw new Error(`Schema with ID "${schemaData.id}" already exists in this project`)
      }

      // Get document reference with the specified ID (collectionId)
      const schemaDocRef = getProjectScopedDocRef(COLLECTIONS.SCHEMAS, schemaData.id, projectId)

      // Prepare schema document
      // CRITICAL: Enforce project_id field for multi-tenancy
      const schemaDocument = {
        project_id: projectId, // MANDATORY: Enforces multi-tenancy scoping
        name: schemaData.name,
        description: schemaData.description || '',
        fields: schemaData.fields,
        display_field: schemaData.display_field || schemaData.fields[0]?.name || 'id',
        is_system: schemaData.is_system || false,
        created_at: getServerTimestamp(),
        updated_at: getServerTimestamp(),
        created_by: userId,
      }

      // Create the document
      await setDoc(schemaDocRef, schemaDocument)

      console.log(`✅ Schema created successfully: ${schemaData.id} in project ${projectId}`)
      return schemaData.id
    } catch (error) {
      console.error('❌ Error creating schema:', error)
      throw new Error(`Failed to create schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update an existing schema
   *
   * Updates the specified schema with new data.
   *
   * **IMPORTANT:**
   * - Cannot change the schema ID (collectionId)
   * - Cannot change the project_id
   * - System schemas (is_system: true) may have restrictions
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to update
   * @param updates - The fields to update
   * @param userId - The ID of the user performing the update
   * @returns Promise<void>
   *
   * @throws Error if schema doesn't exist or update fails
   *
   * @example
   * ```typescript
   * await SchemaService.updateSchema(
   *   'project-123',
   *   'articles',
   *   {
   *     description: 'Updated description',
   *     fields: [...updatedFields]
   *   },
   *   currentUser.uid
   * )
   * ```
   */
  async updateSchema(
    projectId: string,
    schemaId: string,
    updates: UpdateSchemaInput,
    userId: string
  ): Promise<void> {
    validateProjectId(projectId)

    if (!schemaId || typeof schemaId !== 'string' || schemaId.trim() === '') {
      throw new Error('Invalid schema ID')
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID')
    }

    try {
      // Check if schema exists
      const existingSchema = await this.getSchemaById(projectId, schemaId)
      if (!existingSchema) {
        throw new Error(`Schema "${schemaId}" not found in project "${projectId}"`)
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        ...updates,
        updated_at: getServerTimestamp(),
        updated_by: userId,
      }

      // Get document reference
      const schemaDocRef = getProjectScopedDocRef(COLLECTIONS.SCHEMAS, schemaId, projectId)

      // Update the document
      await updateDoc(schemaDocRef, updateData)

      console.log(`✅ Schema updated successfully: ${schemaId}`)
    } catch (error) {
      console.error('❌ Error updating schema:', error)
      throw new Error(`Failed to update schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a schema
   *
   * Deletes the specified schema from the project.
   *
   * **WARNING:**
   * - This is a destructive operation
   * - System schemas (is_system: true) should not be deleted
   * - Consider checking if any content uses this schema before deletion
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to delete
   * @param userId - The ID of the user performing the deletion
   * @returns Promise<void>
   *
   * @throws Error if schema doesn't exist or is a system schema
   *
   * @example
   * ```typescript
   * await SchemaService.deleteSchema('project-123', 'articles', currentUser.uid)
   * ```
   */
  async deleteSchema(projectId: string, schemaId: string, userId: string): Promise<void> {
    validateProjectId(projectId)

    if (!schemaId || typeof schemaId !== 'string' || schemaId.trim() === '') {
      throw new Error('Invalid schema ID')
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID')
    }

    try {
      // Check if schema exists
      const existingSchema = await this.getSchemaById(projectId, schemaId)
      if (!existingSchema) {
        throw new Error(`Schema "${schemaId}" not found in project "${projectId}"`)
      }

      // Prevent deletion of system schemas
      if (existingSchema.is_system) {
        throw new Error(`Cannot delete system schema: ${schemaId}`)
      }

      // Get document reference
      const schemaDocRef = getProjectScopedDocRef(COLLECTIONS.SCHEMAS, schemaId, projectId)

      // Delete the document
      await deleteDoc(schemaDocRef)

      console.log(`✅ Schema deleted successfully: ${schemaId}`)
    } catch (error) {
      console.error('❌ Error deleting schema:', error)
      throw new Error(`Failed to delete schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if a schema exists
   *
   * Checks whether a schema with the given ID exists in the project.
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to check
   * @returns Promise<boolean> - True if schema exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await SchemaService.schemaExists('project-123', 'articles')
   * if (exists) {
   *   console.log('Schema already exists')
   * }
   * ```
   */
  async schemaExists(projectId: string, schemaId: string): Promise<boolean> {
    try {
      const schema = await this.getSchemaById(projectId, schemaId)
      return schema !== null
    } catch (error) {
      console.error('❌ Error checking schema existence:', error)
      return false
    }
  }
}

/**
 * Export singleton instance
 */
export const SchemaService = new SchemaServiceClass()

/**
 * Export the class for testing purposes
 */
export { SchemaServiceClass }
