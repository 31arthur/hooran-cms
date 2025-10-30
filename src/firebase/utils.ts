/**
 * Firebase Utility Functions
 *
 * This file contains core utility functions for Firestore operations
 * with built-in multi-tenancy support.
 *
 * **Multi-Tenancy Scoping:**
 * All data operations must be filtered by `project_id` to ensure
 * proper data isolation between different projects/tenants.
 */

import {
  type DocumentReference,
  type CollectionReference,
  type Query,
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint,
  type WhereFilterOp,
  type OrderByDirection,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

/**
 * Get a project-scoped document reference
 *
 * This is the core function for enforcing multi-tenancy.
 * All document reads/writes should use this function to ensure
 * data is properly scoped to a specific project.
 *
 * @param collectionId - The collection name (e.g., 'content', 'schemas', 'audit_logs')
 * @param docId - The document ID
 * @param projectId - The project ID for multi-tenancy scoping
 * @returns DocumentReference scoped to the project
 *
 * @example
 * ```typescript
 * const articleRef = getProjectScopedDocRef('content', 'article-123', 'project-abc')
 * const articleSnap = await getDoc(articleRef)
 * ```
 */
export function getProjectScopedDocRef(
  collectionId: string,
  docId: string,
  projectId: string
): DocumentReference<DocumentData> {
  // For multi-tenant architecture, we organize data as:
  // projects/{projectId}/{collectionId}/{docId}
  return doc(db, 'projects', projectId, collectionId, docId)
}

/**
 * Get a project-scoped collection reference
 *
 * Returns a collection reference scoped to a specific project.
 *
 * @param collectionId - The collection name
 * @param projectId - The project ID for multi-tenancy scoping
 * @returns CollectionReference scoped to the project
 *
 * @example
 * ```typescript
 * const contentCollection = getProjectScopedCollection('content', 'project-abc')
 * const snapshot = await getDocs(contentCollection)
 * ```
 */
export function getProjectScopedCollection(
  collectionId: string,
  projectId: string
): CollectionReference<DocumentData> {
  return collection(db, 'projects', projectId, collectionId)
}

/**
 * Create a project-scoped query
 *
 * Helper function to create queries with automatic project scoping.
 *
 * @param collectionId - The collection name
 * @param projectId - The project ID for multi-tenancy scoping
 * @param constraints - Additional query constraints (where, orderBy, limit, etc.)
 * @returns Query with project scoping
 *
 * @example
 * ```typescript
 * const publishedArticles = createProjectScopedQuery(
 *   'content',
 *   'project-abc',
 *   where('status', '==', 'published'),
 *   orderBy('created_at', 'desc'),
 *   limit(10)
 * )
 * ```
 */
export function createProjectScopedQuery(
  collectionId: string,
  projectId: string,
  ...constraints: QueryConstraint[]
): Query<DocumentData> {
  const collectionRef = getProjectScopedCollection(collectionId, projectId)
  return query(collectionRef, ...constraints)
}

/**
 * Build a where constraint
 *
 * Type-safe wrapper for Firestore where clauses.
 *
 * @param field - Field name
 * @param operator - Comparison operator
 * @param value - Value to compare
 * @returns QueryConstraint
 */
export function whereConstraint(
  field: string,
  operator: WhereFilterOp,
  value: unknown
): QueryConstraint {
  return where(field, operator, value)
}

/**
 * Build an orderBy constraint
 *
 * Type-safe wrapper for Firestore orderBy clauses.
 *
 * @param field - Field to order by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns QueryConstraint
 */
export function orderByConstraint(
  field: string,
  direction: OrderByDirection = 'asc'
): QueryConstraint {
  return orderBy(field, direction)
}

/**
 * Build a limit constraint
 *
 * Type-safe wrapper for Firestore limit clauses.
 *
 * @param count - Maximum number of documents
 * @returns QueryConstraint
 */
export function limitConstraint(count: number): QueryConstraint {
  return limit(count)
}

/**
 * Get server timestamp
 *
 * Returns a Firestore server timestamp for consistent time tracking.
 *
 * @returns Firestore server timestamp
 *
 * @example
 * ```typescript
 * const newArticle = {
 *   title: 'Hello World',
 *   created_at: getServerTimestamp(),
 *   updated_at: getServerTimestamp(),
 * }
 * ```
 */
export function getServerTimestamp() {
  return serverTimestamp()
}

/**
 * Convert Firestore Timestamp to JavaScript Date
 *
 * @param timestamp - Firestore Timestamp
 * @returns JavaScript Date object
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate()
}

/**
 * Convert JavaScript Date to Firestore Timestamp
 *
 * @param date - JavaScript Date object
 * @returns Firestore Timestamp
 */
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date)
}

/**
 * Get the root projects collection reference
 *
 * Useful for project management operations.
 *
 * @returns CollectionReference for projects
 */
export function getProjectsCollection(): CollectionReference<DocumentData> {
  return collection(db, 'projects')
}

/**
 * Get a specific project document reference
 *
 * @param projectId - The project ID
 * @returns DocumentReference for the project
 */
export function getProjectDocRef(projectId: string): DocumentReference<DocumentData> {
  return doc(db, 'projects', projectId)
}

/**
 * Validate project ID
 *
 * Ensures the project ID is valid before making Firestore calls.
 *
 * @param projectId - The project ID to validate
 * @throws Error if project ID is invalid
 */
export function validateProjectId(projectId: string): void {
  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    throw new Error('Invalid project ID: Project ID must be a non-empty string')
  }
}

/**
 * Validate collection ID
 *
 * Ensures the collection ID is valid before making Firestore calls.
 *
 * @param collectionId - The collection ID to validate
 * @throws Error if collection ID is invalid
 */
export function validateCollectionId(collectionId: string): void {
  if (!collectionId || typeof collectionId !== 'string' || collectionId.trim() === '') {
    throw new Error('Invalid collection ID: Collection ID must be a non-empty string')
  }
}

/**
 * Create audit log entry
 *
 * Helper function to create audit log entries for tracking changes.
 *
 * @param projectId - The project ID
 * @param action - The action performed (e.g., 'create', 'update', 'delete')
 * @param resourceType - The type of resource (e.g., 'content', 'schema')
 * @param resourceId - The ID of the resource
 * @param userId - The ID of the user performing the action
 * @param metadata - Additional metadata about the action
 * @returns Audit log entry object
 */
export function createAuditLogEntry(
  projectId: string,
  action: 'create' | 'update' | 'delete' | 'read',
  resourceType: string,
  resourceId: string,
  userId: string,
  metadata?: Record<string, unknown>
) {
  return {
    project_id: projectId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    user_id: userId,
    timestamp: getServerTimestamp(),
    metadata: metadata || {},
  }
}

/**
 * Firestore collection names constants
 *
 * Centralized collection names for consistency.
 */
export const COLLECTIONS = {
  PROJECTS: 'projects',
  CONTENT: 'content',
  SCHEMAS: 'schemas',
  AUDIT_LOGS: 'audit_logs',
  USERS: 'users',
  MEDIA: 'media',
  ROLES: 'roles',
  SETTINGS: 'settings',
} as const

/**
 * Export common Firestore types for convenience
 */
export type {
  DocumentReference,
  CollectionReference,
  Query,
  DocumentData,
  QueryConstraint,
  Timestamp,
}
