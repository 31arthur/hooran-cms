/**
 * Core Domain Entities
 *
 * This module exports all domain entities used throughout the application.
 * These entities are completely database-agnostic and represent the core business objects.
 */

export type { Project, ProjectMetadata, ProjectStatus } from './Project'
export type {
  SchemaDefinition,
  SchemaField,
  SchemaFieldType,
  CreateSchemaInput,
  UpdateSchemaInput,
} from './SchemaDefinition'
export type {
  ContentEntry,
  ContentStatus,
  CreateContentEntryInput,
  UpdateContentEntryInput,
  GetContentEntriesOptions,
} from './ContentEntry'
export type { User, UserRole, CreateUserInput, UpdateUserInput } from './User'
export type {
  AuditLog,
  AuditAction,
  AuditResourceType,
  CreateAuditLogInput as CreateAuditInput,
  AuditLogFilters,
} from './AuditLog'
export type {
  AuditLogEntry,
  CreateAuditLogInput as CreateAuditLogEntryInput,
  AuditLogQueryOptions,
} from '../repositories/IAuditRepository'
export type {
  MediaFile,
  MediaType,
  MediaUploadResult,
  UploadMediaInput,
  DeleteMediaInput,
} from './MediaFile'
