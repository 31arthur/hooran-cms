/**
 * Mock Project Repository
 *
 * In-memory implementation of IProjectRepository for testing purposes.
 * This mock allows unit tests to run without Firebase dependencies.
 *
 * **Usage in Tests:**
 * ```typescript
 * import { DIContainer, DI_TYPES } from '@/domain/di'
 * import { MockProjectRepository } from '@/infrastructure/repositories/__mocks__/MockProjectRepository'
 *
 * beforeEach(() => {
 *   DIContainer.clear()
 *   const mockRepo = new MockProjectRepository()
 *   DIContainer.register(DI_TYPES.ProjectRepository, mockRepo)
 * })
 * ```
 */

import type { IProjectRepository } from '@/domain/repositories'
import type { Project, ProjectMetadata } from '@/domain/entities'

/**
 * MockProjectRepository
 *
 * In-memory implementation for testing
 */
export class MockProjectRepository implements IProjectRepository {
  private projects: Map<string, Project> = new Map()

  constructor(initialProjects: Project[] = []) {
    initialProjects.forEach((project) => {
      this.projects.set(project.projectId, project)
    })
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values())
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    return this.projects.get(projectId) || null
  }

  async createProject(
    projectName: string,
    projectSlug: string,
    _initialAdminEmail: string | null,
    userId: string
  ): Promise<string> {
    // Validate slug uniqueness
    if (this.projects.has(projectSlug)) {
      throw new Error(`Project slug "${projectSlug}" already exists`)
    }

    const newProject: Project = {
      projectId: projectSlug,
      name: projectName,
      slug: projectSlug,
      status: 'Active',
      description: '',
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.projects.set(projectSlug, newProject)
    return projectSlug
  }

  async updateProjectMetadata(
    projectId: string,
    metadata: ProjectMetadata,
    _userId: string
  ): Promise<void> {
    const project = this.projects.get(projectId)
    if (!project) {
      throw new Error(`Project not found: ${projectId}`)
    }

    this.projects.set(projectId, {
      ...project,
      name: metadata.name,
      status: metadata.status,
      updatedAt: new Date(),
    })
  }

  async deleteProject(projectId: string, _userId: string): Promise<void> {
    if (!this.projects.has(projectId)) {
      throw new Error(`Project not found: ${projectId}`)
    }
    this.projects.delete(projectId)
  }

  async projectExists(projectId: string): Promise<boolean> {
    return this.projects.has(projectId)
  }

  // Test helper methods
  clear(): void {
    this.projects.clear()
  }

  addProject(project: Project): void {
    this.projects.set(project.projectId, project)
  }

  getProjectCount(): number {
    return this.projects.size
  }
}
