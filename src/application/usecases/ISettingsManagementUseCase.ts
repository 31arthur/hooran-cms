/**
 * Settings Management Use Case Interface
 *
 * Defines the contract for managing project and system settings in the multi-tenant CMS.
 * This Use Case orchestrates configuration updates with mandatory audit logging.
 *
 * **Key Features:**
 * - Project metadata management (name, status)
 * - Project creation with admin assignment
 * - System-wide settings management
 * - Comprehensive audit logging for all configuration changes
 *
 * **Architecture:**
 * This interface represents the Application Layer in Clean Architecture,
 * defining business operations that coordinate multiple repositories.
 *
 * **Implementation Requirements:**
 * - All operations MUST log audit actions
 * - Project creation must handle transactional integrity
 * - Settings changes require proper access control validation
 */

import type { ProjectMetadata } from '@/domain/entities/Project'

/**
 * System Settings Data
 */
export interface SystemSettings {
  defaultRole: 'User' | 'Admin'
  maintenanceMode: boolean
  updated_at?: any
  updated_by?: string
}

/**
 * Project Creation Result
 *
 * Returns the created project ID and success status
 */
export interface ProjectCreationResult {
  projectId: string
  adminAssigned: boolean
}

/**
 * ISettingsManagementUseCase
 *
 * Use Case interface for managing project and system configuration
 */
export interface ISettingsManagementUseCase {
  /**
   * Update project metadata
   *
   * Updates project name and status with automatic audit logging.
   *
   * **Business Logic:**
   * 1. Validates project exists and user has access
   * 2. Updates project metadata via IProjectRepository
   * 3. Logs audit action with resourceType: 'PROJECT_SETTINGS'
   *
   * **Audit Requirements:**
   * - Action: 'UPDATE'
   * - ResourceType: 'PROJECT_SETTINGS'
   * - Details: changed fields, old/new values
   *
   * @param projectId - The project ID to update
   * @param metadata - The updated metadata (name, status)
   * @param userId - The user ID performing the update
   * @returns Promise<void>
   * @throws Error if project not found or update fails
   */
  updateProjectMetadata(
    projectId: string,
    metadata: ProjectMetadata,
    userId: string
  ): Promise<void>

  /**
   * Create a new project (Super Exclusive)
   *
   * Creates a new multi-tenant project with optional admin assignment.
   * This is a complex transactional operation that must maintain consistency.
   *
   * **Business Logic:**
   * 1. Validates project slug uniqueness
   * 2. Creates project via IProjectRepository
   * 3. If initialAdminEmail provided:
   *    - Finds user by email via IUserRepository
   *    - Assigns user to project via IUserRepository
   * 4. Logs TWO audit actions:
   *    a. PROJECT creation
   *    b. USER_ASSIGNMENT (if admin assigned)
   *
   * **Audit Requirements:**
   * - Action: 'CREATE' for project
   * - ResourceType: 'PROJECT'
   * - Action: 'USER_ASSIGNMENT' if admin assigned
   * - ResourceType: 'USER_ROLE' if admin assigned
   *
   * **Error Handling:**
   * - If project creation succeeds but admin assignment fails:
   *   Project remains created, error is logged but not thrown
   * - If project slug already exists: throws Error
   *
   * @param projectName - Human-readable project name
   * @param projectSlug - Unique project identifier
   * @param initialAdminEmail - Optional email of initial admin user
   * @param userId - The Super user ID creating the project
   * @returns Promise<ProjectCreationResult> - Creation result with admin assignment status
   * @throws Error if validation fails or project creation fails
   */
  createProject(
    projectName: string,
    projectSlug: string,
    initialAdminEmail: string | null,
    userId: string
  ): Promise<ProjectCreationResult>

  /**
   * Update system settings (Super Exclusive)
   *
   * Updates global application settings with audit logging.
   *
   * **Business Logic:**
   * 1. Validates settings data
   * 2. Fetches existing settings for change tracking
   * 3. Updates settings (creates if not exists)
   * 4. Logs audit action with resourceType: 'SYSTEM_SETTINGS'
   *
   * **Audit Requirements:**
   * - Action: 'UPDATE'
   * - ResourceType: 'SYSTEM_SETTINGS'
   * - ProjectId: 'system' (system-wide)
   * - Details: changed fields, old/new values
   *
   * @param settings - The updated system settings
   * @param userId - The Super user ID performing the update
   * @returns Promise<void>
   * @throws Error if validation fails or update fails
   */
  updateSystemSettings(settings: SystemSettings, userId: string): Promise<void>

  /**
   * Get current system settings
   *
   * Retrieves the current system-wide configuration.
   * Returns default values if settings don't exist.
   *
   * @returns Promise<SystemSettings> - Current system settings
   */
  getSystemSettings(): Promise<SystemSettings>
}
