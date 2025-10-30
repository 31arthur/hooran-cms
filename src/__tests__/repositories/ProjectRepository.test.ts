/**
 * Project Repository Tests
 *
 * Example unit tests demonstrating how to test code that uses repositories
 * with the DI container and mock implementations.
 *
 * **Key Testing Principles:**
 * - Clear DI container before each test
 * - Register mock repositories
 * - Test business logic without Firebase
 * - Fast, isolated, repeatable tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DIContainer, DI_TYPES } from '@/domain/di'
import { MockProjectRepository } from '@/infrastructure/repositories/__mocks__'
import type { IProjectRepository } from '@/domain/repositories'
import type { Project } from '@/domain/entities'

describe('ProjectRepository Tests', () => {
  let mockRepo: MockProjectRepository

  beforeEach(() => {
    // Clear DI container to ensure clean state
    DIContainer.clear()

    // Create mock repository with test data
    const testProjects: Project[] = [
      {
        projectId: 'project-1',
        name: 'Test Project 1',
        status: 'Active',
        slug: 'project-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'user-123',
      },
      {
        projectId: 'project-2',
        name: 'Test Project 2',
        status: 'Archived',
        slug: 'project-2',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        createdBy: 'user-456',
      },
    ]

    mockRepo = new MockProjectRepository(testProjects)

    // Register mock in DI container
    DIContainer.register<IProjectRepository>(DI_TYPES.ProjectRepository, mockRepo)
  })

  afterEach(() => {
    // Clean up after each test
    DIContainer.clear()
  })

  describe('getProjects', () => {
    it('should return all projects', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act
      const projects = await repo.getProjects()

      // Assert
      expect(projects).toHaveLength(2)
      expect(projects[0].name).toBe('Test Project 1')
      expect(projects[1].name).toBe('Test Project 2')
    })

    it('should return empty array when no projects exist', async () => {
      // Arrange - Create empty mock
      DIContainer.clear()
      const emptyRepo = new MockProjectRepository([])
      DIContainer.register(DI_TYPES.ProjectRepository, emptyRepo)

      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act
      const projects = await repo.getProjects()

      // Assert
      expect(projects).toHaveLength(0)
    })
  })

  describe('getProjectById', () => {
    it('should return project when it exists', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act
      const project = await repo.getProjectById('project-1')

      // Assert
      expect(project).not.toBeNull()
      expect(project!.name).toBe('Test Project 1')
      expect(project!.status).toBe('Active')
    })

    it('should return null when project does not exist', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act
      const project = await repo.getProjectById('non-existent')

      // Assert
      expect(project).toBeNull()
    })
  })

  describe('createProject', () => {
    it('should create a new project', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act
      const projectId = await repo.createProject(
        'New Project',
        'new-project',
        null,
        'user-789'
      )

      // Assert
      expect(projectId).toBe('new-project')

      const project = await repo.getProjectById('new-project')
      expect(project).not.toBeNull()
      expect(project!.name).toBe('New Project')
      expect(project!.status).toBe('Active')
      expect(project!.createdBy).toBe('user-789')
    })

    it('should throw error if slug already exists', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act & Assert
      await expect(
        repo.createProject('Duplicate', 'project-1', null, 'user-789')
      ).rejects.toThrow('already exists')
    })
  })

  describe('updateProjectMetadata', () => {
    it('should update project name and status', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act
      await repo.updateProjectMetadata(
        'project-1',
        { name: 'Updated Project', status: 'Archived' },
        'user-123'
      )

      // Assert
      const project = await repo.getProjectById('project-1')
      expect(project).not.toBeNull()
      expect(project!.name).toBe('Updated Project')
      expect(project!.status).toBe('Archived')
    })

    it('should throw error if project does not exist', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act & Assert
      await expect(
        repo.updateProjectMetadata(
          'non-existent',
          { name: 'Updated', status: 'Active' },
          'user-123'
        )
      ).rejects.toThrow('not found')
    })
  })

  describe('deleteProject', () => {
    it('should delete an existing project', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Verify project exists first
      const existsBefore = await repo.projectExists('project-1')
      expect(existsBefore).toBe(true)

      // Act
      await repo.deleteProject('project-1', 'user-123')

      // Assert
      const existsAfter = await repo.projectExists('project-1')
      expect(existsAfter).toBe(false)

      const project = await repo.getProjectById('project-1')
      expect(project).toBeNull()
    })

    it('should throw error if project does not exist', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act & Assert
      await expect(
        repo.deleteProject('non-existent', 'user-123')
      ).rejects.toThrow('not found')
    })
  })

  describe('projectExists', () => {
    it('should return true for existing project', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act
      const exists = await repo.projectExists('project-1')

      // Assert
      expect(exists).toBe(true)
    })

    it('should return false for non-existing project', async () => {
      // Arrange
      const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Act
      const exists = await repo.projectExists('non-existent')

      // Assert
      expect(exists).toBe(false)
    })
  })

  describe('Integration with DI Container', () => {
    it('should resolve the same instance from container', () => {
      // Act
      const repo1 = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)
      const repo2 = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

      // Assert
      expect(repo1).toBe(repo2) // Same instance
    })

    it('should throw error if repository not registered', () => {
      // Arrange
      DIContainer.clear()

      // Act & Assert
      expect(() => {
        DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)
      }).toThrow('No dependency registered')
    })
  })
})
