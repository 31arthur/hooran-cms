/**
 * Firebase Data Model Types
 *
 * TypeScript type definitions for Firestore documents
 * used in Hooran CMS Phase 1.
 *
 * All content entries and collections include `project_id`
 * for multi-tenancy scoping.
 */

import { Timestamp } from 'firebase/firestore'

/**
 * Base interface for all project-scoped documents
 * All Firestore documents must include project_id for multi-tenancy
 */
export interface ProjectScopedDocument {
  project_id: string
  created_at: Timestamp
  updated_at: Timestamp
}

/**
 * Project Document
 * Represents a tenant/project in the multi-tenant architecture
 */
export interface Project {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: Timestamp
  updated_at: Timestamp
  settings?: ProjectSettings
  status: 'active' | 'suspended' | 'archived'
}

/**
 * Project Settings
 */
export interface ProjectSettings {
  timezone?: string
  locale?: string
  date_format?: string
  custom_fields?: Record<string, unknown>
}

/**
 * Content Entry Document
 * Represents a single content item (article, page, etc.)
 */
export interface ContentEntry extends ProjectScopedDocument {
  id: string
  schema_id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  content: Record<string, unknown>
  author_id: string
  published_at?: Timestamp
  metadata?: ContentMetadata
}

/**
 * Content Metadata
 */
export interface ContentMetadata {
  tags?: string[]
  categories?: string[]
  featured_image?: string
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  custom?: Record<string, unknown>
}

/**
 * Schema Document
 * Defines the structure for content types
 */
export interface Schema extends ProjectScopedDocument {
  id: string
  name: string
  description?: string
  fields: SchemaField[]
  display_field?: string
  is_system?: boolean
}

/**
 * Schema Field Definition
 */
export interface SchemaField {
  name: string
  type: SchemaFieldType
  label: string
  required?: boolean
  unique?: boolean
  default_value?: unknown
  validation?: FieldValidation
  options?: FieldOptions
}

/**
 * Supported field types
 */
export type SchemaFieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'relation'
  | 'media'
  | 'json'

/**
 * Field validation rules
 */
export interface FieldValidation {
  min?: number
  max?: number
  pattern?: string
  custom?: string
}

/**
 * Field options (for select/multiselect)
 */
export interface FieldOptions {
  choices?: Array<{ label: string; value: string }>
  multiple?: boolean
  relation_schema?: string
}

/**
 * Audit Log Entry
 * Tracks all changes in the system
 */
export interface AuditLogEntry extends ProjectScopedDocument {
  id: string
  action: 'create' | 'update' | 'delete' | 'read'
  resource_type: string
  resource_id: string
  user_id: string
  timestamp: Timestamp
  metadata?: Record<string, unknown>
  changes?: AuditLogChanges
}

/**
 * Audit log changes (for update actions)
 */
export interface AuditLogChanges {
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  fields_changed?: string[]
}

/**
 * User Document
 */
export interface User {
  id: string
  email: string
  display_name?: string
  photo_url?: string
  role: UserRole
  projects: string[] // Array of project IDs the user has access to
  created_at: Timestamp
  updated_at: Timestamp
  last_login?: Timestamp
}

/**
 * User roles
 */
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer'

/**
 * Media Document
 * Represents uploaded files
 */
export interface Media extends ProjectScopedDocument {
  id: string
  name: string
  url: string
  storage_path: string
  mime_type: string
  size: number // in bytes
  width?: number
  height?: number
  uploaded_by: string
  alt_text?: string
  caption?: string
  folder?: string
}

/**
 * Role Document
 * Custom role definitions for fine-grained permissions
 */
export interface Role extends ProjectScopedDocument {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  is_system?: boolean
}

/**
 * Permission definition
 */
export interface Permission {
  resource: string // e.g., 'content', 'schema', 'user'
  actions: PermissionAction[]
}

/**
 * Permission actions
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'publish'

/**
 * Firestore Query Options
 */
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  where?: Array<{
    field: string
    operator: '<' | '<=' | '==' | '>' | '>=' | '!=' | 'array-contains' | 'in' | 'array-contains-any'
    value: unknown
  }>
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}
