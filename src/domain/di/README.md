# Dependency Injection System

A lightweight, type-safe dependency injection container for managing application dependencies and enabling testability.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Testing with DI](#testing-with-di)
- [Best Practices](#best-practices)

## Overview

This DI system solves the **CRITICAL VIOLATION** of hard-coded dependencies by:

1. **Enabling Dependency Injection** - Replace direct imports with dynamic resolution
2. **Improving Testability** - Easy mocking of dependencies in unit tests
3. **Loose Coupling** - Business logic depends on interfaces, not concrete implementations
4. **Type Safety** - Full TypeScript support with compile-time checking

### Problem: Hard-Coded Dependencies

```typescript
// ❌ BAD - Hard-coded dependency, cannot be mocked
import { ProjectService } from '@/services/ProjectService'

class ProjectManager {
  async getProjects() {
    // Directly coupled to Firebase implementation
    return ProjectService.getProjects()
  }
}

// Cannot test without Firebase!
```

### Solution: Dependency Injection

```typescript
// ✅ GOOD - Dependency injection, easily testable
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'

class ProjectManager {
  private projectRepo: IProjectRepository

  constructor() {
    // Resolve dependency from container
    this.projectRepo = DIContainer.resolve<IProjectRepository>(
      DI_TYPES.ProjectRepository
    )
  }

  async getProjects() {
    return this.projectRepo.getProjects()
  }
}

// Easy to test with mocks!
```

## Quick Start

### 1. Import DI System

```typescript
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
```

### 2. Register Dependencies (App Initialization)

```typescript
// src/main.tsx or src/App.tsx
import { DIContainer, DI_TYPES } from '@/core/di'
import { FirebaseProjectRepository } from '@/infrastructure/repositories/FirebaseProjectRepository'
import { FirebaseSchemaRepository } from '@/infrastructure/repositories/FirebaseSchemaRepository'
import { FirebaseContentRepository } from '@/infrastructure/repositories/FirebaseContentRepository'

// Register all dependencies at app startup
DIContainer.register(
  DI_TYPES.ProjectRepository,
  new FirebaseProjectRepository()
)

DIContainer.register(
  DI_TYPES.SchemaRepository,
  new FirebaseSchemaRepository()
)

DIContainer.register(
  DI_TYPES.ContentRepository,
  new FirebaseContentRepository()
)

console.log('✅ DI Container initialized with', DIContainer.count(), 'dependencies')
```

### 3. Resolve Dependencies (Usage)

```typescript
// In your components, services, or use cases
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'

function MyComponent() {
  // Resolve dependency when needed
  const projectRepo = DIContainer.resolve<IProjectRepository>(
    DI_TYPES.ProjectRepository
  )

  const loadProjects = async () => {
    const projects = await projectRepo.getProjects()
    console.log('Projects:', projects)
  }

  return <button onClick={loadProjects}>Load Projects</button>
}
```

## Core Concepts

### 1. Dependency Injection Tokens (Symbols)

Tokens are **unique symbols** that identify dependencies. Using symbols instead of strings provides:

- **Type safety** - Compile-time validation
- **Uniqueness** - No naming collisions
- **Refactoring-friendly** - IDE support for renaming

```typescript
// diTypes.ts
export const DI_TYPES = {
  ProjectRepository: Symbol.for('IProjectRepository'),
  SchemaRepository: Symbol.for('ISchemaRepository'),
  ContentRepository: Symbol.for('IContentRepository'),
} as const
```

### 2. DIContainer Singleton

The container is a **singleton** that stores all registered dependencies:

```typescript
export const DIContainer = DependencyInjectionContainer.getInstance()
```

Key methods:
- `register<T>(token, instance)` - Register a dependency
- `resolve<T>(token)` - Get a registered dependency
- `isRegistered(token)` - Check if dependency exists
- `clear()` - Remove all dependencies (useful for testing)

### 3. Type Safety

The system provides full TypeScript support:

```typescript
// Type-safe registration
DIContainer.register<IProjectRepository>(
  DI_TYPES.ProjectRepository,
  new FirebaseProjectRepository() // Must implement IProjectRepository
)

// Type-safe resolution
const repo = DIContainer.resolve<IProjectRepository>(
  DI_TYPES.ProjectRepository
)
// repo is typed as IProjectRepository with full intellisense
```

## API Reference

### `DIContainer.register<T>(token: symbol, instance: T): void`

Register a dependency in the container.

**Parameters:**
- `token` - Unique symbol from `DI_TYPES`
- `instance` - The implementation instance

**Example:**
```typescript
DIContainer.register<IProjectRepository>(
  DI_TYPES.ProjectRepository,
  new FirebaseProjectRepository()
)
```

### `DIContainer.resolve<T>(token: symbol): T`

Resolve a registered dependency.

**Parameters:**
- `token` - Unique symbol from `DI_TYPES`

**Returns:**
- The registered instance

**Throws:**
- Error if dependency not registered

**Example:**
```typescript
const repo = DIContainer.resolve<IProjectRepository>(
  DI_TYPES.ProjectRepository
)
```

### `DIContainer.tryResolve<T>(token: symbol): T | null`

Try to resolve a dependency without throwing an error.

**Parameters:**
- `token` - Unique symbol from `DI_TYPES`

**Returns:**
- The registered instance or `null` if not found

**Example:**
```typescript
const repo = DIContainer.tryResolve<IProjectRepository>(
  DI_TYPES.ProjectRepository
)

if (repo) {
  // Use repo
} else {
  // Handle missing dependency
}
```

### `DIContainer.isRegistered(token: symbol): boolean`

Check if a dependency is registered.

**Example:**
```typescript
if (DIContainer.isRegistered(DI_TYPES.ProjectRepository)) {
  console.log('ProjectRepository is available')
}
```

### `DIContainer.unregister(token: symbol): boolean`

Remove a dependency from the container.

**Example:**
```typescript
DIContainer.unregister(DI_TYPES.ProjectRepository)
```

### `DIContainer.clear(): void`

Remove all dependencies. Primarily for testing.

**Example:**
```typescript
beforeEach(() => {
  DIContainer.clear()
})
```

### `DIContainer.registerMany(entries: Array<[symbol, any]>): void`

Register multiple dependencies at once.

**Example:**
```typescript
DIContainer.registerMany([
  [DI_TYPES.ProjectRepository, new FirebaseProjectRepository()],
  [DI_TYPES.SchemaRepository, new FirebaseSchemaRepository()],
  [DI_TYPES.ContentRepository, new FirebaseContentRepository()],
])
```

### `DIContainer.count(): number`

Get the number of registered dependencies.

**Example:**
```typescript
console.log('Registered dependencies:', DIContainer.count())
```

## Usage Examples

### Example 1: Service with Dependency Injection

```typescript
// src/services/ProjectManager.ts
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
import type { Project } from '@/core/entities'

export class ProjectManager {
  private projectRepo: IProjectRepository

  constructor() {
    // Resolve dependency from container
    this.projectRepo = DIContainer.resolve<IProjectRepository>(
      DI_TYPES.ProjectRepository
    )
  }

  async getAllProjects(): Promise<Project[]> {
    return this.projectRepo.getProjects()
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.projectRepo.getProjectById(id)
  }

  async createProject(
    name: string,
    slug: string,
    userId: string
  ): Promise<string> {
    return this.projectRepo.createProject(name, slug, null, userId)
  }
}
```

### Example 2: React Component with DI

```typescript
// src/components/ProjectList.tsx
import React, { useEffect, useState } from 'react'
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
import type { Project } from '@/core/entities'

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Resolve repository from container
        const projectRepo = DIContainer.resolve<IProjectRepository>(
          DI_TYPES.ProjectRepository
        )

        const data = await projectRepo.getProjects()
        setProjects(data)
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <ul>
      {projects.map((project) => (
        <li key={project.projectId}>{project.name}</li>
      ))}
    </ul>
  )
}
```

### Example 3: Custom Hook with DI

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

  const projectRepo = DIContainer.resolve<IProjectRepository>(
    DI_TYPES.ProjectRepository
  )

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectRepo.getProjects()
        setProjects(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  return { projects, loading, error }
}
```

## Testing with DI

The DI system makes unit testing dramatically easier by enabling dependency mocking.

### Example: Testing with Mock Repository

```typescript
// src/services/__tests__/ProjectManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
import type { Project } from '@/core/entities'
import { ProjectManager } from '../ProjectManager'

describe('ProjectManager', () => {
  // Create mock repository
  const mockProjectRepo: IProjectRepository = {
    getProjects: vi.fn(),
    getProjectById: vi.fn(),
    createProject: vi.fn(),
    updateProjectMetadata: vi.fn(),
    deleteProject: vi.fn(),
    projectExists: vi.fn(),
  }

  // Clear container before each test
  beforeEach(() => {
    DIContainer.clear()
    // Register mock repository
    DIContainer.register<IProjectRepository>(
      DI_TYPES.ProjectRepository,
      mockProjectRepo
    )
  })

  it('should get all projects', async () => {
    // Arrange
    const mockProjects: Project[] = [
      {
        projectId: 'project-1',
        name: 'Test Project',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    vi.mocked(mockProjectRepo.getProjects).mockResolvedValue(mockProjects)

    // Act
    const manager = new ProjectManager()
    const result = await manager.getAllProjects()

    // Assert
    expect(result).toEqual(mockProjects)
    expect(mockProjectRepo.getProjects).toHaveBeenCalledTimes(1)
  })

  it('should create a project', async () => {
    // Arrange
    vi.mocked(mockProjectRepo.createProject).mockResolvedValue('new-project-id')

    // Act
    const manager = new ProjectManager()
    const projectId = await manager.createProject('New Project', 'new-project', 'user-123')

    // Assert
    expect(projectId).toBe('new-project-id')
    expect(mockProjectRepo.createProject).toHaveBeenCalledWith(
      'New Project',
      'new-project',
      null,
      'user-123'
    )
  })
})
```

### Example: Testing React Component

```typescript
// src/components/__tests__/ProjectList.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'
import { ProjectList } from '../ProjectList'

describe('ProjectList', () => {
  const mockProjectRepo: IProjectRepository = {
    getProjects: vi.fn(),
    getProjectById: vi.fn(),
    createProject: vi.fn(),
    updateProjectMetadata: vi.fn(),
    deleteProject: vi.fn(),
    projectExists: vi.fn(),
  }

  beforeEach(() => {
    DIContainer.clear()
    DIContainer.register(DI_TYPES.ProjectRepository, mockProjectRepo)
  })

  it('should render projects', async () => {
    // Arrange
    vi.mocked(mockProjectRepo.getProjects).mockResolvedValue([
      {
        projectId: 'p1',
        name: 'Project 1',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        projectId: 'p2',
        name: 'Project 2',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    // Act
    render(<ProjectList />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
      expect(screen.getByText('Project 2')).toBeInTheDocument()
    })
  })
})
```

## Best Practices

### 1. Register Dependencies at App Startup

Register all dependencies once during application initialization:

```typescript
// src/main.tsx
import { DIContainer, DI_TYPES } from '@/core/di'
import { initializeDependencies } from '@/infrastructure/di/setup'

// Initialize DI container
initializeDependencies()

// Start React app
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

### 2. Create a Setup File for DI Registration

```typescript
// src/infrastructure/di/setup.ts
import { DIContainer, DI_TYPES } from '@/core/di'
import { FirebaseProjectRepository } from '@/infrastructure/repositories/FirebaseProjectRepository'
import { FirebaseSchemaRepository } from '@/infrastructure/repositories/FirebaseSchemaRepository'
import { FirebaseContentRepository } from '@/infrastructure/repositories/FirebaseContentRepository'

export function initializeDependencies() {
  console.log('🔧 Initializing DI Container...')

  // Register repositories
  DIContainer.registerMany([
    [DI_TYPES.ProjectRepository, new FirebaseProjectRepository()],
    [DI_TYPES.SchemaRepository, new FirebaseSchemaRepository()],
    [DI_TYPES.ContentRepository, new FirebaseContentRepository()],
  ])

  console.log('✅ DI Container initialized with', DIContainer.count(), 'dependencies')
}
```

### 3. Use Type Annotations

Always specify the type when resolving dependencies:

```typescript
// ✅ GOOD - Type-safe
const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)

// ❌ BAD - Type information lost
const repo = DIContainer.resolve(DI_TYPES.ProjectRepository)
```

### 4. Clear Container in Test Setup

Always clear the container before each test to ensure isolation:

```typescript
beforeEach(() => {
  DIContainer.clear()
  // Register test dependencies
})
```

### 5. Use Constructor Injection for Classes

```typescript
// ✅ GOOD - Constructor injection
class ProjectManager {
  constructor(private projectRepo: IProjectRepository) {}
}

// Create instance with resolved dependency
const manager = new ProjectManager(
  DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)
)
```

### 6. Avoid Service Locator Anti-Pattern

Don't pass the container around as a dependency:

```typescript
// ❌ BAD - Service locator anti-pattern
class ProjectManager {
  constructor(private container: DIContainer) {}

  async getProjects() {
    const repo = this.container.resolve(DI_TYPES.ProjectRepository)
    return repo.getProjects()
  }
}

// ✅ GOOD - Inject specific dependencies
class ProjectManager {
  constructor(private projectRepo: IProjectRepository) {}

  async getProjects() {
    return this.projectRepo.getProjects()
  }
}
```

## Migration Guide

### From Hard-Coded Dependencies to DI

**Before:**
```typescript
// Direct import (hard-coded dependency)
import { ProjectService } from '@/services/ProjectService'

export function MyComponent() {
  const projects = await ProjectService.getProjects()
  return <div>{projects.length} projects</div>
}
```

**After:**
```typescript
// Dependency injection
import { DIContainer, DI_TYPES } from '@/core/di'
import type { IProjectRepository } from '@/core/repositories'

export function MyComponent() {
  const projectRepo = DIContainer.resolve<IProjectRepository>(
    DI_TYPES.ProjectRepository
  )
  const projects = await projectRepo.getProjects()
  return <div>{projects.length} projects</div>
}
```

## Benefits Summary

✅ **Testability** - Easy mocking for unit tests
✅ **Loose Coupling** - Depend on interfaces, not implementations
✅ **Type Safety** - Full TypeScript support
✅ **Flexibility** - Easy to swap implementations
✅ **Maintainability** - Clear dependency relationships
✅ **Framework Independence** - Not tied to any specific DI framework

## References

- [Dependency Injection Principle](https://en.wikipedia.org/wiki/Dependency_injection)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
