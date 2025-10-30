/**
 * IProjectRepository Interface
 *
 * Repository contract for project data operations.
 * This interface defines the contract for all project-related data access,
 * completely decoupled from any specific database implementation.
 *
 * **Framework Independence:**
 * - All methods use clean domain entities (Project, ProjectMetadata)
 * - NO Firebase-specific types allowed (no Timestamp, DocumentReference, etc.)
 * - All implementations must convert database-specific types to domain entities
 *
 * **Purpose:**
 * This interface shields the business logic from the underlying data store,
 * allowing the application to switch databases without changing business logic.
 */

import type { Project, ProjectMetadata } from '../entities/Project'

export interface IProjectRepository {
  /**
   * Get all projects
   *
   * @returns Promise<Project[]> - Array of all projects
   */
  getProjects(): Promise<Project[]>

  /**
   * Get a project by ID
   *
   * @param projectId - The project ID to fetch
   * @returns Promise<Project | null> - The project or null if not found
   */
  getProjectById(projectId: string): Promise<Project | null>

  /**
   * Create a new project
   *
   * @param projectName - The project name
   * @param projectSlug - The unique project slug
   * @param initialAdminEmail - Optional email of initial admin user
   * @param userId - The user ID creating the project
   * @returns Promise<string> - The created project ID
   */
  createProject(
    projectName: string,
    projectSlug: string,
    initialAdminEmail: string | null,
    userId: string
  ): Promise<string>

  /**
   * Update project metadata
   *
   * @param projectId - The project ID to update
   * @param metadata - The updated metadata
   * @param userId - The user ID performing the update
   * @returns Promise<void>
   */
  updateProjectMetadata(
    projectId: string,
    metadata: ProjectMetadata,
    userId: string
  ): Promise<void>

  /**
   * Delete a project
   *
   * @param projectId - The project ID to delete
   * @param userId - The user ID performing the deletion
   * @returns Promise<void>
   */
  deleteProject(projectId: string, userId: string): Promise<void>

  /**
   * Check if a project exists
   *
   * @param projectId - The project ID to check
   * @returns Promise<boolean> - True if project exists
   */
  projectExists(projectId: string): Promise<boolean>
}
