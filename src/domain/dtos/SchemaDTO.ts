/**
 * Schema Data Transfer Objects (DTOs)
 *
 * These DTOs provide simplified views of schema/collection data for specific UI needs.
 * They follow the Interface Segregation Principle (ISP) by exposing only
 * the data required for each specific use case.
 */

import type {
  SchemaDefinition,
  SchemaField,
  SchemaFieldType,
} from '@/domain/entities/SchemaDefinition'

/**
 * SchemaListDTO
 *
 * Simplified schema information for list views and selectors.
 *
 * **Usage:**
 * - Schema list page
 * - Collection selector dropdowns
 * - Navigation menus
 *
 * @example
 * ```typescript
 * const schemas: SchemaListDTO[] = [
 *   {
 *     id: 'blog-posts',
 *     name: 'Blog Posts',
 *     description: 'Blog article entries',
 *     fieldCount: 5
 *   }
 * ]
 * ```
 */
export interface SchemaListDTO {
  /**
   * Unique schema/collection identifier
   */
  id: string

  /**
   * Human-readable schema name
   */
  name: string

  /**
   * Optional schema description
   */
  description?: string

  /**
   * Number of fields in this schema
   */
  fieldCount: number

  /**
   * Number of content entries using this schema
   */
  entryCount?: number

  /**
   * Last update timestamp
   */
  updatedAt?: Date
}

/**
 * SchemaDetailDTO
 *
 * Complete schema information for detail views and editors.
 *
 * **Usage:**
 * - Schema builder page
 * - Schema detail view
 * - Content type configuration
 */
export interface SchemaDetailDTO {
  /**
   * Unique schema/collection identifier
   */
  id: string

  /**
   * Project ID this schema belongs to
   */
  projectId: string

  /**
   * Human-readable schema name
   */
  name: string

  /**
   * Optional schema description
   */
  description?: string

  /**
   * Array of field definitions
   */
  fields: SchemaField[]

  /**
   * Display field name (used for titles)
   */
  displayField: string

  /**
   * User who created this schema
   */
  createdBy?: string

  /**
   * Creation timestamp
   */
  createdAt: Date

  /**
   * Last update timestamp
   */
  updatedAt: Date
}

/**
 * SchemaFieldSummaryDTO
 *
 * Simplified field information for quick reference.
 *
 * **Usage:**
 * - Field list previews
 * - Schema summaries
 * - Quick field reference
 */
export interface SchemaFieldSummaryDTO {
  /**
   * Field name (key)
   */
  name: string

  /**
   * Field type
   */
  type: SchemaFieldType

  /**
   * Whether field is required
   */
  required: boolean

  /**
   * Optional field label
   */
  label?: string
}

/**
 * SchemaSummaryDTO
 *
 * Minimal schema information for references.
 *
 * **Usage:**
 * - Content editor schema reference
 * - Quick schema info display
 * - Breadcrumbs
 */
export interface SchemaSummaryDTO {
  /**
   * Schema ID
   */
  id: string

  /**
   * Schema name
   */
  name: string

  /**
   * Field count
   */
  fieldCount: number
}

/**
 * SchemaMapper
 *
 * Static utility class for mapping SchemaDefinition domain entities to DTOs.
 */
export class SchemaMapper {
  /**
   * Convert SchemaDefinition entity to SchemaListDTO
   *
   * @param schema - The full schema definition
   * @param entryCount - Optional content entry count
   * @returns Simplified list DTO
   */
  static toListDTO(schema: SchemaDefinition, entryCount?: number): SchemaListDTO {
    return {
      id: schema.collectionId || schema.id,
      name: schema.collectionName || schema.name,
      description: schema.description,
      fieldCount: schema.fields.length,
      entryCount,
      updatedAt: schema.updatedAt,
    }
  }

  /**
   * Convert array of SchemaDefinition entities to SchemaListDTO array
   *
   * @param schemas - Array of schema definitions
   * @returns Array of list DTOs
   */
  static toListDTOList(schemas: SchemaDefinition[]): SchemaListDTO[] {
    return schemas.map((s) => SchemaMapper.toListDTO(s))
  }

  /**
   * Convert SchemaDefinition entity to SchemaDetailDTO
   *
   * @param schema - The full schema definition
   * @returns Detailed schema DTO
   */
  static toDetailDTO(schema: SchemaDefinition): SchemaDetailDTO {
    return {
      id: schema.collectionId || schema.id,
      projectId: schema.projectId,
      name: schema.collectionName || schema.name,
      description: schema.description,
      fields: schema.fields,
      displayField: schema.displayField || 'title',
      createdBy: schema.createdBy,
      createdAt: schema.createdAt ?? new Date(),
      updatedAt: schema.updatedAt ?? new Date(),
    }
  }

  /**
   * Convert SchemaDefinition entity to SchemaSummaryDTO
   *
   * @param schema - The full schema definition
   * @returns Summary DTO
   */
  static toSummaryDTO(schema: SchemaDefinition): SchemaSummaryDTO {
    return {
      id: schema.collectionId || schema.id,
      name: schema.collectionName || schema.name,
      fieldCount: schema.fields.length,
    }
  }

  /**
   * Convert SchemaField to SchemaFieldSummaryDTO
   *
   * @param field - Schema field definition
   * @returns Field summary DTO
   */
  static toFieldSummaryDTO(field: SchemaField): SchemaFieldSummaryDTO {
    return {
      name: field.name,
      type: field.type,
      required: field.required ?? false,
      label: field.label,
    }
  }

  /**
   * Convert array of SchemaFields to SchemaFieldSummaryDTO array
   *
   * @param fields - Array of field definitions
   * @returns Array of field summary DTOs
   */
  static toFieldSummaryDTOList(fields: SchemaField[]): SchemaFieldSummaryDTO[] {
    return fields.map((f) => SchemaMapper.toFieldSummaryDTO(f))
  }
}
