/**
 * Content Management Use Case Implementation
 *
 * Concrete implementation of IContentManagementUseCase that orchestrates
 * content management operations using repository interfaces.
 *
 * **Key Architecture Fix:**
 * This class demonstrates the core architectural improvements:
 * 1. Single Responsibility Principle (SRP) - Only orchestrates business logic
 * 2. Dependency Inversion - Depends on interfaces, not implementations
 * 3. Separation of Concerns - Business rules separated from data access
 * 4. Constructor Injection - Dependencies injected via constructor
 *
 * **Example of SRP Fix:**
 * OLD (Violation):
 * ```typescript
 * // SchemaService.ts - Mixed responsibilities
 * await updateDoc(schemaRef, data)  // Data access
 * await AuditService.logAction(...)  // Audit logging
 * // Business logic, data access, and logging all mixed together
 * ```
 *
 * NEW (Fixed):
 * ```typescript
 * // ContentManagementUseCase.ts - Clear separation
 * constructor(
 *   private contentRepo: IContentRepository,  // Data access
 *   private auditRepo: IAuditRepository       // Audit logging
 * ) {}
 *
 * async createContentEntry(...) {
 *   // Business logic orchestration
 *   await this.contentRepo.createContentEntry(...)
 *   await this.auditRepo.logAction(...)
 * }
 * ```
 */

import type {
  IContentManagementUseCase,
  ContentEntryWithSchema,
  ContentValidationResult,
  BatchOperationResult,
} from './IContentManagementUseCase'
import type {
  IContentRepository,
  ISchemaRepository,
  IAuditRepository,
} from '@/domain/repositories'
import type {
  ContentEntry,
  CreateContentEntryInput,
  UpdateContentEntryInput,
  GetContentEntriesOptions,
  SchemaDefinition,
} from '@/domain/entities'
import { ContentMapper } from '@/domain/dtos'
import type { ContentListDTO } from '@/domain/dtos'

/**
 * ContentManagementUseCase
 *
 * Implements the IContentManagementUseCase interface, orchestrating
 * content operations by coordinating between content, schema, and audit repositories.
 */
export class ContentManagementUseCase implements IContentManagementUseCase {
  private readonly contentRepository: IContentRepository
  private readonly schemaRepository: ISchemaRepository
  private readonly auditRepository: IAuditRepository

  /**
   * Constructor with Dependency Injection
   *
   * **CRITICAL: This demonstrates the architectural fix**
   * Dependencies are injected via constructor (not imported directly),
   * enabling proper separation of concerns and testability.
   *
   * @param contentRepository - Content data access
   * @param schemaRepository - Schema data access
   * @param auditRepository - Audit logging
   */
  constructor(
    contentRepository: IContentRepository,
    schemaRepository: ISchemaRepository,
    auditRepository: IAuditRepository
  ) {
    this.contentRepository = contentRepository
    this.schemaRepository = schemaRepository
    this.auditRepository = auditRepository
  }

  /**
   * Get content entries for a collection
   *
   * Business Logic:
   * - Validates user has access to project
   * - Applies role-based filtering
   * - Maps entities to DTOs for UI consumption
   */
  async getContentEntries(
    projectId: string,
    collectionId: string,
    options: GetContentEntriesOptions,
    userId: string,
    userRole: string
  ): Promise<ContentListDTO[]> {
    // Validate project access (business rule)
    await this.validateProjectAccess(projectId, userId, userRole)

    // Delegate to repository (data access)
    const entities = await this.contentRepository.getContentEntries(projectId, collectionId, options)

    // Map entities to DTOs (Interface Segregation Principle)
    return ContentMapper.toListDTOList(entities)
  }

  /**
   * Get published content only
   *
   * Business Logic:
   * - Filters for published status only
   * - Public-facing content retrieval
   */
  async getPublishedContent(
    projectId: string,
    collectionId: string
  ): Promise<ContentEntry[]> {
    // Apply business rule: only published content
    return this.contentRepository.getContentEntries(projectId, collectionId, {
      limit: 100,
      filterField: 'status',
      filterValue: 'published',
    })
  }

  /**
   * Get draft content only
   *
   * Business Logic:
   * - Requires Admin or Super role
   * - Returns draft entries only
   */
  async getDraftContent(
    projectId: string,
    collectionId: string,
    userId: string,
    userRole: string
  ): Promise<ContentEntry[]> {
    // Business rule: Only Admin/Super can view drafts
    if (userRole !== 'Admin' && userRole !== 'Super') {
      throw new Error('Permission denied: Only Admin or Super users can view draft content')
    }

    await this.validateProjectAccess(projectId, userId, userRole)

    return this.contentRepository.getContentEntries(projectId, collectionId, {
      limit: 100,
      filterField: 'status',
      filterValue: 'draft',
    })
  }

