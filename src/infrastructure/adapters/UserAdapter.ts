/**
 * User Entity Adapter
 *
 * Converts between Firebase Firestore document data and clean User domain entities.
 *
 * **Architectural Boundary:**
 * This adapter is the ONLY place where Firebase Timestamp types are converted to native Date types
 * for user entities. This maintains framework independence in the domain layer.
 */

import type { DocumentData } from 'firebase/firestore'
import type { User, UserRole, CreateUserInput } from '@/domain/entities/User'

/**
 * Convert Firebase Firestore Timestamp to JavaScript Date
 *
 * Handles various timestamp formats from Firestore
 */
function timestampToDate(timestamp: any): Date {
  if (!timestamp) {
    return new Date()
  }

  // Firebase Timestamp object with toDate() method
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }

  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp
  }

  // Timestamp in milliseconds (number)
  if (typeof timestamp === 'number') {
    return new Date(timestamp)
  }

  // ISO string
  if (typeof timestamp === 'string') {
    return new Date(timestamp)
  }

  // Firestore server timestamp (seconds + nanoseconds)
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000)
  }

  // Fallback to current date
  console.warn('Unknown timestamp format:', timestamp)
  return new Date()
}

/**
 * UserAdapter
 *
 * Handles conversion between Firebase documents and User entities
 */
export class UserAdapter {
  /**
   * Convert Firestore document to User entity
   *
   * @param userId - The user document ID (uid)
   * @param data - The document data from Firestore
   * @returns Clean User entity with native Date types
   */
  static toEntity(userId: string, data: DocumentData): User {
    return {
      uid: userId,
      email: data.email || '',
      name: data.name || data.display_name || '',
      displayName: data.display_name || data.name || '',
      photoUrl: data.photo_url || data.photoUrl || '',
      role: (data.role as UserRole) || 'User',
      projects: Array.isArray(data.projects) ? data.projects : [],
      createdAt: timestampToDate(data.created_at || data.createdAt),
      updatedAt: timestampToDate(data.updated_at || data.updatedAt),
      lastLogin: data.last_login ? timestampToDate(data.last_login) : undefined,
    }
  }

  /**
   * Convert User entity to Firestore document data
   *
   * @param user - The User entity (without uid)
   * @returns Document data ready for Firestore
   *
   * **Field Naming:** Uses snake_case (created_at, not createdAt) to match
   * the existing UserService implementation.
   */
  static toFirestore(user: Omit<User, 'uid'>): DocumentData {
    return {
      email: user.email,
      name: user.name || user.displayName || '',
      display_name: user.displayName || user.name || '',
      photo_url: user.photoUrl || '',
      role: user.role,
      projects: user.projects || [],
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      last_login: user.lastLogin,
    }
  }

  /**
   * Convert CreateUserInput to Firestore document data
   *
   * @param input - Create user input data
   * @returns Document data ready for Firestore
   */
  static createInputToFirestore(input: CreateUserInput): DocumentData {
    return {
      email: input.email,
      name: input.name || input.displayName || '',
      display_name: input.displayName || input.name || '',
      photo_url: input.photoUrl || '',
      role: input.role || 'User',
      projects: input.projects || [],
    }
  }

  /**
   * Convert array of Firestore documents to User entities
   *
   * @param docs - Array of [userId, data] tuples
   * @returns Array of clean User entities
   */
  static toEntityArray(docs: Array<[string, DocumentData]>): User[] {
    return docs.map(([userId, data]) => UserAdapter.toEntity(userId, data))
  }
}
