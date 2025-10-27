/**
 * Firebase Usage Examples
 *
 * This file contains practical examples of how to use the Firebase
 * utilities with the multi-tenancy architecture.
 *
 * These examples demonstrate common operations like CRUD, queries,
 * and real-time listeners.
 */

import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'

import {
  getProjectScopedDocRef,
  getProjectScopedCollection,
  createProjectScopedQuery,
  whereConstraint,
  orderByConstraint,
  limitConstraint,
  getServerTimestamp,
  createAuditLogEntry,
  COLLECTIONS,
} from './utils'

import type { ContentEntry, Schema, AuditLogEntry } from './types'

/**
 * Example 1: Fetch a single content entry
 */
export async function fetchContentEntry(
  projectId: string,
  contentId: string
): Promise<ContentEntry | null> {
  try {
    const docRef = getProjectScopedDocRef(COLLECTIONS.CONTENT, contentId, projectId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ContentEntry
    } else {
      console.log('Content entry not found')
      return null
    }
  } catch (error) {
    console.error('Error fetching content entry:', error)
    throw error
  }
}

/**
 * Example 2: Create a new content entry
 */
export async function createContentEntry(
  projectId: string,
  data: Omit<ContentEntry, 'id' | 'project_id' | 'created_at' | 'updated_at'>
): Promise<string> {
  try {
    const contentCollection = getProjectScopedCollection(COLLECTIONS.CONTENT, projectId)

    const newContent: Omit<ContentEntry, 'id'> = {
      ...data,
      project_id: projectId,
      created_at: getServerTimestamp() as Timestamp,
      updated_at: getServerTimestamp() as Timestamp,
    }

    const docRef = await addDoc(contentCollection, newContent)
    console.log('Content entry created with ID:', docRef.id)

    return docRef.id
  } catch (error) {
    console.error('Error creating content entry:', error)
    throw error
  }
}

/**
 * Example 3: Update a content entry
 */
export async function updateContentEntry(
  projectId: string,
  contentId: string,
  updates: Partial<ContentEntry>
): Promise<void> {
  try {
    const docRef = getProjectScopedDocRef(COLLECTIONS.CONTENT, contentId, projectId)

    await updateDoc(docRef, {
      ...updates,
      updated_at: getServerTimestamp(),
    })

    console.log('Content entry updated successfully')
  } catch (error) {
    console.error('Error updating content entry:', error)
    throw error
  }
}

/**
 * Example 4: Delete a content entry
 */
export async function deleteContentEntry(
  projectId: string,
  contentId: string
): Promise<void> {
  try {
    const docRef = getProjectScopedDocRef(COLLECTIONS.CONTENT, contentId, projectId)
    await deleteDoc(docRef)

    console.log('Content entry deleted successfully')
  } catch (error) {
    console.error('Error deleting content entry:', error)
    throw error
  }
}

/**
 * Example 5: Query published content entries
 */
export async function fetchPublishedContent(
  projectId: string,
  limit = 10
): Promise<ContentEntry[]> {
  try {
    const q = createProjectScopedQuery(
      COLLECTIONS.CONTENT,
      projectId,
      whereConstraint('status', '==', 'published'),
      orderByConstraint('published_at', 'desc'),
      limitConstraint(limit)
    )

    const querySnapshot = await getDocs(q)
    const content: ContentEntry[] = []

    querySnapshot.forEach((doc) => {
      content.push({ id: doc.id, ...doc.data() } as ContentEntry)
    })

    return content
  } catch (error) {
    console.error('Error fetching published content:', error)
    throw error
  }
}

/**
 * Example 6: Query content by schema
 */
export async function fetchContentBySchema(
  projectId: string,
  schemaId: string
): Promise<ContentEntry[]> {
  try {
    const q = createProjectScopedQuery(
      COLLECTIONS.CONTENT,
      projectId,
      whereConstraint('schema_id', '==', schemaId),
      orderByConstraint('created_at', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const content: ContentEntry[] = []

    querySnapshot.forEach((doc) => {
      content.push({ id: doc.id, ...doc.data() } as ContentEntry)
    })

    return content
  } catch (error) {
    console.error('Error fetching content by schema:', error)
    throw error
  }
}

/**
 * Example 7: Create a schema
 */
export async function createSchema(
  projectId: string,
  data: Omit<Schema, 'id' | 'project_id' | 'created_at' | 'updated_at'>
): Promise<string> {
  try {
    const schemasCollection = getProjectScopedCollection(COLLECTIONS.SCHEMAS, projectId)

    const newSchema: Omit<Schema, 'id'> = {
      ...data,
      project_id: projectId,
      created_at: getServerTimestamp() as Timestamp,
      updated_at: getServerTimestamp() as Timestamp,
    }

    const docRef = await addDoc(schemasCollection, newSchema)
    console.log('Schema created with ID:', docRef.id)

    return docRef.id
  } catch (error) {
    console.error('Error creating schema:', error)
    throw error
  }
}

/**
 * Example 8: Fetch all schemas for a project
 */
export async function fetchAllSchemas(projectId: string): Promise<Schema[]> {
  try {
    const schemasCollection = getProjectScopedCollection(COLLECTIONS.SCHEMAS, projectId)
    const querySnapshot = await getDocs(schemasCollection)

    const schemas: Schema[] = []
    querySnapshot.forEach((doc) => {
      schemas.push({ id: doc.id, ...doc.data() } as Schema)
    })

    return schemas
  } catch (error) {
    console.error('Error fetching schemas:', error)
    throw error
  }
}

/**
 * Example 9: Create an audit log entry
 */
export async function logAction(
  projectId: string,
  action: 'create' | 'update' | 'delete' | 'read',
  resourceType: string,
  resourceId: string,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const auditLog = createAuditLogEntry(
      projectId,
      action,
      resourceType,
      resourceId,
      userId,
      metadata
    )

    const auditLogsCollection = getProjectScopedCollection(
      COLLECTIONS.AUDIT_LOGS,
      projectId
    )

    await addDoc(auditLogsCollection, auditLog)
    console.log('Audit log created')
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw - audit logging failures shouldn't break the main operation
  }
}

/**
 * Example 10: Real-time listener for a content entry
 */
export function subscribeToContentEntry(
  projectId: string,
  contentId: string,
  callback: (content: ContentEntry | null) => void
): () => void {
  const docRef = getProjectScopedDocRef(COLLECTIONS.CONTENT, contentId, projectId)

  const unsubscribe = onSnapshot(
    docRef,
    (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as ContentEntry)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Error in real-time listener:', error)
    }
  )

  return unsubscribe
}

