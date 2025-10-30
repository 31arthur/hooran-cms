/**
 * Project Selection Use Case Interface
 *
 * Defines the application-layer contract for project selection and management operations.
 * This interface represents high-level business operations related to project selection,
 * multi-tenancy, and user-project relationships.
 *
 * **Clean Architecture - Application Layer:**
 * This use case sits between the presentation layer (UI) and the domain layer,
 * orchestrating business logic without knowing about UI frameworks or databases.
 *
 * **Key Principles:**
 * - Methods accept and return ONLY domain entities or primitives
 * - NO Firebase types (no Timestamp, DocumentReference, etc.)
 * - NO UI types (no React components, events, etc.)
 * - NO infrastructure concerns (no database-specific logic)
 * - Pure business operations
 *
 * **Dependency Direction:**
 * UI/Presentation → Use Cases → Repositories → Infrastructure
 *
 * **Example Implementation Flow:**
 * 1. UI calls use case method
 * 2. Use case orchestrates multiple repository calls
 * 3. Use case applies business rules
 * 4. Use case returns clean domain entities to UI
 */

import type { Project, ProjectMetadata } from '@/domain/entities'

/**
 * Project Selection Use Case Result
 *
 * Represents the outcome of project selection operations,
 * including user permissions and project context.
 */
export interface ProjectSelectionResult {
  project: Project
  hasAdminAccess: boolean
  hasContentAccess: boolean
  userRole: 'Super' | 'Admin' | 'User'
}

/**
 * Project List Item
 *
 * Simplified project information for listing operations
 */
export interface ProjectListItem {
  projectId: string
  name: string
  status: 'Active' | 'Draft' | 'Archived'
  description?: string
  isAccessible: boolean
  userRole?: 'Super' | 'Admin' | 'User'
}

/**
 * IProjectSelectionUseCase
 *
 * Application-layer interface defining all business operations
 * related to project selection and management.
 */
export interface IProjectSelectionUseCase {
  /**
   * Get all projects accessible by the current user
   *
   * Business Rules:
   * - Super users see all projects
   * - Admin users see only their assigned projects
   * - User role sees projects they're assigned to
   * - Projects are filtered based on user permissions
   * - Includes permission context for each project
   *
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<ProjectListItem[]> - List of accessible projects with permissions
   */
  getAccessibleProjects(userId: string, userRole: string): Promise<ProjectListItem[]>

  /**
   * Get all projects (Super users only)
   *
   * Business Rules:
   * - Only accessible by Super role
   * - Returns complete project list
   * - Includes all project metadata
   *
   * @param userId - The current user's ID (for audit)
   * @returns Promise<Project[]> - Complete list of all projects
   * @throws Error if user is not Super role
   */
  getAllProjects(userId: string): Promise<Project[]>

  /**
   * Get a specific project by ID
   *
   * Business Rules:
   * - Validates user has access to the project
   * - Returns null if project doesn't exist or user lacks access
   * - Includes permission context
   *
   * @param projectId - The project ID to fetch
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Promise<ProjectSelectionResult | null> - Project with permissions or null
   */
  getProjectById(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<ProjectSelectionResult | null>

  /**
   * Create a new project (Super users only)
   *
   * Business Rules:
   * - Only Super users can create projects
   * - Project slug must be unique
   * - Project slug must be valid (lowercase, alphanumeric, hyphens)
   * - Initial status is always 'Active'
   * - Optional: Assign initial admin user by email
   * - Creates audit log entry
   *
   * @param projectName - The project name
   * @param projectSlug - The unique project slug
   * @param initialAdminEmail - Optional email of initial admin user
   * @param userId - The Super user creating the project
   * @returns Promise<string> - The created project ID
   * @throws Error if validation fails or user lacks permission
   */
  createProject(
    projectName: string,
    projectSlug: string,
    initialAdminEmail: string | null,
    userId: string
  ): Promise<string>

  /**
   * Update project metadata (Admin or Super)
   *
   * Business Rules:
   * - Super users can update any project
   * - Admin users can only update their assigned projects
   * - Cannot change project ID or slug
   * - Creates audit log entry
   * - Tracks field changes
   *
   * @param projectId - The project ID to update
   * @param metadata - The updated metadata
   * @param userId - The user performing the update
   * @param userRole - The user's role
   * @returns Promise<void>
   * @throws Error if validation fails or user lacks permission
   */
  updateProjectMetadata(
    projectId: string,
    metadata: ProjectMetadata,
    userId: string,
    userRole: string
  ): Promise<void>

  /**
   * Archive a project (Super or Admin)
   *
   * Business Rules:
   * - Changes project status to 'Archived'
   * - Archived projects are hidden from regular listings
   * - Does not delete project data
   * - Can be reversed by changing status back to 'Active'
   *
   * @param projectId - The project ID to archive
   * @param userId - The user performing the archive
   * @param userRole - The user's role
   * @returns Promise<void>
   * @throws Error if user lacks permission
   */
  archiveProject(projectId: string, userId: string, userRole: string): Promise<void>

  /**
   * Delete a project (Super users only)
   *
   * Business Rules:
   * - Only Super users can delete projects
   * - DESTRUCTIVE operation
   * - Should verify no critical data before deletion
   * - Creates audit log entry
   *
   * @param projectId - The project ID to delete
   * @param userId - The Super user performing the deletion
   * @returns Promise<void>
   * @throws Error if user lacks permission or deletion fails
   */
  deleteProject(projectId: string, userId: string): Promise<void>

  /**
   * Check if user has access to a project
   *
   * Business Rules:
   * - Super users have access to all projects
   * - Admin/User roles must be explicitly assigned
   * - Returns access level information
   *
   * @param projectId - The project ID to check
   * @param userId - The user ID to check
   * @param userRole - The user's role
   * @returns Promise<boolean> - True if user has access
   */
  hasProjectAccess(projectId: string, userId: string, userRole: string): Promise<boolean>

  /**
   * Get user's assigned projects
   *
   * Business Rules:
   * - Returns projects explicitly assigned to the user
   * - Super users see all projects (not filtered by assignment)
   * - Used for project selector dropdowns
   *
   * @param userId - The user ID
   * @param userRole - The user's role
   * @returns Promise<Project[]> - List of assigned projects
   */
  getUserAssignedProjects(userId: string, userRole: string): Promise<Project[]>

  /**
   * Validate project slug uniqueness
   *
   * Business Rules:
   * - Project slugs must be globally unique
   * - Used during project creation validation
   *
   * @param slug - The slug to validate
   * @returns Promise<boolean> - True if slug is available
   */
  isProjectSlugAvailable(slug: string): Promise<boolean>
}
