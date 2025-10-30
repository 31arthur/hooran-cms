/**
 * User Management Use Case Implementation
 *
 * Orchestrates user management operations including role management,
 * project assignments, and access control with comprehensive audit logging.
 *
 * **Architecture Pattern:**
 * This class demonstrates Clean Architecture principles:
 * 1. Dependency Injection - Repositories injected via constructor
 * 2. Interface Segregation - Depends only on repository interfaces
 * 3. Single Responsibility - Orchestrates user management operations only
 * 4. Business Logic Separation - Contains no database-specific code
 *
 * **Key Responsibilities:**
 * - User CRUD operations with role-based access control
 * - Project assignment management
 * - Role management with audit logging
 * - Access validation
 */

import type {
  IUserManagementUseCase,
  User,
  ProjectAssignmentResult,
} from './IUserManagementUseCase'
import type {
  IUserRepository,
  IProjectRepository,
  IAuditRepository,
} from '@/domain/repositories'
import type { User as CoreUser } from '@/domain/entities/User'

/**
 * UserManagementUseCase
 *
 * Implements user management with mandatory audit logging for compliance.
 */
export class UserManagementUseCase implements IUserManagementUseCase {
  private userRepository: IUserRepository
  private projectRepository: IProjectRepository
  private auditRepository: IAuditRepository

  /**
   * Constructor with Dependency Injection
   *
   * @param userRepository - User data access
   * @param projectRepository - Project data access (for validation)
   * @param auditRepository - Audit logging
   */
  constructor(
    userRepository: IUserRepository,
    projectRepository: IProjectRepository,
    auditRepository: IAuditRepository
  ) {
    this.userRepository = userRepository
    this.projectRepository = projectRepository
    this.auditRepository = auditRepository
  }

  /**
   * Convert Core User entity to Use Case User interface
   */
  private mapCoreUserToUser(coreUser: CoreUser): User {
    return {
      uid: coreUser.uid,
      email: coreUser.email,
      displayName: coreUser.displayName || coreUser.name,
      role: coreUser.role,
      projects: coreUser.projects || [],
      createdAt: coreUser.createdAt || new Date(),
      updatedAt: coreUser.updatedAt || new Date(),
    }
  }

