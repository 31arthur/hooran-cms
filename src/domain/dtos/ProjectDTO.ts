/**
 * Project Data Transfer Objects (DTOs)
 *
 * These DTOs provide simplified views of project data for specific UI needs.
 * They follow the Interface Segregation Principle (ISP) by exposing only
 * the data required for each specific use case.
 *
 * **Why DTOs?**
 * - Decouples UI from complex domain entities
 * - Reduces data transfer overhead
 * - Clear contract between layers
 * - Easier to evolve independently
 * - Better type safety for UI components
 *
 * **Mapping:**
 * Use the static `toDTO` methods or mappers to convert domain entities to DTOs.
 */

import type { Project, ProjectStatus } from '@/domain/entities/Project'

/**
 * ProjectMetadataDTO
 *
 * Simplified project information for UI list views, dropdowns, and selectors.
 * Contains only essential fields needed for project selection and display.
 *
 * **Usage:**
 * - Project selector dropdowns
 * - Dashboard project lists
 * - Navigation breadcrumbs
 * - Any UI component that needs basic project info
 *
 * @example
 * ```typescript
 * const projects: ProjectMetadataDTO[] = [
 *   { id: 'proj-1', name: 'My Project', status: 'Active' },
 *   { id: 'proj-2', name: 'Test Project', status: 'Draft' }
 * ]
 * ```
 */
export interface ProjectMetadataDTO {
  /**
   * Unique project identifier
   */
  id: string

  /**
   * Human-readable project name
   */
  name: string

  /**
   * Current project status
   */
  status: ProjectStatus
}

/**
 * ProjectDetailDTO
 *
 * Extended project information for detail views and settings pages.
 * Includes additional metadata beyond the basic list view.
 *
 * **Usage:**
 * - Project settings page
 * - Project detail views
 * - Project management interfaces
 */
export interface ProjectDetailDTO {
  /**
   * Unique project identifier
   */
  id: string

  /**
   * Human-readable project name
   */
  name: string

  /**
   * Project slug (URL-friendly identifier)
   */
  slug?: string

  /**
   * Current project status
   */
  status: ProjectStatus

  /**
   * Optional project description
   */
  description?: string

  /**
   * User ID of project creator
   */
  createdBy?: string

  /**
   * Creation timestamp
   */
  createdAt?: Date

  /**
   * Last update timestamp
   */
  updatedAt?: Date
}

/**
 * ProjectMapper
 *
 * Static utility class for mapping Project domain entities to DTOs.
 * Centralizes the transformation logic to ensure consistency.
 */
export class ProjectMapper {
  /**
   * Convert Project entity to ProjectMetadataDTO
   *
   * Extracts only the fields needed for list views and selectors.
   *
   * @param project - The full project entity
   * @returns Simplified metadata DTO
   */
  static toMetadataDTO(project: Project): ProjectMetadataDTO {
    return {
      id: project.projectId,
      name: project.name,
      status: project.status,
    }
  }

  /**
   * Convert array of Project entities to ProjectMetadataDTO array
   *
   * @param projects - Array of project entities
   * @returns Array of metadata DTOs
   */
  static toMetadataDTOList(projects: Project[]): ProjectMetadataDTO[] {
    return projects.map((p) => ProjectMapper.toMetadataDTO(p))
  }

  /**
   * Convert Project entity to ProjectDetailDTO
   *
   * Includes all relevant fields for detail views.
   *
   * @param project - The full project entity
   * @returns Detailed project DTO
   */
  static toDetailDTO(project: Project): ProjectDetailDTO {
    return {
      id: project.projectId,
      name: project.name,
      slug: project.slug,
      status: project.status,
      description: project.description,
      createdBy: project.createdBy,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  }

  /**
   * Convert array of Project entities to ProjectDetailDTO array
   *
   * @param projects - Array of project entities
   * @returns Array of detail DTOs
   */
  static toDetailDTOList(projects: Project[]): ProjectDetailDTO[] {
    return projects.map((p) => ProjectMapper.toDetailDTO(p))
  }
}
