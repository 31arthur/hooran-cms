/**
 * User Management Use Case Interface
 *
 * Defines the application-layer contract for user management and
 * project assignment operations.
 *
 * **Clean Architecture - Application Layer:**
 * Orchestrates user operations, role management, and project assignments.
 *
 * **Key Principles:**
 * - Methods accept and return ONLY domain entities or primitives
 * - NO Firebase, UI, or infrastructure types
 * - Pure business operations
 */

/**
 * User Entity
 *
 * Clean domain representation of a user
 */
export interface User {
  uid: string
  email: string
  displayName?: string
  role: 'Super' | 'Admin' | 'User'
  projects: string[] // Array of assigned project IDs
  createdAt: Date
  updatedAt: Date
}

/**
 * User with Project Details
 *
 * Enriched user information with project names
 */
export interface UserWithProjects {
  user: User
  projectNames: string[]
}

/**
 * Project Assignment Result
 *
 * Result of project assignment operation
 */
export interface ProjectAssignmentResult {
  success: boolean
  assignedProjects: string[]
  failedProjects: string[]
  errors: string[]
}

/**
 * IUserManagementUseCase
 *
 * Application-layer interface for user management operations.
 */
export interface IUserManagementUseCase {
  /**
   * Get all users (Super users only)
   *
   * Business Rules:
   * - Only Super users can view all users
   * - Returns complete user list with roles and assignments
   *
   * @param requestingUserId - The Super user requesting the list
   * @returns Promise<User[]> - List of all users
   * @throws Error if user is not Super role
   */
  getAllUsers(requestingUserId: string): Promise<User[]>

