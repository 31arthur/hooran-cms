# DI Container - Practical Examples

This document provides real-world examples of using the DI container in the Hooran CMS application.

## Table of Contents

1. [Application Setup](#application-setup)
2. [Creating Mock Repositories for Testing](#creating-mock-repositories-for-testing)
3. [Service Layer with DI](#service-layer-with-di)
4. [React Components with DI](#react-components-with-di)
5. [Custom Hooks with DI](#custom-hooks-with-di)
6. [Unit Testing Examples](#unit-testing-examples)

---

## Application Setup

### Step 1: Create Infrastructure Setup File

Create a file to register all dependencies at application startup:

```typescript
// src/infrastructure/di/setup.ts
import { DIContainer, DI_TYPES } from '@/core/di'
import { FirebaseProjectRepository } from '@/infrastructure/repositories/FirebaseProjectRepository'
import { FirebaseSchemaRepository } from '@/infrastructure/repositories/FirebaseSchemaRepository'
import { FirebaseContentRepository } from '@/infrastructure/repositories/FirebaseContentRepository'

/**
 * Initialize all dependencies for production environment
 */
export function initializeDependencies() {
  console.log('🔧 Initializing DI Container for production...')

  // Register repository implementations
  DIContainer.registerMany([
    [DI_TYPES.ProjectRepository, new FirebaseProjectRepository()],
    [DI_TYPES.SchemaRepository, new FirebaseSchemaRepository()],
    [DI_TYPES.ContentRepository, new FirebaseContentRepository()],
  ])

  console.log(`✅ DI Container initialized with ${DIContainer.count()} dependencies`)
}

/**
 * Initialize mock dependencies for testing
 */
export function initializeMockDependencies() {
  console.log('🔧 Initializing DI Container for testing...')

  DIContainer.clear()

  // Register mock implementations (to be defined in test setup)
  console.log('⚠️ Mock dependencies should be registered in individual test files')
}
```

### Step 2: Initialize in Main Entry Point

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import DI initialization
import { initializeDependencies } from '@/infrastructure/di/setup'

// Initialize dependency injection container BEFORE rendering
initializeDependencies()

// Now render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## Creating Mock Repositories for Testing

### Mock Project Repository

```typescript
// src/infrastructure/repositories/__mocks__/MockProjectRepository.ts
import type { IProjectRepository } from '@/core/repositories'
import type { Project, ProjectMetadata } from '@/core/entities'

export class MockProjectRepository implements IProjectRepository {
  private projects: Map<string, Project> = new Map()

  constructor(initialProjects: Project[] = []) {
    initialProjects.forEach(project => {
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
    initialAdminEmail: string | null,
    userId: string
  ): Promise<string> {
    const newProject: Project = {
      projectId: projectSlug,
      name: projectName,
      slug: projectSlug,
      status: 'Active',
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
    userId: string
  ): Promise<void> {
    const project = this.projects.get(projectId)
    if (!project) {
      throw new Error(`Project not found: ${projectId}`)
    }
    this.projects.set(projectId, {
      ...project,
      ...metadata,
      updatedAt: new Date(),
    })
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    this.projects.delete(projectId)
  }

  async projectExists(projectId: string): Promise<boolean> {
    return this.projects.has(projectId)
  }

  // Test helper methods
  clear() {
    this.projects.clear()
  }

  addProject(project: Project) {
    this.projects.set(project.projectId, project)
  }
}
```

---

## Service Layer with DI

### Example: Project Manager Service

```typescript
// src/application/services/ProjectManager.ts
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
import type { Project, ProjectMetadata } from '@/core/entities'

/**
 * Project Manager Service
 *
 * Business logic layer for project management.
 * Uses dependency injection for testability.
 */
export class ProjectManager {
  private projectRepo: IProjectRepository

  constructor() {
    // Resolve dependency from DI container
    this.projectRepo = DIContainer.resolve<IProjectRepository>(
      DI_TYPES.ProjectRepository
    )
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    return this.projectRepo.getProjects()
  }

  /**
   * Get active projects only
   */
  async getActiveProjects(): Promise<Project[]> {
    const projects = await this.projectRepo.getProjects()
    return projects.filter(p => p.status === 'Active')
  }

  /**
   * Get a project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    const project = await this.projectRepo.getProjectById(projectId)
    if (!project) {
      throw new Error(`Project not found: ${projectId}`)
    }
    return project
  }

  /**
   * Create a new project
   */
  async createProject(
    name: string,
    slug: string,
    userId: string,
    adminEmail?: string
  ): Promise<string> {
    // Validate input
    if (!name || !slug || !userId) {
      throw new Error('Invalid input: name, slug, and userId are required')
    }

    // Check if slug already exists
    const exists = await this.projectRepo.projectExists(slug)
    if (exists) {
      throw new Error(`Project with slug "${slug}" already exists`)
    }

    // Create project
    return this.projectRepo.createProject(name, slug, adminEmail || null, userId)
  }

  /**
   * Update project metadata
   */
  async updateProject(
    projectId: string,
    metadata: ProjectMetadata,
    userId: string
  ): Promise<void> {
    // Verify project exists
    await this.getProject(projectId)

    // Update
    await this.projectRepo.updateProjectMetadata(projectId, metadata, userId)
  }

  /**
   * Archive a project
   */
  async archiveProject(projectId: string, userId: string): Promise<void> {
    const project = await this.getProject(projectId)
    await this.projectRepo.updateProjectMetadata(
      projectId,
      { name: project.name, status: 'Archived' },
      userId
    )
  }
}
```

---

## React Components with DI

### Example: Project List Component

```typescript
// src/components/ProjectList.tsx
import React, { useEffect, useState } from 'react'
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
import type { Project } from '@/core/entities'

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Resolve repository from DI container
        const projectRepo = DIContainer.resolve<IProjectRepository>(
          DI_TYPES.ProjectRepository
        )

        const data = await projectRepo.getProjects()
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  if (loading) {
    return <div className="loading">Loading projects...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="project-list">
      <h2>Projects ({projects.length})</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.projectId}>
            <strong>{project.name}</strong>
            <span className={`status ${project.status.toLowerCase()}`}>
              {project.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Example: Project Creation Form

```typescript
// src/components/ProjectCreationForm.tsx
import React, { useState } from 'react'
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
import { useAuth } from '@/context/AuthContext'

export function ProjectCreationForm() {
  const { currentUser } = useAuth()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Resolve repository
      const projectRepo = DIContainer.resolve<IProjectRepository>(
        DI_TYPES.ProjectRepository
      )

      // Create project
      const projectId = await projectRepo.createProject(
        name,
        slug,
        null,
        currentUser.uid
      )

      console.log('✅ Project created:', projectId)
      alert('Project created successfully!')

      // Reset form
      setName('')
      setSlug('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <h2>Create New Project</h2>

      {error && <div className="error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Project Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="slug">Project Slug</label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  )
}
```

---

## Custom Hooks with DI

### Example: useProjects Hook

```typescript
// src/hooks/useProjects.ts
import { useState, useEffect } from 'react'
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
import type { Project } from '@/core/entities'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const loadProjects = async () => {
      try {
        const projectRepo = DIContainer.resolve<IProjectRepository>(
          DI_TYPES.ProjectRepository
        )

        const data = await projectRepo.getProjects()

        if (mounted) {
          setProjects(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      mounted = false
    }
  }, [])

  return { projects, loading, error }
}
```

### Example: useProject Hook

```typescript
// src/hooks/useProject.ts
import { useState, useEffect } from 'react'
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
import type { Project } from '@/core/entities'

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }

    let mounted = true

    const loadProject = async () => {
      try {
        const projectRepo = DIContainer.resolve<IProjectRepository>(
          DI_TYPES.ProjectRepository
        )

        const data = await projectRepo.getProjectById(projectId)

        if (mounted) {
          setProject(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProject()

    return () => {
      mounted = false
    }
  }, [projectId])

  return { project, loading, error }
}
```

---

## Unit Testing Examples

### Example: Testing ProjectManager Service

```typescript
// src/application/services/__tests__/ProjectManager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DIContainer, DI_TYPES } from '@/core/di'
import { MockProjectRepository } from '@/infrastructure/repositories/__mocks__/MockProjectRepository'
import { ProjectManager } from '../ProjectManager'
import type { Project } from '@/core/entities'

describe('ProjectManager', () => {
  let mockRepo: MockProjectRepository
  let projectManager: ProjectManager

  beforeEach(() => {
    // Clear DI container
    DIContainer.clear()

    // Create mock repository with test data
    const testProjects: Project[] = [
      {
        projectId: 'project-1',
        name: 'Test Project 1',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        projectId: 'project-2',
        name: 'Test Project 2',
        status: 'Archived',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockRepo = new MockProjectRepository(testProjects)

    // Register mock in DI container
    DIContainer.register(DI_TYPES.ProjectRepository, mockRepo)

    // Create service instance
    projectManager = new ProjectManager()
  })

  afterEach(() => {
    DIContainer.clear()
  })

  describe('getAllProjects', () => {
    it('should return all projects', async () => {
      const projects = await projectManager.getAllProjects()
      expect(projects).toHaveLength(2)
      expect(projects[0].name).toBe('Test Project 1')
    })
  })

  describe('getActiveProjects', () => {
    it('should return only active projects', async () => {
      const projects = await projectManager.getActiveProjects()
      expect(projects).toHaveLength(1)
      expect(projects[0].status).toBe('Active')
    })
  })

  describe('getProject', () => {
    it('should return a project by id', async () => {
      const project = await projectManager.getProject('project-1')
      expect(project.name).toBe('Test Project 1')
    })

    it('should throw error if project not found', async () => {
      await expect(
        projectManager.getProject('non-existent')
      ).rejects.toThrow('Project not found')
    })
  })

  describe('createProject', () => {
    it('should create a new project', async () => {
      const projectId = await projectManager.createProject(
        'New Project',
        'new-project',
        'user-123'
      )

      expect(projectId).toBe('new-project')

      const project = await projectManager.getProject('new-project')
      expect(project.name).toBe('New Project')
    })

    it('should throw error if slug already exists', async () => {
      await expect(
        projectManager.createProject('Duplicate', 'project-1', 'user-123')
      ).rejects.toThrow('already exists')
    })

    it('should throw error if input is invalid', async () => {
      await expect(
        projectManager.createProject('', '', '')
      ).rejects.toThrow('Invalid input')
    })
  })

  describe('archiveProject', () => {
    it('should archive a project', async () => {
      await projectManager.archiveProject('project-1', 'user-123')

      const project = await projectManager.getProject('project-1')
      expect(project.status).toBe('Archived')
    })
  })
})
```

### Example: Testing React Hook

```typescript
// src/hooks/__tests__/useProjects.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { DIContainer, DI_TYPES } from '@/core/di'
import { MockProjectRepository } from '@/infrastructure/repositories/__mocks__/MockProjectRepository'
import { useProjects } from '../useProjects'
import type { Project } from '@/core/entities'

describe('useProjects', () => {
  beforeEach(() => {
    DIContainer.clear()

    const testProjects: Project[] = [
      {
        projectId: 'p1',
        name: 'Project 1',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const mockRepo = new MockProjectRepository(testProjects)
    DIContainer.register(DI_TYPES.ProjectRepository, mockRepo)
  })

  it('should load projects successfully', async () => {
    const { result } = renderHook(() => useProjects())

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.projects).toEqual([])

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Check loaded data
    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].name).toBe('Project 1')
    expect(result.current.error).toBeNull()
  })
})
```

---

## Summary

The DI container enables:

✅ **Easy testing** - Mock dependencies in tests
✅ **Loose coupling** - Components depend on interfaces
✅ **Type safety** - Full TypeScript support
✅ **Flexibility** - Swap implementations easily
✅ **Maintainability** - Clear dependency relationships

Use the examples above as templates for your own implementation!