  /**
   * Get all users (Super users only)
   */
  async getAllUsers(requestingUserId: string): Promise<User[]> {
    try {
      console.log('📋 UserManagementUseCase: Getting all users')

      // Verify requesting user is Super (would normally check role first)
      const requestingUser = await this.userRepository.getUserById(requestingUserId)
      if (!requestingUser || requestingUser.role !== 'Super') {
        throw new Error('Only Super users can view all users')
      }

      const coreUsers = await this.userRepository.getAllUsers()
      return coreUsers.map((u) => this.mapCoreUserToUser(u))
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to get all users', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(
    userId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<User | null> {
    try {
      // Check access: Super can view anyone, others can only view themselves
      if (requestingUserRole !== 'Super' && userId !== requestingUserId) {
        throw new Error('Permission denied: You can only view your own profile')
      }

      const coreUser = await this.userRepository.getUserById(userId)
      return coreUser ? this.mapCoreUserToUser(coreUser) : null
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to get user by ID', error)
      throw error
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string, requestingUserId: string): Promise<User | null> {
    try {
      // Verify requesting user is Super
      const requestingUser = await this.userRepository.getUserById(requestingUserId)
      if (!requestingUser || requestingUser.role !== 'Super') {
        throw new Error('Only Super users can search users by email')
      }

      const coreUser = await this.userRepository.getUserByEmail(email)
      return coreUser ? this.mapCoreUserToUser(coreUser) : null
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to get user by email', error)
      throw error
    }
  }

  /**
   * Get users assigned to a project
   */
  async getUsersAssignedToProject(
    projectId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<User[]> {
    try {
      // Verify access to project
      if (requestingUserRole !== 'Super') {
        const hasAccess = await this.userRepository.hasProjectAccess(
          requestingUserId,
          projectId
        )
        if (!hasAccess) {
          throw new Error('Permission denied: You do not have access to this project')
        }
      }

      // Get all users and filter by project assignment
      const allUsers = await this.userRepository.getAdminsAndSuperUsers()
      const assignedUsers = allUsers.filter(
        (u) => u.role !== 'Super' && u.projects?.includes(projectId)
      )

      return assignedUsers.map((u) => this.mapCoreUserToUser(u))
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to get assigned users', error)
      throw error
    }
  }

  /**
   * Assign user to project
   */
  async assignUserToProject(
    userId: string,
    projectId: string,
    requestingUserId: string
  ): Promise<void> {
    try {
      // Verify requesting user is Super
      const requestingUser = await this.userRepository.getUserById(requestingUserId)
      if (!requestingUser || requestingUser.role !== 'Super') {
        throw new Error('Only Super users can assign users to projects')
      }

      // Verify target user exists and has Admin role
      const targetUser = await this.userRepository.getUserById(userId)
      if (!targetUser) {
        throw new Error(`User ${userId} not found`)
      }

      if (targetUser.role !== 'Admin') {
        throw new Error('Only Admin users can be assigned to projects')
      }

      // Verify project exists
      const project = await this.projectRepository.getProjectById(projectId)
      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      // Assign user to project
      await this.userRepository.assignUserToProject(userId, projectId)

      // Log audit action
      await this.auditRepository.logAction({
        projectId,
        userId: requestingUserId,
        action: 'USER_ASSIGNMENT',
        resourceType: 'USER_ROLE',
        resourceId: userId,
        details: {
          assigned_user_id: userId,
          assigned_to_project: projectId,
          assigned_by: requestingUserId,
        },
        timestamp: new Date(),
      })

      console.log(`✅ UserManagementUseCase: User ${userId} assigned to project ${projectId}`)
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to assign user to project', error)
      throw error
    }
  }

  /**
   * Remove user from project
   */
  async removeUserFromProject(
    userId: string,
    projectId: string,
    requestingUserId: string
  ): Promise<void> {
    try {
      // Verify requesting user is Super
      const requestingUser = await this.userRepository.getUserById(requestingUserId)
      if (!requestingUser || requestingUser.role !== 'Super') {
        throw new Error('Only Super users can remove user assignments')
      }

      // Remove user from project
      await this.userRepository.removeUserFromProject(userId, projectId)

      // Log audit action
      await this.auditRepository.logAction({
        projectId,
        userId: requestingUserId,
        action: 'UPDATE',
        resourceType: 'USER_ROLE',
        resourceId: userId,
        details: {
          removed_user_id: userId,
          removed_from_project: projectId,
          removed_by: requestingUserId,
        },
        timestamp: new Date(),
      })

      console.log(`✅ UserManagementUseCase: User ${userId} removed from project ${projectId}`)
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to remove user from project', error)
      throw error
    }
  }

  /**
   * Batch assign user to multiple projects
   */
  async batchAssignUserToProjects(
    userId: string,
    projectIds: string[],
    requestingUserId: string
  ): Promise<ProjectAssignmentResult> {
    const result: ProjectAssignmentResult = {
      success: true,
      assignedProjects: [],
      failedProjects: [],
      errors: [],
    }

    for (const projectId of projectIds) {
      try {
        await this.assignUserToProject(userId, projectId, requestingUserId)
        result.assignedProjects.push(projectId)
      } catch (error) {
        result.success = false
        result.failedProjects.push(projectId)
        result.errors.push(
          `Failed to assign to ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return result
  }

  /**
   * Update user's assigned projects
   *
   * This replaces the entire projects array for a user
   */
  async updateUserProjectAssignments(
    userId: string,
    projectIds: string[],
    requestingUserId: string
  ): Promise<void> {
    try {
      console.log('💾 UserManagementUseCase: Updating user project assignments', {
        userId,
        projectIds,
        requestingUserId,
      })

      // Verify requesting user is Super
      const requestingUser = await this.userRepository.getUserById(requestingUserId)
      if (!requestingUser || requestingUser.role !== 'Super') {
        throw new Error('Only Super users can update project assignments')
      }

      // Verify target user exists and is Admin
      const targetUser = await this.userRepository.getUserById(userId)
      if (!targetUser) {
        throw new Error(`User ${userId} not found`)
      }

      if (targetUser.role !== 'Admin') {
        throw new Error('Only Admin users can be assigned to projects')
      }

      // Update project assignments
      await this.userRepository.updateUserProjectAssignments(userId, projectIds, requestingUserId)

      // Log audit action
      await this.auditRepository.logAction({
        projectId: 'system', // System-wide operation
        userId: requestingUserId,
        action: 'UPDATE',
        resourceType: 'USER_ROLE',
        resourceId: userId,
        details: {
          updated_user_id: userId,
          new_projects: projectIds,
          updated_by: requestingUserId,
        },
        timestamp: new Date(),
      })

      console.log(`✅ UserManagementUseCase: Updated project assignments for user ${userId}`)
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to update project assignments', error)
      throw error
    }
  }

  /**
   * Update user role
   *
   * CRITICAL BUSINESS RULES:
   * 1. Role Validation: Ensures newRole is 'Super', 'Admin', or 'User'
   * 2. Project Assignment Impact:
   *    - Super role: assigned_projects CLEARED (implicit all-access)
   *    - User role: assigned_projects CLEARED (no CMS access)
   *    - Admin role: assigned_projects PRESERVED
   * 3. MANDATORY Audit Logging: Logs role change with old/new values
   */
  async updateUserRole(
    userId: string,
    newRole: 'Super' | 'Admin' | 'User',
    requestingUserId: string
  ): Promise<void> {
    try {
      console.log('👤 UserManagementUseCase: Updating user role')
      console.log(`   Target User: ${userId}`)
      console.log(`   New Role: ${newRole}`)
      console.log(`   Acting User: ${requestingUserId}`)

      // Step 1: Validate inputs
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid target user ID: User ID must be a non-empty string')
      }

      if (!newRole || !['Super', 'Admin', 'User'].includes(newRole)) {
        throw new Error('Invalid role: Role must be "Super", "Admin", or "User"')
      }

      if (!requestingUserId || typeof requestingUserId !== 'string' || requestingUserId.trim() === '') {
        throw new Error('Invalid acting user ID: User ID must be a non-empty string')
      }

      // Step 2: Verify requesting user is Super
      const requestingUser = await this.userRepository.getUserById(requestingUserId)
      if (!requestingUser || requestingUser.role !== 'Super') {
        throw new Error('Only Super users can change user roles')
      }

      // Step 3: Cannot change own role
      if (userId === requestingUserId) {
        throw new Error('Cannot change your own role')
      }

      // Step 4: Fetch existing user data to track changes
      const targetUser = await this.userRepository.getUserById(userId)
      if (!targetUser) {
        throw new Error(`User not found: ${userId}`)
      }

      const oldRole = targetUser.role || 'User'
      const oldProjects = targetUser.projects || []

      // If no change in role, skip update
      if (oldRole === newRole) {
        console.log('⚠️ UserManagementUseCase: Role unchanged, skipping update')
        return
      }

      console.log(`   Old Role: ${oldRole}`)
      console.log(`   Old Projects: ${oldProjects.length} assigned`)

      // Step 5: Determine project assignment impact based on new role
      // CRITICAL SECURITY RULE: Super and User roles must have cleared projects
      let updatedProjects: string[]

      if (newRole === 'Super') {
        // SUPER: Clear assigned_projects (implicit all-access)
        updatedProjects = []
        console.log('   → Super role: Clearing assigned_projects (implicit all-access)')
      } else if (newRole === 'User') {
        // USER: Clear assigned_projects (no CMS access)
        updatedProjects = []
        console.log('   → User role: Clearing assigned_projects (no CMS access)')
      } else if (newRole === 'Admin') {
        // ADMIN: Preserve assigned_projects (requires explicit assignments)
        updatedProjects = oldProjects
        console.log(`   → Admin role: Preserving assigned_projects (${updatedProjects.length} projects)`)
      } else {
        // Fallback (should never reach here due to validation)
        updatedProjects = oldProjects
      }

      // Step 6: Update role via repository (which handles both role and projects)
      await this.userRepository.updateUserRole(userId, newRole, requestingUserId)

      console.log(`✅ UserManagementUseCase: User role updated to "${newRole}"`)

      // Step 7: MANDATORY AUDIT LOGGING (New Audit System)
      try {
        // Use the new AuditLoggingUseCase for comprehensive audit trail
        const { DIContainer, DI_TYPES } = await import('@/domain/di')
        const auditLoggingUseCase = DIContainer.resolve(DI_TYPES.AuditLoggingUseCase) as any

        await auditLoggingUseCase.logRoleChange(
          userId,
          targetUser.email,
          oldRole,
          newRole,
          {
            userId: requestingUserId,
            userEmail: requestingUser.email,
            userName: requestingUser.displayName || requestingUser.email,
            userRole: requestingUser.role,
          }
        )

        console.log('📝 UserManagementUseCase: Role change logged to audit trail')
      } catch (auditError) {
        console.error('⚠️ UserManagementUseCase: Failed to create audit log', auditError)
        // Don't throw - audit logging should not break role updates
      }

      // Step 8: Legacy audit logging (for compatibility)
      try {
        await this.auditRepository.logAction({
          projectId: 'system', // System-level action, not project-specific
          userId: requestingUserId, // Acting user (Super who made the change)
          action: 'UPDATE',
          resourceType: 'USER_ROLE',
          resourceId: userId,
          details: {
            action_type: 'USER_ROLE_CHANGE',
            old_role: oldRole,
            new_role: newRole,
            target_user_id: userId,
            old_assigned_projects: oldProjects,
            new_assigned_projects: updatedProjects,
            projects_cleared: oldProjects.length > 0 && updatedProjects.length === 0,
            role_change_reason:
              newRole === 'Super'
                ? 'Promoted to Super (all-access)'
                : newRole === 'User'
                  ? 'Demoted to User (no CMS access)'
                  : 'Changed to Admin (requires project assignment)',
          },
          timestamp: new Date(),
        })

        console.log('✅ UserManagementUseCase: Audit log created for role change')
      } catch (auditError) {
        // Audit logging failure should not fail the operation
        console.error(
          '❌ UserManagementUseCase: Failed to create audit log (role change was still successful):',
          auditError
        )
        console.error('   This is a non-critical error - the role update was successful')
      }
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to update user role', error)
      throw error
    }
  }

  /**
   * Check if user has access to project
   */
  async hasProjectAccess(userId: string, projectId: string, userRole: string): Promise<boolean> {
    try {
      // Super users have access to all projects
      if (userRole === 'Super') {
        return true
      }

      return await this.userRepository.hasProjectAccess(userId, projectId)
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to check project access', error)
      return false
    }
  }

  /**
   * Validate user can be assigned to projects
   */
  async validateUserForProjectAssignment(
    userId: string
  ): Promise<{ canAssign: boolean; reason?: string }> {
    try {
      const user = await this.userRepository.getUserById(userId)

      if (!user) {
        return {
          canAssign: false,
          reason: 'User not found',
        }
      }

      if (user.role !== 'Admin') {
        return {
          canAssign: false,
          reason: 'Only Admin users can be assigned to projects',
        }
      }

      return {
        canAssign: true,
      }
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to validate user', error)
      return {
        canAssign: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get all Admins and Super users
   *
   * Used by User Assignment page to display CMS users.
   */
  async getAdminsAndSuperUsers(requestingUserId: string): Promise<User[]> {
    try {
      console.log('📋 UserManagementUseCase: Fetching Admin and Super users')

      // Verify requesting user is Super
      const requestingUser = await this.userRepository.getUserById(requestingUserId)
      if (!requestingUser || requestingUser.role !== 'Super') {
        throw new Error('Only Super users can view Admin/Super users list')
      }

      const coreUsers = await this.userRepository.getAdminsAndSuperUsers()
      const users = coreUsers.map((u) => this.mapCoreUserToUser(u))

      console.log(`✅ UserManagementUseCase: Fetched ${users.length} Admin/Super users`)
      return users
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to fetch Admin/Super users', error)
      throw error
    }
  }

  /**
   * Ensure user document exists in database
   *
   * Critical authentication function that creates user document if it doesn't exist.
   * This MUST be called immediately after Google Sign-In.
   */
  async ensureUserDocument(
    uid: string,
    email: string,
    displayName?: string,
    photoURL?: string | null
  ): Promise<'Super' | 'Admin' | 'User'> {
    try {
      console.log(`📋 UserManagementUseCase: Ensuring user document for ${email}`)

      // Check if user already exists
      const existingUser = await this.userRepository.getUserById(uid)

      if (existingUser) {
        // User document EXISTS - return stored role
        const role = existingUser.role || 'User'
        console.log(`✅ UserManagementUseCase: Existing user document found - Role: ${role}`)

        // Update last_login timestamp via repository
        await this.userRepository.updateLastLogin(uid)

        // Validate role is one of the allowed values
        const validRoles: Array<'Super' | 'Admin' | 'User'> = ['Super', 'Admin', 'User']
        if (!validRoles.includes(role)) {
          console.warn(`⚠️ UserManagementUseCase: Invalid role "${role}" detected, defaulting to "User"`)
          return 'User'
        }

        return role
      } else {
        // User document DOES NOT EXIST - create new document with default 'User' role
        console.log('📝 UserManagementUseCase: User document not found, creating new document')

        await this.userRepository.createUser({
          uid,
          email,
          name: displayName,
          displayName,
          photoUrl: photoURL || undefined,
          role: 'User', // ⚠️ DEFAULT ROLE: No CMS access
          projects: [], // Empty projects array - no project access yet
        })

        console.log('✅ UserManagementUseCase: New user document created with role: "User"')
        console.log(
          '⚠️ UserManagementUseCase: New user has "User" role - CMS access DENIED. Admin must upgrade role to "Admin" or "Super" for CMS access.'
        )

        return 'User'
      }
    } catch (error) {
      console.error('❌ UserManagementUseCase: Error ensuring user document:', error)

      // On error, default to least privileged role for security
      console.error('🚫 UserManagementUseCase: Defaulting to "User" role due to error')
      return 'User'
    }
  }

  /**
   * Get user data by ID
   *
   * Simplified version of getUserById without access control checks.
   * Used for internal operations where access has already been validated.
   */
  async getUserData(userId: string): Promise<User | null> {
    try {
      const coreUser = await this.userRepository.getUserById(userId)
      return coreUser ? this.mapCoreUserToUser(coreUser) : null
    } catch (error) {
      console.error('❌ UserManagementUseCase: Failed to get user data', error)
      return null
    }
  }
}
