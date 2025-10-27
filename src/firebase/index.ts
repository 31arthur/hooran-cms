/**
 * Firebase Module
 *
 * Central export point for all Firebase-related functionality.
 * Import from this file to access Firebase services and utilities.
 *
 * @example
 * ```typescript
 * import { auth, db, getProjectScopedDocRef } from '@/firebase'
 * ```
 */

// Export Firebase services
export {
  app,
  auth,
  db,
  storage,
  firestore,
  firebaseAuth,
  firebaseStorage,
  firebaseApp,
} from './config'

// Export all utility functions
export {
  getProjectScopedDocRef,
  getProjectScopedCollection,
  createProjectScopedQuery,
  whereConstraint,
  orderByConstraint,
  limitConstraint,
  getServerTimestamp,
  timestampToDate,
  dateToTimestamp,
  getProjectsCollection,
  getProjectDocRef,
  validateProjectId,
  validateCollectionId,
  createAuditLogEntry,
  COLLECTIONS,
} from './utils'

// Export Firestore types
export type {
  DocumentReference,
  CollectionReference,
  Query,
  DocumentData,
  QueryConstraint,
  Timestamp,
} from './utils'

export type { FirebaseApp, Auth, Firestore, FirebaseStorage } from './config'

// Export data model types
export type {
  Project,
  ProjectSettings,
  ContentEntry,
  ContentMetadata,
  Schema,
  SchemaField,
  SchemaFieldType,
  FieldValidation,
  FieldOptions,
  AuditLogEntry,
  AuditLogChanges,
  User,
  UserRole,
  Media,
  Role,
  Permission,
  PermissionAction,
  QueryOptions,
  PaginatedResult,
  ProjectScopedDocument,
} from './types'