  /**
   * Get user by ID
   *
   * Business Rules:
   * - Super users can view any user
   * - Non-Super users can only view themselves
   *
   * @param userId - The user ID to fetch
   * @param requestingUserId - The user making the request
   * @param requestingUserRole - The requesting user's role
   * @returns Promise<User | null> - User or null
   * @throws Error if permission denied
   */
  getUserById(
    userId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<User | null>

  /**
   * Get user by email
   *
   * Business Rules:
   * - Super users can search any user by email
   * - Used for project assignment lookups
   *
   * @param email - The email to search for
   * @param requestingUserId - The Super user making the request
   * @returns Promise<User | null> - User or null
   * @throws Error if user is not Super role
   */
  getUserByEmail(email: string, requestingUserId: string): Promise<User | null>

  /**
   * Get users assigned to a project
   *
   * Business Rules:
   * - Returns all users with access to the project
   * - Includes role information
   * - Excludes Super users (they have access to all projects)
   *
   * @param projectId - The project ID
   * @param requestingUserId - The user making the request
   * @param requestingUserRole - The requesting user's role
   * @returns Promise<User[]> - List of assigned users
   * @throws Error if user lacks access
   */
  getUsersAssignedToProject(
    projectId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<User[]>

  /**
   * Assign user to project
   *
   * Business Rules:
   * - Only Super users can assign users to projects
   * - User must have Admin role to be assigned
   * - Cannot assign User role to projects
   * - Creates audit log entry
   *
   * @param userId - The user ID to assign
   * @param projectId - The project ID to assign to
   * @param requestingUserId - The Super user making the assignment
   * @returns Promise<void>
   * @throws Error if validation fails or user lacks permission
   */
  assignUserToProject(
    userId: string,
    projectId: string,
    requestingUserId: string
  ): Promise<void>

  /**
   * Remove user from project
   *
   * Business Rules:
   * - Only Super users can remove assignments
   * - Creates audit log entry
   * - User loses access to project
   *
   * @param userId - The user ID to remove
   * @param projectId - The project ID to remove from
   * @param requestingUserId - The Super user making the change
   * @returns Promise<void>
   * @throws Error if user lacks permission
   */
  removeUserFromProject(
    userId: string,
    projectId: string,
    requestingUserId: string
  ): Promise<void>

  /**
   * Batch assign user to multiple projects
   *
   * Business Rules:
   * - Only Super users can batch assign
   * - User must be Admin role
   * - Continues on error for partial success
   * - Returns detailed results
   *
   * @param userId - The user ID to assign
   * @param projectIds - Array of project IDs
   * @param requestingUserId - The Super user making the assignments
   * @returns Promise<ProjectAssignmentResult> - Detailed results
   */
  batchAssignUserToProjects(
    userId: string,
    projectIds: string[],
    requestingUserId: string
  ): Promise<ProjectAssignmentResult>

  /**
   * Update user's assigned projects
   *
   * Business Rules:
   * - Only Super users can update assignments
   * - Replaces entire project list
   * - User must be Admin role
   * - Creates audit log entry
   *
   * @param userId - The user ID to update
   * @param projectIds - New array of project IDs
   * @param requestingUserId - The Super user making the change
   * @returns Promise<void>
   * @throws Error if user lacks permission
   */
  updateUserProjectAssignments(
    userId: string,
    projectIds: string[],
    requestingUserId: string
  ): Promise<void>

  /**
   * Update user role
   *
   * Business Rules:
   * - Only Super users can change roles
   * - Cannot change own role
   * - Super user role cannot be changed (permanent)
   * - Role changes may affect project access
   * - Creates audit log entry
   *
   * @param userId - The user ID to update
   * @param newRole - The new role ('Super', 'Admin', 'User')
   * @param requestingUserId - The Super user making the change
   * @returns Promise<void>
   * @throws Error if validation fails or user lacks permission
   */
  updateUserRole(
    userId: string,
    newRole: 'Super' | 'Admin' | 'User',
    requestingUserId: string
  ): Promise<void>

  /**
   * Update user profile
   *
   * Business Rules:
   * - Only Super users can update other users' profiles
   * - Email cannot be changed (security constraint)
   * - Display name can be updated
   * - Creates audit log entry
   *
   * @param userId - The user ID to update
   * @param updates - Profile updates (displayName only, email excluded)
   * @param requestingUserId - The Super user making the change
   * @returns Promise<void>
   * @throws Error if validation fails or user lacks permission
   */
  updateUserProfile(
    userId: string,
    updates: { displayName?: string },
    requestingUserId: string
  ): Promise<void>

  /**
   * Check if user has access to project
   *
   * Business Rules:
   * - Super users always have access
   * - Admin/User must be explicitly assigned
   *
   * @param userId - The user ID to check
   * @param projectId - The project ID to check
   * @param userRole - The user's role
   * @returns Promise<boolean> - True if user has access
   */
  hasProjectAccess(userId: string, projectId: string, userRole: string): Promise<boolean>

  /**
   * Validate user can be assigned to projects
   *
   * Business Rules:
   * - User must have Admin role
   * - User role cannot be assigned to projects
   *
   * @param userId - The user ID to validate
   * @returns Promise<{ canAssign: boolean; reason?: string }> - Validation result
   */
  validateUserForProjectAssignment(
    userId: string
  ): Promise<{ canAssign: boolean; reason?: string }>

  /**
   * Get all Admins and Super users
   *
   * Business Rules:
   * - Returns users with 'Admin' or 'Super' role only
   * - Used for user assignment interfaces
   * - Includes project assignments for each user
   *
   * @param requestingUserId - The user making the request
   * @returns Promise<User[]> - List of Admin and Super users
   * @throws Error if user lacks permission
   */
  getAdminsAndSuperUsers(requestingUserId: string): Promise<User[]>

  /**
   * Ensure user document exists in database
   *
   * Critical authentication function that creates user document if it doesn't exist.
   *
   * Business Rules:
   * - If user document exists: Returns existing role
   * - If user document doesn't exist: Creates with default 'User' role
   * - New users default to 'User' role (no CMS access)
   * - Updates last_login timestamp
   * - Used immediately after authentication
   *
   * @param uid - The user's unique identifier
   * @param email - The user's email
   * @param displayName - The user's display name (optional)
   * @param photoURL - The user's photo URL (optional, can be null)
   * @returns Promise<'Super' | 'Admin' | 'User'> - The user's role
   */
  ensureUserDocument(
    uid: string,
    email: string,
    displayName?: string,
    photoURL?: string | null
  ): Promise<'Super' | 'Admin' | 'User'>

  /**
   * Delete user
   *
   * Business Rules:
   * - Only Super users can delete other users
   * - Cannot delete your own account
   * - Deletes Firestore user document
   * - Attempts to delete Firebase Auth account (limited by client-side constraints)
   * - Creates audit log entry
   *
   * @param userId - The user ID to delete
   * @param requestingUserId - The Super user performing the deletion
   * @returns Promise<void>
   * @throws Error if validation fails or user lacks permission
   */
  deleteUser(userId: string, requestingUserId: string): Promise<void>

  /**
   * Get user data by ID
   *
   * Returns complete user data including timestamps.
   * Alias for getUserById with simpler signature.
   *
   * @param userId - The user ID to fetch
   * @returns Promise<User | null> - User or null
   */
  getUserData(userId: string): Promise<User | null>
}
