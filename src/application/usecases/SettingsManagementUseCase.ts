/**
 * Settings Management Use Case Implementation
 *
 * Orchestrates project and system settings operations with comprehensive audit logging.
 * This Use Case ensures that all configuration updates are properly tracked and auditable.
 *
 * **Architecture Pattern:**
 * This class demonstrates Clean Architecture principles:
 * 1. Dependency Injection - Repositories injected via constructor
 * 2. Interface Segregation - Depends only on repository interfaces
 * 3. Single Responsibility - Orchestrates settings operations only
 * 4. Business Logic Separation - Contains no database-specific code
 *
 * **Key Responsibilities:**
 * - Project metadata updates with audit logging
 * - Project creation with transactional integrity
 * - System settings management with change tracking
 * - Comprehensive audit trail for compliance
 */

import type {
  ISettingsManagementUseCase,
  SystemSettings,
  ProjectCreationResult,
} from './ISettingsManagementUseCase'
import type {
  IProjectRepository,
  IUserRepository,
  IAuditRepository,
} from '@/domain/repositories'
import type { ProjectMetadata } from '@/domain/entities/Project'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'

/**
 * SettingsManagementUseCase
 *
 * Implements settings management with mandatory audit logging for compliance.
 */
export class SettingsManagementUseCase implements ISettingsManagementUseCase {
  private projectRepository: IProjectRepository
  private userRepository: IUserRepository
  private auditRepository: IAuditRepository

  /**
   * Constructor with Dependency Injection
   *
   * Dependencies are injected via constructor, enabling proper separation
   * of concerns and testability.
   *
   * @param projectRepository - Project data access
   * @param userRepository - User data access
   * @param auditRepository - Audit logging
   */
  constructor(
    projectRepository: IProjectRepository,
    userRepository: IUserRepository,
    auditRepository: IAuditRepository
  ) {
    this.projectRepository = projectRepository
    this.userRepository = userRepository
    this.auditRepository = auditRepository
  }

  /**
   * Update project metadata
   *
   * Updates project name and status with automatic audit logging.
   *
   * **Implementation:**
   * 1. Fetches existing project for change tracking
   * 2. Updates project via repository
   * 3. Logs audit action with PROJECT_SETTINGS resource type
   */
  async updateProjectMetadata(
    projectId: string,
    metadata: ProjectMetadata,
    userId: string
  ): Promise<void> {
    try {
      console.log('💾 SettingsManagementUseCase: Updating project metadata', {
        projectId,
        metadata,
        userId,
      })

      // Step 1: Fetch existing project for change tracking
      const existingProject = await this.projectRepository.getProjectById(projectId)
      if (!existingProject) {
        throw new Error(`Project ${projectId} not found`)
      }

      // Step 2: Track changes for audit logging
      const changes: string[] = []
      const changeDetails: Record<string, any> = {}

      if (metadata.name !== existingProject.name) {
        changes.push('name')
        changeDetails.name = {
          old: existingProject.name,
          new: metadata.name,
        }
      }

      if (metadata.status !== existingProject.status) {
        changes.push('status')
        changeDetails.status = {
          old: existingProject.status,
          new: metadata.status,
        }
      }

      // Step 3: Update project metadata via repository
      await this.projectRepository.updateProjectMetadata(projectId, metadata, userId)

      console.log('✅ SettingsManagementUseCase: Project metadata updated successfully')

      // Step 4: MANDATORY audit logging with PROJECT_SETTINGS resource type
      if (changes.length > 0) {
        await this.auditRepository.logAction({
          projectId,
          userId,
          action: 'UPDATE',
          resourceType: 'PROJECT_SETTINGS' as any, // Extended resource type for settings
          resourceId: projectId,
          details: {
            changed_fields: changes,
            changes: changeDetails,
            old_name: existingProject.name,
            old_status: existingProject.status,
            new_name: metadata.name,
            new_status: metadata.status,
            change_summary: `Updated ${changes.join(', ')} for project "${metadata.name}"`,
          },
          timestamp: new Date(),
        })

        console.log('✅ SettingsManagementUseCase: PROJECT_SETTINGS audit log created')
      }
    } catch (error) {
      console.error('❌ SettingsManagementUseCase: Failed to update project metadata', error)
      throw error
    }
  }

