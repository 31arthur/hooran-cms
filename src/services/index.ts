/**
 * Services Index
 *
 * Central export point for all service modules.
 *
 * Usage:
 * ```typescript
 * import { SchemaService } from '@/services'
 * ```
 */

// Schema Service
export { SchemaService, SchemaServiceClass } from './SchemaService'
export type { CreateSchemaInput, UpdateSchemaInput } from './SchemaService'

// Re-export Firebase types commonly used with services
export type { Schema, SchemaField, SchemaFieldType } from '@/firebase/types'
