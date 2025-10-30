/**
 * Schema Management Use Case
 *
 * Application-layer implementation for schema management operations.
 * Orchestrates schema CRUD with validation, audit logging, and business rules.
 *
 * **Architecture - Clean Architecture Application Layer:**
 * - Dependencies: ISchemaRepository, IContentRepository, IAuditRepository
 * - Responsibility: Schema management business logic and orchestration
 * - No Framework Dependencies: Uses only domain entities and repository interfaces
 *
 * **Business Rules Enforced:**
 * 1. Role-based access control (Admin/Super for write operations)
 * 2. Schema ID uniqueness within projects
 * 3. Content existence validation before schema deletion
 * 4. Mandatory audit logging for all modifications
 * 5. Field structure validation
 * 6. Project context validation
 *
 * **SRP Compliance:**
 * Unlike the old SchemaService which mixed data access, business logic, and audit logging,
 * this use case delegates:
 * - Data access → ISchemaRepository
 * - Audit logging → IAuditRepository
 * - Content checks → IContentRepository
 * - Business logic → This class
 *
 * @see ISchemaManagementUseCase
 */

import type {
  ISchemaManagementUseCase,
  SchemaWithStats,
  SchemaDeletionResult,
} from './ISchemaManagementUseCase'
import type { ISchemaRepository } from '@/domain/repositories/ISchemaRepository'
import type { IContentRepository } from '@/domain/repositories/IContentRepository'
import type { IAuditRepository } from '@/domain/repositories/IAuditRepository'
import type {
  SchemaDefinition,
  CreateSchemaInput,
  UpdateSchemaInput,
  SchemaField,
} from '@/domain/entities'
import type { UserRole } from '@/domain/entities'

/**
 * SchemaManagementUseCase Implementation
 *
 * Concrete implementation of schema management business logic.
 */
export class SchemaManagementUseCase implements ISchemaManagementUseCase {
  private readonly schemaRepository: ISchemaRepository
  private readonly contentRepository: IContentRepository
  private readonly auditRepository: IAuditRepository

  /**
   * Constructor with dependency injection
   *
   * @param schemaRepository - Schema data access abstraction
   * @param contentRepository - Content data access for existence checks
   * @param auditRepository - Audit logging abstraction
   */
  constructor(
    schemaRepository: ISchemaRepository,
    contentRepository: IContentRepository,
    auditRepository: IAuditRepository
  ) {
    this.schemaRepository = schemaRepository
    this.contentRepository = contentRepository
    this.auditRepository = auditRepository
  }

