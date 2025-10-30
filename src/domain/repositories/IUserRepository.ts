/**
 * User Repository Interface
 *
 * Defines the contract for user management operations.
 * This interface enables clean separation between user management business logic
 * and the actual persistence mechanism.
 *
 * **Framework Independence:**
 * - Methods accept and return only domain entities or primitives
 * - NO Firebase types (no Timestamp, DocumentReference, etc.)
 * - Completely database-agnostic
 *
 * **Purpose:**
 * Handles user profile management, role assignments, and project access control.
 */

import type { User, UserRole, CreateUserInput, UpdateUserInput } from '../entities/User'

/**
 * IUserRepository
 *
 * Repository interface for user management operations
 */
export interface IUserRepository {
  /**
   * Ensure user document exists
   *
   * Creates a new user document if it doesn't exist, or returns the existing role.
   * This is the critical function called after Google Sign-In to ensure every
   * authenticated user has a Firestore document.
   *
   * **Behavior:**
   * - If user document EXISTS: Returns existing role from Firestore
   * - If user document DOES NOT EXIST: Creates new document with default 'User' role
   *
   * @param input - User data from Firebase Auth
   * @returns Promise<UserRole> - The user's role
   */
  ensureUserDocument(input: CreateUserInput): Promise<UserRole>

  /**
   * Create a new user
   *
   * Creates a new user document in the database.
   * This method directly creates a user with the specified role and properties.
   *
   * **Usage:**
   * - Called when explicitly creating a new user document
   * - Accepts full user data including role, projects, and timestamps
   * - Returns the created user's UID
   *
   * **Note:** For post-authentication user creation, consider using ensureUserDocument()
   * which handles both creation and existing user scenarios.
   *
   * @param userData - Complete user data including uid, email, role, etc.
   * @returns Promise<string> - The created user's UID
   */
  createUser(userData: CreateUserInput): Promise<string>

  /**
   * Get user by ID
   *
   * Retrieves a user's complete profile data.
   *
   * @param userId - The user's UID
   * @returns Promise<User | null> - User data or null if not found
   */
  getUserById(userId: string): Promise<User | null>

  /**
   * Get user by email
   *
   * Retrieves a user by their email address.
   *
   * @param email - The user's email address
   * @returns Promise<User | null> - User data or null if not found
   */
  getUserByEmail(email: string): Promise<User | null>

  /**
   * Get all users
   *
   * Retrieves all users in the system (Super admin only).
   *
   * @returns Promise<User[]> - Array of all users
   */
  getAllUsers(): Promise<User[]>

  /**
   * Get admins and super users
   *
   * Retrieves all users with 'Admin' or 'Super' roles.
   * Used in the User Assignment page to display CMS users.
   *
   * @returns Promise<User[]> - Array of Admin and Super users
   */
  getAdminsAndSuperUsers(): Promise<User[]>

  /**
   * Update user role
   *
   * Updates a user's role and manages project assignments accordingly.
   *
   * **Project Assignment Logic:**
   * - Super: Has implicit access to all projects, assigned_projects cleared
   * - Admin: Requires explicit project assignments, assigned_projects preserved
   * - User: No CMS access, assigned_projects cleared
   *
   * @param userId - The user ID whose role is being updated
   * @param newRole - The new role to assign
   * @param actingUserId - The Super user ID performing the role change
   * @returns Promise<void>
   */
  updateUserRole(userId: string, newRole: UserRole, actingUserId: string): Promise<void>

  /**
   * Update user profile
   *
   * Updates user profile information (name, photo, etc.).
   *
   * @param userId - The user ID
   * @param updates - Profile updates
   * @returns Promise<void>
   */
  updateUserProfile(userId: string, updates: UpdateUserInput): Promise<void>

  /**
   * Update user project assignments
   *
   * Updates a user's project assignments.
   * Super admin only operation.
   *
   * @param userId - The user ID whose projects are being updated
   * @param projectIds - Array of project IDs to assign
   * @param actingUserId - The Super admin user ID making the change
   * @returns Promise<void>
   */
  updateUserProjectAssignments(
    userId: string,
    projectIds: string[],
    actingUserId: string
  ): Promise<void>

  /**
   * Assign user to project
   *
   * Adds a project ID to the user's projects array.
   *
   * @param userId - The user's UID
   * @param projectId - The project ID to assign
   * @returns Promise<boolean> - True if successful
   */
  assignUserToProject(userId: string, projectId: string): Promise<boolean>

  /**
   * Remove user from project
   *
   * Removes a project ID from the user's projects array.
   *
   * @param userId - The user's UID
   * @param projectId - The project ID to remove
   * @returns Promise<boolean> - True if successful
   */
  removeUserFromProject(userId: string, projectId: string): Promise<boolean>

  /**
   * Update last login timestamp
   *
   * Updates the user's last login timestamp.
   *
   * @param userId - The user's UID
   * @returns Promise<void>
   */
  updateLastLogin(userId: string): Promise<void>

  /**
   * Delete user
   *
   * Deletes a user document (Super admin only).
   * This does NOT delete the Firebase Auth account, only the Firestore document.
   *
   * @param userId - The user ID to delete
   * @returns Promise<void>
   */
  deleteUser(userId: string): Promise<void>

  /**
   * Check if user has project access
   *
   * Checks if a user has access to a specific project.
   * Super users always have access.
   *
   * @param userId - The user's UID
   * @param projectId - The project ID to check
   * @returns Promise<boolean> - True if user has access
   */
  hasProjectAccess(userId: string, projectId: string): Promise<boolean>
}
