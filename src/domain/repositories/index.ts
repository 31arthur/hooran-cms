/**
 * Repository Interfaces
 *
 * This module exports all repository interfaces that define contracts
 * for data access operations. These interfaces are implementation-agnostic
 * and can be satisfied by any data store (Firebase, PostgreSQL, MongoDB, etc.).
 */

export type { IProjectRepository } from './IProjectRepository'
export type { ISchemaRepository } from './ISchemaRepository'
export type { IContentRepository } from './IContentRepository'
export type {
  IAuditRepository,
  AuditLogEntry,
  CreateAuditLogInput,
  AuditLogQueryOptions,
} from './IAuditRepository'
export type { IUserRepository } from './IUserRepository'
export type { IAuditLogRepository } from './IAuditLogRepository'
export type { IMediaRepository } from './IMediaRepository'