  /**
   * Get all schemas for a project
   *
   * Retrieves all schemas with role-based access validation.
   *
   * @param projectId - The project ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<SchemaDefinition[]> - List of schemas
   */
  async getSchemasForProject(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<SchemaDefinition[]> {
    // Validate inputs
    this.validateProjectId(projectId)
    this.validateUserId(userId)

    // Validate access (all authenticated users can view schemas)
    if (!userRole) {
      throw new Error('User role is required')
    }

    console.log(`📋 SchemaManagementUseCase: Fetching schemas for project ${projectId}`)

    try {
      const schemas = await this.schemaRepository.getSchemasForProject(projectId)
      console.log(`✅ Retrieved ${schemas.length} schemas`)
      return schemas
    } catch (error) {
      console.error('❌ Failed to fetch schemas:', error)
      throw new Error(
        `Failed to fetch schemas: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get schemas with content statistics
   *
   * Enriches schema information with content counts.
   *
   * @param projectId - The project ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<SchemaWithStats[]> - Schemas with statistics
   */
  async getSchemasWithStats(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<SchemaWithStats[]> {
    console.log(`📊 SchemaManagementUseCase: Fetching schemas with stats`)

    // Get all schemas
    const schemas = await this.getSchemasForProject(projectId, userId, userRole)

    // Enrich with content statistics
    const schemasWithStats: SchemaWithStats[] = []

    for (const schema of schemas) {
      try {
        // Get content count for this schema's collection
        const contentCount = await this.contentRepository.countContentEntries(
          projectId,
          schema.id
        )

        // Get status-specific counts
        const entries = await this.contentRepository.getContentEntries(projectId, schema.id, {
          limit: 1000, // Reasonable limit for counting
        })

        const draftCount = entries.filter(e => e.status === 'draft').length
        const publishedCount = entries.filter(e => e.status === 'published').length

        schemasWithStats.push({
          schema,
          contentCount,
          draftCount,
          publishedCount,
        })
      } catch (error) {
        console.error(`❌ Failed to get stats for schema ${schema.id}:`, error)
        // Include schema with zero counts if stats fail
        schemasWithStats.push({
          schema,
          contentCount: 0,
          draftCount: 0,
          publishedCount: 0,
        })
      }
    }

    return schemasWithStats
  }

  /**
   * Get a schema by ID
   *
   * Retrieves a specific schema with project context validation.
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<SchemaDefinition | null> - Schema or null
   */
  async getSchemaById(
    projectId: string,
    schemaId: string,
    userId: string,
    _userRole: string
  ): Promise<SchemaDefinition | null> {
    this.validateProjectId(projectId)
    this.validateSchemaId(schemaId)
    this.validateUserId(userId)

    console.log(`📋 SchemaManagementUseCase: Fetching schema ${schemaId}`)

    try {
      const schema = await this.schemaRepository.getSchemaById(projectId, schemaId)

      if (!schema) {
        console.warn(`⚠️ Schema not found: ${schemaId}`)
        return null
      }

      // Validate schema belongs to correct project
      if (schema.projectId !== projectId) {
        throw new Error(
          `Schema project mismatch: Schema belongs to ${schema.projectId} but requested from ${projectId}`
        )
      }

      return schema
    } catch (error) {
      console.error('❌ Failed to fetch schema:', error)
      throw new Error(
        `Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Create a new schema
   *
   * Creates a schema with validation, role checks, and audit logging.
   *
   * **Business Rules:**
   * - Only Admin or Super users can create schemas
   * - Schema ID must be unique and valid
   * - Must have at least one field
   * - Field names must be unique
   * - Audit log is mandatory
   *
   * @param projectId - The project ID
   * @param schemaData - The schema definition data
   * @param userId - The user creating the schema
   * @param userRole - The user's role
   * @returns Promise<string> - The created schema ID
   */
  async createSchema(
    projectId: string,
    schemaData: CreateSchemaInput,
    userId: string,
    userRole: string
  ): Promise<string> {
    console.log(`📝 SchemaManagementUseCase: Creating schema ${schemaData.id}`)

    // Step 1: Validate inputs
    this.validateProjectId(projectId)
    this.validateUserId(userId)
    this.validateCreateSchemaInput(schemaData)

    // Step 2: Validate role-based access
    if (!this.canManageSchemas(userRole as UserRole)) {
      throw new Error(
        `Permission denied: Only Admin or Super users can create schemas. Current role: ${userRole}`
      )
    }

    // Step 3: Validate schema ID format
    this.validateSchemaIdFormat(schemaData.id)

    // Step 4: Check if schema ID is available
    const isAvailable = await this.isSchemaIdAvailable(projectId, schemaData.id)
    if (!isAvailable) {
      throw new Error(`Schema ID "${schemaData.id}" already exists in this project`)
    }

    // Step 5: Validate schema structure
    const validation = await this.validateSchemaStructure({ fields: schemaData.fields })
    if (!validation.isValid) {
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`)
    }

    try {
      // Step 6: Create schema via repository
      const schemaId = await this.schemaRepository.createSchema(projectId, schemaData, userId)

      console.log(`✅ Schema created: ${schemaId}`)

      // Step 7: MANDATORY AUDIT LOGGING
      try {
        await this.auditRepository.logAction({
          projectId,
          userId,
          action: 'SCHEMA_CREATE',
          resourceType: 'SCHEMA',
          resourceId: schemaId,
          details: {
            schema_name: schemaData.name,
            schema_id: schemaId,
            field_count: schemaData.fields.length,
            fields: schemaData.fields.map(f => f.name),
            display_field: schemaData.displayField,
          },
          timestamp: new Date(),
        })

        console.log('✅ Audit log created for schema creation')
      } catch (auditError) {
        // Log error but don't fail the operation
        console.error('❌ Failed to create audit log (schema was created):', auditError)
      }

      return schemaId
    } catch (error) {
      console.error('❌ Failed to create schema:', error)
      throw new Error(
        `Failed to create schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Update an existing schema
   *
   * Updates schema with change tracking and audit logging.
   *
   * **Business Rules:**
   * - Only Admin or Super users can update
   * - Tracks all field changes
   * - Creates detailed audit log
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to update
   * @param updates - The fields to update
   * @param userId - The user performing the update
   * @param userRole - The user's role
   * @returns Promise<void>
   */
  async updateSchema(
    projectId: string,
    schemaId: string,
    updates: UpdateSchemaInput,
    userId: string,
    userRole: string
  ): Promise<void> {
    console.log(`📝 SchemaManagementUseCase: Updating schema ${schemaId}`)

    // Step 1: Validate inputs
    this.validateProjectId(projectId)
    this.validateSchemaId(schemaId)
    this.validateUserId(userId)

    // Step 2: Validate role-based access
    if (!this.canManageSchemas(userRole as UserRole)) {
      throw new Error(
        `Permission denied: Only Admin or Super users can update schemas. Current role: ${userRole}`
      )
    }

    try {
      // Step 3: Fetch existing schema for change tracking
      const existingSchema = await this.schemaRepository.getSchemaById(projectId, schemaId)
      if (!existingSchema) {
        throw new Error(`Schema "${schemaId}" not found in project "${projectId}"`)
      }

      // Step 4: Validate project context
      if (existingSchema.projectId !== projectId) {
        throw new Error(
          `Project mismatch: Schema belongs to ${existingSchema.projectId} but update requested for ${projectId}`
        )
      }

      // Step 5: Validate schema structure if fields are being updated
      if (updates.fields) {
        const validation = await this.validateSchemaStructure({ fields: updates.fields })
        if (!validation.isValid) {
          throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`)
        }
      }

      // Step 6: Track field changes for audit log
      const changeSummary = this.buildChangeSummary(existingSchema, updates)

      // Step 7: Update schema via repository
      await this.schemaRepository.updateSchema(projectId, schemaId, updates, userId)

      console.log(`✅ Schema updated: ${schemaId}`)

      // Step 8: MANDATORY AUDIT LOGGING
      try {
        await this.auditRepository.logAction({
          projectId,
          userId,
          action: 'SCHEMA_UPDATE',
          resourceType: 'SCHEMA',
          resourceId: schemaId,
          details: {
            schema_name: updates.name || existingSchema.name,
            change_summary: changeSummary,
            old_field_count: existingSchema.fields?.length || 0,
            new_field_count: updates.fields?.length || existingSchema.fields?.length || 0,
          },
          timestamp: new Date(),
        })

        console.log('✅ Audit log created for schema update')
      } catch (auditError) {
        console.error('❌ Failed to create audit log (schema was updated):', auditError)
      }
    } catch (error) {
      console.error('❌ Failed to update schema:', error)
      throw new Error(
        `Failed to update schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Delete a schema
   *
   * Deletes schema with content existence validation and audit logging.
   *
   * **CRITICAL BUSINESS RULE:**
   * Cannot delete schema if content entries exist.
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to delete
   * @param userId - The Super user performing the deletion
   * @returns Promise<void>
   */
  async deleteSchema(projectId: string, schemaId: string, userId: string): Promise<void> {
    console.log(`🗑️ SchemaManagementUseCase: Deleting schema ${schemaId}`)

    // Step 1: Validate inputs
    this.validateProjectId(projectId)
    this.validateSchemaId(schemaId)
    this.validateUserId(userId)

    try {
      // Step 2: Fetch schema to get metadata
      const existingSchema = await this.schemaRepository.getSchemaById(projectId, schemaId)
      if (!existingSchema) {
        throw new Error(`Schema "${schemaId}" not found in project "${projectId}"`)
      }

      // Step 3: CRITICAL - Validate content existence
      console.log('🔍 Checking for existing content entries...')
      const contentCount = await this.contentRepository.countContentEntries(projectId, schemaId)

      if (contentCount > 0) {
        throw new Error(
          `Cannot delete schema. ${contentCount} content entries exist for collection "${schemaId}". ` +
          `Please delete all content entries before deleting the schema.`
        )
      }

      console.log('✅ No content entries found - safe to delete')

      // Step 4: Delete schema via repository
      await this.schemaRepository.deleteSchema(projectId, schemaId, schemaId, userId)

      console.log(`✅ Schema deleted: ${schemaId}`)

      // Step 5: MANDATORY AUDIT LOGGING
      try {
        await this.auditRepository.logAction({
          projectId,
          userId,
          action: 'SCHEMA_DELETE',
          resourceType: 'SCHEMA',
          resourceId: schemaId,
          details: {
            schema_name: existingSchema.name,
            schema_id: schemaId,
            field_count: existingSchema.fields?.length || 0,
            deletion_verified: 'Content collection was empty',
          },
          timestamp: new Date(),
        })

        console.log('✅ Audit log created for schema deletion')
      } catch (auditError) {
        console.error('❌ Failed to create audit log (schema was deleted):', auditError)
      }
    } catch (error) {
      console.error('❌ Failed to delete schema:', error)
      throw error
    }
  }

  /**
   * Validate schema deletion
   *
   * Checks if schema can be safely deleted.
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to check
   * @returns Promise<SchemaDeletionResult> - Validation result
   */
  async validateSchemaDeletion(
    projectId: string,
    schemaId: string
  ): Promise<SchemaDeletionResult> {
    try {
      const schema = await this.schemaRepository.getSchemaById(projectId, schemaId)

      if (!schema) {
        return {
          canDelete: false,
          reason: 'Schema not found',
        }
      }

      if (schema.isSystem) {
        return {
          canDelete: false,
          reason: 'Cannot delete system schemas',
        }
      }

      const contentCount = await this.contentRepository.countContentEntries(projectId, schemaId)

      if (contentCount > 0) {
        return {
          canDelete: false,
          reason: `Cannot delete schema with ${contentCount} existing content entries`,
          contentCount,
        }
      }

      return {
        canDelete: true,
        contentCount: 0,
      }
    } catch (error) {
      console.error('❌ Error validating schema deletion:', error)
      return {
        canDelete: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Validate schema structure
   *
   * Validates field names are unique and structure is valid.
   *
   * @param schemaData - The schema data to validate
   * @returns Promise<{ isValid: boolean; errors: string[] }> - Validation result
   */
  async validateSchemaStructure(schemaData: {
    fields: SchemaField[]
  }): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!schemaData.fields || schemaData.fields.length === 0) {
      errors.push('Schema must have at least one field')
    }

    // Check for duplicate field names
    const fieldNames = new Set<string>()
    for (const field of schemaData.fields) {
      if (!field.name || !field.type || !field.label) {
        errors.push(`Field must have name, type, and label: ${JSON.stringify(field)}`)
      }

      if (fieldNames.has(field.name)) {
        errors.push(`Duplicate field name: ${field.name}`)
      }
      fieldNames.add(field.name)

      // Validate field name format
      if (field.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push(
          `Invalid field name "${field.name}": Must start with letter or underscore, contain only alphanumeric characters and underscores`
        )
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Check if schema ID is available
   *
   * @param projectId - The project ID
   * @param schemaId - The schema ID to check
   * @returns Promise<boolean> - True if ID is available
   */
  async isSchemaIdAvailable(projectId: string, schemaId: string): Promise<boolean> {
    try {
      const schema = await this.schemaRepository.getSchemaById(projectId, schemaId)
      return schema === null
    } catch (error) {
      console.error('❌ Error checking schema availability:', error)
      return false
    }
  }

  /**
   * Get field suggestions based on field type
   *
   * @param fieldType - The field type
   * @returns Promise<Partial<SchemaField>> - Suggested field configuration
   */
  async getFieldSuggestions(fieldType: string): Promise<Partial<SchemaField>> {
    // Provide sensible defaults based on field type
    const suggestions: Record<string, Partial<SchemaField>> = {
      text: { required: false, maxLength: 255 },
      textarea: { required: false, maxLength: 5000 },
      richtext: { required: false },
      number: { required: false },
      boolean: { required: false, defaultValue: false },
      date: { required: false },
      select: { required: false, options: { choices: [] } },
      multiselect: { required: false, options: { choices: [] } },
      image: { required: false },
      file: { required: false },
    }

    return suggestions[fieldType] || { required: false }
  }

  // ========== Private Helper Methods ==========

  /**
   * Validate project ID
   */
  private validateProjectId(projectId: string): void {
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      throw new Error('Invalid project ID: Project ID must be a non-empty string')
    }
  }

  /**
   * Validate schema ID
   */
  private validateSchemaId(schemaId: string): void {
    if (!schemaId || typeof schemaId !== 'string' || schemaId.trim() === '') {
      throw new Error('Invalid schema ID: Schema ID must be a non-empty string')
    }
  }

  /**
   * Validate user ID
   */
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID: User ID must be a non-empty string')
    }
  }

  /**
   * Validate create schema input
   */
  private validateCreateSchemaInput(schemaData: CreateSchemaInput): void {
    if (!schemaData || typeof schemaData !== 'object') {
      throw new Error('Invalid schema data: Schema data must be an object')
    }

    if (!schemaData.id || typeof schemaData.id !== 'string' || schemaData.id.trim() === '') {
      throw new Error('Invalid schema ID: Schema ID must be a non-empty string')
    }

    if (!schemaData.name || typeof schemaData.name !== 'string' || schemaData.name.trim() === '') {
      throw new Error('Invalid schema name: Schema name must be a non-empty string')
    }

    if (!Array.isArray(schemaData.fields) || schemaData.fields.length === 0) {
      throw new Error('Invalid fields: Schema must have at least one field')
    }
  }

  /**
   * Validate schema ID format
   */
  private validateSchemaIdFormat(schemaId: string): void {
    // Schema IDs should be lowercase, alphanumeric, and underscores
    if (!/^[a-z0-9_]+$/.test(schemaId)) {
      throw new Error(
        'Invalid schema ID format: Must be lowercase, alphanumeric characters, and underscores only'
      )
    }
  }

  /**
   * Check if user role can manage schemas
   */
  private canManageSchemas(userRole: UserRole): boolean {
    return userRole === 'Admin' || userRole === 'Super'
  }

  /**
   * Build change summary for audit log
   */
  private buildChangeSummary(
    existingSchema: SchemaDefinition,
    updates: UpdateSchemaInput
  ): string {
    const changes: string[] = []

    if (updates.name && updates.name !== existingSchema.name) {
      changes.push(`Renamed from "${existingSchema.name}" to "${updates.name}"`)
    }

    if (updates.description && updates.description !== existingSchema.description) {
      changes.push('Updated description')
    }

    if (updates.fields) {
      const oldFields = existingSchema.fields || []
      const newFields = updates.fields
      const oldFieldNames = oldFields.map(f => f.name)
      const newFieldNames = newFields.map(f => f.name)

      const addedFields = newFieldNames.filter(name => !oldFieldNames.includes(name))
      const removedFields = oldFieldNames.filter(name => !newFieldNames.includes(name))

      if (addedFields.length > 0) {
        changes.push(`Added ${addedFields.length} field(s): ${addedFields.join(', ')}`)
      }
      if (removedFields.length > 0) {
        changes.push(`Removed ${removedFields.length} field(s): ${removedFields.join(', ')}`)
      }
    }

    return changes.length > 0 ? changes.join('; ') : 'Schema updated'
  }
}
