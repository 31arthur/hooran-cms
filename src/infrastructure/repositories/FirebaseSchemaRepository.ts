/**
 * Firebase Schema Repository
 *
 * Concrete implementation of ISchemaRepository using Firebase Firestore.
 * This is the ONLY place in the application where Schema-related Firebase SDK calls occur.
 *
 * **CRITICAL: Framework Independence**
 * This class:
 * - Implements ISchemaRepository interface
 * - Contains ALL Firebase-specific code for schemas
 * - Converts Firebase types to domain entities using SchemaAdapter
 * - Handles Firebase-specific errors
 * - Is completely replaceable without affecting business logic
 *
 * **Firestore Structure:**
 * projects/{projectId}/schemas/{schemaId}
 *   - project_id: string (multi-tenancy enforcement)
 *   - name: string
 *   - description: string
 *   - fields: SchemaField[]
 *   - display_field: string
 *   - is_system: boolean
 *   - created_at: Timestamp
 *   - updated_at: Timestamp
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import {
  getProjectScopedCollection,
  getProjectScopedDocRef,
  validateProjectId,
  COLLECTIONS,
} from '@/firebase/utils'
import type { ISchemaRepository } from '@/domain/repositories'
import type {
  SchemaDefinition,
  CreateSchemaInput,
  UpdateSchemaInput,
} from '@/domain/entities'
import { SchemaAdapter } from '@/infrastructure/adapters/SchemaAdapter'
import { AuditService } from '@/services'

/**
 * FirebaseSchemaRepository
 *
 * Implements the ISchemaRepository interface using Firebase Firestore as the data store.
 */
export class FirebaseSchemaRepository implements ISchemaRepository {
  /**
   * Get all schemas for a project (alias)
   *
   * This is an alias for getSchemasForProject() to support
   * different naming conventions across use cases.
   *
   * @param projectId - The project ID
   * @returns Promise<SchemaDefinition[]> - Array of schemas
   * @throws Error if Firestore query fails
   */
  async getSchemas(projectId: string): Promise<SchemaDefinition[]> {
    return this.getSchemasForProject(projectId)
  }

