/**
 * User Domain Entity
 *
 * Represents a user in the system with their role and project assignments.
 * This is a database-agnostic entity that uses native JavaScript types.
 *
 * **Framework Independence:**
 * - Uses native Date type (not Firebase Timestamp)
 * - No Firebase-specific types
 * - Clean domain model
 *
 * **Role-Based Access Control:**
 * - Super: Full access to all projects and system settings
 * - Admin: Access to assigned projects only
 * - User: No CMS access (default role for new users)
 */

/**
 * User Role Type
 *
 * Defines the role-based access levels in the system
 */
export type UserRole = 'Super' | 'Admin' | 'User'

/**
 * User Entity
 *
 * Represents a user with their authentication info, role, and project assignments
 */
export interface User {
  /**
   * Unique user ID (Firebase Auth UID)
   */
  uid: string

  /**
   * User's email address
   */
  email: string

  /**
   * User's display name
   */
  name?: string

  /**
   * Display name (alternative field for compatibility)
   */
  displayName?: string

  /**
   * URL to user's profile photo
   */
  photoUrl?: string

  /**
   * User's role in the system
   *
   * - Super: Full access to all projects
   * - Admin: Access to assigned projects only
   * - User: No CMS access
   */
  role: UserRole

  /**
   * Array of project IDs the user has access to
   *
   * - Super users: Empty array (implicit access to all)
   * - Admin users: Explicit project assignments
   * - User role: Empty array (no CMS access)
   */
  projects: string[]

  /**
   * When the user document was created
   */
  createdAt: Date

  /**
   * When the user document was last updated
   */
  updatedAt: Date

  /**
   * When the user last logged in
   */
  lastLogin?: Date
}

/**
 * Create User Input
 *
 * Data required to create a new user document
 */
export interface CreateUserInput {
  uid: string
  email: string
  name?: string
  displayName?: string
  photoUrl?: string
  role?: UserRole // Defaults to 'User'
  projects?: string[] // Defaults to empty array
}

/**
 * Update User Input
 *
 * Data for updating an existing user
 */
export interface UpdateUserInput {
  name?: string
  displayName?: string
  photoUrl?: string
  role?: UserRole
  projects?: string[]
  lastLogin?: Date
}