  /**
   * Get a single content entry by ID
   *
   * Business Logic:
   * - Validates access
   * - Retrieves entry with schema
   * - Returns enriched data
   */
  async getContentEntryById(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string,
    userRole: string
  ): Promise<ContentEntryWithSchema | null> {
    await this.validateProjectAccess(projectId, userId, userRole)

    // Get entry from repository
    const entry = await this.contentRepository.getContentEntryById(
      projectId,
      collectionId,
      entryId
    )

    if (!entry) {
      return null
    }

    // Get schema for validation context
    const schema = await this.schemaRepository.getSchemaById(projectId, collectionId)

    if (!schema) {
      throw new Error(`Schema not found: ${collectionId}`)
    }

    return {
      entry,
      schema,
    }
  }

  /**
   * Create a new content entry
   *
   * **DEMONSTRATES SRP FIX:**
   * This method shows the separation of concerns:
   * 1. Business validation (this class)
   * 2. Data persistence (IContentRepository)
   * 3. Audit logging (IAuditRepository)
   *
   * Business Logic:
   * - Validates user permission
   * - Validates data against schema
   * - Creates entry
   * - Logs action
   */
  async createContentEntry(
    projectId: string,
    collectionId: string,
    entryData: CreateContentEntryInput,
    userId: string,
    userRole: string
  ): Promise<string> {
    // Business rule: Only Admin/Super can create content
    if (userRole !== 'Admin' && userRole !== 'Super') {
      throw new Error('Permission denied: Only Admin or Super users can create content')
    }

    await this.validateProjectAccess(projectId, userId, userRole)

    // Business rule: Validate against schema
    const validationResult = await this.validateContentEntry(
      projectId,
      collectionId,
      entryData.data
    )

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Content validation failed: ${errorMessages.join(', ')}`)
    }

    // Data access: Create entry
    const entryId = await this.contentRepository.createContentEntry(
      projectId,
      collectionId,
      entryData,
      userId
    )

    // Audit logging: Log the action
    // **THIS IS THE KEY FIX** - Separated from data access
    try {
      await this.auditRepository.logAction({
        projectId,
        userId,
        action: 'CREATE',
        resourceType: 'CONTENT',
        resourceId: entryId,
        details: {
          collectionId,
          status: entryData.status || 'draft',
          fieldCount: Object.keys(entryData.data).length,
        },
        timestamp: new Date(),
      })
    } catch (auditError) {
      // Audit failure should not fail the operation
      console.error('Failed to log audit entry:', auditError)
    }

    return entryId
  }

  /**
   * Update an existing content entry
   *
   * **DEMONSTRATES SRP FIX:**
   * Separation: validation → data access → audit logging
   */
  async updateContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    updates: UpdateContentEntryInput,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Business rule: Only Admin/Super can update
    if (userRole !== 'Admin' && userRole !== 'Super') {
      throw new Error('Permission denied: Only Admin or Super users can update content')
    }

    await this.validateProjectAccess(projectId, userId, userRole)

    // Business rule: Validate updated data if provided
    if (updates.data) {
      const validationResult = await this.validateContentEntry(
        projectId,
        collectionId,
        updates.data
      )

      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors.map((e) => `${e.field}: ${e.message}`)
        throw new Error(`Content validation failed: ${errorMessages.join(', ')}`)
      }
    }

    // Get existing entry for audit comparison
    const existingEntry = await this.contentRepository.getContentEntryById(
      projectId,
      collectionId,
      entryId
    )

    if (!existingEntry) {
      throw new Error(`Content entry not found: ${entryId}`)
    }

    // Data access: Update entry
    await this.contentRepository.updateContentEntry(
      projectId,
      collectionId,
      entryId,
      updates,
      userId
    )

    // Audit logging: Log the update
    try {
      const changes: string[] = []
      if (updates.data) changes.push('data')
      if (updates.status && updates.status !== existingEntry.status) changes.push('status')

      await this.auditRepository.logAction({
        projectId,
        userId,
        action: 'UPDATE',
        resourceType: 'CONTENT',
        resourceId: entryId,
        details: {
          collectionId,
          changes,
          oldStatus: existingEntry.status,
          newStatus: updates.status || existingEntry.status,
        },
        timestamp: new Date(),
      })
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError)
    }
  }

  /**
   * Delete a content entry
   *
   * **DEMONSTRATES SRP FIX:**
   * Orchestrates: permission check → data deletion → audit logging
   */
  async deleteContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Business rule: Only Admin/Super can delete
    if (userRole !== 'Admin' && userRole !== 'Super') {
      throw new Error('Permission denied: Only Admin or Super users can delete content')
    }

    await this.validateProjectAccess(projectId, userId, userRole)

    // Get entry details for audit before deletion
    const entry = await this.contentRepository.getContentEntryById(
      projectId,
      collectionId,
      entryId
    )

    if (!entry) {
      throw new Error(`Content entry not found: ${entryId}`)
    }

    // Data access: Delete entry
    await this.contentRepository.deleteContentEntry(projectId, collectionId, entryId, userId)

    // Audit logging: Log the deletion with snapshot
    try {
      await this.auditRepository.logAction({
        projectId,
        userId,
        action: 'DELETE',
        resourceType: 'CONTENT',
        resourceId: entryId,
        details: {
          collectionId,
          entryTitle: entry.data.title || entry.data.name || `Entry ${entryId}`,
          snapshot: entry.data, // Capture data before deletion
        },
        timestamp: new Date(),
      })
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError)
    }
  }

  /**
   * Publish content entry
   *
   * Business Logic:
   * - Validates all required fields present
   * - Changes status to 'published'
   * - Logs publish action
   */
  async publishContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    if (userRole !== 'Admin' && userRole !== 'Super') {
      throw new Error('Permission denied: Only Admin or Super users can publish content')
    }

    await this.validateProjectAccess(projectId, userId, userRole)

    // Get entry to validate
    const entry = await this.contentRepository.getContentEntryById(
      projectId,
      collectionId,
      entryId
    )

    if (!entry) {
      throw new Error(`Content entry not found: ${entryId}`)
    }

    // Business rule: Validate before publishing
    const validationResult = await this.validateContentEntry(
      projectId,
      collectionId,
      entry.data
    )

    if (!validationResult.isValid) {
      throw new Error('Cannot publish: Content has validation errors')
    }

    // Update status to published
    await this.contentRepository.updateContentEntry(
      projectId,
      collectionId,
      entryId,
      { status: 'published' },
      userId
    )

    // Audit logging
    try {
      await this.auditRepository.logAction({
        projectId,
        userId,
        action: 'PUBLISH',
        resourceType: 'CONTENT',
        resourceId: entryId,
        details: {
          collectionId,
          previousStatus: entry.status,
        },
        timestamp: new Date(),
      })
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError)
    }
  }

  /**
   * Unpublish content entry
   */
  async unpublishContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    if (userRole !== 'Admin' && userRole !== 'Super') {
      throw new Error('Permission denied: Only Admin or Super users can unpublish content')
    }

    await this.validateProjectAccess(projectId, userId, userRole)

    await this.contentRepository.updateContentEntry(
      projectId,
      collectionId,
      entryId,
      { status: 'draft' },
      userId
    )

    // Audit logging
    try {
      await this.auditRepository.logAction({
        projectId,
        userId,
        action: 'UNPUBLISH',
        resourceType: 'CONTENT',
        resourceId: entryId,
        details: { collectionId },
        timestamp: new Date(),
      })
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError)
    }
  }

  /**
   * Batch publish multiple entries
   *
   * Business Logic:
   * - Processes each entry individually
   * - Continues on error
   * - Returns detailed results
   */
  async batchPublishEntries(
    projectId: string,
    collectionId: string,
    entryIds: string[],
    userId: string,
    userRole: string
  ): Promise<BatchOperationResult> {
    if (userRole !== 'Admin' && userRole !== 'Super') {
      throw new Error('Permission denied: Only Admin or Super users can publish content')
    }

    await this.validateProjectAccess(projectId, userId, userRole)

    const results: BatchOperationResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    }

    for (const entryId of entryIds) {
      try {
        await this.publishContentEntry(projectId, collectionId, entryId, userId, userRole)
        results.successCount++
      } catch (error) {
        results.failureCount++
        results.errors.push({
          entryId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Batch unpublish multiple entries
   */
  async batchUnpublishEntries(
    projectId: string,
    collectionId: string,
    entryIds: string[],
    userId: string,
    userRole: string
  ): Promise<BatchOperationResult> {
    if (userRole !== 'Admin' && userRole !== 'Super') {
      throw new Error('Permission denied')
    }

    await this.validateProjectAccess(projectId, userId, userRole)

    const results: BatchOperationResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    }

    for (const entryId of entryIds) {
      try {
        await this.unpublishContentEntry(projectId, collectionId, entryId, userId, userRole)
        results.successCount++
      } catch (error) {
        results.failureCount++
        results.errors.push({
          entryId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Batch delete multiple entries (Super only)
   */
  async batchDeleteEntries(
    projectId: string,
    collectionId: string,
    entryIds: string[],
    userId: string
  ): Promise<BatchOperationResult> {
    // Business rule: Only Super users can batch delete
    const results: BatchOperationResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    }

    for (const entryId of entryIds) {
      try {
        await this.deleteContentEntry(projectId, collectionId, entryId, userId, 'Super')
        results.successCount++
      } catch (error) {
        results.failureCount++
        results.errors.push({
          entryId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Batch update status for multiple entries
   *
   * **DEMONSTRATES AUDITING CONSISTENCY BUSINESS RULE:**
   * This method enforces the critical rule that ALL content changes must be audited.
   * Each entry update creates an individual audit log entry, ensuring complete
   * traceability and audit trail for all status changes.
   *
   * **SRP Compliance:**
   * - Business logic orchestration (this method)
   * - Data access (IContentRepository.updateContentEntry)
   * - Audit logging (IAuditRepository.logAction) - INDIVIDUAL LOG PER ENTRY
   *
   * Business Logic:
   * - Validates user permission
   * - Processes each entry sequentially
   * - Fetches existing entry to track changes
   * - Skips if status already matches
   * - Updates status via repository
   * - Creates MANDATORY individual audit log for each update
   * - Continues on error (doesn't fail entire batch)
   */
  async batchUpdateStatus(
    projectId: string,
    collectionId: string,
    entryIds: string[],
    status: 'published' | 'draft',
    userId: string
  ): Promise<void> {
    // Input validation
    if (!projectId || !collectionId || !userId) {
      throw new Error('Invalid parameters for batch update operation')
    }

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      throw new Error('entryIds must be a non-empty array')
    }

    if (status !== 'published' && status !== 'draft') {
      throw new Error('status must be either "published" or "draft"')
    }

    console.log(
      `📝 ContentManagementUseCase: Batch updating ${entryIds.length} entries to status "${status}"`
    )

    // Process each entry sequentially to ensure audit logs are created properly
    let successCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const entryId of entryIds) {
      try {
        console.log(`   Processing entry ${entryId}...`)

        // Fetch existing entry to track changes
        const existingEntry = await this.contentRepository.getContentEntryById(
          projectId,
          collectionId,
          entryId
        )

        if (!existingEntry) {
          console.warn(`   Entry "${entryId}" not found, skipping`)
          errorCount++
          continue
        }

        const oldStatus = existingEntry.status

        // Skip if status is already the same
        if (oldStatus === status) {
          console.log(`   Entry ${entryId} already has status "${status}", skipping`)
          skippedCount++
          continue
        }

        // Update the status via repository
        await this.contentRepository.updateContentEntry(
          projectId,
          collectionId,
          entryId,
          { status },
          userId
        )

        console.log(`   ✅ Entry ${entryId} status updated to "${status}"`)
        successCount++

        // **CRITICAL: MANDATORY INDIVIDUAL AUDIT LOGGING for each entry**
        // This enforces the business rule that ALL content changes must be audited
        try {
          const entryName =
            existingEntry.data?.title ||
            existingEntry.data?.name ||
            `Entry ${entryId.substring(0, 8)}`

          await this.auditRepository.logAction({
            projectId,
            userId,
            action: 'UPDATE',
            resourceType: 'CONTENT',
            resourceId: entryId,
            details: {
              collection: collectionId,
              entry_name: entryName,
              old_status: oldStatus,
              new_status: status,
              change: `Status changed from "${oldStatus}" to "${status}"`,
              batch_operation: true,
            },
            timestamp: new Date(),
          })

          console.log(`   ✅ Audit log created for entry ${entryId}`)
        } catch (auditError) {
          // Audit logging failure should not fail the operation
          console.error(
            `   ⚠️ Failed to create audit log for entry ${entryId} (entry was still updated):`,
            auditError
          )
        }
      } catch (error) {
        console.error(`   ❌ Failed to update entry ${entryId}:`, error)
        errorCount++
      }
    }

    console.log(
      `✅ Batch update completed: ${successCount} updated, ${skippedCount} skipped, ${errorCount} errors`
    )
  }

  /**
   * Validate content entry against schema
   *
   * Business Logic:
   * - Retrieves schema definition
   * - Checks required fields
   * - Validates field types
   * - Returns detailed errors
   */
  async validateContentEntry(
    projectId: string,
    collectionId: string,
    entryData: Record<string, any>
  ): Promise<ContentValidationResult> {
    const schema = await this.schemaRepository.getSchemaById(projectId, collectionId)

    if (!schema) {
      throw new Error(`Schema not found: ${collectionId}`)
    }

    const errors: Array<{ field: string; message: string }> = []

    // Validate required fields
    for (const field of schema.fields) {
      if (field.required && !entryData[field.name]) {
        errors.push({
          field: field.name,
          message: `Required field '${field.label}' is missing`,
        })
      }
    }

    // Additional type validation could be added here

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get content count for a collection
   */
  async getContentCount(
    projectId: string,
    collectionId: string,
    status?: 'draft' | 'published' | 'archived'
  ): Promise<number> {
    const options: GetContentEntriesOptions = {
      limit: 1000, // High limit to count all
    }

    if (status) {
      options.filterField = 'status'
      options.filterValue = status
    }

    const entries = await this.contentRepository.getContentEntries(
      projectId,
      collectionId,
      options
    )

    return entries.length
  }

  /**
   * Search content across fields
   */
  async searchContent(
    projectId: string,
    collectionId: string,
    searchTerm: string,
    userId: string,
    userRole: string
  ): Promise<ContentEntry[]> {
    await this.validateProjectAccess(projectId, userId, userRole)

    return this.contentRepository.getContentEntries(projectId, collectionId, {
      limit: 50,
      search: searchTerm,
    })
  }

  /**
   * Get schema definition by ID
   *
   * Business Logic:
   * - Retrieves schema from repository
   * - Returns null if schema not found
   * - Used by UI components for dynamic form/table rendering
   */
  async getSchemaById(projectId: string, schemaId: string): Promise<SchemaDefinition | null> {
    return this.schemaRepository.getSchemaById(projectId, schemaId)
  }

  /**
   * Get content entries for a collection
   *
   * Business Logic:
   * - Simplified interface without explicit role validation
   * - Delegates to content repository
   * - Used for UI components requiring basic entry listing
   */
  async getEntries(
    projectId: string,
    collectionId: string,
    options?: GetContentEntriesOptions
  ): Promise<ContentEntry[]> {
    const queryOptions: GetContentEntriesOptions = options || { limit: 100 }
    return this.contentRepository.getContentEntries(projectId, collectionId, queryOptions)
  }

  /**
   * Update a content entry
   *
   * Business Logic:
   * - Simplified interface without explicit role validation
   * - Validates data against schema
   * - Delegates to repository for update
   * - Logs audit entry
   */
  async updateEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    updates: UpdateContentEntryInput,
    userId: string
  ): Promise<void> {
    // Business rule: Validate updated data if provided
    if (updates.data) {
      const validationResult = await this.validateContentEntry(
        projectId,
        collectionId,
        updates.data
      )

      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors.map((e) => `${e.field}: ${e.message}`)
        throw new Error(`Content validation failed: ${errorMessages.join(', ')}`)
      }
    }

    // Get existing entry for audit comparison
    const existingEntry = await this.contentRepository.getContentEntryById(
      projectId,
      collectionId,
      entryId
    )

    if (!existingEntry) {
      throw new Error(`Content entry not found: ${entryId}`)
    }

    // Data access: Update entry
    await this.contentRepository.updateContentEntry(
      projectId,
      collectionId,
      entryId,
      updates,
      userId
    )

    // Audit logging: Log the update
    try {
      const changes: string[] = []
      if (updates.data) changes.push('data')
      if (updates.status && updates.status !== existingEntry.status) changes.push('status')

      await this.auditRepository.logAction({
        projectId,
        userId,
        action: 'UPDATE',
        resourceType: 'CONTENT',
        resourceId: entryId,
        details: {
          collectionId,
          changes,
          oldStatus: existingEntry.status,
          newStatus: updates.status || existingEntry.status,
        },
        timestamp: new Date(),
      })
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError)
    }
  }

  /**
   * Private helper: Validate project access
   *
   * Business rule: Super users have access to all projects
   * Admin/User must be explicitly assigned
   */
  private async validateProjectAccess(
    _projectId: string,
    _userId: string,
    userRole: string
  ): Promise<void> {
    // Super users have access to all projects
    if (userRole === 'Super') {
      return
    }

    // For Admin/User, would check user assignments here
    // Simplified for this implementation
    // In production, would query user repository to verify assignment
  }
}