  /**
   * Get all schemas for a project
   *
   * @param projectId - The project ID
   * @returns Promise<SchemaDefinition[]> - Array of schemas
   * @throws Error if Firestore query fails
   */
  async getSchemasForProject(projectId: string): Promise<SchemaDefinition[]> {
    try {
      validateProjectId(projectId)
      console.log(`📋 FirebaseSchemaRepository: Fetching schemas for project ${projectId}`)

      const schemasCollection = getProjectScopedCollection(COLLECTIONS.SCHEMAS, projectId)
      const schemasQuery = query(schemasCollection, orderBy('created_at', 'desc'))
      const querySnapshot = await getDocs(schemasQuery)

      const schemas: SchemaDefinition[] = []
      querySnapshot.forEach((docSnap) => {
        const schema = SchemaAdapter.toEntity(docSnap.id, docSnap.data())
        schemas.push(schema)
      })

      console.log(`✅ FirebaseSchemaRepository: Fetched ${schemas.length} schemas`)
      return schemas
    } catch (error) {
      console.error('❌ FirebaseSchemaRepository: Error fetching schemas:', error)
      throw new Error(
        `Failed to fetch schemas: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get a schema by ID
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID
   * @returns Promise<SchemaDefinition | null> - The schema or null if not found
   * @throws Error if Firestore read fails
   */
  async getSchemaById(projectId: string, schemaId: string): Promise<SchemaDefinition | null> {
    try {
      validateProjectId(projectId)
      console.log(`📋 FirebaseSchemaRepository: Fetching schema ${schemaId}`)

      const schemaDocRef = getProjectScopedDocRef(COLLECTIONS.SCHEMAS, schemaId, projectId)
      const schemaDocSnap = await getDoc(schemaDocRef)

      if (!schemaDocSnap.exists()) {
        console.log(`⚠️ FirebaseSchemaRepository: Schema ${schemaId} not found`)
        return null
      }

      const schema = SchemaAdapter.toEntity(schemaDocSnap.id, schemaDocSnap.data())
      console.log(`✅ FirebaseSchemaRepository: Fetched schema ${schemaId}`)
      return schema
    } catch (error) {
      console.error(`❌ FirebaseSchemaRepository: Error fetching schema ${schemaId}:`, error)
      throw new Error(
        `Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get schema definition with project context validation
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID
   * @returns Promise<SchemaDefinition> - The validated schema
   * @throws Error if schema not found or project mismatch
   */
  async getSchemaDefinition(projectId: string, schemaId: string): Promise<SchemaDefinition> {
    try {
      validateProjectId(projectId)
      console.log(`📋 FirebaseSchemaRepository: Fetching schema definition ${schemaId}`)

      const schema = await this.getSchemaById(projectId, schemaId)

      if (!schema) {
        throw new Error(
          `Schema not found: "${schemaId}" does not exist in project "${projectId}"`
        )
      }

      // CRITICAL: Validate project context
      if (schema.projectId !== projectId) {
        console.error(
          `❌ Project ID mismatch: Schema "${schemaId}" belongs to project "${schema.projectId}" but was requested from project "${projectId}"`
        )
        throw new Error(
          'Schema Not Found in Current Project Context: This schema does not belong to the selected project'
        )
      }

      console.log(`✅ FirebaseSchemaRepository: Schema definition validated`)
      return schema
    } catch (error) {
      console.error('❌ FirebaseSchemaRepository: Error fetching schema definition:', error)
      throw error instanceof Error ? error : new Error('Unknown error')
    }
  }

  /**
   * Create a new schema
   *
   * @param projectId - The project ID
   * @param schemaData - The schema data
   * @param userId - The user ID creating the schema
   * @returns Promise<string> - The created schema ID
   * @throws Error if validation fails or creation fails
   */
  async createSchema(
    projectId: string,
    schemaData: CreateSchemaInput,
    userId: string
  ): Promise<string> {
    try {
      validateProjectId(projectId)
      console.log(`🚀 FirebaseSchemaRepository: Creating schema ${schemaData.id}`)

      // Validate input
      if (!schemaData.id || !schemaData.name || !schemaData.fields || schemaData.fields.length === 0) {
        throw new Error('Invalid schema data: id, name, and fields are required')
      }

      // Check if schema already exists
      const existingSchema = await this.getSchemaById(projectId, schemaData.id)
      if (existingSchema) {
        throw new Error(`Schema with ID "${schemaData.id}" already exists in this project`)
      }

      // Prepare schema data using adapter
      const schemaDocument = {
        ...SchemaAdapter.toFirestoreCreate(schemaData, projectId, userId),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      // Create schema document
      const schemaDocRef = getProjectScopedDocRef(COLLECTIONS.SCHEMAS, schemaData.id, projectId)
      await setDoc(schemaDocRef, schemaDocument)
      console.log(`✅ FirebaseSchemaRepository: Schema ${schemaData.id} created`)

      // Audit logging
      try {
        await AuditService.logAction({
          projectId,
          userId,
          action: 'CREATE',
          resourceType: 'SCHEMA',
          resourceId: schemaData.id,
          details: {
            schema_name: schemaData.name,
            schema_id: schemaData.id,
            field_count: schemaData.fields.length,
            fields: schemaData.fields.map(f => f.name),
          },
          timestamp: new Date(),
        })
        console.log('✅ FirebaseSchemaRepository: Audit log created')
      } catch (auditError) {
        console.error('❌ FirebaseSchemaRepository: Audit logging failed:', auditError)
      }

      return schemaData.id
    } catch (error) {
      console.error('❌ FirebaseSchemaRepository: Error creating schema:', error)
      throw new Error(
        `Failed to create schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Update an existing schema
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to update
   * @param updates - The fields to update
   * @param userId - The user ID performing the update
   * @returns Promise<void>
   * @throws Error if schema not found or update fails
   */
  async updateSchema(
    projectId: string,
    schemaId: string,
    updates: UpdateSchemaInput,
    userId: string
  ): Promise<void> {
    try {
      validateProjectId(projectId)
      console.log(`📝 FirebaseSchemaRepository: Updating schema ${schemaId}`)

      // Verify schema exists and get current state
      const existingSchema = await this.getSchemaById(projectId, schemaId)
      if (!existingSchema) {
        throw new Error(`Schema "${schemaId}" not found in project "${projectId}"`)
      }

      // Validate project integrity
      if (existingSchema.projectId !== projectId) {
        throw new Error(
          `Project ID mismatch: Schema "${schemaId}" belongs to project "${existingSchema.projectId}"`
        )
      }

      // Track field changes for audit
      const oldFields = existingSchema.fields || []
      const newFields = updates.fields || oldFields
      const addedFields = newFields.filter(nf => !oldFields.some(of => of.name === nf.name)).map(f => f.name)
      const removedFields = oldFields.filter(of => !newFields.some(nf => nf.name === of.name)).map(f => f.name)
      const modifiedFields = newFields.filter(nf => {
        const oldField = oldFields.find(of => of.name === nf.name)
        return oldField && JSON.stringify(oldField) !== JSON.stringify(nf)
      }).map(f => f.name)

      // Prepare update data using adapter
      const updateData = {
        ...SchemaAdapter.toFirestoreUpdate(updates, userId),
        updated_at: serverTimestamp(),
      }

      // Update Firestore
      const schemaDocRef = getProjectScopedDocRef(COLLECTIONS.SCHEMAS, schemaId, projectId)
      await updateDoc(schemaDocRef, updateData)
      console.log(`✅ FirebaseSchemaRepository: Schema ${schemaId} updated`)

      // Audit logging
      try {
        await AuditService.logAction({
          projectId,
          userId,
          action: 'UPDATE',
          resourceType: 'SCHEMA',
          resourceId: schemaId,
          details: {
            schema_name: updates.name || existingSchema.name,
            field_changes: {
              added: addedFields,
              removed: removedFields,
              modified: modifiedFields,
            },
            total_fields_before: oldFields.length,
            total_fields_after: newFields.length,
          },
          timestamp: new Date(),
        })
        console.log('✅ FirebaseSchemaRepository: Audit log created')
      } catch (auditError) {
        console.error('❌ FirebaseSchemaRepository: Audit logging failed:', auditError)
      }
    } catch (error) {
      console.error(`❌ FirebaseSchemaRepository: Error updating schema ${schemaId}:`, error)
      throw new Error(
        `Failed to update schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Delete a schema
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to delete
   * @param collectionId - The collection ID (for content validation)
   * @param userId - The user ID performing the deletion
   * @returns Promise<void>
   * @throws Error if schema not found, content exists, or deletion fails
   */
  async deleteSchema(
    projectId: string,
    schemaId: string,
    collectionId: string,
    userId: string
  ): Promise<void> {
    try {
      validateProjectId(projectId)
      console.log(`🗑️ FirebaseSchemaRepository: Deleting schema ${schemaId}`)

      // Verify schema exists
      const existingSchema = await this.getSchemaById(projectId, schemaId)
      if (!existingSchema) {
        throw new Error(`Schema "${schemaId}" not found in project "${projectId}"`)
      }

      // CRITICAL: Check for existing content entries
      const projectDocRef = doc(db, 'projects', projectId)
      const dataCollectionRef = collection(projectDocRef, 'data', collectionId)
      const contentQuery = query(dataCollectionRef, limit(1))
      const contentSnapshot = await getDocs(contentQuery)

      if (!contentSnapshot.empty) {
        throw new Error(
          `Cannot delete schema. Content entries exist for collection "${collectionId}". ` +
          `Please delete all content entries before deleting the schema.`
        )
      }

      // Delete schema document
      const schemaDocRef = getProjectScopedDocRef(COLLECTIONS.SCHEMAS, schemaId, projectId)
      await deleteDoc(schemaDocRef)
      console.log(`✅ FirebaseSchemaRepository: Schema ${schemaId} deleted`)

      // Audit logging
      try {
        await AuditService.logAction({
          projectId,
          userId,
          action: 'DELETE',
          resourceType: 'SCHEMA',
          resourceId: schemaId,
          details: {
            schema_name: existingSchema.name,
            schema_id: schemaId,
            collection_id: collectionId,
            field_count: existingSchema.fields?.length || 0,
          },
          timestamp: new Date(),
        })
        console.log('✅ FirebaseSchemaRepository: Audit log created')
      } catch (auditError) {
        console.error('❌ FirebaseSchemaRepository: Audit logging failed:', auditError)
      }
    } catch (error) {
      console.error(`❌ FirebaseSchemaRepository: Error deleting schema ${schemaId}:`, error)
      throw error instanceof Error ? error : new Error('Unknown error')
    }
  }

  /**
   * Check if a schema exists
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to check
   * @returns Promise<boolean> - True if schema exists
   */
  async schemaExists(projectId: string, schemaId: string): Promise<boolean> {
    try {
      const schema = await this.getSchemaById(projectId, schemaId)
      return schema !== null
    } catch (error) {
      console.error('❌ FirebaseSchemaRepository: Error checking schema existence:', error)
      return false
    }
  }
}