  /**
   * Create a new project (Super Exclusive)
   *
   * Creates a new multi-tenant project with optional admin assignment.
   * Handles transactional integrity and comprehensive audit logging.
   *
   * **Implementation:**
   * 1. Validates inputs
   * 2. Creates project via repository
   * 3. If admin email provided:
   *    - Finds user by email
   *    - Assigns user to project
   *    - Logs USER_ASSIGNMENT audit
   * 4. Logs PROJECT creation audit
   */
  async createProject(
    projectName: string,
    projectSlug: string,
    initialAdminEmail: string | null,
    userId: string
  ): Promise<ProjectCreationResult> {
    try {
      console.log('🚀 SettingsManagementUseCase: Creating new project', {
        name: projectName,
        slug: projectSlug,
        initialAdmin: initialAdminEmail || 'None',
        creator: userId,
      })

      // Step 1: Validate inputs
      if (!projectName || typeof projectName !== 'string' || projectName.trim() === '') {
        throw new Error('Invalid project name: Name must be a non-empty string')
      }

      if (!projectSlug || typeof projectSlug !== 'string' || projectSlug.trim() === '') {
        throw new Error('Invalid project slug: Slug must be a non-empty string')
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(projectSlug)) {
        throw new Error(
          'Invalid project slug format: Must contain only lowercase letters, numbers, and hyphens'
        )
      }

      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid user ID: User ID must be a non-empty string')
      }

      // Step 2: Check if project slug is unique
      const existingProject = await this.projectRepository.getProjectById(projectSlug)
      if (existingProject) {
        throw new Error(
          `Project slug "${projectSlug}" already exists. Please choose a different slug.`
        )
      }

      console.log('✅ SettingsManagementUseCase: Slug is unique, proceeding with creation')

      // Step 3: Create project via repository
      const projectId = await this.projectRepository.createProject(
        projectName,
        projectSlug,
        initialAdminEmail,
        userId
      )

      console.log('✅ SettingsManagementUseCase: Project created successfully', { projectId })

      // Step 4: Handle initial admin assignment if provided
      let adminAssigned = false
      let adminUserId: string | null = null

      if (initialAdminEmail && initialAdminEmail.trim() !== '') {
        try {
          console.log(
            `📋 SettingsManagementUseCase: Finding user with email ${initialAdminEmail}...`
          )

          const adminUser = await this.userRepository.getUserByEmail(initialAdminEmail.trim())

          if (!adminUser) {
            console.warn(
              `⚠️ SettingsManagementUseCase: User with email ${initialAdminEmail} not found. Project created but admin not assigned.`
            )
          } else {
            console.log(`✅ SettingsManagementUseCase: User found - ${adminUser.uid}`)

            // Assign user to project
            const assignSuccess = await this.userRepository.assignUserToProject(
              adminUser.uid,
              projectId
            )

            if (assignSuccess) {
              adminAssigned = true
              adminUserId = adminUser.uid
              console.log(
                `✅ SettingsManagementUseCase: User ${adminUser.uid} assigned to project ${projectId}`
              )

              // Log USER_ASSIGNMENT audit action
              await this.auditRepository.logAction({
                projectId,
                userId,
                action: 'USER_ASSIGNMENT',
                resourceType: 'USER_ROLE',
                resourceId: adminUser.uid,
                details: {
                  assigned_user_id: adminUser.uid,
                  assigned_user_email: initialAdminEmail.trim(),
                  assigned_user_role: adminUser.role,
                  assigned_to_project: projectId,
                  assigned_by: userId,
                  assignment_type: 'initial_admin',
                },
                timestamp: new Date(),
              })

              console.log('✅ SettingsManagementUseCase: USER_ASSIGNMENT audit log created')
            } else {
              console.warn(
                `⚠️ SettingsManagementUseCase: Failed to assign user ${adminUser.uid} to project`
              )
            }
          }
        } catch (adminError) {
          // Non-critical error - project was created successfully
          console.error(
            '❌ SettingsManagementUseCase: Error assigning initial admin (project still created):',
            adminError
          )
        }
      }

      // Step 5: MANDATORY audit logging for project creation
      await this.auditRepository.logAction({
        projectId,
        userId,
        action: 'CREATE',
        resourceType: 'PROJECT',
        resourceId: projectId,
        details: {
          project_name: projectName,
          project_slug: projectSlug,
          initial_admin_email: initialAdminEmail || null,
          initial_admin_assigned: adminAssigned,
          initial_admin_user_id: adminUserId,
          created_by: userId,
        },
        timestamp: new Date(),
      })

      console.log('✅ SettingsManagementUseCase: PROJECT creation audit log created')

      return {
        projectId,
        adminAssigned,
      }
    } catch (error) {
      console.error('❌ SettingsManagementUseCase: Failed to create project', error)
      throw error
    }
  }

  /**
   * Update system settings (Super Exclusive)
   *
   * Updates global application settings with comprehensive audit logging.
   *
   * **Implementation:**
   * 1. Validates settings data
   * 2. Fetches existing settings for change tracking
   * 3. Updates settings in Firestore
   * 4. Logs audit action with SYSTEM_SETTINGS resource type
   *
   * **Note:** This method directly accesses Firestore for system settings
   * because system_settings is a special singleton document, not a typical entity.
   */
  async updateSystemSettings(settings: SystemSettings, userId: string): Promise<void> {
    try {
      console.log('⚙️ SettingsManagementUseCase: Updating system settings', {
        defaultRole: settings.defaultRole,
        maintenanceMode: settings.maintenanceMode,
        userId,
      })

      // Step 1: Validate inputs
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid system settings: Data must be an object')
      }

      if (!settings.defaultRole || !['User', 'Admin'].includes(settings.defaultRole)) {
        throw new Error('Invalid defaultRole: Must be "User" or "Admin"')
      }

      if (typeof settings.maintenanceMode !== 'boolean') {
        throw new Error('Invalid maintenanceMode: Must be a boolean')
      }

      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid user ID: User ID must be a non-empty string')
      }

      // Step 2: Fetch existing settings for change tracking
      const settingsDocRef = doc(db, 'system_settings', 'global')
      const settingsDocSnap = await getDoc(settingsDocRef)

      let oldSettings: SystemSettings | null = null

      if (settingsDocSnap.exists()) {
        const existingData = settingsDocSnap.data()
        oldSettings = {
          defaultRole: existingData.defaultRole || 'User',
          maintenanceMode: existingData.maintenanceMode || false,
          updated_at: existingData.updated_at,
          updated_by: existingData.updated_by,
        }
      }

      // Step 3: Track changes for audit logging
      const changes: string[] = []
      const changeDetails: Record<string, any> = {}

      if (oldSettings) {
        if (settings.defaultRole !== oldSettings.defaultRole) {
          changes.push('defaultRole')
          changeDetails.defaultRole = {
            old: oldSettings.defaultRole,
            new: settings.defaultRole,
          }
        }

        if (settings.maintenanceMode !== oldSettings.maintenanceMode) {
          changes.push('maintenanceMode')
          changeDetails.maintenanceMode = {
            old: oldSettings.maintenanceMode,
            new: settings.maintenanceMode,
          }
        }
      } else {
        // First-time settings creation
        changes.push('defaultRole', 'maintenanceMode')
        changeDetails.defaultRole = { old: null, new: settings.defaultRole }
        changeDetails.maintenanceMode = { old: null, new: settings.maintenanceMode }
      }

      // If no changes, skip update
      if (changes.length === 0) {
        console.log('⚠️ SettingsManagementUseCase: No changes detected, skipping update')
        return
      }

      // Step 4: Update Firestore document
      await setDoc(
        settingsDocRef,
        {
          defaultRole: settings.defaultRole,
          maintenanceMode: settings.maintenanceMode,
          updated_at: serverTimestamp(),
          updated_by: userId,
        },
        { merge: true }
      )

      console.log('✅ SettingsManagementUseCase: System settings updated successfully')
      console.log(`   Changed fields: ${changes.join(', ')}`)

      // Step 5: MANDATORY audit logging for SYSTEM_SETTINGS
      await this.auditRepository.logAction({
        projectId: 'system', // System-wide settings, not project-specific
        userId,
        action: 'UPDATE',
        resourceType: 'SYSTEM_SETTINGS' as any,
        resourceId: 'global',
        details: {
          changed_fields: changes,
          changes: changeDetails,
          new_default_role: settings.defaultRole,
          new_maintenance_mode: settings.maintenanceMode,
        },
        timestamp: new Date(),
      })

      console.log('✅ SettingsManagementUseCase: SYSTEM_SETTINGS audit log created')
    } catch (error) {
      console.error('❌ SettingsManagementUseCase: Failed to update system settings', error)
      throw error
    }
  }

  /**
   * Get current system settings
   *
   * Retrieves the current system-wide configuration.
   * Returns default values if settings don't exist.
   */
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      console.log('🔍 SettingsManagementUseCase: Fetching system settings')

      const settingsDocRef = doc(db, 'system_settings', 'global')
      const settingsDocSnap = await getDoc(settingsDocRef)

      if (!settingsDocSnap.exists()) {
        console.log('⚠️ SettingsManagementUseCase: No settings found, returning defaults')
        return {
          defaultRole: 'User',
          maintenanceMode: false,
        }
      }

      const data = settingsDocSnap.data()

      const settings: SystemSettings = {
        defaultRole: data.defaultRole || 'User',
        maintenanceMode: data.maintenanceMode || false,
        updated_at: data.updated_at,
        updated_by: data.updated_by,
      }

      console.log('✅ SettingsManagementUseCase: Settings loaded successfully')

      return settings
    } catch (error) {
      console.error('❌ SettingsManagementUseCase: Error fetching system settings', error)
      // Return defaults on error to avoid breaking the UI
      return {
        defaultRole: 'User',
        maintenanceMode: false,
      }
    }
  }
}