/**
 * Example 11: Real-time listener for published content
 */
export function subscribeToPublishedContent(
  projectId: string,
  callback: (content: ContentEntry[]) => void,
  limit = 10
): () => void {
  const q = createProjectScopedQuery(
    COLLECTIONS.CONTENT,
    projectId,
    whereConstraint('status', '==', 'published'),
    orderByConstraint('published_at', 'desc'),
    limitConstraint(limit)
  )

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const content: ContentEntry[] = []
      querySnapshot.forEach((doc) => {
        content.push({ id: doc.id, ...doc.data() } as ContentEntry)
      })
      callback(content)
    },
    (error) => {
      console.error('Error in real-time listener:', error)
    }
  )

  return unsubscribe
}

/**
 * Example 12: Publish a content entry
 */
export async function publishContentEntry(
  projectId: string,
  contentId: string,
  userId: string
): Promise<void> {
  try {
    // Update content status
    await updateContentEntry(projectId, contentId, {
      status: 'published',
      published_at: getServerTimestamp() as Timestamp,
    })

    // Log the action
    await logAction(projectId, 'update', 'content', contentId, userId, {
      action: 'publish',
      previous_status: 'draft',
      new_status: 'published',
    })

    console.log('Content entry published successfully')
  } catch (error) {
    console.error('Error publishing content entry:', error)
    throw error
  }
}

/**
 * Example 13: Unpublish a content entry
 */
export async function unpublishContentEntry(
  projectId: string,
  contentId: string,
  userId: string
): Promise<void> {
  try {
    // Update content status
    await updateContentEntry(projectId, contentId, {
      status: 'draft',
      published_at: null as any, // Remove published timestamp
    })

    // Log the action
    await logAction(projectId, 'update', 'content', contentId, userId, {
      action: 'unpublish',
      previous_status: 'published',
      new_status: 'draft',
    })

    console.log('Content entry unpublished successfully')
  } catch (error) {
    console.error('Error unpublishing content entry:', error)
    throw error
  }
}

/**
 * Example 14: Batch operation - Create multiple content entries
 */
export async function createMultipleContentEntries(
  projectId: string,
  entries: Array<Omit<ContentEntry, 'id' | 'project_id' | 'created_at' | 'updated_at'>>
): Promise<string[]> {
  try {
    const contentCollection = getProjectScopedCollection(COLLECTIONS.CONTENT, projectId)
    const createdIds: string[] = []

    for (const entry of entries) {
      const newContent: Omit<ContentEntry, 'id'> = {
        ...entry,
        project_id: projectId,
        created_at: getServerTimestamp() as Timestamp,
        updated_at: getServerTimestamp() as Timestamp,
      }

      const docRef = await addDoc(contentCollection, newContent)
      createdIds.push(docRef.id)
    }

    console.log(`Created ${createdIds.length} content entries`)
    return createdIds
  } catch (error) {
    console.error('Error creating multiple content entries:', error)
    throw error
  }
}

/**
 * Example 15: Search content by title
 */
export async function searchContentByTitle(
  projectId: string,
  searchTerm: string
): Promise<ContentEntry[]> {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation using >= and <= for prefix matching
    const q = createProjectScopedQuery(
      COLLECTIONS.CONTENT,
      projectId,
      whereConstraint('title', '>=', searchTerm),
      whereConstraint('title', '<=', searchTerm + '\uf8ff'),
      limitConstraint(20)
    )

    const querySnapshot = await getDocs(q)
    const content: ContentEntry[] = []

    querySnapshot.forEach((doc) => {
      content.push({ id: doc.id, ...doc.data() } as ContentEntry)
    })

    return content
  } catch (error) {
    console.error('Error searching content:', error)
    throw error
  }
}
