/**
 * Schema Adapter
 *
 * Handles conversion between Firebase Firestore data structures and SchemaDefinition entities.
 * This adapter is the ONLY place where Firebase-specific types are converted to/from
 * clean domain entities for schemas.
 *
 * **Framework Independence:**
 * By isolating Firebase type conversions here, we ensure that:
 * - Domain entities remain database-agnostic
 * - Business logic never touches Firebase types
 * - Database migration becomes straightforward
 */

import type { DocumentData } from 'firebase/firestore'
import type {
  SchemaDefinition,
  SchemaField,
  CreateSchemaInput,
  UpdateSchemaInput,
} from '@/domain/entities'

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
function timestampToDate(timestamp: any): Date | undefined {
  if (!timestamp) return undefined

  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }

  if (timestamp instanceof Date) {
    return timestamp
  }

  return undefined
}

/**
 * SchemaAdapter Class
 *
 * Provides static methods for converting between Firebase data and SchemaDefinition entities
 */
export class SchemaAdapter {
  /**
   * Convert Firestore document data to SchemaDefinition domain entity
   *
   * This method performs the critical translation from Firebase-specific types
   * to clean, database-agnostic domain entities.
   *
   * @param docId - The Firestore document ID
   * @param data - The raw Firestore document data
   * @returns SchemaDefinition domain entity
   */
  static toEntity(docId: string, data: DocumentData): SchemaDefinition {
    return {
      id: docId,
      projectId: data.project_id || data.projectId || '',
      name: data.name || docId,
      description: data.description || '',
      fields: this.normalizeFields(data.fields || []),
      displayField: data.display_field || data.displayField,
      isSystem: data.is_system || data.isSystem || false,
      createdAt: timestampToDate(data.created_at || data.createdAt),
      updatedAt: timestampToDate(data.updated_at || data.updatedAt),
      createdBy: data.created_by || data.createdBy,
      updatedBy: data.updated_by || data.updatedBy,
    }
  }

  /**
   * Normalize field array to ensure consistent structure
   *
   * @param fields - Raw fields array from Firestore
   * @returns Normalized SchemaField array
   */
  private static normalizeFields(fields: any[]): SchemaField[] {
    if (!Array.isArray(fields)) return []

    return fields.map((field) => ({
      name: field.name || '',
      type: field.type || 'text',
      label: field.label || '',
      required: field.required || false,
      options: field.options || undefined,
      defaultValue: field.defaultValue || field.default_value || undefined,
      helpText: field.helpText || field.help_text || undefined,
    }))
  }

  /**
   * Convert multiple Firestore documents to SchemaDefinition entities
   *
   * @param documents - Array of [docId, data] tuples
   * @returns Array of SchemaDefinition domain entities
   */
  static toEntityList(documents: Array<[string, DocumentData]>): SchemaDefinition[] {
    return documents.map(([docId, data]) => this.toEntity(docId, data))
  }

  /**
   * Convert CreateSchemaInput to Firestore document data
   *
   * @param input - Create schema input from domain layer
   * @param projectId - Project ID for multi-tenancy
   * @param userId - Creating user ID
   * @returns Object ready for Firestore setDoc()
   */
  static toFirestoreCreate(
    input: CreateSchemaInput,
    projectId: string,
    userId: string
  ): Record<string, any> {
    return {
      project_id: projectId, // CRITICAL: Multi-tenancy enforcement
      name: input.name,
      description: input.description || '',
      fields: input.fields,
      display_field: input.displayField || input.fields[0]?.name || 'id',
      is_system: input.isSystem || false,
      created_by: userId,
      // Note: created_at and updated_at should be added by repository using serverTimestamp()
    }
  }

  /**
   * Convert UpdateSchemaInput to Firestore update data
   *
   * @param updates - Update schema input from domain layer
   * @param userId - Updating user ID
   * @returns Object ready for Firestore updateDoc()
   */
  static toFirestoreUpdate(
    updates: UpdateSchemaInput,
    userId: string
  ): Record<string, any> {
    const updateData: Record<string, any> = {
      updated_by: userId,
      // Note: updated_at should be added by repository using serverTimestamp()
    }

    if (updates.name !== undefined) {
      updateData.name = updates.name
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description
    }

    if (updates.fields !== undefined) {
      updateData.fields = updates.fields
    }

    if (updates.displayField !== undefined) {
      updateData.display_field = updates.displayField
    }

    if (updates.isSystem !== undefined) {
      updateData.is_system = updates.isSystem
    }

    return updateData
  }
}
